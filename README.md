# Sicherheitsdienst-Tool Backend

[![CI](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml)

This is the backend for a comprehensive management tool for security services. It provides a REST API to manage employees, shifts, time tracking, and other operational data. The project is built with Node.js, Express, TypeScript, and Prisma, using a PostgreSQL database.
It follows consistent coding standards (EditorConfig, Prettier, ESLint v9) and includes smoke tests.

## Current Project Status

The project is in a stable development stage. The basic API structure is established, and a **complete authentication system based on JSON Web Tokens (JWT) has been successfully implemented and tested.**

- **Core Functions**: CRUD operations for `Users` and `Shifts` are in place.
- **Authentication**: Users can log in via `POST /api/auth/login` to receive a valid JWT.
- **Security**: User routes (`/api/users`) are protected by middleware and require authentication.
- **Logging**: Structured application logs are written using Winston.
- **Validation**: Zod-based request validation via middleware.
- **RBAC**: Route-level authorization with roles (e.g. ADMIN, DISPATCHER).

## Technology Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL (can be run via Docker)
- **Authentication**: JSON Web Tokens (JWT) with `bcryptjs` for password hashing.
- **Development Environment**: `ts-node` and `nodemon` for live-reloading.

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

### E-Mail-Trigger bei Schicht-Änderungen (Feature-Flag)
- Flag: `EMAIL_NOTIFY_SHIFTS=true` aktiviert echte E-Mail-Benachrichtigungen bei Schicht-Erstellung/-Aktualisierung/-Löschung.
- Bei deaktiviertem Flag werden nur Logs geschrieben, es erfolgt kein Mailversand.
- Empfänger: aktuell zugewiesene Mitarbeiter der Schicht (falls vorhanden).
- Implementierung: Controller in `backend/src/controllers/shiftController.ts` rufen `sendShiftChangedEmail` aus `emailService` auf.
- Tests: Unit-Tests mocken `emailService` und prüfen Aufruf abhängig vom Flag; Routen-Tests decken 201/200/404/400-Fälle ab.

### RBAC Übersicht
- Notifications:
  - ADMIN: erlaubt, MANAGER: erlaubt, EMPLOYEE: 403, anonym: 401
- Sites:
  - GET/Liste/Details: Auth erforderlich (alle Rollen)
  - POST/PUT: ADMIN, DISPATCHER
  - DELETE: ADMIN
- Shifts:
  - GET/Liste/Details: Auth erforderlich (alle Rollen)
  - POST/PUT: ADMIN, DISPATCHER
  - DELETE: ADMIN
- Users:
  - GET Liste: ADMIN, DISPATCHER
  - POST/DELETE/PUT: ADMIN (detailspezifische Logik ggf. erweitert)

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
  - Pagination objects: `EmployeesList` / `SitesList` with `meta` (`page`, `perPage`, `total`, `totalPages`).
  - Query parameters: `page`, `perPage`, `sort`, `order`, `q`, plus `city` for Sites.
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
  "http://localhost:3001/api/sites?page=1&perPage=20&sort=name&order=asc&city=Berlin&postalCode=14055"

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
