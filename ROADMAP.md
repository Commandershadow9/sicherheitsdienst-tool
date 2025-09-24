# Roadmap (nächste 1–2 Sprints)

Aktualisierung: Stand 2025‑09‑15
- RBAC‑Feinschliff (401 Refresh 1×, 403 Karte, Navigation ausblenden) umgesetzt (FE/BE).
- Users‑Liste serverseitig (Suche/Sort/Paging, 300ms Debounce, Export gefiltert) umgesetzt.
- E2E‑Smokes (Playwright) und API‑Smoke (httpie) in CI aktiv; Artefakte verfügbar.
- UI‑Atoms eingeführt und Listen/Filter konsolidiert.
- Login‑Bruteforce‑Limiter konfigurierbar (`LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`) mit sicheren Defaults und Dev‑Override.

## Roadmap – Heute (konsolidiert)

Hinweis: Dieser Abschnitt fasst die tagesaktuellen Ziele aus der ehemaligen Datei `docs/ROADMAP.md` zusammen. Quelle bleibt `docs/KONZEPT.pdf` (Roadmap/DoD maßgeblich).

### Heutige Ziele (Bestätigung)
- Konzepttreu nach `docs/KONZEPT.pdf` arbeiten (Roadmap/DoD einhalten).
- In kleinen, überprüfbaren Schritten vorgehen (max. 3 Tasks, je ≤ 90 Minuten).
- Nur UNIFIED DIFF zeigen und Freigabe abwarten.
- Fokus: OpenAPI v1, Auth/RBAC, Entity „Site“.
- Jede Aufgabe mit klaren Akzeptanzkriterien hinterlegen.

### Ergebnisse heute (Auszug)
- RBAC (Users): Detail- und Update-Routen abgesichert (ADMIN oder Self-Access); Self-Updates auf Basisfelder beschränkt.
- Validierung: 422-Fehler enthalten `code: VALIDATION_ERROR` (Middleware + Tests angepasst).
- OpenAPI: Push-API dokumentiert (`/push/tokens`, `/push/tokens/{token}`, `/push/users/{userId}/opt`) + zusätzlicher Server `http://localhost:3001/api/v1`.
- Auth: Login-Limiter nutzt Default 5/15min bei fehlender ENV; ENV-Overrides dokumentiert/Compose angepasst.
- Observability: Login-Limiter exportiert Prometheus-Counter (Hits/Blocked) & FE zeigt 429-Countdown.
- Doku: README Listen-Parameter vereinheitlicht (`page/pageSize/sortBy/sortDir/filter[...]`).
- Tests/Build lokal: Typecheck/Build grün; einige Jest-Suites benötigen Prisma-Generate/Mocks (CI deckt regulär ab).
- DX: Swagger UI (nur Dev) unter `/api-docs` verfügbar.
- Observability: `/api/stats` erweitert (Features/Notifications/Auth/System/Env) und dokumentiert (README + OpenAPI).
- Observability: `/api/stats` liefert Laufzeit/Event-Loop/Queue & Success-Rates; README Logging-Runbook ergänzt (2025-09-15).
- Observability: Alertmanager (Slack/Webhook) im Monitoring-Compose, Audit-Trail-Dashboard provisioniert & Runbooks in README/MONITORING aktualisiert (2025-09-20).
- Monitoring/Ops: README & MONITORING.md um Betriebs-Checkliste (Ports, Reload-Skripte, Alert-Routing) ergänzt; Audit-Alerts dokumentiert (2025-09-22).
- Ops/Compose: Docker-Stacks nutzen `/readyz` für Healthchecks, führen `prisma migrate deploy` vor dem Start aus und triggern Dev-Seeds über `SEED_ON_START` (Default true, abschaltbar).

### Neu seit v1.1.1 (Health/Readiness)
- Liveness/Readiness: `/healthz`, `/readyz` (mit `deps.db`, `deps.smtp`).
- Security: `helmet()` aktiv; CORS per Allowlist (`CORS_ORIGINS`).
- Auth Rate-Limits: IP‑basiert + pro User/Email; optional Redis‑Store (`REDIS_URL`).
- OpenAPI: interne Endpunkte als `x-internal: true`, operationId‑Konvention vereinheitlicht, Beispiele korrigiert.
- CI: Health‑Smoke‑Job (baut, startet, prüft `/healthz`/`/readyz`).

