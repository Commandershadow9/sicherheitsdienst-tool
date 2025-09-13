#!/usr/bin/env bash
set -euo pipefail

# Simple API smoke using httpie (preferred) or curl fallback.
# Usage: BASE=http://localhost:3000 tools/api-smoke.sh

BASE=${BASE:-http://localhost:3000}
EMAIL=${EMAIL:-admin@sicherheitsdienst.de}
PASSWORD=${PASSWORD:-password123}

have_httpie() { command -v http >/dev/null 2>&1; }
have_jq() { command -v jq >/dev/null 2>&1; }

echo "[SMOKE] Base: $BASE"

# 1) Login
if have_httpie; then
  LOGIN_JSON=$(http --ignore-stdin --check-status --pretty=none POST "$BASE/api/auth/login" email="$EMAIL" password="$PASSWORD")
else
  LOGIN_JSON=$(curl -sS -f -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "$BASE/api/auth/login")
fi

if have_jq; then
  TOKEN=$(echo "$LOGIN_JSON" | jq -r '.accessToken // .token')
else
  TOKEN=$(python3 - <<PY
import sys, json
o=json.load(sys.stdin)
print(o.get('accessToken') or o.get('token') or '')
PY
  <<<"$LOGIN_JSON")
fi

test -n "$TOKEN" || { echo "[SMOKE] ERROR: no token from login"; exit 1; }
echo "[SMOKE] Got token: ${TOKEN:0:12}…"

AUTH=("Authorization: Bearer $TOKEN")

# 2) Users list (JSON)
if have_httpie; then
  http --ignore-stdin --check-status GET "$BASE/api/users?page=1&pageSize=1" "${AUTH[@]}" >/dev/null
else
  curl -sS -f -H "${AUTH[@]}" "$BASE/api/users?page=1&pageSize=1" >/dev/null
fi
echo "[SMOKE] /api/users ok"

# 3) Users CSV export (filtered)
if have_httpie; then
  http --ignore-stdin --check-status GET "$BASE/api/users?role=EMPLOYEE" "${AUTH[@]}" Accept:text/csv >/dev/null
else
  curl -sS -f -H "${AUTH[@]}" -H 'Accept: text/csv' "$BASE/api/users?role=EMPLOYEE" >/dev/null
fi
echo "[SMOKE] /api/users CSV ok"

# 4) Sites list
if have_httpie; then
  http --ignore-stdin --check-status GET "$BASE/api/sites?page=1&pageSize=1" "${AUTH[@]}" >/dev/null
else
  curl -sS -f -H "${AUTH[@]}" "$BASE/api/sites?page=1&pageSize=1" >/dev/null
fi
echo "[SMOKE] /api/sites ok"

echo "[SMOKE] DONE"

