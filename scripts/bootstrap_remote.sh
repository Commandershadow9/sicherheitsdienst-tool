#!/usr/bin/env bash
set -euo pipefail

# Remote-Bootstrap: kopiert Backup auf neuen Server und startet restore.sh (mit sudo)
# Nutzung:
#   scripts/bootstrap_remote.sh <user@host> <backup_ts> [ssh_port]
# Beispiel:
#   scripts/bootstrap_remote.sh ubuntu@203.0.113.10 20250914-020456 22

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <user@host> <backup_ts> [ssh_port]" >&2
  exit 1
fi

REMOTE="$1"
TS="$2"
PORT="${3:-}"
SSH_OPTS="-o BatchMode=yes"
if [ -n "$PORT" ]; then
  SSH_OPTS="$SSH_OPTS -p $PORT"
fi

ROOT="${ROOT:-$HOME/project}"
SRC_DIR="$ROOT/.backups/$TS"

if [ ! -d "$SRC_DIR" ]; then
  echo "Backup-Verzeichnis nicht gefunden: $SRC_DIR" >&2
  exit 1
fi

echo "== Kopiere Backup nach $REMOTE =="
ssh $SSH_OPTS "$REMOTE" "mkdir -p ~/project/.backups/$TS"
if command -v rsync >/dev/null 2>&1; then
  rsync -av --progress -e "ssh $SSH_OPTS" "$SRC_DIR/" "$REMOTE:~/project/.backups/$TS/"
else
  scp $([ -n "$PORT" ] && echo "-P $PORT") -r "$SRC_DIR/"* "$REMOTE:~/project/.backups/$TS/"
fi

echo "== Starte Restore remote (sudo) =="
ssh -t $SSH_OPTS "$REMOTE" "cd ~/project/.backups/$TS && sudo bash restore.sh"

echo "== Prüfe Endpunkte remote =="
ssh -t $SSH_OPTS "$REMOTE" "curl -sf http://localhost:3000/api/health >/dev/null && echo 'API /api/health: OK' || echo 'API /api/health: FEHLER'"
ssh -t $SSH_OPTS "$REMOTE" "curl -sf http://localhost:3000/api/stats  >/dev/null && echo 'API /api/stats: OK'  || echo 'API /api/stats: FEHLER'"
echo "Frontend: http://$REMOTE:5173"
