# Testing – Cut (Golden Command)

## Golden Command (targeted, stabil)
```bash
cd backend
npm run test:ci
```

## Voraussetzungen
- Node.js und npm installiert.
- Test-ENV wird aus `backend/.env.test` geladen, falls vorhanden; sonst aus `backend/.env.test.example`.
- Keine echte Datenbank erforderlich (Prisma wird gemockt).

## Pflicht-Suites (Targeted)
- `src/__tests__/auth.login.validation.test.ts` (Auth)
- `src/__tests__/auditTrail.util.test.ts` (Audit)
- `src/__tests__/magicBytes.validator.test.ts` (Upload)

## Optional: Integrationstests
Wenn Integrationstests notwendig sind, muss eine Test‑DB bereitstehen. Empfehlung:
- Docker Postgres lokal starten und `DATABASE_URL` auf die Test-DB zeigen.
- Tests/Commands im Release‑Log dokumentieren.
