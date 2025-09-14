#!/usr/bin/env bash
set -euo pipefail

# Remote-Bootstrap: kopiert Backup auf neuen Server und startet restore.sh
# - Optional Passwort-Auth via sshpass (env: SSH_PASSWORD)
# - Root-User: ohne sudo; andere Nutzer: mit sudo
# Nutzung:
#   SSH_PASSWORD=secret scripts/bootstrap_remote.sh <user@host> <backup_ts> [ssh_port]
# Beispiel:
#   SSH_PASSWORD=secret scripts/bootstrap_remote.sh root@203.0.113.10 20250914-020456 22

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <user@host> <backup_ts> [ssh_port]" >&2
  exit 1
fi

REMOTE="$1"
TS="$2"
PORT="${3:-}"
ROOT="${ROOT:-$HOME/project}"
SRC_DIR="$ROOT/.backups/$TS"

if [ ! -d "$SRC_DIR" ]; then
  echo "Backup-Verzeichnis nicht gefunden: $SRC_DIR" >&2
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PreferredAuthentications=publickey,password,keyboard-interactive"
if [ -n "$PORT" ]; then
  SSH_OPTS="$SSH_OPTS -p $PORT"
fi

USE_SSH="ssh $SSH_OPTS"
USE_SCP="scp $([ -n "$PORT" ] && echo "-P $PORT")"
RSYNC_PREFIX=""

if [ -n "${SSH_PASSWORD:-}" ]; then
  if command -v sshpass >/dev/null 2>&1; then
    USE_SSH="sshpass -p "$SSH_PASSWORD" $USE_SSH"
    USE_SCP="sshpass -p "$SSH_PASSWORD" $USE_SCP"
    RSYNC_PREFIX="sshpass -p $SSH_PASSWORD"
  else
    echo "Warnung: SSH_PASSWORD gesetzt, aber 'sshpass' nicht installiert. Versuche ohne Passwort-Helper (kann interaktiv scheitern)." >&2
  fi
fi

echo "== Kopiere Backup nach $REMOTE =="
eval $USE_SSH "$REMOTE" "mkdir -p ~/project/.backups/$TS"
if command -v rsync >/dev/null 2>&1; then
  if [ -n "$RSYNC_PREFIX" ]; then
    eval $RSYNC_PREFIX rsync -av --progress -e "ssh $SSH_OPTS" "$SRC_DIR/" "$REMOTE:~/project/.backups/$TS/"
  else
    rsync -av --progress -e "ssh $SSH_OPTS" "$SRC_DIR/" "$REMOTE:~/project/.backups/$TS/"
  fi
else
  eval $USE_SCP -r "$SRC_DIR/"* "$REMOTE:~/project/.backups/$TS/"
fi

REMOTE_USER="${REMOTE%@*}"
RUN_REMOTE="cd ~/project/.backups/$TS && bash restore.sh"
if [ "${REMOTE_USER}" != "root" ]; then
  RUN_REMOTE="cd ~/project/.backups/$TS && sudo bash restore.sh"
fi
echo "== Starte Restore remote =="
eval $USE_SSH -t "$REMOTE" "$RUN_REMOTE"

echo "== Prüfe Endpunkte remote =="
eval $USE_SSH -t "$REMOTE" "curl -sf http://localhost:3000/api/health >/dev/null && echo 'API /api/health: OK' || echo 'API /api/health: FEHLER'"
eval $USE_SSH -t "$REMOTE" "curl -sf http://localhost:3000/api/stats  >/dev/null && echo 'API /api/stats: OK'  || echo 'API /api/stats: FEHLER'"
echo "Frontend: http://$REMOTE:5173"
