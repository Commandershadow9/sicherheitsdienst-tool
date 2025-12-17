# Monitoring (Dev)

Kurzer Leitfaden für Prometheus + Grafana im optionalen Profil.

## Quickstart
```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```
- Prometheus: `http://<SERVER_IP>:9090`
- Grafana: `http://<SERVER_IP>:3300` (admin/admin)
- Alertmanager: `http://<SERVER_IP>:9093`

## ShadowOps Bot – Auto-Remediation (Prod-Stack)
- Health- und Log-Monitoring liegen im ShadowOps Bot (`/home/cmdshadow/shadowops-bot/config/config.yaml`).
- Für `sicherheitsdiensttool` aktiv: `/readyz` alle 15 s, Remediation-Schwelle 1, Log-Tail-Scan (80 KB) auf `PrismaClientKnownRequestError`; Remediation-Command: `docker compose up -d api db redis traefik pgadmin`.
- Testablauf: `docker compose stop api`, ~30–60 s warten → Bot sollte Alarm/Remediation auslösen und API wieder hochziehen.
- Parser-Warnungen wurden mit `npm install esprima` im Bot-Verzeichnis behoben; falls erneut auftauchen, erneut installieren.

## Operations Checklist
1. **ENV prüfen:** `.env` im Repo-Root mit `ALERTMANAGER_SLACK_WEBHOOK` (optional `ALERTMANAGER_SLACK_CHANNEL` und `ALERTMANAGER_SLACK_AUDIT_CHANNEL`) sowie optional `ALERTMANAGER_WEBHOOK_URL`/`ALERTMANAGER_WEBHOOK_BEARER` ergänzen.
2. **Stack starten:** `docker compose -f monitoring/docker-compose.monitoring.yml up -d`.
3. **Status prüfen:** `docker compose -f monitoring/docker-compose.monitoring.yml ps` – alle Services sollten `running` sein.
4. **Prometheus Targets:** `http://<SERVER_IP>:9090/targets` aufrufen → `sicherheitsdienst-api` muss `UP` sein (sonst Scrape-URL/Firewall prüfen).
5. **Grafana Login:** `http://<SERVER_IP>:3300` → admin/admin (Default), Passwort sofort ändern.
6. **Dashboard importieren (falls Provisioning deaktiviert oder Update nötig):**
   ```bash
   cd monitoring
   GRAFANA_URL=http://<SERVER_IP>:3300 \
   GRAFANA_USER=admin GRAFANA_PASSWORD=<PASSWORT> \
 ./scripts/import-dashboard.sh grafana/dashboards/audit-trail.json
  ```
   Optional: weitere Dashboards importieren (SLO/Fehlerraten):
   ```bash
   ./scripts/import-dashboard.sh grafana/dashboards/latency-and-errors.json
   ./scripts/import-dashboard.sh grafana/dashboards/top-routes-p95.json
   ./scripts/import-dashboard.sh grafana/dashboards/top-routes-5xx.json
   ```
7. **Regeln/Config neu laden:**
   - Prometheus: `PROMETHEUS_URL=http://<SERVER_IP>:9090 ./scripts/reload-prometheus.sh`
   - Alertmanager: `ALERTMANAGER_URL=http://<SERVER_IP>:9093 ./scripts/reload-alertmanager.sh`
8. **Alert-Routing testen:** Alertmanager UI `http://<SERVER_IP>:9093` → `Routes` prüfen oder per Skript `./monitoring/scripts/send-test-alert.sh AuditLogQueueGrowing` einen Dummy-Alert in Slack/Webhook auslösen (weitere Typen: `AuditLogDirectFailures`, `AuditLogFlushFailures`, `AuditLogPruneErrors`).
9. **Blackbox-Checks beobachten:** Prometheus `blackbox`-Job (`http://<SERVER_IP>:9090/targets`) und Grafana-Panels "Blackbox Probe Erfolg"/"Blackbox Probe Dauer" prüfen; Fehler weisen auf Netz-/DNS-Probleme oder auf nicht erreichbare `/healthz`/`/readyz`-Endpunkte hin.

