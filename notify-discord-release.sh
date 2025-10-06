#!/bin/bash
# Discord Release Notification für v1.8.0
set -e

WEBHOOK_URL="${DISCORD_WEBHOOK:-}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: DISCORD_WEBHOOK environment variable not set"
  exit 1
fi

RELEASE_TAG="v1.8.0"
RELEASE_URL="https://github.com/Commandershadow9/sicherheitsdienst-tool/releases/tag/v1.8.0"
REPO_URL="https://github.com/Commandershadow9/sicherheitsdienst-tool"

# Release Notes (gekürzt für Discord - max 1600 Zeichen)
RELEASE_NOTES=$(cat <<'EOF'
**🎯 Großer Meilenstein: Intelligente Ersatz-Mitarbeiter-Suche**

**Intelligentes Scoring (0-100 Punkte)**
• 40% Compliance (ArbZG §3 & §5)
• 30% Präferenzen
• 20% Fairness (Team-Vergleich)
• 10% Workload

**Visuelle Bewertung**
🟢 OPTIMAL (85-100) | 🟡 GOOD (70-84)
🟠 ACCEPTABLE (50-69) | 🔴 NOT_RECOMMENDED (<50)

**Was ist neu**
• 3 Datenmodelle (Preferences, Workload, Compliance)
• 5 Scoring-Algorithmen + 31 Unit-Tests
• Neue UI-Komponenten (ScoreRing, MetricBadge, WarningBadge)
• Metriken-Grid & Compliance-Warnungen

**Bugfixes**
• Login-Problem gelöst (Docker-Migration)
• Backend Port 3000→3001
• CORS konfiguriert

**Stats**: 56 Dateien | 8463+ Zeilen | 31 Tests ✓ | ~14h Dev
EOF
)

# JSON Payload erstellen
PAYLOAD=$(cat <<EOF
{
  "username": "GitHub · sicherheitsdienst-tool",
  "avatar_url": "https://github.com/Commandershadow9.png",
  "embeds": [
    {
      "title": "🚀 Release ${RELEASE_TAG} - Intelligente Ersatz-Mitarbeiter-Suche",
      "url": "${RELEASE_URL}",
      "description": "${RELEASE_NOTES}",
      "color": 3066993,
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "thumbnail": {
        "url": "https://raw.githubusercontent.com/primer/octicons/main/icons/rocket-24.svg"
      },
      "author": {
        "name": "Commandershadow9",
        "url": "https://github.com/Commandershadow9",
        "icon_url": "https://github.com/Commandershadow9.png"
      },
      "fields": [
        {
          "name": "📝 Release Notes",
          "value": "[Vollständige Release Notes ansehen](${RELEASE_URL})"
        },
        {
          "name": "📚 Dokumentation",
          "value": "• [ROADMAP.md](${REPO_URL}/blob/main/docs/ROADMAP.md)\\n• [Feature-Spec](${REPO_URL}/blob/main/docs/FEATURE_INTELLIGENT_REPLACEMENT.md)\\n• [Test-Guide](${REPO_URL}/blob/main/HEUTE_ABEND_TESTEN.md)"
        },
        {
          "name": "🔗 Links",
          "value": "[Repository](${REPO_URL}) | [Actions](${REPO_URL}/actions) | [Releases](${REPO_URL}/releases)"
        }
      ],
      "footer": {
        "text": "Release v1.8.0 • $(date -u +%Y-%m-%d)"
      }
    }
  ]
}
EOF
)

# Send to Discord
echo "Sending release notification to Discord..."
RESPONSE=$(curl -sS -X POST -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Release notification sent successfully (HTTP $HTTP_CODE)"
else
  echo "❌ Failed to send notification (HTTP $HTTP_CODE)"
  echo "$RESPONSE"
  exit 1
fi
