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
8. **Alert-Routing testen:** Alertmanager UI `http://<SERVER_IP>:9093` → `Routes` checken; Test-Alert via `amtool`/`promtool` simulieren.

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
- **AuditLogQueueGrowing** (Warnung) → Slack (Ops-Kanal) informiert über Queue > 200 für ≥ 2 Minuten.
- **AuditLogDirectFailures** (Warnung) → Slack (Ops-Kanal) meldet direkte Schreibfehler (> 5 in 5 Minuten).
- **AuditLogFlushFailures** (Kritisch) → Slack (Ops-Kanal) **und** Ops-Webhook; Flush blockiert → sofort handeln.
- **AuditLogPruneErrors** (Warnung) → Slack (Ops-Kanal) erinnert an fehlerhafte Retention-Läufe.
- Slack-Meldungen enthalten Service, Summary, Details & optional `runbook_url`; Ops-Webhook spiegelt kritische Alerts (PagerDuty o. ä.).

## Synthetische Checks (Blackbox Exporter)
- Ziel: Externe SLO‑Messung (HTTP‑Probe) für `/healthz` und `/readyz` — unabhängig vom internen Metrics‑Pfad.
- Compose‑Service (Beispiel):
  ```yaml
  blackbox:
    image: prom/blackbox-exporter:latest
    container_name: sicherheitsdienst-blackbox
    ports:
      - '9115:9115'
    networks: [ 'obs' ]
  ```
- Prometheus‑Job (Beispiel in `monitoring/prometheus/prometheus.yml`):
  ```yaml
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - http://api:3000/healthz
          - http://api:3000/readyz
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: target
      - target_label: __address__
        replacement: blackbox:9115
  ```
- Dashboard‑Panels: `latency-and-errors.json` enthält p95/Fehler‑Panels; optional eigenes Panel für `probe_success` / `probe_duration_seconds` ergänzen.

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

Empfehlung: synthetische Checks (Blackbox Exporter)
- Blackbox‑Exporter als zusätzlichen Service in `docker-compose.monitoring.yml` aufnehmen und in Prometheus als Job `blackbox` konfigurieren (z. B. HTTP‑Probe auf `/healthz` und `/readyz`).
- Nutzen: Synthetische SLO‑Messung unabhängig vom Applikations‑/Metrics‑Pfad; ergänzt Panels `latency-and-errors`.
