# Monitoring (Dev)

Kurzer Leitfaden für Prometheus + Grafana im optionalen Profil.

## Quickstart
```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```
- Prometheus: `http://<SERVER_IP>:9090`
- Grafana: `http://<SERVER_IP>:3000` (admin/admin)

## PromQL Snippets
- p50/p90/p95/p99 (rolling 5m):
  - `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- 4xx/5xx Rate:
  - `sum(rate(http_requests_total{status_code=~"4.."}[5m])) / sum(rate(http_requests_total[5m]))`
  - `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`

## Panels (Empfehlung)
- Top Routes p95
- 4xx/5xx Rate (rolling 5m)
- Latenz Heatmap
- Requests Total / per Route

Hinweise
- Scrape‑Target: im Dev häufig `api:3000` (Compose‑Service). Für reines Monitoring‑Compose ggf. `host.docker.internal:3000`/Bridge‑Netz.
- Ports: Prometheus 9090, Grafana 3000 (kollisionsfrei zu API 3000/FE 5173).
- Optionales Profil: Monitoring‑Compose ist getrennt; kann parallel zum Dev‑Stack laufen.
