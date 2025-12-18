# CONTRIBUTING – Sicherheitsdienst-Tool (Backend)

Danke für deinen Beitrag! Dieses Dokument bündelt die wichtigsten Projektkonventionen (kurz & pragmatisch).

## Quick Start

- Node 20, npm 10
- Befehle (im Ordner `backend/`):
  - `npm ci`
  - `npm run lint` / `npm run lint:fix`
  - `npm test` (unit + smoke, ohne Port-Bindings)
- `npm run build`

Weitere Doku
- Maintainers: `docs/MAINTAINERS.md`
- UI‑Atoms: `docs/UI_COMPONENTS.md`

## Commit-/PR-Richtlinien

- Conventional Commits werden enforced (commitlint) – Beispiele:
  - `feat(users): server pagination/filter/sort`
  - `fix(auth): refresh once on 401`
  - `docs(readme): add Quickstart`
  - `chore(ci): add commitlint workflow`
- PR-Beschreibung: Zweck, Änderungen, Tests, Risiken, Follow-ups (kurz)
- CI muss grün sein (lint, tests, build, OpenAPI-Validation)

## API-Konventionen (Listen)

- Query-Parameter (serverseitig): `page` (ab 1), `pageSize` (max 100), `sortBy`, `sortDir` (`asc|desc`), `filter[feld]`
- Response-Format:
  ```json
  {
    "data": [ … ],
    "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 },
    "sort": { "by": "name", "dir": "asc" },
    "filters": { "city": "Berlin" }
  }
  ```
- Validierung via Zod; ungültige Sortfelder → 400, Validierungsfehler → 422

## RBAC-Matrix (Kurz)

| Bereich         | GET/Liste/Details | POST/PUT          | DELETE |
|-----------------|-------------------|-------------------|--------|
| Notifications   | ADMIN, MANAGER    | –                 | –      |
| Sites           | Auth (alle)       | ADMIN, DISPATCHER | ADMIN  |
| Shifts          | Auth (alle)       | ADMIN, DISPATCHER | ADMIN  |
| Users           | ADMIN, DISPATCHER | ADMIN             | ADMIN  |

Hinweis: OpenAPI enthält ergänzend `x-required-roles` je Endpoint.

## Feature-Flags

- `EMAIL_NOTIFY_SHIFTS`: E-Mail-Trigger bei Schicht-Erstellung/-Aktualisierung/-Löschung (true/false)

## OpenAPI

- Quelle: `docs/openapi.yaml` (3.1)
- Lokal prüfen: `npx swagger-cli@latest validate docs/openapi.yaml`
 - CI: führt `swagger-cli validate` (fail on invalid) und Redocly Lint (warn-only) aus.

## Docker/Compose (Kurz)

- `docker compose up -d db` (DB starten)
- API-Service baut/migriert automatisch (`prisma migrate deploy`) und hat Healthcheck `/api/health`

Viel Spaß beim Mitmachen! ✨
