#!/usr/bin/env bash
set -euo pipefail

# Bootstrap/Deploy script for production stack

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker ist nicht installiert. Bitte zuerst Docker Engine + Compose installieren." >&2
  exit 1
fi

echo "[+] Baue und starte production-Stack"
docker compose -f docker-compose.prod.yml up -d --build

echo "[+] Warte kurz auf Container-Start"
sleep 5

echo "[+] Health-Check API"
docker compose -f docker-compose.prod.yml exec -T api sh -lc 'wget -qO- http://localhost:3000/api/health || true'

echo "[i] Hinweis: Für HTTPS Zertifikate bitte Domains im caddy/Caddyfile setzen und DNS auf diesen Server zeigen."

