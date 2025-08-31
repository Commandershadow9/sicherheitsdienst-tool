# merge: adopt PR #2 concept-aligned

Kurzbeschreibung
- Übernahme MVP-Backend: Express/TS/Prisma, JWT-Auth, Users/Shifts CRUD, Health/Stats.
- Artefakte entfernt (kein `dist/`, keine Review-Dateien), `LICENSE`/`.gitignore` bewahrt.

Wesentliche Änderungen
- OpenAPI v1 Grundgerüst (`docs/openapi.yaml`)
- Validierung mit Zod + `validate`-Middleware
- Zentrale Fehlerbehandlung konsolidiert
- Basis-Tests (Smoke) für Controller/Middleware/Validierungen
- Docker Compose gehärtet (DB Healthcheck, Volume)

Akzeptanz
- Lint grün: `npm run lint`
- Tests grün: `npm test -- --ci --runInBand`
- Build OK: `npm run build`
- Compose Start OK: `docker compose up -d` (DB healthy; API health grün)

Hinweise
- ENV: `DATABASE_URL`, `JWT_SECRET` (siehe `backend/.env.example`)
- Migrationslauf: API startet mit `prisma migrate deploy`
