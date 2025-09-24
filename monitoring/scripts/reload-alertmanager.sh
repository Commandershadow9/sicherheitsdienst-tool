#!/usr/bin/env bash
set -euo pipefail

ALERTMANAGER_URL=${ALERTMANAGER_URL:-http://localhost:9093}

echo "Triggering Alertmanager config reload at $ALERTMANAGER_URL/-/reload"
curl -sS -X POST "$ALERTMANAGER_URL/-/reload" || {
  echo "Failed to trigger reload. Is Alertmanager reachable?" >&2
  exit 1
}

echo "Reload request sent."
