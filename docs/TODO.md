# TODO – Nächste Schritte (Kurzplanung)

Stand: 2025-09-15

- ## Kurzfristig (P1, 1–2 Tage)
- [x] Login-Limiter Observability
  - Akzeptanz: Auth-Login-Limiter exportiert Prometheus-Zähler (Hits, Blocked); Dashboard + Alert-Empfehlung dokumentiert.
- [x] Login-Limiter QA
  - Akzeptanz: Integrationstest deckt ENV-Overrides (`LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`) ab; Dev-Doku erklärt Default/Fallback klar (README/Troubleshooting aktualisiert, QA-Notiz).
- [x] Frontend Feedback für 429 Login
  - Akzeptanz: UI zeigt dedizierten Hinweis + Retry-Countdown, wenn API 429 liefert; UX-Review bestätigt.

- [ ] Monitoring: Alert-Routing (Grafana/Alertmanager) gegen Ops-Kanal verdrahten
  - Akzeptanz: Neue Audit-Warnungen (Queue, Direct/Flush-Failures, Prune) laufen im gewünschten Kanal auf.
- [ ] Monitoring: Audit-Dashboard (`svc-audit-trail`) auf Prod-Grafana importieren & Panels feinjustieren
  - Akzeptanz: Queue/Failures/Prune-Panels zeigen Daten aus Produktions-Prometheus.
- [ ] Monitoring-Dokumentation: Compose-Ports (Prometheus 9090, Grafana 3300) & Betriebs-Checkliste finalisieren
  - Akzeptanz: README / MONITORING.md enthalten klare Schritte für Deploy & Betrieb, inkl. Skripte `import-dashboard.sh` und `reload-prometheus.sh`.

- [ ] Monitoring: Synthetische Checks (Blackbox Exporter) für SLOs
  - Akzeptanz: Blackbox‑Exporter als Service in `docker-compose.monitoring.yml`, Prometheus‑Job `blackbox` (HTTP‑Probe `/healthz`/`/readyz`), Panels in `latency-and-errors` zeigen Ergebnisse; MONITORING.md enthält Konfig‑Snippet.
- [ ] ENV/Onboarding: `.env.example` verlinken und Root‑.env erklären
  - Akzeptanz: GETTING_STARTED.md verlinkt `.env.example` (Root) und erläutert kurz, wann Root‑.env (Monitoring/Compose) vs. Service‑`.env.example` (backend/frontend) genutzt wird.
- [ ] Alert‑Routing validieren (Slack/Webhook)
  - Akzeptanz: Test‑Alerts erscheinen im konfigurierten Slack‑Audit‑Kanal (`ALERTMANAGER_SLACK_AUDIT_CHANNEL`) und Ops‑Webhook empfängt `severity=critical`; Vorgehen in MONITORING.md dokumentiert.
- [ ] CI‑Sichtbarkeit schärfen
  - Akzeptanz: `metrics-smoke` zusätzlich zeitgesteuert (cron) ausführen; Artefakt‑Links in Benachrichtigungen verweisen auf Reports/Dashboards.
- [ ] Doku‑Feinschliff (Ports/Dashboards)
  - Akzeptanz: README nennt unterschiedliche Grafana‑Ports (Dev‑Compose 3002 vs. Monitoring 3300) und listet Import‑Befehle für `latency-and-errors`, `top-routes-p95`, `top-routes-5xx`.

Erledigt:
- [x] Auth Login-Limiter konfigurierbar (ENV `LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`, sichere Defaults, Compose Override, Docs aktualisiert).
- [x] Swagger UI (Dev) unter `/api-docs` mit YAML‑Quelle (`/api-docs-spec/openapi.yaml`).
- [x] Users: RBAC‑Negativtests ergänzen (403/401) – analog zu Sites/Shifts
  - Akzeptanz: Tests schlagen korrekt bei EMPLOYEE/anonymous an; CI grün.
- [x] OpenAPI Feinschliff – operationId/Beispiele für Randendpunkte prüfen/ergänzen
  - Akzeptanz: Redocly lint ohne neue Errors; konsistente Beispieldaten.
- [x] README Quickstart (Docker Compose) – kurzer Abschnitt mit `.env.example`, `docker-compose up`, Healthcheck‑Hinweis
  - Akzeptanz: Schritte reproduzierbar; Hinweis auf `prisma migrate deploy`.
