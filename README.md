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
- `docker compose -f docker-compose.dev.yml up`

URLs (Remote/Server)
- Frontend: `http://<SERVER_IP>:5173`
- API:     `http://<SERVER_IP>:3000`

Login‑Demo (Seeds)
- `admin@sicherheitsdienst.de` / `password123`
- weitere: `dispatcher@…`, `thomas.mueller@…`, `anna.schmidt@…`, `michael.wagner@…` (alle `password123`)

Seed (falls DB aktiv)
- `docker compose -f docker-compose.dev.yml exec api sh -lc 'npm run -s seed'`

## ENV & Konfiguration

API (Backend)
- `PORT`, `DATABASE_URL` (optional), `JWT_SECRET`, `REFRESH_SECRET`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_SKIP_PATHS`

WEB (Frontend)
- `VITE_API_BASE_URL`, `VITE_HMR_HOST_SERVER_IP`, `VITE_HMR_CLIENT_PORT=5173`

## Health & Stats
- `GET /healthz` → 200 `{ status: "ok" }`
- `GET /readyz` → prüft DB & SMTP (DB optional im Dev)
- `GET /api/stats` → `buildSha`, `specVersion`, `env`, Zähler

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

Badges/CI (Platzhalter)
- Build • Contract‑Tests • Lint
