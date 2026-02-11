# CLAUDE.md - Sicherheitsdienst-Tool

## Projektbeschreibung
Management-Plattform fuer Sicherheitsdienste. Verwaltet Objekte, Mitarbeiter, Schichten, Dokumente, Rundgaenge (NFC/QR), Logbuch und Angebotskalkulation.

**Version:** 1.0.0 (Release: 29.01.2026)
**Repo:** https://github.com/Commandershadow9/sicherheitsdienst-tool
**Sprache:** Deutsch (Antworten und Kommentare auf Deutsch)

## STATUS: AUF EIS (seit 11.02.2026)
Projekt ist pausiert. Container sind gestoppt. Code und Daten bleiben erhalten.

### Wieder starten
```bash
# Sicherheitsdienst-Services starten (DB, API, Redis, pgAdmin)
cd /home/cmdshadow/project && docker compose --profile sicherheitsdienst up -d

# Pruefen ob alles laeuft
docker ps --filter "name=sicherheitsdienst"

# DB-Migrationen ausfuehren (falls noetig nach laengerer Pause)
docker compose --profile sicherheitsdienst exec api sh -c "npx prisma migrate deploy"
```

### Wieder auf Eis legen
```bash
cd /home/cmdshadow/project && docker compose --profile sicherheitsdienst stop
```

### Hinweise zum Neustart
- Traefik (Reverse Proxy) laeuft weiter - wird von GuildScout/ZERODOX mitgenutzt
- DB-Volume `db-data` ist erhalten - keine Daten verloren
- `.env` Datei mit allen Secrets ist vorhanden
- Logs wurden beim Einfrieren geleert (combined.log, error.log)
- 5 gemergte Feature-Branches koennen aufgeraeumt werden (fix/issue-28 bis fix/issue-35)

## Tech Stack
### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js 5
- **Sprache:** TypeScript 5.8
- **ORM:** Prisma 6.8
- **Datenbank:** PostgreSQL 15
- **Auth:** JWT (Access + Refresh Token)
- **Cache:** Redis (ioredis)
- **Logging:** Winston
- **Tests:** Jest 29, Supertest

### Frontend
- **Build:** Vite 5
- **Framework:** React 18
- **Sprache:** TypeScript 5.6
- **State:** TanStack React Query 5
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS 3, Radix UI
- **Tests:** Vitest, Playwright (E2E)

### DevOps
- Docker Compose (dev + prod)
- Traefik (Reverse Proxy)
- Prometheus + Grafana (Monitoring)

## Projektstruktur
```
backend/
  src/
    controllers/              # Route Handler
    services/                 # Business Logic
    routes/                   # API Endpoints
    middleware/                # Express Middleware
    validations/              # Zod DTOs
    jobs/                     # Cron Jobs
    types/                    # TypeScript Types
    app.ts                    # Express App
    server.ts                 # Entry Point
  prisma/
    schema.prisma             # DB Schema
frontend/
  src/
    components/               # React Komponenten
    features/                 # Feature Module
    pages/                    # Seiten
    lib/                      # Utilities & Hooks
    router.tsx                # React Router
docs/                         # Dokumentation
  dev/                        # Entwickler-Guides
  product/                    # Feature-Docs
  ops/                        # Operations
  security/                   # Sicherheit
monitoring/                   # Prometheus + Grafana
e2e/                          # Playwright Tests
docker-compose.yml            # Produktion
docker-compose.dev.yml        # Entwicklung
Makefile                      # Schnellbefehle
```

## Wichtige Befehle
```bash
# Entwicklung starten
cd /home/cmdshadow/project && docker compose -f docker-compose.dev.yml up

# Backend
cd /home/cmdshadow/project/backend && npm run dev
cd /home/cmdshadow/project/backend && npm run build
cd /home/cmdshadow/project/backend && npm run test
cd /home/cmdshadow/project/backend && npm run lint

# Frontend
cd /home/cmdshadow/project/frontend && npm run dev
cd /home/cmdshadow/project/frontend && npm run build
cd /home/cmdshadow/project/frontend && npm run test

# Datenbank
cd /home/cmdshadow/project/backend && npm run db:migrate
cd /home/cmdshadow/project/backend && npm run db:seed
cd /home/cmdshadow/project/backend && npm run db:studio

# E2E Tests
cd /home/cmdshadow/project/e2e && npx playwright test

# Makefile Shortcuts
make api-up          # Dev Stack starten
make api-down        # Dev Stack stoppen
make api-smoke       # API Smoke Tests
```

## RBAC Rollen
| Rolle | Beschreibung |
|-------|-------------|
| ADMIN | Voller Zugriff |
| DISPATCHER | Schichtplanung & Objekte |
| MANAGER | Objekt-Management |
| EMPLOYEE | Eigene Schichten & Logbuch |

## API Endpoints
- Health: `GET /health`, `GET /readyz`
- Auth: `POST /api/auth/login`, `POST /api/auth/refresh`
- Users: `/api/users`
- Sites: `/api/sites` (Objekte)
- Shifts: `/api/shifts` (Schichten)
- Documents: `/api/sites/:id/documents`
- Logbook: `/api/sites/:id/events`
- Patrols: `/api/sites/:id/patrols`
- Stats: `/api/stats`

## Konventionen
- Commits: `feat|fix|chore|refactor|test|docs: Beschreibung`
- Controller nutzen `asyncHandler` + `createError`
- Validierung mit Zod DTOs in `validations/`
- Audit-Events ueber `buildAuditEvent`/`submitAuditEvent`
- OpenAPI Spec (`docs/dev/openapi.yaml`) synchron halten
- Tests muessen gruen sein vor Push
- Keine destruktiven Befehle ohne Freigabe

## Referenz-Dokumente
- `docs/dev/ARCHITECTURE.md` - Systemarchitektur
- `docs/dev/API_CHEATSHEET.md` - API Referenz
- `docs/dev/openapi.yaml` - OpenAPI Spec
- `docs/security/RBAC.md` - Rollensystem
- `GETTING_STARTED.md` - Setup-Anleitung
- `MONITORING.md` - Observability
- `TROUBLESHOOTING.md` - Fehlerbehebung

## Git
- **Remote:** https://github.com/Commandershadow9/sicherheitsdienst-tool.git
- **Branch:** main
- **Repo:** public
