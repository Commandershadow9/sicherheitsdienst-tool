#!/usr/bin/env bash
set -euo pipefail

# Sicherheitsdienst-Tool — Voll-Backup + Git Push + Restore-Paket
# Schritte: Git sync/push, Projekt-Archiv, DB-Dump, optionale Volumes, Manifest+restore.sh

TS="$(date -u +%Y%m%d-%H%M%S)"
ROOT="${ROOT:-$HOME/project}"
BACKUP_DIR="$ROOT/.backups/$TS"

mkdir -p "$BACKUP_DIR"
cd "$ROOT"

echo "== Git Status & Remote =="
git status || true
git remote -v || true

echo "== GitHub CLI Auth (falls nötig) =="
if command -v gh >/dev/null 2>&1; then
  gh auth status || gh auth login || true
else
  echo "Hinweis: 'gh' nicht installiert. Überspringe GitHub-Auth."
fi

echo "== Git: Fetch & Ensure main =="
git fetch -p || true
if git show-ref --verify --quiet refs/heads/main; then
  git checkout main || git checkout -B main
else
  git checkout -B main
fi
git pull --rebase --autostash origin main || true

echo "== Git: Push main und Feature-Branches (ohne Secrets) =="
if git remote get-url origin >/dev/null 2>&1; then
  # Push alle lokalen Branches außer main zuerst
  for BR in $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -v '^main$' || true); do
    git push -u origin "$BR" || true
  done
  git push origin main || true
else
  echo "Warnung: Kein 'origin' Remote konfiguriert. Überspringe Push."
fi

echo "== Erzeuge Projekt-Archiv (ohne node_modules / dist / .backups) =="
tar \
  --exclude='*/node_modules' \
  --exclude='*/dist' \
  --exclude='.backups' \
  -czf "$BACKUP_DIR/project.tar.gz" .

echo "== Ermittle DATABASE_URL =="
DB_URL="$(grep -h '^DATABASE_URL=' backend/.env 2>/dev/null | cut -d= -f2- || true)"
if [ -z "${DB_URL:-}" ]; then
  DB_URL="$(grep -h 'DATABASE_URL' docker-compose.dev.yml 2>/dev/null | head -n1 | sed 's/.*DATABASE_URL[=:] *"\{0,1\}\(.*\)"\{0,1\}.*/\1/' || true)"
fi
DB_URL="${DB_URL:-${DATABASE_URL:-}}"
echo "DATABASE_URL=${DB_URL:-<leer>}"

echo "== Suche Compose Postgres-Service =="
PG_SVC="$(docker compose -f docker-compose.dev.yml config --services 2>/dev/null | grep -E '^(postgres|db)$' || true)"

if [ -n "$PG_SVC" ]; then
  echo "== Dump aus Compose-Postgres-Service: $PG_SVC =="
  docker compose -f docker-compose.dev.yml up -d "$PG_SVC"
  sleep 2
  docker compose -f docker-compose.dev.yml exec -T "$PG_SVC" sh -lc \
    'export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"; pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -h localhost -F p' \
    | gzip -9 > "$BACKUP_DIR/db.sql.gz"
else
  echo "== Dump via DATABASE_URL (pg_dump benötigt) =="
  if [ -z "${DB_URL:-}" ]; then
    echo "Fehler: Keine DATABASE_URL gefunden und kein Compose-Postgres-Service vorhanden." >&2
    echo "Überspringe DB-Dump."
  else
    if ! command -v pg_dump >/dev/null 2>&1; then
      echo "pg_dump nicht gefunden. Bitte 'postgresql-client' installieren."
      # Optional auto-install (kann interaktiv sein):
      # sudo apt-get update && sudo apt-get install -y postgresql-client
    fi
    pg_dump "$DB_URL" | gzip -9 > "$BACKUP_DIR/db.sql.gz"
  fi
fi

backup_volume() {
  local V="$1"
  if docker volume inspect "$V" >/dev/null 2>&1; then
    echo "== Volume $V sichern =="
    docker run --rm -v "$V":/vol -v "$BACKUP_DIR":/out alpine sh -lc "cd /vol && tar czf /out/${V}.tar.gz ."
  fi
}

