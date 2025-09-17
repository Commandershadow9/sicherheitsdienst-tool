#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  cat <<'USAGE'
Usage: GRAFANA_URL=... GRAFANA_USER=... GRAFANA_PASSWORD=... ./import-dashboard.sh <dashboard-json>

Environment variables:
  GRAFANA_URL       Base URL of Grafana (e.g. http://localhost:3000)
  GRAFANA_USER      Grafana username (default: admin)
  GRAFANA_PASSWORD  Grafana password (default: admin)

The script posts the dashboard JSON file to /api/dashboards/db.
USAGE
  exit 0
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: ./import-dashboard.sh <dashboard-json>" >&2
  exit 1
fi

GRAFANA_URL=${GRAFANA_URL:-http://localhost:3000}
GRAFANA_USER=${GRAFANA_USER:-admin}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin}
DASHBOARD_FILE=$1

if [[ ! -f "$DASHBOARD_FILE" ]]; then
  echo "Dashboard file '$DASHBOARD_FILE' not found" >&2
  exit 1
fi

echo "Importing dashboard $DASHBOARD_FILE into $GRAFANA_URL"

payload=$(jq -n --argjson dashboard "$(cat "$DASHBOARD_FILE")" '{ dashboard: $dashboard, folderId: 0, overwrite: true }')

curl -sS -X POST \
  "$GRAFANA_URL/api/dashboards/db" \
  -H 'Content-Type: application/json' \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d "$payload"

echo
echo "Dashboard import request submitted."

