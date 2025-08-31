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

### DevOps
- GitHub Actions CI-Workflow `.github/workflows/ci.yml`
- `.env.example` erweitert (DB/JWT/Refresh/SMTP)
- Docker Compose: DB-Volume, Healthchecks, API `depends_on: service_healthy`

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