## Alertmanager Setup & Routing
- Compose startet `prom/alertmanager` mit `monitoring/alertmanager/config.yml` (Slack + Webhook).
- ENV vor dem Start setzen (z. B. in `.env` im Repo-Root):
  ```dotenv
  ALERTMANAGER_SLACK_WEBHOOK=https://hooks.slack.com/services/XXX/YYY/ZZZ
  ALERTMANAGER_SLACK_CHANNEL=#on-call
  ALERTMANAGER_SLACK_AUDIT_CHANNEL=#ops-audit
  ALERTMANAGER_WEBHOOK_URL=https://ops-gateway.internal/hooks/sicherheitsdienst
  ALERTMANAGER_WEBHOOK_BEARER=optional-bearer-token
  ```
- Slack-Receiver bündelt Alerts via `alertname`/`service` und zeigt Summary/Description + Runbook-Link.
- Subroute mit `alertname=~"AuditLog.*"` sendet Audit-Warnungen in den dedizierten Ops-Kanal (optional via `ALERTMANAGER_SLACK_AUDIT_CHANNEL` konfigurierbar).
- Subroute mit `severity="critical"` spiegelt Alerts zusätzlich auf das Ops-Webhook (continue: true).
- `monitoring/scripts/reload-alertmanager.sh` triggert `/-/reload` (nach Config-Änderungen statt Container-Neustart).
- Labels nutzen (`service=sicherheitsdienst-api`, `severity=warning|critical`, optional `runbook_url`) – siehe `monitoring/alerts/alerts.yml`.


### Audit Alerts & Eskalation
- **AuditLogQueueGrowing** (Warnung) → Slack (Ops-Kanal) informiert über Queue > 200 für ≥ 2 Minuten.
- **AuditLogDirectFailures** (Warnung) → Slack (Ops-Kanal) meldet direkte Schreibfehler (> 5 in 5 Minuten).
- **AuditLogFlushFailures** (Kritisch) → Slack (Ops-Kanal) **und** Ops-Webhook; Flush blockiert → sofort handeln.
- **AuditLogPruneErrors** (Warnung) → Slack (Ops-Kanal) erinnert an fehlerhafte Retention-Läufe.
- Slack-Meldungen enthalten Service, Summary, Details & optional `runbook_url`; Ops-Webhook spiegelt kritische Alerts (PagerDuty o. ä.).

## Synthetische Checks (Blackbox Exporter)
- Compose enthält den Service `blackbox` (Port `9115`) mit Konfiguration `monitoring/blackbox/config.yml` – HTTP-Probe (`http_2xx`) mit 5s Timeout und TLS-Relax für Dev-Stacks.
- Prometheus-Job `blackbox` (siehe `monitoring/prometheus/prometheus.yml`) tastet `/healthz` und `/readyz` über den Exporter an. Targets lassen sich durch weitere URLs unter `static_configs` erweitern.
- Neue Grafana-Panels im Dashboard `latency-and-errors.json` visualisieren `probe_success` (rolling 5 Minuten) sowie das p95 der `probe_duration_seconds`.
- Validierung: `docker compose -f monitoring/docker-compose.monitoring.yml logs blackbox` prüft die Probes; in Grafana sollten die Panels grün sein, sobald die API erreichbar ist.

## PromQL Snippets
- p50/p90/p95/p99 (rolling 5m):
  - `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- 4xx/5xx Rate:
  - `sum(rate(http_requests_total{status_code=~"4.."}[5m])) / sum(rate(http_requests_total[5m]))`
  - `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- Login-Limiter Hits/Blocks (rolling 5m):
  - `increase(app_auth_login_attempts_total[5m])`
  - `increase(app_auth_login_blocked_total[5m])`
- Notification Streams aktiv:
  - `app_api_stats_notifications_streams_subscribers` (über `/api/stats` per Exporter) bzw. `notifications.streams.subscribers` im JSON.
- Audit Queue & Events:
  - `audit_log_queue_size`
  - `sum(increase(audit_log_events_total[5m])) by (result)`
  - `sum(increase(audit_log_failures_total[5m])) by (stage)`
  - `sum(increase(audit_log_prune_operations_total{result="error"}[24h]))`
- Replacement-Service Metriken:
  - `replacement_candidates_evaluated_total` - Anzahl bewerteter Kandidaten
  - `histogram_quantile(0.95, sum(rate(replacement_calculation_duration_seconds_bucket[5m])) by (le))` - p95 Berechnungsdauer
  - `sum(increase(replacement_score_total{recommendation="OPTIMAL"}[1h]))` - OPTIMAL-Scores (letzte Stunde)
  - `sum(increase(replacement_score_total{recommendation="GOOD"}[1h]))` - GOOD-Scores
  - `sum(increase(replacement_score_total{recommendation="ACCEPTABLE"}[1h]))` - ACCEPTABLE-Scores
  - `sum(increase(replacement_score_total{recommendation="NOT_RECOMMENDED"}[1h]))` - NOT_RECOMMENDED-Scores
  - `avg(replacement_score_components_avg) by (component)` - Durchschnittliche Komponenten-Scores

