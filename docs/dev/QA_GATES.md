# QA Gates – Cut/Release

## Definition of Done (Cut/Release)
- Dokumentation: `docs/product/PROJECT_STATUS.md`, `docs/product/MVP_PLAN_PRUEFEN.md`, `docs/ops/GO_NO_GO.md` aktuell.
- Build: Backend/Frontend builden ohne Fehler.
- Targeted Tests: Pflicht-Suites grün (siehe unten).
- Smoke: API startet, `/health` und `/readyz` reagieren.
- Security-Minimum geprüft (siehe unten).

## Pflicht-Checks (grün)
**Builds**
- Backend: `npm run build` (Ordner `backend/`)
- Frontend: `npm run build` (Ordner `frontend/`)

**Targeted Tests (Pflicht)**
- `backend/src/__tests__/auditTrail.util.test.ts`
- `backend/src/__tests__/magicBytes.validator.test.ts`

**Smoke Tests**
- `docker compose up -d` startet ohne Crash-Spirale.
- `/health` liefert `{status:"ok"}`.
- `/readyz` liefert `db: ok` (SMTP optional/skip).

## Gesamtsuite kaputt? (Regelwerk)
Wenn `npm test` (backend) fehlschlägt aufgrund bekannter Test-Infra:
- **Erlaubt:** Nur targeted Tests ausführen und im Release-Log vermerken.
- **Pflicht:** Link auf P1-Backlog (`docs/product/TODO.md`, Eintrag Test-Infra).
- **Nicht erlaubt:** Test-Infra im Rahmen eines Cut-Releases umbauen.

## Minimaler Security-Check (Pflicht)
- HTTPS aktiv (Traefik + gültiges Zertifikat) oder klar dokumentiert als Open Point.
- Cookie-Auth/Token-Handling unverändert und dokumentiert.
- `TRUSTED_PROXIES` gesetzt (XFF nur trusted).
- Uploads: Magic-Bytes aktiv (PDF/JPG/PNG).
- Audit-Log: asynchron, Backoff/Drop aktiv (kein Log-Spam bei DB-Ausfall).

## Open Points (für Release Notes)
- Test-Infra instabil (ENV/Prisma-Mocks).
- Monitoring/Alerting: Receiver-Konfiguration je Environment.
