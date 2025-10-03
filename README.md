# Sicherheitsdienst‑Tool – Dev/Ops Quickstart

[![CI](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml)
[![Contract Tests](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/contract-tests.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/contract-tests.yml)
[![Lint/OpenAPI](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/lint-openapi.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/lint-openapi.yml)

Kurzer Überblick, klare Quickstarts und schnelles Troubleshooting für Devs/Ops.

- Komponenten
  - Backend (Node.js/Express, Prisma, PostgreSQL)
  - Frontend (Vite/React)
  - Monitoring (optional als separates Compose‑Profil)

Links
- OpenAPI: `docs/openapi.yaml` (Swagger UI im Dev: `/api-docs`)
- API Cheatsheet: `docs/API_CHEATSHEET.md`
- VS Code REST Client: `docs/API_EXAMPLES.http`
- Architektur: `docs/ARCHITECTURE.md`
- RBAC: `docs/RBAC.md`
- UI Components (Atoms): `docs/UI_COMPONENTS.md`
- Changelog: `CHANGELOG.md`
- Roadmap: `ROADMAP.md`
- Getting Started (Schritt‑für‑Schritt): `GETTING_STARTED.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- Monitoring: `MONITORING.md`

## Quickstart (Dev)

Voraussetzungen
- Docker + Docker Compose
- Optional: Node.js 22+ (für lokale FE/BE‑Entwicklung außerhalb von Compose)

Start (Dev-Stack)
- `.env` optional (siehe `.env.example` im jeweiligen Teilprojekt, Compose liest `.env` im Repo-Root – hier z. B. `PUBLIC_HOST=37.114.53.56`)
- Lokal: `docker compose -f docker-compose.dev.yml up`
- Remote/Server: `PUBLIC_HOST=<SERVER_IP> docker compose -f docker-compose.dev.yml up`
- Migrationslauf: Alle Stacks führen vor dem Start `npx prisma migrate deploy` aus und brechen bei Fehlern ab.
- Seed (Dev): Standardmäßig setzt `docker-compose.dev.yml` `SEED_ON_START=true` und startet nach erfolgreichen Migrationen `npm run seed`. Zum Deaktivieren `SEED_ON_START=false` setzen.
- Healthcheck: Compose nutzt `/readyz` als Readiness-Probe; abhängige Dienste (`web`, Monitoring) warten via `depends_on.condition: service_healthy` auf die API.

URLs (Remote/Server)
- Frontend: `http://<SERVER_IP>:5173`
- API:     `http://<SERVER_IP>:3000`

Login‑Demo (Seeds)
- `admin@sicherheitsdienst.de` / `password123`
- weitere: `dispatcher@…`, `thomas.mueller@…`, `anna.schmidt@…`, `michael.wagner@…` (alle `password123`)

- **Kern-Entitäten anlegen**
  - **Objekte/Sites:** Im Frontend (`/sites`) oder via `POST /api/sites` neue Einsatzorte erfassen. Filter, CSV/XLSX-Export sowie ein Site-spezifischer Schichtüberblick (`/sites/:id/shifts`) sind enthalten.
  - **Dienstmitarbeiter:** Verwaltung läuft über `/users` (Frontend) bzw. `POST /api/users`. Serverseitige Suche/Filter unterstützen große Datenmengen.
  - **Dienste/Schichten:** Unter `/shifts` lassen sich Schichten erstellen, Mitarbeitenden zuordnen und als CSV/XLSX exportieren. Clock-in/out ist RBAC-geschützt.
  - **Abwesenheiten:** Unter `/absences` beantragen Mitarbeitende Urlaub/Krankheit, Manager genehmigen/lehnen ab. Konflikte mit Schichten werden beim Anlegen angezeigt.
  - **Mitarbeiterprofil:** `/users/:id/profile` bündelt Stammdaten, Arbeitszeitkennzahlen, Qualifikationen und Dokumente (z. B. Waffenschein, Abmahnungen) – Grundlage für Abrechnung & Arbeitszeitgesetz.

- Seed (manuell)
- `docker compose -f docker-compose.dev.yml exec api sh -lc 'npm run -s seed'`

## Release-Checkliste (Tag & Container)

1. Lokal prüfen: `npm ci && npm run lint && npm run test`.
2. Changelog und `docs/releases/vX.Y.Z.md` aktualisieren, Version erhöhen (z. B. `npm version patch --no-git-tag-version`).
3. Commit schreiben (`chore: release vX.Y.Z`), Tag setzen (`git tag vX.Y.Z`) und Push inkl. Tags durchführen.
4. Container bauen & veröffentlichen: `docker buildx build -t ghcr.io/<org>/sicherheitsdienst-tool:vX.Y.Z -t ghcr.io/<org>/sicherheitsdienst-tool:latest --push .`.
5. Deployment aktualisieren (`docker compose pull && docker compose up -d`) und `/readyz` sowie `/system` nach dem Rollout kontrollieren.

## ENV & Konfiguration

API (Backend)
- `.env.example` im Ordner `backend/`
- Minimal: `PORT`, `JWT_SECRET`, `REFRESH_SECRET`
- Dokumente: `DOCUMENT_STORAGE_ROOT` (Pfad zum verschlüsselten Dokumentenspeicher; default `./storage/documents`)
- Optional: `DATABASE_URL` (Dev-Compose setzt es bereits), `CORS_ORIGIN|CORS_ORIGINS`, `SEED_ON_START` (steuert automatischen Seed im Dev-Stack), Rate-Limits (siehe unten)
- Rate-Limits
  - Global: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`
  - Auth/Login: `LOGIN_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_WINDOW_MS`
  - Schreibend (POST/PUT/DELETE allgemein): `WRITE_RATE_LIMIT_PER_MIN`, `WRITE_RATE_LIMIT_WINDOW_MS`, `WRITE_RATE_LIMIT_ENABLED`
  - Notifications-Test: `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN`, `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS`, `NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED`
  - Schicht-Zuweisung: `SHIFT_ASSIGN_RATE_LIMIT_PER_MIN`, `SHIFT_ASSIGN_RATE_LIMIT_WINDOW_MS`, `SHIFT_ASSIGN_RATE_LIMIT_ENABLED`
  - Clock-in/out: `SHIFT_CLOCK_RATE_LIMIT_PER_MIN`, `SHIFT_CLOCK_RATE_LIMIT_WINDOW_MS`, `SHIFT_CLOCK_RATE_LIMIT_ENABLED`
- Logging: `LOG_LEVEL` (Default `debug` in Dev, sonst `info`), `LOG_FORMAT=json` erzwingt strukturierte Console-Logs.
- Audit-Log (Phase E): `AUDIT_LOG_FLUSH_INTERVAL_MS` (Default 2000 ms), `AUDIT_LOG_BATCH_SIZE` (Default 25), `AUDIT_LOG_MAX_QUEUE` (Default 1000 Einträge vor Drop ältester Events), `AUDIT_RETENTION_DAYS` (Default 400, Minimum 1 Tag).
- Compose: `PUBLIC_HOST` steuert, welche Origin (`http://PUBLIC_HOST:5173`) automatisch freigegeben wird.

WEB (Frontend)
- `.env.example` im Ordner `frontend/`
- `VITE_API_BASE_URL`, `VITE_HMR_HOST_SERVER_IP`, `VITE_HMR_CLIENT_PORT=5173` (Compose nutzt `PUBLIC_HOST`)
- Kein manuelles Port-Mapping mehr nötig: Der API-Client erkennt lokale Vite-Ports (`5173`/`4173`) und spricht automatisch `:3000` an.
- Auth-Provider persistiert Access- & Refresh-Token in `localStorage`, führt automatische Refresh-Läufe 30 s vor Ablauf aus und meldet Netzwerkausfälle oder 401/429 direkt im UI.

Monitoring (Compose, optional)
- `.env` im Repo-Root: `ALERTMANAGER_SLACK_WEBHOOK`, `ALERTMANAGER_SLACK_CHANNEL`, `ALERTMANAGER_WEBHOOK_URL`, `ALERTMANAGER_WEBHOOK_BEARER`
- Konfigurations-Reload: `monitoring/scripts/reload-prometheus.sh`, `monitoring/scripts/reload-alertmanager.sh`

## Module & Workflows

- **Abwesenheiten & Urlaub:** `/absences` listet Anträge, Filter (Status, Zeitraum, Nutzer) und erlaubt CSV-Export. Mitarbeitende stellen Anträge, Manager/Admin genehmigen oder lehnen ab; Stornierung erfolgt durch Antragsteller oder Führungskraft. Backend-Endpunkte: `POST /api/absences`, `POST /api/absences/:id/approve|reject|cancel`.
- **Mitarbeiterprofil & Compliance:** `/users/:id/profile` führt Stammdaten, Arbeitszeitkennzahlen (letzte 7/30 Tage, YTD), Qualifikationen, sowie Dokumente (Waffenschein, Verträge, Abmahnungen). Felder für Stundensatz, Sollstunden und Notizen unterstützen Payroll und Arbeitszeitgesetz. Genehmigte Abwesenheiten (nächste 5) werden direkt im Profil angezeigt; Abwesenheitsdialoge lassen sich von hier aus starten. REST: `PUT /api/users/:id/profile`, `POST /api/users/:id/profile/qualifications|documents` etc.
- **Schicht-/Abwesenheitskonflikte:** Beim Anlegen einer Abwesenheit prüft das Backend aktive Schichtzuweisungen und meldet Konflikte (z. B. Einsatzleiter doppelt belegt). Diese Warnungen werden im Frontend angezeigt.
- **Systemdashboard & Monitoring:** `/system` visualisiert `/api/stats` inkl. Queue-States, Audit- und Notification-Kennzahlen, Event-Loop-Auslastung sowie SLO-relevante Metriken – ideal für schnelle Checks ohne Grafana.

## Health & Stats
- `GET /health` → 200 `{ status: "ok" }` (Liveness, alias für `/healthz`)
- `GET /healthz` → 200 `{ status: "ok" }` (Liveness, ohne Dependency-Checks)
- `GET /readyz` → prüft DB & optional SMTP (`READINESS_CHECK_SMTP=true`, Timeout `READINESS_SMTP_TIMEOUT_MS`); in Nicht-Prod liefert `deps.smtpMessage` Hinweise bei Fehlern.
- `GET /api/stats` → Laufzeit-/Systemmetriken, Request-Zähler, Feature-Flags, Notification-Erfolg & Queue-Zustand, Build-Infos
  - `system.resourceUsage` liefert CPU-Zeiten, Page-Faults & Context-Switches; `system.eventLoop.delay/utilization` zeigt Event-Loop-Auslastung.
  - `notifications.counters` enthält `attempts`, Zeitstempel & letzte Fehlermeldung je Kanal; `notifications.successRate` gibt Erfolgsquote (0–1) zurück.
  - `notifications.queue` & `queues` spiegeln In-Memory-Jobs (`notifications-email`, `notifications-push`) mit Pending/In-Flight/Processed/Failed wider.
  - `notifications.streams` liefert Anzahl aktiver SSE-Abonnenten und zuletzt versandte Events (inkl. Kanalverteilung).
  - `env.specVersion`/`env.version`/`env.buildSha` sowie Request-Zähler (`requests.requestsTotal`, `responses4xx`, `responses5xx`).

## CORS‑Hinweise
- Lokale Dev‑Kombi: `VITE_API_BASE_URL=http://localhost:3000`, `CORS_ORIGIN=http://localhost:5173`.
- Dev-Server lassen zusätzlich automatisch `http://127.0.0.1:5173` sowie Vite-Preview (`http://localhost:4173`, `http://127.0.0.1:4173`) zu – kein manuelles Nachtragen notwendig.
- Remote: `VITE_API_BASE_URL=http://<SERVER_IP>:3000`, `CORS_ORIGIN=http://<SERVER_IP>:5173` (oder `CORS_ORIGINS` als Allowlist setzen).

## Export (CSV/XLSX)
- Streaming‑Download (100k+ Zeilen) via Accept: `text/csv` oder XLSX MIME‑Type

## Schichten & Zeiterfassung – Sicherheit & Limits
- `POST /api/shifts/:id/assign` (RBAC: `ADMIN`, `DISPATCHER`) nutzt einen dedizierten Puffer `SHIFT_ASSIGN_RATE_LIMIT_*` zusätzlich zum globalen Schreib-Limit (`WRITE_RATE_LIMIT_*`).
- `POST /api/shifts/:id/clock-in` sowie `POST /api/shifts/:id/clock-out` teilen sich den Puffer `SHIFT_CLOCK_RATE_LIMIT_*`; damit werden schnelle Mehrfachbuchungen gebremst, ohne reguläre Nutzung zu blockieren.
- Empfohlene Produktionswerte: Assignments 6/min, Clock-Events 4/min (je 60 s Fenster). Temporäre Anpassungen lassen sich per ENV ohne Neustart vornehmen.
- 429-Antworten enthalten `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` – Clients sollten diese Header respektieren und keine aggressiven Retries senden.

## Users – Listen‑API (Suche/Filter/Sort/Pagination)
- Endpoint: `GET /api/users`
- Parameter (Query)
  - `page` (number, default 1)
  - `pageSize` oder `pagesize` (number, default 25, max 100)
  - `sortBy` (one of: `firstName`, `lastName`, `email`, `createdAt`, `updatedAt`, `role`, `isActive`; default `firstName`)
  - `sortDir` (`asc` | `desc`, default `asc`)
  - `query` (string, Freitextsuche über `email|firstName|lastName`)
  - `role` (`ADMIN|MANAGER|DISPATCHER|EMPLOYEE`)
  - `isActive` (`true|false`)
  - `filter[...]` (zusätzliche Filter, z. B. `filter[email]=john`)
- Antworten (JSON)
  - `{ data: User[], pagination: { page, pageSize, total, totalPages }, sort: { by, dir }, filters? }`
- Fehlersemantik
  - 400 bei Domain‑Fehlern (z. B. unbekanntes `sortBy`)
  - 422 bei Typvalidierungsfehlern (Zod), z. B. nicht‑numerisches `page`
- Export
  - CSV/XLSX via `Accept: text/csv` bzw. XLSX MIME; es gelten dieselben Filter/Sortierungen wie bei JSON.
  - Export liefert das vollständige (ungepaginierte) Ergebnis‑Set.

Beispiele
- `GET /api/users?page=1&pageSize=25&sortBy=lastName&sortDir=asc&query=anna`
- `GET /api/users?role=EMPLOYEE&isActive=true&filter[email]=@firma.de`
- `GET /api/users?role=DISPATCHER` mit `Accept: text/csv` → gefiltertes CSV

## Backend – Fehlerbehandlung & Controller-Stil

- Controller werden sukzessive auf `asyncHandler` mit `next(createError(...))` umgestellt, damit der globale Error-Handler konsistente JSON-Antworten liefert.
- Der `userController` nutzt bereits dieses Muster inklusive Audit-Events vor dem Throw; weitere Controller sollten ohne manuelle `try/catch`-Blöcke folgen und erwartete 4xx-Fälle per `createError` melden.

## Monitoring (optional)
- **Compose-Profil starten:** `docker compose -f monitoring/docker-compose.monitoring.yml up -d`
- **Ports/Services:** Prometheus `9090`, Grafana `3300` (admin/admin), Alertmanager `9093` – alle im Bridge-Netz erreichbar (Remote: `http://<SERVER_IP>:PORT`). Im Dev-Compose (`docker-compose.dev.yml`) läuft Grafana auf Port `3002`.
- **Health-Check nach dem Start:** `docker compose -f monitoring/docker-compose.monitoring.yml ps` prüfen; Prometheus-Targets sollten `UP` melden (`Status`-Tab in Prometheus → `http://<SERVER_IP>:9090/targets`).
- **ENV-Vorlagen nutzen:** `cp .env.example .env` (Root), `cp backend/.env.example backend/.env`, `cp frontend/.env.example frontend/.env` – anschließend Werte für Secrets/Hosts ergänzen. Compose lädt das Root-`.env` automatisch.
- **Alert-Routing konfigurieren:** ENV in `.env` setzen (`ALERTMANAGER_SLACK_WEBHOOK`, `ALERTMANAGER_SLACK_CHANNEL`, optional `ALERTMANAGER_SLACK_AUDIT_CHANNEL`, `ALERTMANAGER_WEBHOOK_URL`, optional `ALERTMANAGER_WEBHOOK_BEARER`). Slack bündelt alle Alerts; Audit-Warnungen landen im dedizierten Ops-Kanal und `severity="critical"` wird zusätzlich auf das Ops-Webhook gespiegelt.
- **Alerts testen:** `./monitoring/scripts/send-test-alert.sh AuditLogQueueGrowing` erzeugt einen Dummy-Alert; weitere Typen (`AuditLogDirectFailures`, `AuditLogFlushFailures`, `AuditLogPruneErrors`) prüfen Slack- und Webhook-Routing.
- **Synthetische Checks:** Der Blackbox-Exporter (Port `9115`) überwacht `/healthz` & `/readyz`; die Panels im Dashboard `latency-and-errors` visualisieren Erfolgsrate und p95-Latenz.
- **Dashboards & Regeln verwalten:**
  - Audit Trail Dashboard (`monitoring/grafana/dashboards/audit-trail.json`) via `monitoring/scripts/import-dashboard.sh` einspielen oder automatisches Provisioning nutzen.
  - SLO/Fehler‑Dashboards: `monitoring/grafana/dashboards/latency-and-errors.json`, `monitoring/grafana/dashboards/top-routes-p95.json`, `monitoring/grafana/dashboards/top-routes-5xx.json` analog importieren.
  - Prometheus-Regeln (`monitoring/alerts/alerts.yml`) nach Änderungen mit `monitoring/scripts/reload-prometheus.sh` neu laden.
  - Alertmanager-Konfiguration (`monitoring/alertmanager/config.yml`) nach Anpassungen mit `monitoring/scripts/reload-alertmanager.sh` übernehmen.
- **Dashboards importieren (Beispiele):**
  ```bash
  cd monitoring
  GRAFANA_URL=http://localhost:3300 GRAFANA_USER=admin GRAFANA_PASSWORD=admin \
    ./scripts/import-dashboard.sh grafana/dashboards/latency-and-errors.json
  ./scripts/import-dashboard.sh grafana/dashboards/top-routes-p95.json
  ./scripts/import-dashboard.sh grafana/dashboards/top-routes-5xx.json
  ```
- **Audit-Alerts:** Warnungen zu Queue-Wachstum, Direct-/Flush-Fehlern sowie Prune-Errors sind aktiv und werden in den Ops-Slack-Kanal (optional konfigurierbar) plus – bei kritischen Flush-Fehlern – das Ops-Webhook geroutet (Details in `MONITORING.md`).
- **Neue Auth-Limiter-Metriken:** `app_auth_login_attempts_total`, `app_auth_login_blocked_total` (Dashboard/Alert siehe `MONITORING.md`).
 - Siehe `.env.example` im Repo‑Root für Beispiel‑ENV (inkl. `PUBLIC_HOST` und Alertmanager‑Variablen).

## Logging
- Winston schreibt nach `logs/combined.log` und `logs/error.log`; Console-Output übernimmt `LOG_LEVEL` (Dev: `debug`, sonst `info`).
- Request-ID (`X-Request-ID`) wird in jeden Logeintrag injiziert; strukturierte Logs via `LOG_FORMAT=json`.
- Für JSON-Shipping (z. B. Loki/ELK) `LOG_FORMAT=json` setzen und `docker compose logs -f api` bzw. Filebeat nutzen.

## Audit-Trail (Phase E)
- Prisma-Modell `AuditLog` persistiert sicherheitsrelevante Aktionen (Actor, Ressource, Outcome, optional Payload) in der Tabelle `audit_logs`.
- Service `logAuditEvent` schreibt synchron; bei Fehlern landen Events in einer In-Memory-Retry-Queue (`flushAuditLogQueue` leert sie batchweise, Default alle 2 s / max. 25 Events) und Prometheus-Metriken zählen direkte/Flush-Erfolge bzw. -Fehler (`audit_log_events_total`, `audit_log_failures_total`, `audit_log_queue_size`). Fällt das Prisma-Modell `auditLog` (z. B. in Tests) weg, werden Events verlustfrei verworfen und genau einmal gewarnt statt Exceptions zu werfen.
- `getAuditLogState()` liefert einen Laufzeitsnapshot (Queue-Größe, Flush-Status, Konfiguration) für `/api/stats` bzw. spätere Observability-Auswertungen.
- Hilfsfunktionen in `utils/audit.ts` sammeln Actor-, Request- und Client-Metadaten (`buildAuditEvent`, `submitAuditEvent`), `recordAuditEvent` nutzt sie für Controller-Aufrufe.
- Queue ist per ENV einstellbar (`AUDIT_LOG_FLUSH_INTERVAL_MS`, `AUDIT_LOG_BATCH_SIZE`, `AUDIT_LOG_MAX_QUEUE`, `AUDIT_RETENTION_DAYS`); bei voller Queue werden älteste Einträge verworfen (Warn-Log).
- Events werden für Auth (Login/Refresh), Users (Create/Update/Deactivate inkl. verbotener Self-Änderungen), Schichten (Create/Update/Delete, Assign, Clock in/out), Incidents (Create/Update/Delete) sowie Notifications (Opt-In/Out & Test-Sendungen inkl. 4xx-Szenarien) aufgezeichnet.
- Admins rufen das Journal via `GET /api/audit-logs` (RBAC `ADMIN`) mit Paging & Filtern (`actorId`, `resourceType`, `resourceId`, `action`, `outcome`, `from`, `to`) ab – CSV-Export via `GET /api/audit-logs/export?format=csv` (gleiche Filter).
- `/api/stats` enthält Audit-Kennzahlen (Total, letzte 24 h, Outcome-Verteilung, Queue-State) plus separates `audit`-Objekt mit Queue-Größe, Flush-Status und Timer, wodurch Dashboards den In-Memory-Puffer überwachen können.
- Helper `buildAuditEvent`/`submitAuditEvent` reichern Actor-, Request- und Client-Informationen konsistent an, fangen fehlende Header/Test-Kontexte ab (nullsafe IP/User-Agent, defensive Datums-Normalisierung) und werden von allen kritischen Controllern aufgerufen.
- Retention: `npm run audit:prune` löscht Einträge älter als `AUDIT_RETENTION_DAYS` (Default 400 Tage). Dry-Run via `npm run audit:prune -- --dry-run` oder alternativer `--retention-days` Wert.
- Tests decken Sofort-Schreibpfad, Queueing, Fehlerszenarien sowie Retention-Logik ab.

## Troubleshooting (Kurz)
- 429 beim Login: Dev‑RateLimiter ist nahezu deaktiviert; das Frontend zeigt Countdown & Hinweis und blockiert Wiederholungen bis `Retry-After`. Bei dauerhaften 429 → API neu starten oder ENV prüfen (`LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`).
- Login- oder Netzwerkausfälle: UI meldet „Server nicht erreichbar“ statt stumm zu hängen. Tokens bleiben trotz Soft-Reload erhalten; harter Reload ist nicht mehr nötig.
- 401 auf `/api/users`: Frontend MUSS zentralen `api`‑Client nutzen (Token‑Interceptor); keine nackten `fetch/axios`
- Contract‑Tests: Dredd/Prism Workflow (manuell/cron) – siehe CI
- DB fehlt: viele Routen funktionieren trotzdem; Seed nur mit `DATABASE_URL`
- 403 (RBAC): Kein Refresh; UI blendet verbotene Navigation aus, zeigt 403‑Karte.
- Logout nach Reload: Tokens & User werden aus `localStorage` rehydrisiert. Falls der Browser `localStorage` blockiert oder Drittanbieter-Cookies deaktiviert sind, prüfen ob `about:config`/Private Mode eine Persistenz verhindern.

## CI Smokes
- health-smoke: Startet API ohne DB und prüft `/healthz`/`/readyz` inkl. p95‑SLA.
- api-smoke: Startet DB+API via Docker Compose (Seed on start) und prüft Login, Users‑List/Export, Sites‑List mit httpie.

## E2E‑Smoke (Playwright)
- Workflow: `.github/workflows/e2e-smoke.yml` (Compose: db+api+web, headless Browser)
- Artefakte: `e2e/playwright-report`, `e2e/test-results` (Traces/Videos)

Lokal ausführen
```bash
# Stack starten (mit Seed)
docker compose -f docker-compose.dev.yml up -d

# E2E in Ordner e2e/ ausführen
cd e2e
npm init -y >/dev/null 2>&1 || true
npm install -D @playwright/test
npx playwright install chromium

# Tests laufen lassen (BASE_URL optional, Default http://localhost:5173)
BASE_URL=http://localhost:5173 npx playwright test specs/smoke.spec.ts --project=chromium --reporter=list,html

# Report öffnen
npx playwright show-report
```

Badges/CI (Platzhalter)
- Build • Contract‑Tests • Lint
## Benachrichtigungen (Templates, Opt-In, Events)

- Testversand: `POST /api/notifications/test` (RBAC: ADMIN/MANAGER, Rate-Limit). Unterstützt `channel=email|push`, optionale `templateKey` sowie Variablen. Für Push müssen `userIds` angegeben werden.
- Templates: `GET /api/notifications/templates` liefert verfügbare Vorlagen (inkl. Feature-Flag & Variablen). Flags: `EMAIL_NOTIFY_SHIFTS`, `EMAIL_NOTIFY_INCIDENTS`, `PUSH_NOTIFY_EVENTS`, `PUSH_NOTIFY_INCIDENTS`.
- Opt-In/Out: `GET|PUT /api/notifications/preferences/me` erlaubt Mitarbeitenden, `emailOptIn` bzw. `pushOptIn` zu setzen (Standard: beide `true`).
- Echtzeit-Events (SSE): `GET /api/notifications/events` (RBAC: ADMIN/MANAGER/DISPATCHER) streamt Zustellereignisse. Filterbar via Query (`channel=email,push`, `status=sent,failed`, `template=incident-created`). Heartbeat-Intervall via `NOTIFY_EVENTS_HEARTBEAT_MS` (Default 15 s).
