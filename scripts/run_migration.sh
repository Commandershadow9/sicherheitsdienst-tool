#!/usr/bin/env bash
set -euo pipefail

# Orchestrator: führt die exakten, gewünschten Schritte aus
# Nutzung (Beispiel):
#   NEW_USER=root NEW_IP=37.114.53.56 NEW_PASS='...'
#   bash scripts/run_migration.sh

export NEW_USER="${NEW_USER:-root}"
export NEW_IP="${NEW_IP:-}"
export NEW_PASS="${NEW_PASS:-}"

if [ -z "${NEW_IP}" ]; then
  echo "FEHLER: NEW_IP fehlt (export NEW_IP=...)" >&2
  exit 1
fi
if [ -z "${NEW_USER}" ]; then
  echo "FEHLER: NEW_USER fehlt (export NEW_USER=...)" >&2
  exit 1
fi
if [ -z "${NEW_PASS}" ]; then
  echo "FEHLER: NEW_PASS fehlt (export NEW_PASS=...)" >&2
  exit 1
fi

# === Projekt & Skript lokalisieren ===
cd ~/project || { echo "Kein ~/project gefunden"; exit 1; }
if [ ! -f ./migrate_sicherheitsdienst.sh ]; then
  F="$(find ~ -maxdepth 4 -name migrate_sicherheitsdienst.sh 2>/dev/null | head -n1 || true)"
  [ -n "${F:-}" ] && cp "$F" ./ || { echo "migrate_sicherheitsdienst.sh nicht gefunden"; exit 1; }
fi
chmod +x ./migrate_sicherheitsdienst.sh

# === sshpass installieren (für passwordbasiertes ssh-copy-id) ===
if ! command -v sshpass >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y sshpass
fi

# === SSH-Key erzeugen (falls nicht vorhanden) & Host-Fingerprint bereinigen ===
[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
ssh-keygen -R "${NEW_IP}" >/dev/null 2>&1 || true

# === Public Key mit Passwort einmalig auf neuen Server kopieren ===
sshpass -p "$NEW_PASS" ssh-copy-id -o StrictHostKeyChecking=accept-new ${NEW_USER}@${NEW_IP}

# Kurztest: jetzt muss Key-Login ohne Passwort funktionieren
ssh -o BatchMode=yes ${NEW_USER}@${NEW_IP} "echo OK" | grep -q "^OK$" || { echo "SSH-Key-Login fehlgeschlagen"; exit 1; }

# Passwort-Variable aus dem Environment entfernen
unset NEW_PASS

# (Optional) Backup-Quelle überschreiben, falls Backups NICHT in ~/project/.backups liegen:
# export BACKUP_SRC_DIR="$HOME/sicherheitsdienst-backup"

# === Migration/Restore starten ===
export NEW_USER="${NEW_USER}" NEW_IP="${NEW_IP}"
./migrate_sicherheitsdienst.sh

# === Nachlauf: kompakte Zusammenfassung erzeugen (Remote) ===
ssh ${NEW_USER}@${NEW_IP} bash -lc '
  set -e
  echo "### MIGRATION – KURZBERICHT"
  echo "- Host: $(hostname -f) ($(hostname -I | awk "{print \$1}"))"
  echo "- Compose Status:"
  docker compose -f ~/project/docker-compose.dev.yml ps || true
  echo "- Health /api/health:"
  (curl -sf http://localhost:3000/api/health | jq -c .) || echo "NOK"
  echo "- Stats /api/stats:"
  (curl -sf http://localhost:3000/api/stats  | jq -c . | cut -c1-200) || echo "NOK"
  echo "- Frontend:  http://'${NEW_IP}':5173"
  echo "- API-Health: http://'${NEW_IP}':3000/api/health"
  echo "- Login (falls Seeds aktiv): admin@sicherheitsdienst.de / password123"
'

