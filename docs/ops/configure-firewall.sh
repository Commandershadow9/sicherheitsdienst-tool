#!/usr/bin/env bash
set -euo pipefail

# Example hardening script for UFW-based hosts.
# Adjust to your environment before running.
# Purpose: allow SSH + web, restrict document storage services to localhost,
# and drop all other inbound traffic.

if [[ $EUID -ne 0 ]]; then
  echo "[ERROR] Run with sudo/root" >&2
  exit 1
fi

read -rp "This will modify UFW rules. Continue? [y/N] " answer
case "$answer" in
  y|Y|yes|YES) ;;
  *) echo "Aborted."; exit 0 ;;
esac

# Baseline policies
ufw default deny incoming
ufw default allow outgoing

# Essential services
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# API (adjust if served on different port)
ufw allow 3000/tcp

# Vite dev server (optional, comment out in production)
# ufw allow from 0.0.0.0/0 to any port 5173 proto tcp

# MinIO or other internal storage endpoints - allow only localhost
# ufw allow from 127.0.0.1 to 127.0.0.1 port 9000 proto tcp
# ufw deny 9000/tcp

# Enable logging at a reasonable level
ufw logging medium

ufw enable
ufw status verbose
