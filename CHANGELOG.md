# Changelog

All notable changes to this project will be documented in this file.

## v1.2.0-rc.1 – Phase 1 Hardening & Release-Readiness

### Added
- Readiness: optionaler SMTP-Verify in `/readyz` (Flag `READINESS_CHECK_SMTP`, Timeout `READINESS_SMTP_TIMEOUT_MS`), Unit-Tests für `ok`/`fail`/`skip`.
- CI/Release: Docker Build & Push nach GHCR bei Tags `v*` (`.github/workflows/docker-release.yml`), Images `:latest` und `:<tag>`.
- Tests: Verschärfte Security-/CORS-Header-Tests (Helmet-Header, Allowlist, FRONTEND_URL-Fallback).

### Changed
- README: Release-Runbook (GHCR) + Compose‑Snippet ergänzt; System‑Health verlinkt.

## 2025-09-06

### Added
- feat(rbac): RBAC für Notifications – nur Rollen ADMIN/MANAGER; Tests für ADMIN/MANAGER=200, EMPLOYEE=403, anonym=401.
- feat(email): E-Mail-Trigger bei Schicht-Erstellung/-Aktualisierung/-Löschung (Feature-Flag `EMAIL_NOTIFY_SHIFTS=true`), Tests mit gemocktem Mailservice (Flag on/off).
- feat(listing): Serverseitige Pagination/Sort/Filter für Sites, Shifts und Users inkl. Zod-Validierung, Prisma-Queries (`where`/`orderBy`/`skip`/`take`) und einheitlichem Response-Schema; Tests und OpenAPI ergänzt.

### Changed
- chore(ci): CI stabilisiert – tolerante Installation (Fallback auf `npm install`), OpenAPI-Lint via `npx @redocly/cli` (warn-only), Build/Tests grün.
- docs(openapi): Notifications-Endpoint `/notifications/test` um 400/422-Responses mit Beispielen ergänzt; RBAC-Hinweise (`x-required-roles`) für Sites/Shifts/Users dokumentiert; Users‑Endpoints (POST/GET{id}/PUT/DELETE) spezifiziert.
- docs(readme): ENV/SMTP/Feature-Flag (`EMAIL_NOTIFY_SHIFTS`) im Compose-Quickstart; RBAC‑Übersicht und Listen‑Parameter dokumentiert.
- ci(discord): Discord-Workflow robuster und grafisch verbessert (klin­kbarer Titel/URL, Autor‑Badge, Felder pro Event; optionaler CI‑Kanal per `DISCORD_WEBHOOK_CI`).

## 2025-09-05

### Added
- Backend: RBAC-Guard für Notifications implementiert (`notificationsRBAC`), erlaubt nur Rollen `ADMIN` und `MANAGER`.
- Tests: RBAC-Tests für Notifications (ADMIN=200, MANAGER=200, EMPLOYEE=403, anonym=401).

### Changed
- Routes: Notifications-Route (`POST /api/notifications/test`) mit `authenticate` + `notificationsRBAC` gesichert; Validierung unverändert.
- Docs: README um Abschnitt „RBAC Notifications“ (Rollenmatrix) erweitert.
- OpenAPI: `docs/openapi.yaml` für Notifications-Endpoint um 400/422-Responses inkl. Beispielpayloads ergänzt.
- Roadmap: RBAC-Feinschliff für Notifications als erledigt markiert.

## 2025-08-31

### Integrated
- merge: adopt PR #2 concept-aligned
  - MVP-Backend konzepttreu übernommen (Express/TS/Prisma, JWT-Auth, Users/Shifts, Health/Stats).
  - OpenAPI v1 hinzugefügt; Zod-Validierung und zentrale Fehlerbehandlung ergänzt.
  - Artefakte entfernt; `LICENSE`/`.gitignore` bewahrt.
- merge: adopt PR #6 concept-aligned
  - RBAC (authorize), Zod-Validierungen und Logging integriert.
  - Access+Refresh-Token-Flow, `GET /api/auth/me`, Seed-Erweiterungen.
  - CI (Node 20: npm ci → lint → test → build) und Compose-Härtung (Healthcheck, migrate deploy).

### Added
- Site-Entity als Referenz (Prisma-Modell + Migration, Routes/Controller, Zod-DTOs, Tests)
- docs: PR-Analyse, PR-Integration, Branch-Protection, Docker-Start/Logs

### Changed
- docs/openapi.yaml: Einheitliche Fehler-Responses (400/401/403/404/409/422/429/500/503) zentralisiert unter `#/components/responses/*`.
- docs/openapi.yaml: Neues Schema `ValidationError` mit Feldfehlern ergänzt.
- docs/openapi.yaml: Pagination/Filter für `GET /employees` und `GET /sites` (Query-Parameter `page`, `perPage`, `sort`, `order`, `q`, `city`) und paginierte Antwortobjekte (`EmployeesList`, `SitesList`).
- docs/openapi.yaml: Beispiel-Payloads (request/response) für alle relevanten Endpunkte ergänzt.
- README: Abschnitt „OpenAPI Specification“ inkl. lokaler Validierungsanleitung (Redocly/Swagger-CLI) ergänzt.
 - docs/openapi.yaml: Zusätzliche Filter ergänzt (`employees`: `role`, `isActive`; `sites`: `postalCode`).
 - backend: `validate`-Middleware und Global-Error-Handler geben nun 422 (statt 400) bei Zod-Validierungsfehlern zurück.
