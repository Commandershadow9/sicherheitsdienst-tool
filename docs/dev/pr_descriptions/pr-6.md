# merge: adopt PR #6 concept-aligned

Kurzbeschreibung
- Post-MVP-Härtungen: RBAC (`authorize`), erweiterte Validierung (Zod), strukturiertes Logging (Winston + morgan).
- Auth-Flow verbessert: Access + Refresh Tokens, `GET /api/auth/me`.

Wesentliche Änderungen
- Middleware-Aliase: `authRequired`/`requireRole`
- Seeds erweitert: Admin/Dispatcher/Guard Demos
- CI-Workflow: Node 20 → `npm ci` → lint → test → build
- Compose: `depends_on: service_healthy`, automatische Migration (`prisma migrate deploy`)

Akzeptanz
- Lint grün: `npm run lint`
- Tests grün: Mind. 6 Tests (2x Login, 2x Allowed, 2x Denied)
- Build OK: `npm run build`
- Compose Start OK: `docker compose up -d`

Hinweise
- ENV: `REFRESH_SECRET`, `REFRESH_EXPIRES_IN` optional
- Branch Protection: siehe `docs/BRANCH_PROTECTION.md`
