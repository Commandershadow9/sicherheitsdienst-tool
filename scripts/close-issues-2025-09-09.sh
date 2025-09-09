#!/usr/bin/env bash
set -euo pipefail

# Close planning issues for 2025-09-09 and close the milestone via gh CLI.
# Prerequisites:
# - GitHub CLI: https://cli.github.com/
# - Authenticated: gh auth login
# - Run from repo root

detect_repo() {
  local url
  url=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ -z "$url" ]]; then echo ""; return; fi
  url=${url#git@github.com:}
  url=${url#https://github.com/}
  url=${url%.git}
  echo "$url"
}

REPO=${REPO:-$(detect_repo)}
if [[ -z "$REPO" ]]; then
  echo "Error: Could not detect GitHub repo. Set REPO=owner/repo." >&2
  exit 1
fi

echo "Repository: $REPO"

close_issue_by_title() {
  local title="$1"
  local num
  num=$(gh issue list --repo "$REPO" --state open --search "$title in:title" --json number,title --jq '.[0].number' 2>/dev/null || true)
  if [[ -n "${num:-}" ]]; then
    echo "Closing #$num ($title)"
    gh issue close "$num" --repo "$REPO" -c "Implemented in release v2025-09-09"
  else
    echo "No open issue found for title: $title (skipping)"
  fi
}

titles=(
  "P0: Incidents CRUD + List/Filter/Export"
  "P0: OpenAPI ErrorResponse harmonisieren"
  "P1: Request-ID Middleware + Log-Korrelation"
  "P1: Rate-Limit für auth/login & refresh"
  "P1: PrismaClient Singleton"
  "/stats erweitern (Basics)"
  "P2: OpenAPI Fehlerbeispiele (Push/E-Mail)"
  "P2: README Operations/Runbook"
  "P2: 404/405 in OpenAPI dokumentieren"
  "P2: E-Mail Retry (einfach)"
)

for t in "${titles[@]}"; do
  close_issue_by_title "$t"
done

# Close milestone by title if exists
close_milestone_by_title() {
  local title
  for title in "Milestone 2025-09-09" "2025-09-09"; do
    local mid
    mid=$(gh api repos/$REPO/milestones --jq \
      ".[] | select(.title==\"$title\" and .state==\"open\") | .number" 2>/dev/null || true)
    if [[ -n "${mid:-}" ]]; then
      echo "Closing milestone '$title' (#$mid)"
      gh api -X PATCH repos/$REPO/milestones/$mid -f state=closed >/dev/null
      return 0
    fi
  done
  echo "No open milestone found to close (ok)"
}

close_milestone_by_title

echo "Done."