echo "== Optionale Monitoring-Volumes sichern =="
backup_volume prometheus_data || true
backup_volume grafana_storage || true

echo "== Erzeuge Backup-Manifest =="
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << 'EOF'
# Backup-Manifest — Sicherheitsdienst-Tool

Inhalt:
- project.tar.gz — Repo Snapshot (ohne node_modules), inkl. Compose-Dateien und lokale .env (nur auf Server-Backup).
- db.sql.gz — Postgres Dump (plain SQL, gzip)
- prometheus_data.tar.gz / grafana_storage.tar.gz — optional, falls vorhanden
- restore.sh — Automatisiertes Restore/Bootstrap auf neuem Server

WICHTIG:
- .env-Dateien sind nicht im Git-Repo, sondern nur im Server-Backup enthalten.
- Geheimnisse (JWT/SMTP/DB) werden aus .env geladen; prüfe nach dem Restore.

Restore-Quickstart:
1) Archiv-Ordner auf neuen Server kopieren (z. B. .backups/<timestamp>/)
2) `bash restore.sh`
3) Prüfen: API /api/health (200), /api/stats (200), Frontend Port 5173, Login ok.
EOF

echo "== Erzeuge restore.sh =="
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${TARGET:-$HOME/project}"

echo "== Installiere Basis-Tools (Docker, Compose, Git) =="
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin git curl jq
  sudo usermod -aG docker "$USER" || true
fi

mkdir -p "$TARGET"
cd "$TARGET"

echo "== Entpacke Projekt =="
tar xzf "$BACKUP_DIR/project.tar.gz" -C "$TARGET"

echo "== Docker Compose Up (DB/Services) =="
docker compose -f docker-compose.dev.yml up -d

# Optional: Volumes (prometheus/grafana) wiederherstellen
restore_volume() {
  local V="$1"
  local T="$BACKUP_DIR/${V}.tar.gz"
  if [ -f "$T" ]; then
    echo "== Restore Volume $V =="
    docker volume create "$V" >/dev/null
    docker run --rm -v "$V":/vol -v "$BACKUP_DIR":/in alpine sh -lc "cd /vol && tar xzf /in/${V}.tar.gz"
  fi
}
restore_volume prometheus_data || true
restore_volume grafana_storage || true

echo "== Warte kurz auf DB-Startup =="
sleep 8

echo "== Prisma Migrations ausführen =="
docker compose -f docker-compose.dev.yml exec -T api sh -lc 'npx prisma migrate deploy || npx prisma db push'

echo "== DB-Seeds (optional; idempotent) =="
docker compose -f docker-compose.dev.yml exec -T api sh -lc 'npm run -s seed || true'

echo "== Healthchecks =="
if command -v jq >/dev/null 2>&1; then
  curl -sf http://localhost:3000/api/health | jq -e '.status=="ok"' >/dev/null
else
  curl -fsS http://localhost:3000/api/health >/dev/null
fi
curl -fsS http://localhost:3000/api/stats >/dev/null || true

echo "== Frontend-Hinweis =="
echo "Vite läuft auf Port 5173. Remote-Zugriff: http://<SERVER_IP>:5173"
echo "Ggf. VITE_API_BASE_URL in frontend/.env anpassen und Web neu starten."

echo "RESTORE DONE."
EOF

chmod +x "$BACKUP_DIR/restore.sh"

echo "== Backup-Files =="
ls -lh "$BACKUP_DIR"
echo "== FERTIG: $BACKUP_DIR =="

echo
echo "== Hinweise für neuen Server =="
cat <<EOF
Backup kopieren (vom alten Server lokal sichern):
  scp -r <user>@<old-server>:$HOME/project/.backups/$TS ./sicherheitsdienst-backup/

Auf neuem Server: Backup hochladen nach ~/project/.backups/$TS/ und ausführen:
  cd ~/project/.backups/$TS && bash restore.sh

Firewall (optional): Ports 3000 (API) & 5173 (FE) freischalten, z. B.:
  sudo ufw allow 3000,5173/tcp

Secrets: Prüfe .env (JWT/REFRESH/SMTP/DATABASE_URL). Für neue Ziel-DB DATABASE_URL anpassen.
EOF
