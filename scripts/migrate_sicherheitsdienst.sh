#!/usr/bin/env bash
set -euo pipefail

# Migration Orchestrator for Sicherheitsdienst-Tool
# Local: root access; Remote: SSH to Debian 12 target
# Steps: Backup discovery -> SSH setup -> Copy -> Remote restore/bootstrap -> Health checks
# Idempotent, stops on errors, does not print secrets.

# -------- Config / Inputs --------
NEW_USER="${NEW_USER:-root}"
NEW_IP="${NEW_IP:-}"
BACKUP_SRC_DIR="${BACKUP_SRC_DIR:-${HOME}/project/.backups}"

if [[ -z "${NEW_IP}" ]]; then
  echo "FEHLER: NEW_IP fehlt. Bitte export NEW_IP=\"<ip>\" setzen und erneut ausführen." >&2
  exit 1
fi

# -------- Error handling --------
CURRENT_STEP="init"
trap 'rc=$?; echo "\nSTOP: Fehler bei Schritt: ${CURRENT_STEP}" >&2; echo "Letzter Befehl: ${BASH_COMMAND}" >&2; exit $rc' ERR

log() { printf "[+] %s\n" "$*"; }

# -------- Step 1: Backup ermitteln --------
CURRENT_STEP="Backup ermitteln"

if [[ ! -d "${BACKUP_SRC_DIR}" ]]; then
  echo "Kein Backup gefunden in ${BACKUP_SRC_DIR}" >&2
  exit 1
fi

# Find newest directory under BACKUP_SRC_DIR
mapfile -t CANDIDATES < <(find "${BACKUP_SRC_DIR}" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | awk '{ $1=""; sub(/^ /,""); print }')

LATEST_DIR=""
for d in "${CANDIDATES[@]}"; do
  if [[ -f "$d/project.tar.gz" ]]; then
    LATEST_DIR="$d"
    break
  fi
done

if [[ -z "${LATEST_DIR}" ]]; then
  echo "Kein Backup gefunden in ${BACKUP_SRC_DIR}" >&2
  exit 1
fi

PROJECT_TAR="${LATEST_DIR}/project.tar.gz"
DB_SQL_GZ="${LATEST_DIR}/db.sql.gz"

if [[ ! -f "${PROJECT_TAR}" ]]; then
  echo "STOP: project.tar.gz fehlt im neuesten Backup: ${LATEST_DIR}" >&2
  exit 1
fi

log "Backup gefunden: ${LATEST_DIR}"

# -------- Step 2: SSH-Zugang schlüsselbasiert einrichten --------
CURRENT_STEP="SSH-Zugang einrichten"

if [[ ! -f "${HOME}/.ssh/id_ed25519" ]]; then
  log "SSH-Key nicht gefunden – erzeuge neuen ed25519 Key"
  ssh-keygen -t ed25519 -N "" -f "${HOME}/.ssh/id_ed25519"
fi

ssh-keygen -R "${NEW_IP}" >/dev/null 2>&1 || true

log "Kopiere SSH-Key zum Ziel (einmal Passwort eingeben)"
if ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${NEW_USER}@${NEW_IP}" "echo OK" 2>/dev/null | grep -q '^OK$'; then
  log "SSH-Zugang mit Schlüssel bereits möglich – überspringe ssh-copy-id"
else
  ssh-copy-id -o StrictHostKeyChecking=accept-new "${NEW_USER}@${NEW_IP}"
fi

log "Teste SSH (BatchMode)"
SSH_TEST_OUT="$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "${NEW_USER}@${NEW_IP}" "echo OK" || true)"
if [[ "${SSH_TEST_OUT}" != "OK" ]]; then
  echo "STOP: SSH-Test fehlgeschlagen (erwartet: OK)" >&2
  exit 1
fi

# -------- Step 3: Backup rüberkopieren --------
CURRENT_STEP="Backup auf Ziel kopieren"

TS="$(date -u +%Y%m%d%H%M%S)"
REMOTE_BACKUP_DIR="project/.backups/${TS}"

log "Erzeuge Zielordner ~/${REMOTE_BACKUP_DIR}"
ssh "${NEW_USER}@${NEW_IP}" "mkdir -p ~/${REMOTE_BACKUP_DIR}"

log "Kopiere project.tar.gz"
rsync -avz --progress "${PROJECT_TAR}" "${NEW_USER}@${NEW_IP}:~/${REMOTE_BACKUP_DIR}/"

if [[ -f "${DB_SQL_GZ}" ]]; then
  log "Kopiere optionale db.sql.gz"
  rsync -avz --progress "${DB_SQL_GZ}" "${NEW_USER}@${NEW_IP}:~/${REMOTE_BACKUP_DIR}/"