- [x] Error‑Responses Smoke‑Tests – 401/422 prüfen (Shape: code/message/details/errors)
  - Akzeptanz: 2–3 schlanke Tests, keine Ports/DB nötig.

## Mittelfristig (P2)
- [x] XLSX‑Exports lokal stabilisieren
  - Akzeptanz: Tests für XLSX‑Exports erkennen Buffer zuverlässig (lokal/CI); ggf. Content‑Type/Body‑Parser‑Setup prüfen.
- [x] Reporting/Exports: CSV/Excel für Listen (Employees/Sites/Shifts)
  - [x] Employees: CSV/XLSX via `Accept` (Filter/Sort unterstützt; README/OpenAPI ergänzt)
  - [x] Sites: CSV/XLSX
  - [x] Shifts: CSV/XLSX
  - Akzeptanz: Endpoint(s) mit Filter/Sort‑Berücksichtigung; Beispiel in README/OpenAPI.
- [x] Performance: DB‑Index‑Vorschläge (Users.email, Sites (name,address), Shifts (startTime,status))
  - Akzeptanz: Liste empfohlener Indexe + (optional) Migrationen vorgeschlagen. (Umgesetzt: `docs/DB_INDEXES.md` + Prisma-@@index in Schema.)
- [x] Notifications: Rate‑Limit produktionsreif (z. B. Token‑Bucket/express-rate-limit) + Env‑Profile
  - Akzeptanz: konfigurierbare Limits; Tests für Grenzen/Eckenfälle. (Umgesetzt: ENV‑Toggle, Standard‑Headers, 429 Retry‑After, Tests.)

- [ ] Codequalität: ESLint‑Warnungen reduzieren
  - Akzeptanz: ESLint‑Warnungen im Backend auf ≤ 5 reduzieren (ohne Funktionsänderung), Format/Lint‑Regeln beibehalten.

## Langfristig / Post‑MVP (P3)
- [x] Erweiterte Benachrichtigungen (Real‑Events, Templates, Opt‑In) (2025-09-16)
- [x] Observability: erweiterte /stats (Laufzeit, Queue, Mail‑Erfolg), Log‑Konfiguration in README (2025-09-15)
- [ ] Sicherheits‑Hardening: Rate‑Limit selektiv auf weitere Endpunkte; Audit‑Trail
  - [x] Selektive Rate-Limits für Schicht-Zuweisung & Clock-in/out (`SHIFT_ASSIGN_RATE_LIMIT_*`, `SHIFT_CLOCK_RATE_LIMIT_*`, Tests/Doku)
  - [ ] Audit-Trail (Schema, Logging-Utility, Read-API, Retention)
    - [x] Phase B: Prisma-Modell `AuditLog`, Logging-Service mit Retry-Queue, Tests & Doku (2025-09-18)
    - [x] Phase C: Audit-Events in Mutationen (Auth/Shifts/Notifications) + erste Read-API (2025-09-19)
    - [x] Phase D: CSV-Export + `/api/stats` Kennzahlen (Audit) (2025-09-19)
    - [x] Phase E: Retention-Job (`npm run audit:prune`), Prometheus-Metriken, `/api/stats` Kennzahlen (2025-09-19)

## Neues Feature: Einsätze/Events
- [x] Datenmodell (Prisma): `Event` mit Feldern `id, title, description, siteId?, startTime, endTime, serviceInstructions (Text/Markdown), assignedEmployeeIds[]` + Indizes
- [x] API/Controller/Routes: CRUD `/api/events` mit RBAC (ADMIN/DISPATCHER: schreiben; alle Auth: lesen)
- [x] Validation (Zod): Create/Update Schemas; Zeitlogik (start < end)
- [x] OpenAPI: Schemas/Paths inkl. Beispiele; List‑Parameter analog zu anderen Listen; operationId
- [x] Exporte: CSV/XLSX für Listen; PDF‑Bericht je Event
- [x] Tests: Unit + Route (RBAC, Validation, CRUD, Exporte, PDF)
- [x] Push: Geräte‑Tokens, optional FCM, Event‑Push (Flag), Admin‑Opt‑In/Out

## Arbeitsweise / Hinweise
- Branch‑Strategie: `feature/<kurzer-name>` je Task; kleine, überprüfbare Commits.
- Vor jedem Merge: Lint/Typecheck/Tests grün; OpenAPI Lint warn‑only toleriert.
- Doku immer mitführen: README + CHANGELOG + ggf. OpenAPI.
- `.env.example` aktualisieren, wenn neue ENV hinzukommen.
