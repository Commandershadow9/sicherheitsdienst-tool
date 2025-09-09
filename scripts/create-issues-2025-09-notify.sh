#!/usr/bin/env bash
set -euo pipefail

# Create milestone + issues for Notifications v1 + Observability 2 (09/2025)
# Requires gh CLI authenticated.

detect_repo() {
  local url
  url=$(git remote get-url origin 2>/dev/null || echo "")
  url=${url#git@github.com:}
  url=${url#https://github.com/}
  url=${url%.git}
  echo "$url"
}
REPO=${REPO:-$(detect_repo)}
if [[ -z "$REPO" ]]; then echo "Repo not detected" >&2; exit 1; fi

MILESTONE_TITLE=${MILESTONE_TITLE:-"Milestone 2025-09 Notifications v1 + Observability 2"}

echo "Creating milestone: $MILESTONE_TITLE"
ms_out=$(gh api repos/$REPO/milestones -f title="$MILESTONE_TITLE" -f state=open --jq '{number: .number, url: .html_url}' 2>/dev/null || true)
if [[ -z "$ms_out" ]]; then
  # fallback: get existing
  ms_out=$(gh api repos/$REPO/milestones --jq ".[] | select(.title==\"$MILESTONE_TITLE\") | {number: .number, url: .html_url}" | head -n1)
fi
MS_NUMBER=$(echo "$ms_out" | jq -r '.number')
echo "Milestone #$MS_NUMBER"

create_issue() {
  local title="$1"; shift
  local body="$1"; shift
  local labels="$1"; shift
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label planning $labels --milestone "$MILESTONE_TITLE" --json number,url | jq -r '"#"+(.number|tostring)+" "+.url'
}

echo "Creating issues..."
create_issue "P0: FCM-Integration produktiv" $'ENV und Doku; robuste Initialisierung; Fehlerhandling; Token-Deaktivierung; /stats push counters.' "P0"
create_issue "P0: Contract-Tests nightly aktivieren" $'Nightly Schedule; compose up; health wait; dredd; logs + teardown.' "P0"
create_issue "P1: E-Mail-Templates (Basis)" $'Templates (Subject/Text) und Variablen; sendShiftChangedEmail verwenden; Tests.' "P1"
create_issue "P1: README – FCM Setup & Best Practices" $'ENV, Credential-Handling, Troubleshooting; Verweis auf /stats.' "P1"
create_issue "P2: Rate-Limits erweitern (optional)" $'Weitere sensible Endpunkte (Users/Sites) per ENV; 429 mit Header; Tests.' "P2"

echo "Done."

