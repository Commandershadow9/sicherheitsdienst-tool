#!/usr/bin/env bash
set -euo pipefail

# Sendet einen Test-Alert an Alertmanager, um Slack/Webhook-Routing zu verifizieren.
# Nutzung:
#   ./monitoring/scripts/send-test-alert.sh AuditLogQueueGrowing
# Optional: ALERTMANAGER_URL=http://<host>:9093 ./monitoring/scripts/send-test-alert.sh AuditLogFlushFailures

ALERTMANAGER_URL=${ALERTMANAGER_URL:-http://localhost:9093}
ALERT_NAME=${1:-AuditLogQueueGrowing}

case "${ALERT_NAME}" in
  AuditLogQueueGrowing)
    SEVERITY=warning
    SUMMARY="Audit Queue wächst (Test)"
    DESCRIPTION="Dummy-Alert, um Slack-Routing zu prüfen."
    ;;
  AuditLogDirectFailures)
    SEVERITY=warning
    SUMMARY="Audit Direct Failure (Test)"
    DESCRIPTION="Dummy-Alert für direkte Fehlversuche."
    ;;
  AuditLogFlushFailures)
    SEVERITY=critical
    SUMMARY="Audit Flush Failure (Test)"
    DESCRIPTION="Dummy-Alert: Flush blockiert."
    ;;
  AuditLogPruneErrors)
    SEVERITY=warning
    SUMMARY="Audit Prune Fehler (Test)"
    DESCRIPTION="Dummy-Alert: Retention schlug fehl."
    ;;
  *)
    echo "Unbekannter Alert-Typ: ${ALERT_NAME}" >&2
    echo "Erlaubte Werte: AuditLogQueueGrowing, AuditLogDirectFailures, AuditLogFlushFailures, AuditLogPruneErrors" >&2
    exit 1
    ;;
 esac

payload=$(cat <<JSON
[
  {
    "labels": {
      "alertname": "${ALERT_NAME}",
      "service": "sicherheitsdienst-api",
      "severity": "${SEVERITY}",
      "source": "manual-test"
    },
    "annotations": {
      "summary": "${SUMMARY}",
      "description": "${DESCRIPTION}",
      "runbook_url": "https://github.com/Commandershadow9/sicherheitsdienst-tool/blob/main/MONITORING.md"
    },
    "startsAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "endsAt": "$(date -u -d '+2 minutes' +%Y-%m-%dT%H:%M:%SZ)"
  }
]
JSON
)

curl -sfS -XPOST "${ALERTMANAGER_URL}/api/v2/alerts" \
  -H 'Content-Type: application/json' \
  -d "${payload}"

echo "Test-Alert '${ALERT_NAME}' erfolgreich an ${ALERTMANAGER_URL} gesendet."
