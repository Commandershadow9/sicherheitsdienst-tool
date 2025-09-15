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

# 5) Events list (get one id), CSV and PDF
if have_httpie; then
  EV_JSON=$(http --ignore-stdin --check-status GET "$BASE/api/events?page=1&pageSize=1" "${AUTH[@]}")
else
  EV_JSON=$(curl -sS -f -H "${AUTH[@]}" "$BASE/api/events?page=1&pageSize=1")
fi
if have_jq; then
  EV_ID=$(echo "$EV_JSON" | jq -r '.data[0].id // empty')
else
  EV_ID=""
fi
echo "[SMOKE] /api/events ok (id=${EV_ID:-none})"

# CSV export
if have_httpie; then
  http --ignore-stdin --check-status GET "$BASE/api/events?page=1&pageSize=1" "${AUTH[@]}" Accept:text/csv >/dev/null
else
  curl -sS -f -H "${AUTH[@]}" -H 'Accept: text/csv' "$BASE/api/events?page=1&pageSize=1" >/dev/null
fi
echo "[SMOKE] /api/events CSV ok"

# PDF (only when id available)
if [ -n "${EV_ID:-}" ]; then
  if have_httpie; then
    http --ignore-stdin --check-status GET "$BASE/api/events/$EV_ID" "${AUTH[@]}" Accept:'application/pdf' >/dev/null
  else
    curl -sS -f -H "${AUTH[@]}" -H 'Accept: application/pdf' "$BASE/api/events/$EV_ID" >/dev/null
  fi
  echo "[SMOKE] /api/events/{id} PDF ok"
else
  echo "[SMOKE] Skipping events PDF (no id)"
fi

# 6) Incidents RBAC 403 (EMPLOYEE)
if have_httpie; then
  EMP_LOGIN=$(http --ignore-stdin --check-status POST "$BASE/api/auth/login" email='thomas.mueller@sicherheitsdienst.de' password='password123')
else
  EMP_LOGIN=$(curl -sS -f -H 'Content-Type: application/json' -d '{"email":"thomas.mueller@sicherheitsdienst.de","password":"password123"}' "$BASE/api/auth/login")
end
if have_jq; then EMP_TOKEN=$(echo "$EMP_LOGIN" | jq -r '.accessToken // .token'); else EMP_TOKEN=""; fi
if [ -n "$EMP_TOKEN" ]; then
  if have_httpie; then
    set +e
    http --ignore-stdin --check-status -v POST "$BASE/api/incidents" "Authorization: Bearer $EMP_TOKEN" title='x' 2>&1 | grep -q 'HTTP/1.1 403'
    RES=$?
    set -e
  else
    RES=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $EMP_TOKEN" -H 'Content-Type: application/json' -d '{"title":"x"}' "$BASE/api/incidents")
    [ "$RES" = "403" ] && RES=0 || RES=1
  fi
  if [ "$RES" -eq 0 ]; then echo "[SMOKE] incidents RBAC (EMPLOYEE→403) ok"; else echo "[SMOKE] ERROR: incidents RBAC check failed"; exit 1; fi
else
  echo "[SMOKE] WARN: could not obtain employee token; skipping incidents RBAC"
fi

echo "[SMOKE] DONE"
