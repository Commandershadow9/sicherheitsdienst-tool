#!/usr/bin/env bash
set -euo pipefail

# Remote-Bootstrap: kopiert Backup auf neuen Server und startet restore.sh
# Nutzung:
#   scripts/bootstrap_remote.sh <user@host> <backup_ts>
# Beispiel:
#   scripts/bootstrap_remote.sh ubuntu@203.0.113.10 20250914-020456

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <user@host> <backup_ts>" >&2
  exit 1
fi

REMOTE="$1"
TS="$2"
ROOT="${ROOT:-$HOME/project}"
SRC_DIR="$ROOT/.backups/$TS"

if [ ! -d "$SRC_DIR" ]; then
  echo "Backup-Verzeichnis nicht gefunden: $SRC_DIR" >&2
  exit 1
fi

echo "== Kopiere Backup nach $REMOTE =="
ssh -o BatchMode=yes "$REMOTE" "mkdir -p ~/project/.backups/$TS"
rsync -av --progress "$SRC_DIR/" "$REMOTE:~/project/.backups/$TS/"

echo "== Starte Restore remote =="
ssh -t "$REMOTE" "cd ~/project/.backups/$TS && bash restore.sh"

echo "== Prüfe Endpunkte remote =="
ssh -t "$REMOTE" "curl -sf http://localhost:3000/api/health >/dev/null && echo 'API /api/health: OK' || echo 'API /api/health: FEHLER'"
ssh -t "$REMOTE" "curl -sf http://localhost:3000/api/stats  >/dev/null && echo 'API /api/stats: OK'  || echo 'API /api/stats: FEHLER'"
echo "Frontend: http://$REMOTE:5173"
