#!/usr/bin/env bash
set -euo pipefail

# BorgBackup helper for document storage.
# Configure the variables below before running.

REPOSITORY="/backups/borg/documents"
SOURCE="/srv/documents"
EXCLUDE_FILE="/etc/borg-exclude-documents.txt"

if [[ -z "${BORG_PASSPHRASE:-}" ]]; then
  echo "[ERROR] Set BORG_PASSPHRASE environment variable before running." >&2
  exit 1
fi

export BORG_RELOCATED_REPO_ACCESS_IS_OK=yes

if [[ ! -d "$REPOSITORY" ]]; then
  echo "[ACTION] Initialising Borg repository at $REPOSITORY"
  borg init --encryption=repokey "$REPOSITORY"
fi

borg create --stats --progress \
  "$REPOSITORY"::"documents-{now:%Y-%m-%d_%H-%M}" \
  "$SOURCE" \
  --exclude-from "$EXCLUDE_FILE"

borg prune -v --list "$REPOSITORY" \
  --keep-daily=7 \
  --keep-weekly=4 \
  --keep-monthly=12

borg compact "$REPOSITORY"

