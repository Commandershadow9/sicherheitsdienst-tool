# Sicherheitsdienst-Tool Backend

[![CI](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml)
[![health-smoke](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/health-smoke.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/health-smoke.yml)

## Inhalt
- [Quickstart (Docker Compose)](#quickstart-docker-compose)
- [Operations / Runbook](#operations--runbook)
- [System-Health (Liveness/Readiness)](#system-health)
- [Release (GHCR)](#release-ghcr)


This is the backend for a comprehensive management tool for security services. It provides a REST API to manage employees, shifts, time tracking, and other operational data. The project is built with Node.js, Express, TypeScript, and Prisma, using a PostgreSQL database.
It follows consistent coding standards (EditorConfig, Prettier, ESLint v9) and includes smoke tests.

## Current Project Status

The project is in a stable development stage. The basic API structure is established.

Milestone 2025‑09‑09 (summary)
- Auth: Refresh flow, `GET /api/auth/me`, `/api/v1` alias, Zod validation for login.
- Notifications: Rate‑limit for test endpoint (ENV + middleware + tests + docs).
- OpenAPI: Unified list params + response shape; `/auth/me`; operationIds; removed unused components.
- Error responses: Harmonized `{ success:false, code, message, details?, errors? }` format.
- DX/CI: Typecheck job + coverage artifact; `.env.example` with `LOG_LEVEL`; PR template.
See CHANGELOG.md for details.

## Technology Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL (can be run via Docker)
- **Authentication**: JSON Web Tokens (JWT) with `bcryptjs` for password hashing.
- **Development Environment**: `ts-node` and `nodemon` for live-reloading.

## Einsätze / Events
- Endpunkte:
  - `GET /api/events` (Liste; Filter/Sort/Pagination wie bei anderen Listen; Exporte via Accept: CSV/XLSX)
  - `POST /api/events` (ADMIN/DISPATCHER)
  - `GET /api/events/{id}`
  - `PUT /api/events/{id}` (ADMIN/DISPATCHER)
  - `DELETE /api/events/{id}` (ADMIN)
- Felder: Titel, Beschreibung, Site, Start/Ende, Dienstanweisungen, zugewiesene Mitarbeiter, Status.
- Push-Hinweis: Bei Event-Erstellung/-Änderung kann (Feature-Flag) eine Push-Mitteilung an zugewiesene Mitarbeiter ausgelöst werden.
- ENV: `PUSH_NOTIFY_EVENTS=true|false` (Standard false). Spätere Integration von FCM/APNs möglich.
### Push/FCM Setup (Produktiv)
- Setze `PUSH_NOTIFY_EVENTS=true` und FCM-Credentials:
  - `FCM_PROJECT_ID`
  - `FCM_CLIENT_EMAIL`
  - `FCM_PRIVATE_KEY` (Zeilenumbrüche als `\n` escapen)
- Verhalten:
  - Ohne FCM: best-effort Mock (nur Logging, zählt `push.success`).
  - Mit FCM: `sendEachForMulticast`; ungültige Tokens werden automatisch deaktiviert (z. B. `registration-token-not-registered`).
- Beobachtung: `/api/stats` → `notifications.counters.push { success, fail }`

---

## Authentication & Refresh

- Login: `POST /api/auth/login` gibt einen Access-Token zurück.
- Refresh: `POST /api/auth/refresh` nimmt einen `refreshToken` entgegen und gibt neue Tokens zurück:
  - Response-Shape: `{ accessToken, refreshToken, expiresIn }` (Sekunden für Access-Token).
- ENV:
  - `JWT_SECRET` (Pflicht), `JWT_EXPIRES_IN` (z. B. `3600` oder `7d`)
  - `REFRESH_SECRET` (Pflicht für Refresh), `REFRESH_EXPIRES_IN` (z. B. `7200` oder `30d`)

### Me-Endpoint und API v1 Alias
- `GET /api/auth/me`: gibt den aktuell authentifizierten Benutzer zurück.
- Alle Endpunkte sind zusätzlich unter `/api/v1/...` erreichbar (Kompatibilität zur OpenAPI `servers`-Angabe).

### Quickstart (curl)
- Login (Access-Token erhalten):
  ```bash
  curl -s -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@example.com","password":"secret123"}'
  ```
- Refresh (neue Tokens ausstellen):
  ```bash
  curl -s -X POST http://localhost:3001/api/auth/refresh \
    -H 'Content-Type: application/json' \
    -d '{"refreshToken":"<REFRESH_TOKEN>"}'
  ```
- Me (aktuellen Benutzer holen):
  ```bash
  ACCESS_TOKEN="<ACCESS_TOKEN>"
  curl -s http://localhost:3001/api/auth/me \
    -H "Authorization: Bearer ${ACCESS_TOKEN}"
  ```

## Quickstart (Docker Compose)

- Copy envs: `cp backend/.env.example backend/.env` and set at least `JWT_SECRET` (and `REFRESH_SECRET` if you use refresh tokens).
- Start stack: `docker-compose up -d --build`
- Healthchecks:
  - DB: waits via `pg_isready`
  - API: checks `GET http://localhost:3001/api/health`
- Migrations: `npx prisma migrate deploy` runs automatically before the API starts.
- Verify:
  - `curl -s http://localhost:3001/api/health`
  - `curl -s http://localhost:3001/api/stats`

### Security & Rate Limiting

- Helmet ist aktiviert (sichere Default‑Header). In Nicht‑Production wird die CSP für die lokale Swagger‑UI deaktiviert.
- CORS ist streng per Allowlist konfiguriert:
  - `CORS_ORIGINS` (Komma‑separiert) – z. B. `https://app.example.com,https://m.example.com`
  - Fallbacks: `FRONTEND_URL`, `MOBILE_APP_URL`, sonst `http://localhost:3000` und `http://localhost:19000`
  - Nicht gelistete Origins erhalten keine ACAO‑Header (kein 500)
- Auth‑Rate‑Limits:
  - IP‑basiert für alle `/api/auth/*`: Standard 10 Req/Minute → 429
    - ENV: `RATE_LIMIT_MAX` (Default `10`), `RATE_LIMIT_WINDOW` in Sekunden (Default `60`)
  - Bruteforce‑Limiter pro User/Email für `POST /api/auth/login`: 5 Versuche / 15 Minuten
  - Store: Memory (Default) oder Redis, wenn `REDIS_URL` gesetzt ist (siehe Compose)
- Response bei Limit‑Verstößen: HTTP 429 + Header `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

### Empfohlene .env (Auszug)

```env
# Auth / Tokens
JWT_SECRET=please-change-me
REFRESH_SECRET=please-change-me
JWT_EXPIRES_IN=7d
REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGINS=https://app.example.com,https://m.example.com
FRONTEND_URL=http://localhost:3000
MOBILE_APP_URL=http://localhost:19000

# Rate Limits (Auth)
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60

# Optional: Redis Store
REDIS_URL=redis://localhost:6379/0
```

### Redis im Docker‑Compose (optional)

- In `docker-compose.yml` ist ein optionaler `redis`‑Service enthalten. Die API liest `REDIS_URL` und nutzt automatisch den Redis‑Store für Rate‑Limits.
- Start (lokal):
  - `docker-compose up -d --build`
  - Test: `curl -i http://localhost:3001/api/auth/login` (nach 10 schnellen Aufrufen folgt 429)

## Operations / Runbook

- Start (Dev): `npm run dev` im `backend/` (setzt lokale .env voraus)
- Start (Compose): `docker-compose up -d --build` (führt `prisma migrate deploy` aus)
- Healthchecks:
  - API: `GET /api/health` → 200/503
  - Stats: `GET /api/stats` → Aggregierte Zahlen und Konfiguration
    - `data.env.specVersion`: Version aus OpenAPI (`docs/openapi.yaml info.version`) oder via `SPEC_VERSION` (Build‑Step)
    - `data.env.buildSha`: Git Commit SHA aus `BUILD_SHA` (oder `null`)
- Logs: Winston (level via `LOG_LEVEL`), HTTP-Logs via morgan; jeder Request hat `X-Request-ID` (Header und Logs)
  - Optional: `LOG_FORMAT=json` für strukturierte Console-Logs (JSON)

## System-Health

- `GET /healthz` (Liveness)
  - Response 200
    ```json
    { "status": "ok" }
    ```

- `GET /readyz` (Readiness)
  - Response 200 (bereit)
    ```json
    { "status": "ready", "deps": { "db": "ok", "smtp": "skip" } }
    ```
    - `deps.db`: Datenbank erreichbar (`ok`)
    - `deps.smtp`: SMTP wird standardmäßig nicht aktiv geprüft und als `skip` signalisiert.
  - Response 503 (nicht bereit)
    ```json
    { "status": "not-ready", "deps": { "db": "fail", "smtp": "skip" } }
    ```
    - Bei DB‑Fehler wird 503 zurückgegeben und `deps.db` auf `fail` gesetzt.

Hinweis: SMTP wird nur als `ok/skip` signalisiert. Ein echter Netzwerk‑Verify kann optional über ENV aktiviert werden:
- `READINESS_CHECK_SMTP` (default `false`)
- `READINESS_SMTP_TIMEOUT_MS` (default `1500`)

Weitere Details siehe: `docs/ops/system-health.md`

### Monitoring/Probes

- Docker Compose/Container (HEALTHCHECK):
  - API: `GET /readyz` (Readiness) eignet sich gut für Container‑Healthchecks, da DB‑Erreichbarkeit berücksichtigt wird.
  - Beispiel (Compose):
    ```yaml
    services:
      api:
        healthcheck:
          test: ["CMD-SHELL", "wget -qO- http://localhost:3001/readyz || exit 1"]
          interval: 15s
          timeout: 5s
          retries: 10
    ```

### Release (GHCR)

- Build & Push: automatisiert via GitHub Actions bei Tag `v*` (`.github/workflows/docker-release.yml`).
  - Images:
    - `ghcr.io/<owner>/<repo>:<tag>`
    - `ghcr.io/<owner>/<repo>:latest`
  - Voraussetzung: Packages‑Write‑Permission für `GITHUB_TOKEN`.

- Runbook: Tag setzen und pushen (Beispiel `v1.2.0-rc.1`)
  ```bash
  npm --workspace backend version 1.2.0-rc.1 --no-git-tag-version
  git add backend/package.json CHANGELOG.md
  git commit -m "chore(release): v1.2.0-rc.1"
  git tag -a v1.2.0-rc.1 -m "Release v1.2.0-rc.1"
  git push origin main --tags
  ```

- Compose (Image verwenden)
  ```yaml
  services:
    api:
      image: ghcr.io/<owner>/<repo>:latest
      environment:
        NODE_ENV: production
        PORT: 3001
        DATABASE_URL: ${DATABASE_URL}
        JWT_SECRET: ${JWT_SECRET}
        FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
        MOBILE_APP_URL: ${MOBILE_APP_URL:-http://localhost:19000}
      ports: ["3001:3001"]
      healthcheck:
        test: ["CMD-SHELL", "wget -qO- http://localhost:3001/readyz || exit 1"]
        interval: 15s
        timeout: 5s
        retries: 10
  ```

#### GitHub Release veröffentlichen (Release Notes)

- Release-Workflow: `.github/workflows/release.yml` erstellt bei Tag‑Push (oder manuell) ein GitHub‑Release mit Body aus `docs/releases/<tag>.md` (Fallback: `CHANGELOG.md`).
- Schritte (RC‑Beispiel `v1.2.0-rc.1`):
  1) Release Notes anlegen: `docs/releases/v1.2.0-rc.1.md`
  2) Tag pushen (siehe oben) – oder Workflow manuell auslösen:
     - Actions → "release" → Run workflow → Input `tag: v1.2.0-rc.1`
     - CLI: `gh workflow run release.yml -f tag=v1.2.0-rc.1`
  3) Discord‑Benachrichtigung (sofern `DISCORD_WEBHOOK` Secret gesetzt) kommt automatisch zum Event `release: published`.

- Kubernetes Probes:
  - Liveness: `GET /healthz`
  - Readiness: `GET /readyz`
  - Beispiel (Deployment Auszug):
    ```yaml
    livenessProbe:
      httpGet:
        path: /healthz
        port: 3001
      initialDelaySeconds: 5
      periodSeconds: 15
      timeoutSeconds: 2
    readinessProbe:
      httpGet:
        path: /readyz
        port: 3001
      initialDelaySeconds: 5
      periodSeconds: 15
      timeoutSeconds: 3
      failureThreshold: 3
    ```
  
### Security & CORS
- Headers: `helmet` setzt u. a. `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (CSP in Dev aus, in Prod an).
- CORS-Allowlist:
  - `CORS_ORIGINS` (Komma-getrennt) hat Vorrang; ansonsten `FRONTEND_URL`/`MOBILE_APP_URL`; Standard lokal: `http://localhost:3000`, `http://localhost:19000`.
  - Nicht gelistete Origins erhalten keinen `Access-Control-Allow-Origin`-Header.
  - Preflight wird über `OPTIONS *` beantwortet.
- Rate Limiting:
  - Notifications-Testendpoint per `NOTIFICATIONS_TEST_RATE_LIMIT_*`
  - Auth (Login/Refresh) per `AUTH_RATE_LIMIT_*`
  - Optional Write-Limits (POST/PUT/DELETE) per `WRITE_RATE_LIMIT_*`
  
### Contract-Tests (OpenAPI)
- Manuell (on-demand): GitHub Actions → "contract-tests (optional)" → Run workflow.
  - Startet Prism-Mock (separater Job) und Compose-Stack (db + api), wartet auf Health, führt Dredd gegen `/api/v1` aus, zeigt vollständige Logs und fährt die Services kontrolliert herunter.
- Nightly: "contract-tests-nightly" läuft täglich um 03:00 UTC.
  - Nutzt den gleichen Compose/Health/Dredd-Flow, um Spezifikation und Implementierung regelmäßig gegenzuprüfen.
- E-Mail Zustellung:
  - SMTP via `SMTP_*`; einfacher Retry (`SMTP_RETRY_MAX`, `SMTP_RETRY_DELAY_MS`)
- Push:
  - Best‑effort ohne FCM; mit FCM via `FCM_*`

### Environment Variablen (Auszug)
- Auth:
  - `JWT_SECRET` (Pflicht), `JWT_EXPIRES_IN`
  - `REFRESH_SECRET` (optional), `REFRESH_EXPIRES_IN`
  - `AUTH_RATE_LIMIT_ENABLED` (default `true`), `AUTH_RATE_LIMIT_PER_MIN` (default `10`), `AUTH_RATE_LIMIT_WINDOW_MS` (default `60000`)
  - Optional Claims: `JWT_ISSUER`, `JWT_AUDIENCE` (werden bei Signatur und Verifikation berücksichtigt)
  - Logging: `LOG_FORMAT=json` (optional; Console-Logs als JSON)
- Notifications (Test):
  - `NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED` (default `true`), `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN`, `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS`
- SMTP:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `SMTP_RETRY_MAX` (default `1`), `SMTP_RETRY_DELAY_MS` (default `200`)
- Push/Events:
  - `PUSH_NOTIFY_EVENTS` (default `false`)
  - `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (optional)

### Diagnose / Troubleshooting
- 401/403/404/422/429/5xx → einheitliches Fehlerformat `{ success:false, code, message, errors? }`
- Rate‑Limit → 429 mit `Retry-After`, `RateLimit-*` Headern
- Korrelation → `X-Request-ID` im Request/Response/Logs verfolgen
- DB → Prisma Migrations/Indices siehe `backend/prisma` und `docs/DB_INDEXES.md`

### Issue-Management (Planung 2025-09-09)
- Issues erzeugen (gh CLI): `bash scripts/create-issues-2025-09-09.sh`
- Issues/Milestone schließen (gh CLI): `bash scripts/close-issues-2025-09-09.sh`

## RBAC Matrix (Kurz)
- Users: Liste/Erstellen/Löschen → ADMIN; Lesen/Aktualisieren → ADMIN oder Self (eingeschränkt bei Self)
- Sites: Erstellen/Aktualisieren → ADMIN, DISPATCHER; Lesen → AUTH; Löschen → ADMIN
- Shifts: Erstellen/Aktualisieren → ADMIN, DISPATCHER; Lesen → AUTH; Löschen → ADMIN; Clock-In/Out/Assign gemäß Zuweisung
- Events: Erstellen/Aktualisieren → ADMIN, DISPATCHER; Lesen → AUTH; Löschen → ADMIN
- Incidents: Erstellen/Aktualisieren/Löschen → ADMIN, MANAGER; Lesen → AUTH
- Notifications (Test): Senden → ADMIN, MANAGER (Rate-Limit aktivierbar)

### RBAC Matrix (Detailliert)
- Quelle (Middleware/Routes):
  - `backend/src/middleware/auth.ts` (`authorize`, `authorizeSelfOr`), `backend/src/middleware/rbac.ts` (Notifications)
  - `backend/src/routes/siteRoutes.ts`, `backend/src/routes/shiftRoutes.ts`, `backend/src/routes/incidentRoutes.ts`, `backend/src/routes/notificationRoutes.ts`
- Notation:
  - ✓ erlaubt
  - ✗ 403 FORBIDDEN (authentifiziert, aber Rolle nicht berechtigt)
  - Lesen schließt List/Detail und, falls vorhanden, Exporte (CSV/XLSX via `Accept`) ein; anonyme Zugriffe → 401

| Ressource / Aktion | ADMIN | MANAGER | DISPATCHER | EMPLOYEE | Relevanter Code |
|---|---:|---:|---:|---:|---|
| Sites – Create (`POST /api/sites`) | ✓ | ✗ | ✓ | ✗ | `backend/src/routes/siteRoutes.ts` |
| Sites – Read (`GET /api/sites`, `GET /api/sites/:id`) | ✓ | ✓ | ✓ | ✓ | `backend/src/routes/siteRoutes.ts` |
| Sites – Update (`PUT /api/sites/:id`) | ✓ | ✗ | ✓ | ✗ | `backend/src/routes/siteRoutes.ts` |
| Sites – Delete (`DELETE /api/sites/:id`) | ✓ | ✗ | ✗ | ✗ | `backend/src/routes/siteRoutes.ts` |
| Sites – Export (CSV/XLSX via `Accept`) | ✓ | ✓ | ✓ | ✓ | Controller: `backend/src/controllers/siteController.ts` |
| Shifts – Create (`POST /api/shifts`) | ✓ | ✗ | ✓ | ✗ | `backend/src/routes/shiftRoutes.ts` |
| Shifts – Read (`GET /api/shifts`, `GET /api/shifts/:id`) | ✓ | ✓ | ✓ | ✓ | `backend/src/routes/shiftRoutes.ts` |
| Shifts – Update (`PUT /api/shifts/:id`) | ✓ | ✗ | ✓ | ✗ | `backend/src/routes/shiftRoutes.ts` |
| Shifts – Delete (`DELETE /api/shifts/:id`) | ✓ | ✗ | ✗ | ✗ | `backend/src/routes/shiftRoutes.ts` |
| Shifts – Export (CSV/XLSX via `Accept`) | ✓ | ✓ | ✓ | ✓ | Controller: `backend/src/controllers/shiftController.ts` |
| Incidents – Create (`POST /api/incidents`) | ✓ | ✓ | ✗ | ✗ | `backend/src/routes/incidentRoutes.ts` |
| Incidents – Read (`GET /api/incidents`, `GET /api/incidents/:id`) | ✓ | ✓ | ✓ | ✓ | `backend/src/routes/incidentRoutes.ts` |
| Incidents – Update (`PUT /api/incidents/:id`) | ✓ | ✓ | ✗ | ✗ | `backend/src/routes/incidentRoutes.ts` |
| Incidents – Delete (`DELETE /api/incidents/:id`) | ✓ | ✓ | ✗ | ✗ | `backend/src/routes/incidentRoutes.ts` |
| Incidents – Export (CSV/XLSX via `Accept`) | ✓ | ✓ | ✓ | ✓ | Controller: `backend/src/controllers/incidentController.ts` |
| Notifications – Send Test (`POST /api/notifications/test`) | ✓ | ✓ | ✗ | ✗ | `backend/src/middleware/rbac.ts`, `backend/src/routes/notificationRoutes.ts` |

- Exporte (zusammengefasst):
  - Sites/Shifts/Incidents: Exporte folgen der Read‑Berechtigung (alle authentifizierten Rollen). Siehe Controller in `backend/src/controllers/*Controller.ts` und Export‑Tests (z. B. `backend/src/__tests__/sites.export.csv.test.ts`, `...xlsx.test.ts`, `shifts.*.test.ts`, `site.shifts.export.*.test.ts`).
  - Users (außerhalb dieser Matrix): `GET /api/users` (inkl. CSV/XLSX via `Accept`) erfordert `ADMIN` oder `DISPATCHER`. Siehe `backend/src/routes/userRoutes.ts` sowie `backend/src/__tests__/users.export.*.test.ts`.

### 403 Negativbeispiele (Tests)
- Sites (EMPLOYEE): 403 bei Create/Update/Delete
  - Tests: `backend/src/__tests__/rbac.negative.employee.test.ts`
- Shifts (EMPLOYEE): 403 bei Create/Update/Delete
  - Tests: `backend/src/__tests__/rbac.negative.employee.test.ts`
- Incidents (EMPLOYEE): 403 bei Create/Update/Delete
  - Tests: `backend/src/__tests__/rbac.incidents.negative.employee.test.ts`
- Notifications (EMPLOYEE): 403 bei `POST /api/notifications/test`
  - Tests: `backend/src/__tests__/notifications.rbac.test.ts`

Hinweis: Anonyme Zugriffe auf geschützte Routen führen zu 401 (z. B. Notifications‑Test ohne Token). Siehe ebenfalls `backend/src/__tests__/notifications.rbac.test.ts`.

## Error Responses

- Shape: jede Fehlermeldung folgt der Struktur
  - `{ success: false, code: string, message: string, details?: string, errors?: any }`
- Codes (Mapping nach HTTP-Status):
  - 400 → `BAD_REQUEST`
  - 401 → `UNAUTHORIZED`
  - 403 → `FORBIDDEN`
  - 404 → `NOT_FOUND`
  - 409 → `CONFLICT`
  - 422 → `VALIDATION_ERROR` (Zod-Fehler in `errors`)
  - 429 → `TOO_MANY_REQUESTS`
  - 503 → `SERVICE_UNAVAILABLE`
  - default → `INTERNAL_SERVER_ERROR`
- Beispiele:
  - Validation (422):
    ```json
    {
      "success": false,
      "code": "VALIDATION_ERROR",
      "message": "Validierungsfehler.",
      "errors": [{ "path": ["email"], "message": "Gültige E-Mail erforderlich" }]
    }
    ```
  - Unauthorized (401):
    ```json
    {
      "success": false,
      "code": "UNAUTHORIZED",
      "message": "Ungültiger oder abgelaufener Token."
    }
    ```
## Setup & Installation (For Developers)

Follow these steps to set up and run the project locally:

1.  **Prerequisites**:
    - Node.js (v18 or higher)
    - Docker and Docker Compose (for the PostgreSQL database)
    - PostgreSQL client tools (optional)
    - A `.env` file (see `.env.example`)

2.  **Clone & Install Repository**:

    ```bash
    git clone <your-repository-url>
    cd backend
    npm install
    ```

3.  **Start Database**:
    - Start the PostgreSQL container using Docker Compose. The Docker setup is pre-configured in your `package.json`.
      ```bash
      npm run docker:up
      ```

4.  **Configure Environment Variables**:
    - Copy the template file `.env.example` to create a `.env` file in the `backend` main directory.
    - Adjust the `DATABASE_URL` in the `.env` file to match your local PostgreSQL settings. Replace placeholders with correct values:
      ```env
      DATABASE_URL="postgresql://your_postgres_user:your_password@localhost:5432/sicherheitsdienst_db?schema=public"
      ```
    - Generate a secure `JWT_SECRET` (at least 32 random characters).
    - Optional: Steuere die Protokollierung über `LOG_LEVEL` (Standard: `debug` in Development, sonst `info`).
      - Unterstützte Werte: `error`, `warn`, `info`, `http`, `debug`
      - Beispiel `.env`:
        ```env
        LOG_LEVEL=debug
        ```

5.  **Migrate and Seed Database**:
    - Apply all Prisma migrations to create the database tables and populate the database with initial test data:
      ```bash
      npx prisma migrate dev
      npm run db:seed
      ```
    - To reset the database, you can use `npm run db:reset`.

6.  **Start Server**:
    - Start the development server:
      ```bash
      npm run dev
      ```
    - The server should now be running at `http://localhost:3001`.

### Start & Logs
- Entwicklung: `npm run dev` (im Ordner `backend/`)
- Produktion (Build + Start):
  - `npm run build`
  - `npm start`
- Logs ansehen:
  - Konsole (dev): farbige Ausgabe über Winston
  - Dateien: `logs/combined.log` (alle Ebenen), `logs/error.log` (nur Fehler)
  - Live verfolgen: `npm run logs`

### Test & Coverage
- Unit-Tests: `npm test`
- Coverage lokal erzeugen: `npm run test:coverage`
  - HTML-Bericht: `backend/coverage/lcov-report/index.html`
- CI-Artefakte:
  - GitHub Actions lädt Coverage als Artefakt `coverage` hoch (falls vorhanden).
  - CI-Workflow: siehe Badge oben (klickbar).

## E-Mail-Benachrichtigungen (Schichtänderung)
- ENV-Variablen (backend/.env):
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Service: `backend/src/services/emailService.ts` (Logging bei Erfolg/Fehlschlag)
- Test-Endpoint (nur zu Testzwecken):
  - POST `/api/notifications/test` mit JSON:
    `{ "recipient": "to@example.com", "title": "Test", "body": "Hallo" }`
  - Antwort: 200 bei Erfolg, 422 bei ungültigen Eingaben, 400 bei `channel != email`
  - OpenAPI ergänzt Beispiel-Responses für 400 (Bad Request) und 422 (Validation Error) unter `docs/openapi.yaml`.
  - RBAC: Zugriff nur für Rollen `ADMIN` und `MANAGER`.
  - Rate-Limit (konfigurierbar über ENV):
    - `NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED` (true|false)
    - `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN` (Standard 10)
    - `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS` (Standard 60000)
    - Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`; bei 429 zusätzlich `Retry-After`.

## Push-Benachrichtigungen (Mobile App)
- Geräte-Token (pro Benutzer) verwalten:
  - `POST /api/push/tokens` mit `{ platform: IOS|ANDROID|WEB, token: string }` – registriert/aktualisiert Token
  - `GET /api/push/tokens` – listet eigene Tokens
  - `PUT /api/push/tokens/:token` – Status ändern (`isActive`, `notificationsEnabled`)
  - `DELETE /api/push/tokens/:token` – Token entfernen
- Events können (Feature-Flag) Push auslösen (best‑effort):
  - Flag: `PUSH_NOTIFY_EVENTS=true`
  - Optional FCM: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (Zeilenumbrüche als `\n`)
  - Ohne FCM: Mock‑Versand (nur Logging)
- Admin: globales Push‑Opt‑In/Out je Benutzer
  - `PUT /api/push/users/{userId}/opt` mit `{ pushOptIn: true|false }` (ADMIN)

## Event‑PDF
- `GET /api/events/{id}` liefert bei `Accept: application/pdf` einen einfachen Einsatzbericht (Titel, Zeitraum, Site, Dienstanweisungen, eingesetzte Mitarbeiter).

### E-Mail-Trigger bei Schicht-Änderungen (Feature-Flag)
- Flag: `EMAIL_NOTIFY_SHIFTS=true` aktiviert echte E-Mail-Benachrichtigungen bei Schicht-Erstellung/-Aktualisierung/-Löschung.
- Bei deaktiviertem Flag werden nur Logs geschrieben, es erfolgt kein Mailversand.
- Empfänger: aktuell zugewiesene Mitarbeiter der Schicht (falls vorhanden).
- Implementierung: Controller in `backend/src/controllers/shiftController.ts` rufen `sendShiftChangedEmail` aus `emailService` auf.
- Tests: Unit-Tests mocken `emailService` und prüfen Aufruf abhängig vom Flag; Routen-Tests decken 201/200/404/400-Fälle ab.

### RBAC Übersicht
- Kurzüberblick: Detailregeln siehe Abschnitt „RBAC Matrix (Detailliert)“ weiter oben.
- Users – Self‑Access: Detail/Update erlaubt für eigene ID; bei Self sind nur Basisfelder erlaubt (`email`, `firstName`, `lastName`, `phone`).
- Shifts – Spezialaktionen:
  - Assign (`POST /api/shifts/:id/assign`): Authentifizierung erforderlich; aktuell keine Rollenprüfung (nur Auth). Route: `backend/src/routes/shiftRoutes.ts`, Controller: `backend/src/controllers/shiftController.ts`.
  - Clock‑In/Out (`POST /api/shifts/:id/clock-in|clock-out`): Authentifizierung + Schichtzuweisung erforderlich (sonst 403). Siehe Tests: `backend/src/__tests__/timetracking.routes.test.ts`.
  - Empfehlung: Assign künftig auf `ADMIN`, `DISPATCHER` einschränken (z. B. `authorize('ADMIN','DISPATCHER')` in `backend/src/routes/shiftRoutes.ts`) und 403‑Negativtests ergänzen.

### Listen-Exporte (Sites, Shifts)
- Sites:
  - CSV: `GET /api/sites` mit `Accept: text/csv`
  - XLSX: `GET /api/sites` mit `Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Shifts:
  - CSV: `GET /api/shifts` mit `Accept: text/csv`
  - XLSX: `GET /api/shifts` mit `Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

Schichten einer Site:
- `GET /api/sites/{siteId}/shifts` unterstützt ebenfalls CSV/XLSX via Accept‑Header (analog zu oben).

Beispiel (CSV für Site‑Schichten):
```bash
SITE_ID="<SITE_ID>"
curl -s -H 'Accept: text/csv' "http://localhost:3001/api/sites/${SITE_ID}/shifts" -o site_shifts.csv
```
Beispiel (XLSX für Site‑Schichten):
```bash
SITE_ID="<SITE_ID>"
curl -s -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' \
  "http://localhost:3001/api/sites/${SITE_ID}/shifts" -o site_shifts.xlsx
```

### Accept‑Header Referenz
- JSON (Standard): `application/json` (oder Header weglassen)
- CSV: `text/csv`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

Beispiel (CSV):
```bash
curl -s -H 'Accept: text/csv' 'http://localhost:3001/api/users?page=1&pageSize=20' -o users.csv
```
Beispiel (XLSX):
```bash
curl -s -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 'http://localhost:3001/api/users?page=1&pageSize=20' -o users.xlsx
```

### RBAC Notifications
- Rollenmatrix (Zugriff auf Benachrichtigungen):
  - ADMIN: erlaubt
  - MANAGER: erlaubt
  - EMPLOYEE: verboten (403)
  - anonym: verboten (401)
- Implementierung: Middleware `notificationsRBAC` in `backend/src/middleware/rbac.ts` prüft `req.user.role ∈ {ADMIN, MANAGER}` und wird in `backend/src/routes/notificationRoutes.ts` vor die Validierung geschaltet.

- Rate-Limit (Test-Endpoint):
  - ENV:
    - `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN` (Standard 10)
    - `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS` (Standard 60000)
  - Gilt nur für `POST /api/notifications/test` (Middleware `notificationsTestRateLimit`).

### Available NPM Scripts

- `npm run dev`: Starts the server in development mode with live-reloading.
- `npm run build`: Compiles the TypeScript code to the `./dist` folder.
- `npm run start`: Starts the compiled application from the `./dist` folder.
- `npm run db:migrate`: Applies database migrations.
- `npm run db:seed`: Populates the database with test data from `src/utils/seedData.ts`.
- `npm run db:studio`: Opens Prisma Studio for easy database management in the browser.

---

## Development Standards

- EditorConfig: see `.editorconfig` (LF, UTF-8, 2 spaces, trim EOL).
- Prettier: see root `.prettierrc.json` and `.prettierignore`.
- ESLint v9: see `backend/eslint.config.mjs` (TypeScript rules, strict parser options).
- TypeScript: strict config in `backend/tsconfig.json`.

## OpenAPI Specification

- Source: `docs/openapi.yaml` (OpenAPI 3.1)
- Contents: Auth, Employees, Sites, Shifts, Assignments, Time, Incidents, Notifications.
- Conventions:
  - Centralized error responses via `#/components/responses/*` (400/401/403/404/409/422/429/500/503).
  - Validation error payload: `#/components/schemas/ValidationError`.
  - List responses: `{ data: [...], pagination: { page, pageSize, total, totalPages }, sort: { by, dir }, filters?: { ... } }`.
  - Query parameters: `page`, `pageSize`, `sortBy`, `sortDir`, `filter[...]` (z. B. Sites: `filter[city]`).
  - Allowed sort fields:
    - Employees: `firstName`, `lastName`, `email`, `createdAt`, `updatedAt`, `role`, `isActive`
    - Sites: `name`, `city`, `postalCode`, `createdAt`, `updatedAt`

### Validate the spec locally

Pick one of the following options (no code changes required):

1) Using Redocly CLI (Docker)

```bash
docker run --rm -v "$PWD/docs:/work" ghcr.io/redocly/cli:latest lint /work/openapi.yaml
```

2) Using Redocly CLI (npx)

```bash
npx @redocly/cli@latest lint docs/openapi.yaml
```

3) Using swagger-cli (npx)

```bash
npx swagger-cli@latest validate docs/openapi.yaml
```

If validation reports issues, fix `docs/openapi.yaml` accordingly. CI integration can be added later to fail builds on spec errors.

### CI

GitHub Actions workflow `ci` runs on pushes/PRs to `main`:
- Backend: install → lint → test → build
- OpenAPI: `npx @redocly/cli lint docs/openapi.yaml`

### Swagger UI (nur Development)
- UI erreichbar unter `http://localhost:3001/api-docs` (nur wenn `NODE_ENV` ≠ `production`).
- Quelle der Spezifikation: `docs/openapi.yaml` (wird unter `/api-docs-spec/openapi.yaml` bereitgestellt).

### System-/Stats-Details
- Endpoint: `GET /api/stats` (liefert `503`, wenn DB nicht verbunden ist).
- Zusätzliche Felder (Observability):
  - features: Flags wie `emailNotifyShifts`, `pushNotifyEvents` (aus ENV)
  - notifications: Rate-Limit-Konfiguration (`enabled`, `perMin`, `windowMs`), `smtpConfigured`, `pushConfigured`
  - auth: `jwtExpiresIn`, `refreshExpiresIn`
  - system: `logLevel` zusätzlich zu `uptime`, `nodeVersion`, `platform`, `memory`
  - env: `nodeEnv`, `version`

## Scripts (Backend)

From within `backend/`:

- `dev`: Runs the server with `ts-node` via `src/server.ts` and watches `src/**`.
- `build`: Compiles TypeScript into `dist/`.
- `start`: Launches compiled app `dist/server.js`.
- `test`: Runs Jest tests (unit + smoke).
- `test:watch`: Runs tests once (no watch-mode).
- `typecheck`: Type-only compilation (`--noEmit`).
- `lint` / `lint:fix`: ESLint check/fix.
- `format` / `format:write`: Prettier check/write.
- `db:*`: Prisma helpers (generate, migrate, seed, studio, reset).

## Testing

- Tests are written with Jest and avoid port-binding. Controller and middleware smoke tests simulate Express `req/res/next`.
- Health and stats controllers handle lack of DB (503), tests pass in both cases (connected/disconnected).

## Listen-API: Pagination/Sort/Filter

- Endpunkte (mindestens): `GET /api/sites`, `GET /api/shifts`, `GET /api/users` unterstützen serverseitige Pagination, Sortierung und Filter.
- Query-Parameter:
  - `page` (ab 1), `pageSize` (max 100)
  - `sortBy` (Sites: name, city, postalCode, createdAt, updatedAt; Shifts: startTime, endTime, title, location, status, createdAt, updatedAt; Users: firstName, lastName, email, createdAt, updatedAt, role, isActive)
  - `sortDir`: `asc` | `desc`
  - `filter[feld]`: z. B. Sites: `name`, `city`, `postalCode`; Shifts: `title`, `location`, `status`; Users: `firstName`, `lastName`, `email`, `role`, `isActive`.
- Response-Format:
  `{ data: [...], pagination: { page, pageSize, total, totalPages }, sort: { by, dir }, filters?: { ... } }`

## Docker Compose

- See `docker-compose.yml` for Postgres (`db`) and pgAdmin (`pgadmin`) with healthchecks.
- Customize env vars with `.env` or environment overrides (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.).
- If you want an API service in Compose, add a `Dockerfile` for `backend` and a service `api` depending on `db: service_healthy`.

## Server Bootstrap

- `src/app.ts` exports the Express app with routes and middleware.
- `src/server.ts` is the runtime entry (listens on `PORT`, handles graceful shutdown with Prisma).

## Compose Quickstart

Local dev with containers (database + API):

1. Create env file for backend

```bash
cp backend/.env.example backend/.env
# In backend/.env, set at least:
# DATABASE_URL="postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public"
# JWT_SECRET="change-me"
# Optional Feature-Flags / SMTP:
# EMAIL_NOTIFY_SHIFTS=false
# SMTP_HOST=...
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_FROM="Security Tool <no-reply@example.com>"
```

2. Start database first, wait for healthy

```bash
docker compose up -d db
```

3. Run migrations against the containerized DB

```bash
docker compose run --rm -e DATABASE_URL="postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public" api npx prisma migrate deploy
```

4. Start API and pgAdmin

```bash
docker compose up -d api pgadmin
# API health: http://localhost:3001/api/health
# pgAdmin: http://localhost:8080 (default creds from compose env)
```

Tip: For pure host development (no API container), run `npm run dev` in `backend/` and point `DATABASE_URL` to `localhost` instead of `db`.

Flag-Hinweis:
- Setze `EMAIL_NOTIFY_SHIFTS=true`, um E-Mails bei Schicht-Erstellung/-Aktualisierung/-Löschung an zugewiesene Mitarbeiter zu senden. Standard: `false` (nur Logging).

## Beispiel: Site API (curl)

Voraussetzung: Auth-Header `Authorization: Bearer <TOKEN>`

Create:
curl -X POST http://localhost:3001/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"HQ","address":"Main St 1","city":"Berlin","postalCode":"10115"}'

List (mit Filtern/Sortierung):
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/sites?page=1&pageSize=20&sortBy=name&sortDir=asc&filter[city]=Berlin&filter[postalCode]=14055"

Get by id:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sites/<id>

Update:
curl -X PUT http://localhost:3001/api/sites/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"HQ Süd"}'

Delete:
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sites/<id>

Hinweise:
- POST/PUT erfordern Rollen ADMIN/DISPATCHER; DELETE nur ADMIN.
- 422 bei Validierungsfehlern (Zod), 404 bei unbekannter ID, 409 bei Duplikaten (Unique-Bedingung: name+address).
- Erfolgreiches Löschen antwortet mit Status 204 (ohne Body).

## Beispiel: Time Tracking (curl)
Voraussetzung: Auth-Header `Authorization: Bearer <TOKEN>` und Schichtzuweisung

Clock-in:
curl -X POST http://localhost:3001/api/shifts/<shiftId>/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"at":"2024-09-01T22:05:00Z","location":"Tor 3","notes":"Start"}'

Clock-out:
curl -X POST http://localhost:3001/api/shifts/<shiftId>/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"at":"2024-09-02T06:05:00Z","breakTime":15,"location":"Tor 3","notes":"Ende"}'

Hinweise:
- Bei offensichtlichen Verstößen werden Warnungen geliefert (z. B. `WARN_REST_PERIOD_LT_11H`, `WARN_SHIFT_GT_10H`, `WARN_SHIFT_GT_12H`).
- Kein Hard-Stop: Die Buchung erfolgt dennoch mit Warnungen.

## Docker Compose: Start/Stop/Logs

- Start (im Projekt-Root):
  docker compose up -d
  - Wartet auf gesunde DB (Healthcheck).
  - API führt beim Start automatisch `prisma migrate deploy` aus.

- Stop:
  docker compose down

- Logs (folgen):
  docker compose logs -f
  docker compose logs -f api
  docker compose logs -f db

- Neuaufsetzen (DB behalten):
  docker compose up -d --build

Migrationshinweis:
- Die API-Container starten mit:
  npx prisma migrate deploy && node dist/server.js
- Dadurch laufen Datenbankmigrationen reproduzierbar beim Containerstart.
- Sicherstellen, dass `DATABASE_URL`, `JWT_SECRET` (und optional SMTP_*) in `backend/.env` bzw. Umgebung gesetzt sind.

## Branch Protection

- Empfohlene Einstellungen sind in `docs/BRANCH_PROTECTION.md` beschrieben.
- Aktiviere in GitHub → Settings → Branches → Branch protection rules für `main`:
  - Require a pull request before merging (Review)
  - Require status checks to pass before merging → `lint-test-build`
  - Optional: Require branches to be up to date before merging

## Further Development Plan (Roadmap)

Based on the original plan, here are the next recommended steps to advance the project.

### Phase 1: Finalize Core API and Security

- [x] **Secure `shiftRoutes.ts`**: Add the `authenticate` middleware to all routes in `src/routes/shiftRoutes.ts` to ensure only authenticated users can access shift data.
- [x] **Implement Role-Based Permissions (`authorize`)**: Utilize the existing `authorize` middleware from `src/middleware/auth.ts` to secure API endpoints with granular control.
  - **Examples**: Only `ADMIN` and `DISPATCHER` can create new shifts. Only `ADMIN` can delete users.
- [x] **Implement Input Validation (Zod)**: Create validation schemas in the `src/validations/` folder for all `POST` and `PUT` requests. Integrate the `validate` middleware into the corresponding routes to ensure data integrity.

### Phase 2: Stability & Quality Assurance

- [x] **Structured Logging (Winston)**: Create a `src/utils/logger.ts` to set up a central logging system. Integrate the logger into the global error handler and key controllers to log requests, errors, and system events.
- [ ] **Write Tests (Jest)**: Set up Jest and Supertest (already in `devDependencies`) to write unit and integration tests for controllers and business logic in the `src/__tests__` directory.

### Phase 3: New Features & Documentation

- [ ] **API Documentation (Swagger)**: Implement `swagger-jsdoc` and `swagger-ui-express` to generate interactive API documentation at an `/api-docs` endpoint. Annotate routes with JSDoc comments for Swagger to recognize them.
- [ ] **Expand Core Features**:
  - **Time Tracking**: Create models, controllers, and routes for employee clock-in/out (`TimeEntry`).
  - **Incident Reporting**: Implement an API for reporting and managing incidents.