- prisma: `Site`-Unique-Constraint geändert auf (name, address) inkl. Migration (`20250831195000_site_unique_name_address`).
- README: Site-API-Beispiele um Filter/Sortierung erweitert und Fehlercodes (422/404/409) dokumentiert.
- Backend: DELETE `/api/sites/:id` liefert jetzt 204 (No Content) bei Erfolg; Tests ergänzt.
- docs/openapi.yaml: POST-Statuscodes (201) vereinheitlicht für Employees, Site-Shifts, Incidents, Assignments.
- TimeTracking dokumentiert (README-Beispiele) und OpenAPI-Hinweis auf mögliche Warnungen bei Clock-in/out.

### Notes (Konzepttreu)
- Änderungen folgen docs/KONZEPT.pdf und ROADMAP (OpenAPI v1 erweitert, aber konsistent mit MVP-Fokus Auth/Site). Keine API-Implementierung geändert, nur Spezifikation/Docs.

### DevOps
- GitHub Actions CI-Workflow `.github/workflows/ci.yml`
- `.env.example` erweitert (DB/JWT/Refresh/SMTP)
- Docker Compose: DB-Volume, Healthchecks, API `depends_on: service_healthy`

### CI
- Neues CI-Job `openapi-lint`: Lintet `docs/openapi.yaml` via Redocly CLI in GitHub Actions.

## 2025-08-30

### Added

