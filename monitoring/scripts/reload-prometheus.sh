#!/usr/bin/env bash
set -euo pipefail

PROMETHEUS_URL=${PROMETHEUS_URL:-http://localhost:9090}

echo "Triggering Prometheus config reload at $PROMETHEUS_URL/-/reload"
curl -sS -X POST "$PROMETHEUS_URL/-/reload" || {
  echo "Failed to trigger reload. Is Prometheus reachable?" >&2
  exit 1
}

echo "Reload request sent."