### Nächste Schritte (Kurz-Backlog)
- ✅ Notifications: Templates/Echtzeit-Events & Opt-In/Out vorbereitet (Feature-Flags, Tests, UI-Hooks) – 2025-09-16.
- ✅ Security-Hardening Phase B: Prisma-AuditLog + Logging-Utility inkl. Queue/Tests/Docs (2025-09-18).
- ✅ Security-Hardening Phase C: Audit-Events für Auth/Shifts/Notifications + Admin Read-API (`GET /api/audit-logs`) (2025-09-19).
- ✅ Security-Hardening Phase D: Audit-CSV-Export + `/api/stats`-Kennzahlen (2025-09-19).
- ✅ Security-Hardening Phase E: Retention-Job (`npm run audit:prune`), Prometheus-Metriken, `/api/stats` Auditdaten (2025-09-19). Nächster Schritt: Dashboards/Alerts feintunen.
- Telemetry: SLO-Panels (p95/5xx) & synthetische Checks für Monitoring-Stack ergänzen.

Ziel: Konkrete, messbare Aufgaben mit klaren Akzeptanzkriterien (Given/When/Then).

## Sprint 1

### 1) RBAC hart durchziehen (API + UI)
- Admin/Manager: Notifications testen, User verwalten
- Mitarbeiter: nur eigene Shifts + Clock-in/out
- UI blendet nicht erlaubte Aktionen/Navigation aus; API verweigert verbotene Aktionen (403)

Akzeptanz (Given/When/Then)
- Given ein EMPLOYEE‑Benutzer ist eingeloggt
  - When er `/users` oder „Benutzer“ aufruft
  - Then zeigt das UI eine 403‑Karte und die API antwortet mit 403 ohne Refresh‑Versuch
- Given ein EMPLOYEE‑Benutzer ist eingeloggt
  - When er `/shifts` öffnet
  - Then listet die API ausschließlich eigene Schichten (`filter[userId]=me`) und der Export berücksichtigt diesen Filter
- Given ein ADMIN/MANAGER ist eingeloggt
  - When „Test Notification“ ausgelöst wird
  - Then sendet API 200 und UI zeigt Erfolg‑Toast

### 2) Users CRUD + Suche/Pagination (10k+)
- Serverseitige Filter/Sort (Query‑Params), Pagination, Debounce (300ms)
- CRUD: Create/Update/Delete mit client‑/serverseitiger Validierung

Akzeptanz (Given/When/Then)
- Given 10k+ User (Seed/Fixture)
  - When Suchen nach `email`/`firstName` mit 300ms Debounce
  - Then bleibt die TTI < 300ms pro Page‑Wechsel und API‑Antwort < 800ms (95. Perzentil)
- Given ADMIN ist eingeloggt
  - When neuer User angelegt und anschließend gefiltert wird
  - Then erscheint der User in Seite 1 entsprechend Filter/Sort, CRUD‑Aktionen liefern 2xx/4xx konsistent

### 3) Sites & Shifts – E2E Use‑Case
- „Schicht anlegen → zuweisen → clock‑in/out → CSV Export“
- End‑to‑End klickbar (UI) und API‑Flows konsistent

Akzeptanz (Given/When/Then)
- Given ADMIN legt eine Schicht an und weist EMPLOYEE zu
  - When EMPLOYEE clock‑in/out ausführt
  - Then wird CSV‑Export generiert (Streaming), Datei enthält neue Buchung

## Sprint 2

### 4) Incident‑Notifications (Feature‑Flag)
- Flag: E‑Mail/Webhook; DEV: Fake Transport/Preview
- Button „Test Notification“ je Incident

Akzeptanz (Given/When/Then)
- Given Flag `EMAIL_NOTIFY_INCIDENTS=true` (oder Webhook)
  - When „Test Notification“ auf Incident klick
  - Then UI zeigt Erfolg, Logs enthalten Versand‑Eintrag; DEV zeigt Preview (ohne realen Versand)

### 5) Telemetry‑Härtung
- Grafana‑Dashboards versionieren (Repo) + SLO‑Panels (p95, 5xx‑Rate)
- PromQL‑Snippets dokumentieren

Akzeptanz (Given/When/Then)
- Given Monitoring‑Profil ist aktiv
  - When Dashboard „Latency & Errors“ geöffnet wird
  - Then p95‑Panel, 5xx‑Rate und Top‑Routes sichtbar; README/Monitoring verweist auf Panels und PromQL

### 6) E2E Smoke (Playwright)
- Szenarien: Login, Users‑Tabelle (Pagination/Sort/Filter), Incidents‑View
- Headless Run in CI

Akzeptanz (Given/When/Then)
- Given CI‑Run auf PR nach main
  - When E2E‑Workflow startet
  - Then alle Smoke‑Szenarien laufen grün (headless), Artefakte (Logs/Traces) werden hochgeladen

## Definition of Done (generisch)
- Tests: Unit/Integration (API), E2E (Playwright) grün; Lint/Contract‑Tests grün
- Docs aktualisiert (README/ARCHITECTURE/RBAC/GETTING_STARTED/TROUBLESHOOTING)
- RBAC/Fehlerfälle: 401 → einmaliger Refresh; 403 → kein Refresh, UI‑Hinweis
- Performance: Server‑Pagination, Debounce, Streaming‑Exporte, keine UI‑Freezes