- Post-MVP features adopted (concept-aligned from PR #6):
  - RBAC on routes via `authorize` middleware.
  - Zod validation with `validate` middleware and schemas.
  - Winston logging + morgan stream.
- Smoke tests (controller/middleware):
  - healthCheck and getSystemStats controllers.
  - authenticate/authorize middleware.
  - Validation schema tests.

### Changed

- Server bootstrap split into `app.ts` (export app) and `server.ts` (startup + graceful shutdown).
- Project-wide formatting and linting:
  - Root `.editorconfig`, `.prettierrc.json`, `.prettierignore`.
  - ESLint v9 config hardened.
- docker-compose hardened:
  - Service names (`db`, `pgadmin`), healthchecks, env defaults, volumes, depends_on (service_healthy).
- NPM scripts unified (dev, build, start, test, test:watch, typecheck, lint, lint:fix, format, format:write).

### Merged (concept-aligned)

- PR #2: MVP backend (Express/TS/Prisma, JWT auth, Users/Shifts CRUD, health/stats).
- PR #6: Post-MVP hardening (RBAC, Zod validation, logging).

### Notes

- Dist/review artifacts excluded from VCS.
- LICENSE and .gitignore preserved.
## 2025-09-09

### Added
- feat(auth): Refresh-Token-Flow implementiert (`POST /api/auth/refresh`) inkl. Zod-Validation und Tests (200/422/401); README um Abschnitt „Authentication & Refresh“ ergänzt.
- feat(api): `GET /api/auth/me` hinzugefügt; alle Routen zusätzlich unter `/api/v1/...` gemountet; Tests für Me-Endpoint und v1-Alias.
- feat(notifications): Rate-Limit für Test-Endpoint `/api/notifications/test` (ENV: `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN`, `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS`), Tests und Doku.
- docs(stats): Observability erweitert – README Abschnitt „System-/Stats-Details“ ergänzt; OpenAPI `/stats` dokumentiert (Features/Notifications/Auth/System/Env Felder).

### Changed
- docs(openapi): `/me` zu `/auth/me` ausgerichtet; `operationId` für zentrale Endpunkte ergänzt; `/employees`-List-Response auf `data/pagination/sort/filters` umgestellt; Parameter für `/sites` und `/shifts` vereinheitlicht (`page/pageSize/sortBy/sortDir/filter[...]`); ungenutzte `EmployeesList`/`SitesList`-Schemas entfernt.
- ci: `typecheck`-Step ergänzt; Tests erzeugen Coverage und werden als Artefakt hochgeladen.
- env: `LOG_LEVEL` in `.env.example` ergänzt.
- rbac(users): Self-Access für `GET/PUT /api/users/:id` erlaubt; Self-Updates auf Basisfelder (email, firstName, lastName, phone) beschränkt.
- fix(validation): 422-Responses der `validate`-Middleware enthalten jetzt `code: "VALIDATION_ERROR"`.
- docs(readme): Listen-Parameter und Beispiele vereinheitlicht auf `page/pageSize/sortBy/sortDir/filter[...]`.

### Fixed
- fix(exports): XLSX-Exporte stabilisiert (korrekte Binary-Ausgabe mit `Content-Length` und `res.end`) für Users/Sites/Shifts/Events.

### Added (Events & Push)
- feat(events): CRUD + CSV/XLSX Exporte, PDF-Bericht via `Accept: application/pdf`, OpenAPI-Schemas/Paths
- feat(push): Geräte-Token-API (registrieren/listen/ändern/löschen), optional FCM-Support, Event-Push (Feature-Flag), Admin-Opt-In/Out je Benutzer, `User.pushOptIn`
- perf(db): Indizes für Users/Sites/Shifts/Assignments/TimeEntries + neue Tabellen `events` und `device_tokens`
- docs: README (Exports, Push, Events, PDF), OpenAPI Accept-Hinweise, FEATURE_EVENTS.md, TODO/ROADMAP aktualisiert
 - docs(openapi): Push-API in Spezifikation ergänzt (`/push/tokens`, `/push/tokens/{token}`, `/push/users/{userId}/opt`) und zusätzlicher Server `http://localhost:3001/api/v1`.

### Added (Planning Phases 1–5)
- feat(openapi): Fehler-Response-Shape harmonisiert (`success:false`, `code`, `message`, `errors?`) und Beispiele in `#/components/responses/*` aktualisiert.
- feat(auth): Rate-Limit für `POST /auth/login` und `POST /auth/refresh` (ENV `AUTH_RATE_LIMIT_*`), Header `Retry-After` und `RateLimit-*` gesetzt.
- feat(observability): Request-ID Middleware (`X-Request-ID`) + Logs; leichte Request-Zähler (`requestsTotal`, `responses4xx`, `responses5xx`) in `/stats`.
- feat(incidents): E2E-Implementierung (CRUD, List/Filter, CSV/XLSX Exporte, RBAC ADMIN/MANAGER schreiben, AUTH lesen) inkl. Tests und OpenAPI-Erweiterungen.
- feat(email): Einfacher Retry (1x) bei transienten SMTP-Fehlern (`SMTP_RETRY_MAX`, `SMTP_RETRY_DELAY_MS`), Tests.
- docs(runbook): Operations-/Runbook-Abschnitt in README (Health/Stats, Logs/Request-ID, Rate-Limits, SMTP/Retry, ENV-Matrix).

### Changed
- refactor(prisma): Zentrale Prisma-Client-Singleton (`backend/src/utils/prisma.ts`); Controller/Middleware/Services umgestellt.
- docs(openapi): Incidents-List-Antwort vereinheitlicht (data/pagination/sort/filters) und CSV/XLSX Accept dokumentiert; 405 `MethodNotAllowed`-Komponente ergänzt.
- tests: RBAC-Tests für Incidents (anonymous/employee negative), TimeTracking-Warnungen (Restzeit <11h, Dauer >10h/>12h) ergänzt.
- auth/jwt: Optional `JWT_ISSUER`/`JWT_AUDIENCE` in Signatur/Verifikation berücksichtigt (konfigurierbar via ENV).
## v1.1.0 – Contracts & Streaming

### Added
- Contract-Tests: Prism-Mock + Dredd (nightly & manual) via GitHub Actions (bundle, mock, run, Artefakte).
- /api/stats: neue Felder `specVersion` (aus OpenAPI `info.version` bzw. `SPEC_VERSION`) und `buildSha` (über `BUILD_SHA`).

### Changed
- CSV-/XLSX-Exporte auf Streaming umgestellt (100k+ Zeilen ohne Heap-Peak; korrekte Headers/Accept/Disposition).
- OpenAPI: konsistente 405-Responses an allen nicht erlaubten Methoden (Events, Events/{id}, Notifications/Test, Stats); Redocly-Lint grün.

### Docs
- README: RBAC-Matrix inkl. 403-Negativbeispielen; `/api/stats` Felder dokumentiert.

### Ops
- CI nutzt gebündelte OpenAPI und `dredd@14` mit robusten Flags; Node-Heap limitiert (`NODE_OPTIONS=--max-old-space-size=512`).
## v1.1.1 – Health/Readiness

### Added
- Endpunkte: `/healthz` (Liveness), `/readyz` (Readiness mit `deps.db`, `deps.smtp`).
- CI: Health‑Smoke‑Job (baut, startet App, prüft `/healthz`/`/readyz`, lädt Artefakte hoch).
- Doku: README Abschnitt „System-Health“, detaillierte Ops‑Doku unter `docs/ops/system-health.md`.
- Release‑Notes: `docs/releases/v1.1.1.md` (Details & Migration).

### Changed
- Security: `helmet()` aktiv, CORS strikt via Allowlist (`CORS_ORIGINS`, Fallbacks).
- OpenAPI: interne Endpunkte dokumentiert (Tag `internal`, `x-internal: true`), `operationId` konsolidiert, Beispiele bereinigt.

### Fixed
- Minor: OpenAPI‑Warnungen bereinigt (nullable Felder in `TimeEntry`, ungültige Beispiele, ungenutzte Parameter entfernt).

Siehe auch: [Release v1.1.1](docs/releases/v1.1.1.md)
