#!/usr/bin/env bash
set -euo pipefail

# This script creates GitHub issues for the planning tickets (2025-09-09).
# Prerequisites:
# - GitHub CLI installed: https://cli.github.com/
# - Authenticated: gh auth login
# - Repo set: run from repo root; script will detect origin.
# Optional:
# - Pre-create labels: planning, P0, P1, P2 (otherwise omit --label flags below).

detect_repo() {
  local url
  url=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ -z "$url" ]]; then
    echo ""; return
  fi
  # Extract org/repo from SSH or HTTPS URL
  url=${url#git@github.com:}
  url=${url#https://github.com/}
  url=${url%.git}
  echo "$url"
}

REPO=${REPO:-$(detect_repo)}
if [[ -z "$REPO" ]]; then
  echo "Error: Could not detect GitHub repo. Set REPO=owner/repo env var." >&2
  exit 1
fi

echo "Using repository: $REPO"

create_issue() {
  local title="$1"; shift
  local priority="$1"; shift
  local body="$1"; shift
  local labels=("planning" "$priority")
  # Create issue and capture URL/number
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    $(printf -- "--label %q " "${labels[@]}") \
    --assignee @me \
    --json number,url \
    --template '' | jq -r '"#" + (.number|tostring) + " " + .url'
}

note() {
  cat <<'EOF'
Note:
- If labels P0/P1/P2 do not exist, create them first or remove label flags.
- You can re-run this script; duplicate titles will be rejected by GitHub if identical.
EOF
}

note

issues=()

# 1) P0 – Incidents CRUD + Listen/Filter/Export
body_1=$(cat <<'EOF'
Description:
Implement Incidents end-to-end: CRUD, list/filter, CSV/XLSX export. Align with OpenAPI and enforce RBAC (ADMIN/MANAGER write, AUTH read).

Acceptance Criteria (DoD):
- CRUD + list/filter return correct statuses; 401/403/404/422 covered.
- CSV/XLSX exports consistent with filters/sort/pagination.
- OpenAPI paths/schemas/examples match implementation.
- Tests (unit + route) green in CI.

Affected:
- backend/src/routes/incidentRoutes.ts
- backend/src/controllers/incidentController.ts
- backend/src/validations/incidentValidation.ts
- docs/openapi.yaml (finalize)
- backend/src/__tests__/incidents.*.test.ts

Estimate: M | Priority: P0
EOF
)
issues+=("$(create_issue "P0: Incidents CRUD + List/Filter/Export" "P0" "$body_1")")

# 2) P0 – ErrorResponse Harmonisierung OpenAPI
body_2=$(cat <<'EOF'
Description:
Align OpenAPI ErrorResponse with backend error shape: include success:boolean and code mapping. Update examples accordingly.

Acceptance Criteria (DoD):
- Components updated with success:boolean; examples reflect {success:false, code, message, errors?}.
- OpenAPI validate + Redocly lint pass in CI.
- Smoke-tests assert error shape.

Affected:
- docs/openapi.yaml
- README.md examples (if needed)

Estimate: S | Priority: P0
EOF
)
issues+=("$(create_issue "P0: OpenAPI ErrorResponse harmonisieren" "P0" "$body_2")")

# 3) P1 – Request-ID Middleware + Log-Korrelation
body_3=$(cat <<'EOF'
Description:
Add request ID middleware that sets/propagates X-Request-ID and logs it with each entry.

Acceptance Criteria (DoD):
- Middleware sets header on response and attaches to req context.
- Logger includes request ID for HTTP logs and errors.
- Tests verify header presence and log correlation hook.

Affected:
- backend/src/middleware/requestId.ts
- backend/src/app.ts (wire)
- backend/src/utils/logger.ts

Estimate: S | Priority: P1
EOF
)
issues+=("$(create_issue "P1: Request-ID Middleware + Log-Korrelation" "P1" "$body_3")")

# 4) P1 – Rate-Limit für auth/login + refresh
body_4=$(cat <<'EOF'
Description:
Apply configurable rate limiting to /auth/login and /auth/refresh with Retry-After and ENV toggles.

Acceptance Criteria (DoD):
- 429 with Retry-After under configured load; env toggles documented.
- Tests for enabled/disabled, perMin/window combinations.

Affected:
- backend/src/middleware/rateLimit.ts (extension)
- backend/src/routes/authRoutes.ts
- backend/.env.example (docs)

Estimate: S | Priority: P1
EOF
)
issues+=("$(create_issue "P1: Rate-Limit für auth/login & refresh" "P1" "$body_4")")

# 5) P1 – PrismaClient Singleton
body_5=$(cat <<'EOF'
Description:
Introduce a Prisma client singleton and refactor modules to use it to avoid multiple instances.

Acceptance Criteria (DoD):
- Single instance exported from utils; controllers/middleware updated.
- Tests/CI remain green; no connection leak warnings.

Affected:
- backend/src/utils/prisma.ts
- Various controllers/middleware imports

Estimate: S | Priority: P1
EOF
)
issues+=("$(create_issue "P1: PrismaClient Singleton" "P1" "$body_5")")

# 6) P1 – /stats erweitern (Basics)
body_6=$(cat <<'EOF'
Description:
Extend /stats with basic counters (requests total, 4xx/5xx) and surface rate-limit config.

Acceptance Criteria (DoD):
- New fields present and documented; tests cover presence/types.

Affected:
- backend/src/controllers/systemController.ts
- Optionally middleware counters

Estimate: S | Priority: P1
EOF
)
issues+=("$(create_issue "P1: /stats erweitern (Basics)" "P1" "$body_6")")

# 7) P2 – OpenAPI Fehlerbeispiele Push/E-Mail
body_7=$(cat <<'EOF'
Description:
Add 429/5xx error examples for push/email related endpoints in OpenAPI.

Acceptance Criteria (DoD):
- Examples added; lint passes.

Affected:
- docs/openapi.yaml

Estimate: S | Priority: P2
EOF
)
issues+=("$(create_issue "P2: OpenAPI Fehlerbeispiele (Push/E-Mail)" "P2" "$body_7")")

# 8) P2 – README Operations/Runbook
body_8=$(cat <<'EOF'
Description:
Add an Operations/Runbook section: start/stop, health checks, env matrix, troubleshooting.

Acceptance Criteria (DoD):
- Section added with docker-compose references and env overview.

Affected:
- README.md

Estimate: S | Priority: P2
EOF
)
issues+=("$(create_issue "P2: README Operations/Runbook" "P2" "$body_8")")

# 9) P2 – 404/405 in OpenAPI dokumentieren
body_9=$(cat <<'EOF'
Description:
Document standard 404/405 responses in OpenAPI components and reference where applicable.

Acceptance Criteria (DoD):
- Components/responses added; lint passes; references added to key paths.

Affected:
- docs/openapi.yaml

Estimate: S | Priority: P2
EOF
)
issues+=("$(create_issue "P2: 404/405 in OpenAPI dokumentieren" "P2" "$body_9")")

# 10) P2 – E-Mail Retry (einfach)
body_10=$(cat <<'EOF'
Description:
Add a simple retry (1 attempt) to email sending for transient failures.

Acceptance Criteria (DoD):
- Retry implemented; unit tests cover success/failure paths; no retry on explicit permanent failures.

Affected:
- backend/src/services/emailService.ts

Estimate: S | Priority: P2
EOF
)
issues+=("$(create_issue "P2: E-Mail Retry (einfach)" "P2" "$body_10")")

echo "Created issues:"
printf '%s\n' "${issues[@]}"

