# Changelog

All notable changes to this project will be documented in this file.

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