## Panels (Empfehlung)
- Top Routes p95
- 4xx/5xx Rate (rolling 5m)
- Latenz Heatmap
- Requests Total / per Route
- Login-Limiter Übersicht (Hits vs. Blocked, Top-Emails optional via Logs)
- Notification Streams & Zustellstatistik (`notifications.streams`, `notifications.counters.success/fail`)
- Audit Trail Overview Dashboard (`monitoring/grafana/dashboards/audit-trail.json`)
  - Queue Size (`audit_log_queue_size`)
  - Events & Failures nach Result/Stage (`audit_log_events_total`, `audit_log_failures_total`)
  - Retention/Prune-Ergebnisse (`audit_log_prune_operations_total`)

## Alerts (Empfehlung)
- Login-Limiter Spike:
  - Expression: `increase(app_auth_login_blocked_total[5m]) > 5`
  - Severity: Warn → Hinweis auf mögliches Bruteforce; bei `> 20` → Kritisch.
- Login-Limiter Stiller Tod (keine Hits):
  - Expression: `increase(app_auth_login_attempts_total[1h]) == 0`
  - Severity: Info – Meldung, wenn sich länger niemand anmeldet (optional).
- Audit Queue groß: `audit_log_queue_size > 200` (Warn) – Gefahr, dass Einträge gedroppt werden.
- Audit Direct Failures: `increase(audit_log_failures_total{stage="direct"}[5m]) > 5` – DB sofort prüfen.
- Audit Flush Failures: `increase(audit_log_failures_total{stage="flush"}[5m]) > 5` – kritisch, Queue leert sich nicht.
- Audit Retention Fehler: `increase(audit_log_prune_operations_total{result="error"}[12h]) > 0` – Retention-Job beobachten.

## Dashboards & Alerts deployen
- Dashboard importieren:
  ```bash
  cd monitoring
  GRAFANA_URL=http://localhost:3300 \
  GRAFANA_USER=admin GRAFANA_PASSWORD=admin \
  ./scripts/import-dashboard.sh grafana/dashboards/audit-trail.json
  ```
- Prometheus Alerts neu laden (z. B. nach Änderungen an `monitoring/alerts/alerts.yml`):
  ```bash
  cd monitoring
  PROMETHEUS_URL=http://localhost:9090 ./scripts/reload-prometheus.sh
  ```
- Alertmanager Config neu laden (z. B. nach Anpassungen an `monitoring/alertmanager/config.yml`):
  ```bash
  cd monitoring
  ALERTMANAGER_URL=http://localhost:9093 ./scripts/reload-alertmanager.sh
  ```
- Alternativ `docker compose -f docker-compose.monitoring.yml restart prometheus grafana`, falls kein API-Zugriff.
- Alert-Routing: Slack/Webhook laufen über Alertmanager (`monitoring/alertmanager/config.yml`); Labels (`severity`, `service`) steuern Eskalation.

Hinweise
- Scrape‑Target: im Dev häufig `api:3000` (Compose‑Service). Für reines Monitoring‑Compose ggf. `host.docker.internal:3000`/Bridge‑Netz.
- Ports: Prometheus 9090, Alertmanager 9093, Grafana 3300 (kollisionsfrei zu API 3000/FE 5173).
- Optionales Profil: Monitoring‑Compose ist getrennt; kann parallel zum Dev‑Stack laufen.
- Echtzeit-Events prüfen: `curl -N -H "Authorization: Bearer <TOKEN>" "http://<SERVER_IP>:3000/api/notifications/events?channel=email,push"` (ADMIN/MANAGER/DISPATCHER). Heartbeat alle `NOTIFY_EVENTS_HEARTBEAT_MS` Sekunden (`: ping`).

Empfehlung: weitere Ziele für synthetische Checks
- Zusätzliche URLs (z. B. `/api/stats` oder externe Upstream-Services) in `monitoring/prometheus/prometheus.yml` unter dem `blackbox`-Job ergänzen, um End-to-End SLOs zu erfassen.
- Nutzen: Synthetische Messung bleibt unabhängig vom internen Metrics-Pfad und erweitert das Dashboard `latency-and-errors` um weitere Services.
