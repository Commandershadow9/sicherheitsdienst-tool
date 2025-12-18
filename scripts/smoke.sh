#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

check_status() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$code" != "$expected" ]]; then
    echo "FAIL: $name ($url) expected $expected, got $code"
    exit 1
  fi
  echo "OK: $name ($code)"
}

check_status "health" "$BASE_URL/health" "200"
check_status "readyz" "$BASE_URL/readyz" "200"
check_status "unauth-protected" "$BASE_URL/api/users" "401"

echo "Smoke test passed."
