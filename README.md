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
- Changelog: `CHANGELOG.md`
- Roadmap: `ROADMAP.md`
- Getting Started (Schritt‑für‑Schritt): `GETTING_STARTED.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- Monitoring: `MONITORING.md`

## Quickstart (Dev)

Voraussetzungen
- Docker + Docker Compose
- Optional: Node.js 22+ (für lokale FE/BE‑Entwicklung außerhalb von Compose)

Start (Dev‑Stack)
- `.env` optional (siehe `.env.example` im jeweiligen Teilprojekt)
- `docker compose -f docker-compose.dev.yml up`
- Migrations/Seed: im Dev werden Schema und Seed automatisch angewendet (SEED_ON_START=true im Compose)

URLs (Remote/Server)
- Frontend: `http://<SERVER_IP>:5173`
- API:     `http://<SERVER_IP>:3000`

Login‑Demo (Seeds)
- `admin@sicherheitsdienst.de` / `password123`
- weitere: `dispatcher@…`, `thomas.mueller@…`, `anna.schmidt@…`, `michael.wagner@…` (alle `password123`)

Seed (manuell)
- `docker compose -f docker-compose.dev.yml exec api sh -lc 'npm run -s seed'`

## ENV & Konfiguration

API (Backend)
- `.env.example` im Ordner `backend/`
- Minimal: `PORT`, `JWT_SECRET`, `REFRESH_SECRET`
- Optional: `DATABASE_URL` (Dev‑Compose setzt es bereits), `CORS_ORIGIN|CORS_ORIGINS`, Rate‑Limits (`RATE_LIMIT_MAX/_WINDOW_MS`)

WEB (Frontend)
- `.env.example` im Ordner `frontend/`
- `VITE_API_BASE_URL`, `VITE_HMR_HOST_SERVER_IP`, `VITE_HMR_CLIENT_PORT=5173`

## Health & Stats
- `GET /healthz` → 200 `{ status: "ok" }`
- `GET /readyz` → prüft DB & SMTP (DB optional im Dev)
- `GET /api/stats` → `buildSha`, `specVersion`, `env`, Zähler

## CORS‑Hinweise
- Lokale Dev‑Kombi: `VITE_API_BASE_URL=http://localhost:3000`, `CORS_ORIGIN=http://localhost:5173`.
- Remote: `VITE_API_BASE_URL=http://<SERVER_IP>:3000`, `CORS_ORIGIN=http://<SERVER_IP>:5173` (oder `CORS_ORIGINS` als Allowlist setzen).

## Export (CSV/XLSX)
- Streaming‑Download (100k+ Zeilen) via Accept: `text/csv` oder XLSX MIME‑Type

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

## Monitoring (optional)
- `docker compose -f monitoring/docker-compose.monitoring.yml up -d`
- Prometheus: `http://<SERVER_IP>:9090`, Grafana: `http://<SERVER_IP>:3000` (admin/admin)

## Troubleshooting (Kurz)
- 429 beim Login: Dev‑RateLimiter ist nahezu deaktiviert; bei 429 → API neustarten + Browser hart reload
- 401 auf `/api/users`: Frontend MUSS zentralen `api`‑Client nutzen (Token‑Interceptor); keine nackten `fetch/axios`
- Contract‑Tests: Dredd/Prism Workflow (manuell/cron) – siehe CI
- DB fehlt: viele Routen funktionieren trotzdem; Seed nur mit `DATABASE_URL`
- 403 (RBAC): Kein Refresh; UI blendet verbotene Navigation aus, zeigt 403‑Karte.

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
