#!/usr/bin/env bash
set -euo pipefail

# LUKS-backed document storage setup
# ----------------------------------
# This script prepares an encrypted container for employee documents and mounts it.
# Run it manually on the server with root privileges. Review before executing.
#
# Example:
#   sudo ./setup-document-storage.sh \
#       --luks-file /srv/vault/documents.luks \
#       --size 20G \
#       --mapper-name docstore \
#       --mount-point /srv/documents \
#       --owner svc-docstore \
#       --group svc-docstore

LUKS_FILE=""
SIZE=""
MAPPER_NAME="docstore"
MOUNT_POINT="/srv/documents"
FILESYSTEM="ext4"
OWNER="root"
GROUP="root"
PERMS="750"

usage() {
  grep '^#' "$0" | sed 's/^# //' | sed -n '1,40p'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --luks-file)    LUKS_FILE="$2"; shift 2 ;;
    --size)         SIZE="$2"; shift 2 ;;
    --mapper-name)  MAPPER_NAME="$2"; shift 2 ;;
    --mount-point)  MOUNT_POINT="$2"; shift 2 ;;
    --filesystem)   FILESYSTEM="$2"; shift 2 ;;
    --owner)        OWNER="$2"; shift 2 ;;
    --group)        GROUP="$2"; shift 2 ;;
    --perms)        PERMS="$2"; shift 2 ;;
    --help|-h)      usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "[ERROR] Run this script with sudo/root." >&2
  exit 1
fi

if [[ -z "$LUKS_FILE" || -z "$SIZE" ]]; then
  echo "[ERROR] --luks-file and --size are required." >&2
  usage
  exit 1
fi

if [[ ! -e "$LUKS_FILE" ]]; then
  echo "[INFO] Creating sparse file $LUKS_FILE with size $SIZE …"
  install -d "$(dirname "$LUKS_FILE")"
  fallocate -l "$SIZE" "$LUKS_FILE"
else
  echo "[INFO] LUKS container $LUKS_FILE already exists."
fi

if ! cryptsetup isLuks "$LUKS_FILE" >/dev/null 2>&1; then
  echo "[ACTION] Initialising LUKS container (you will be prompted for a passphrase)."
  cryptsetup luksFormat "$LUKS_FILE"
else
  echo "[INFO] $LUKS_FILE is already a LUKS container."
fi

if lsblk -o NAME | grep -q "${MAPPER_NAME}$"; then
  echo "[WARN] Mapper $MAPPER_NAME is already open."
else
  echo "[ACTION] Opening mapper $MAPPER_NAME …"
  cryptsetup open "$LUKS_FILE" "$MAPPER_NAME"
fi

MAPPER_PATH="/dev/mapper/${MAPPER_NAME}"
if ! blkid "$MAPPER_PATH" >/dev/null 2>&1; then
  echo "[ACTION] Formatting $MAPPER_PATH as $FILESYSTEM …"
  mkfs -t "$FILESYSTEM" "$MAPPER_PATH"
else
  echo "[INFO] $MAPPER_PATH already formatted."
fi

install -d "$MOUNT_POINT"
if ! mount | grep -q "${MOUNT_POINT} "; then
  echo "[ACTION] Mounting $MAPPER_PATH on $MOUNT_POINT …"
  mount "$MAPPER_PATH" "$MOUNT_POINT"
else
  echo "[INFO] $MOUNT_POINT already mounted."
fi

chown "$OWNER":"$GROUP" "$MOUNT_POINT"
chmod "$PERMS" "$MOUNT_POINT"

UUID=$(blkid -s UUID -o value "$LUKS_FILE")
MAPPER_UUID=$(blkid -s UUID -o value "$MAPPER_PATH" 2>/dev/null || echo "")

cat <<EOF

=== Suggested /etc/crypttab entry ===
${MAPPER_NAME} UUID=${UUID} none luks

=== Suggested /etc/fstab entry ===
/dev/mapper/${MAPPER_NAME} ${MOUNT_POINT} ${FILESYSTEM} defaults,noatime 0 2

=== Optional systemd mount unit ===
# /etc/systemd/system/${MAPPER_NAME}.mount
[Unit]
Description=Document storage
Before=local-fs.target

[Mount]
What=/dev/mapper/${MAPPER_NAME}
Where=${MOUNT_POINT}
Type=${FILESYSTEM}
Options=noatime

[Install]
WantedBy=multi-user.target

After creating the files run:
  systemctl enable ${MAPPER_NAME}.mount
EOF

if [[ -n "$MAPPER_UUID" ]]; then
  echo "[INFO] Mapper filesystem UUID: ${MAPPER_UUID}"
fi

echo "[DONE] Document storage prepared at $MOUNT_POINT."