fi

# -------- Step 4: Remote-Restore & Bootstrap --------
CURRENT_STEP="Remote-Restore & Bootstrap"

ssh "${NEW_USER}@${NEW_IP}" bash -s -- "${TS}" "${NEW_IP}" <<'REMOTE_SCRIPT'
set -euo pipefail
TS="$1"; NEW_IP="$2"

step() { printf "[remote:+] %s\n" "$*"; }

step "Pakete installieren (docker, compose, git, curl, jq, ufw)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y docker.io docker-compose-plugin git curl jq ufw > /dev/null

# Docker group for current user if applicable (idempotent)
usermod -aG docker "$USER" || true

# UFW basic rules (idempotent)
ufw allow 22,3000,5173/tcp || true
ufw --force enable || true

step "Projektverzeichnis vorbereiten"
mkdir -p ~/project
cd ~/project

step "Backup entpacken"
tar xzf ~/project/.backups/${TS}/project.tar.gz -C ~/project

# Ensure frontend/.env
if [[ ! -f "frontend/.env" ]]; then
  step "Erzeuge frontend/.env"
  mkdir -p frontend
  printf "VITE_API_BASE_URL=http://%s:3000\n" "$NEW_IP" > frontend/.env
fi

# Ensure backend/.env without leaking secrets
if [[ ! -f "backend/.env" ]]; then
  step "Erzeuge backend/.env (minimal)"
  mkdir -p backend
  JWT_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '\n')
  REFRESH_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '\n')
  {
    echo "JWT_SECRET=${JWT_SECRET}"
    echo "REFRESH_SECRET=${REFRESH_SECRET}"
    echo "JWT_COOKIE_SECURE=false"
    echo "CORS_ORIGIN=http://${NEW_IP}:5173"
  } > backend/.env
  unset JWT_SECRET REFRESH_SECRET
fi

step "Docker Compose starten (dev)"
docker compose -f docker-compose.dev.yml up -d

sleep 5

step "Prisma Migrations anwenden"
docker compose -f docker-compose.dev.yml exec -T api sh -lc 'npx prisma migrate deploy || npx prisma db push'

# Optional DB import if present and service exists
if [[ -f "${HOME}/project/.backups/${TS}/db.sql.gz" ]]; then
  SVC=$(docker compose -f docker-compose.dev.yml config --services | grep -E '^(postgres|db)$' || true)
  if [[ -n "$SVC" ]]; then
    step "Importiere DB-Dump in Service: $SVC"
    CID=$(docker compose -f docker-compose.dev.yml ps -q "$SVC")
    if [[ -n "$CID" ]]; then
      docker cp "${HOME}/project/.backups/${TS}/db.sql.gz" "$CID":/tmp/db.sql.gz
      docker compose -f docker-compose.dev.yml exec -T "$SVC" sh -lc '
        export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}";
        gunzip -c /tmp/db.sql.gz | psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -h localhost'
    fi
  fi
fi

# Optional seed (idempotent)
step "Optional: Seed"
docker compose -f docker-compose.dev.yml exec -T api sh -lc 'npm run -s seed || true'

REMOTE_SCRIPT

# -------- Step 5: Health-Checks --------
CURRENT_STEP="Health-Checks"

HEALTH_STATUS="$(ssh "${NEW_USER}@${NEW_IP}" "curl -sf http://localhost:3000/api/health | jq -r '.status'" || echo "fail")"
STATS_VALUE="$(ssh "${NEW_USER}@${NEW_IP}" "curl -sf http://localhost:3000/api/stats | jq -r '.\"app.version\" // \"stats-ok\"'" || echo "stats-missing")"

# Compose Status
COMPOSE_PS="$(ssh "${NEW_USER}@${NEW_IP}" "cd ~/project && docker compose -f docker-compose.dev.yml ps" || true)"

# -------- Output Summary (Markdown, compact) --------
CURRENT_STEP="Ergebnis-Ausgabe"

echo
echo "### Migrationsergebnis"
echo "- Verwendetes Backup:"
echo "  - Quelle: ${LATEST_DIR}"
echo "  - Ziel: ~/${REMOTE_BACKUP_DIR}"
echo "- Compose-Status:"
echo "${COMPOSE_PS}"
echo "- Health-Ergebnisse:"
echo "  - /api/health: ${HEALTH_STATUS}"
echo "  - /api/stats: ${STATS_VALUE}"
echo "- Frontend-URL: http://${NEW_IP}:5173"
echo "- API-URL: http://${NEW_IP}:3000/api/health"
echo "- Login (falls Seeds aktiv): admin@sicherheitsdienst.de / password123"

log "Fertig."
