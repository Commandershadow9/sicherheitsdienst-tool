1. **Kurz-Summary (5–8 Zeilen) + „Backend-MVP fertig?“ → JA**

- OpenAPI v1 mit Kernpfaden, konsistenten Fehlern (400/422) und 201/405 abgedeckt; Server-Alias `/api/v1` vorhanden. Evidenz: `docs/dev/openapi.yaml#L1-L20`, `#L752-L880`, `#L1410-L1478`.
- Auth/Refresh, RBAC (inkl. Self-Access), einheitliche Validation via Zod mit 422/`VALIDATION_ERROR`. Evidenz: `backend/src/routes/authRoutes.ts#L13-L22`, `backend/src/middleware/validate.ts#L15-L20`, `backend/src/middleware/rbac.ts#L4-L5`.
- Notifications: E-Mail mit Retry, RBAC nur ADMIN/MANAGER, Rate-Limit konfigurierbar; Push-Token und Feature-Flag für Events. Evidenz: `backend/src/services/emailService.ts#L49-L79`, `backend/src/routes/notificationRoutes.ts#L13-L23`, `backend/src/services/pushService.ts`.
- Time-Tracking: Clock-in/out inkl. AZG-Warnungen (<11h Ruhe, >10h/>12h Dauer). Evidenz: `backend/src/controllers/shiftController.ts#L615`, `#L658-L659`.
- Persistenz: Prisma Schema + Migrations, sinnvolle Indizes für Users/Sites/Shifts; Exporte CSV/XLSX für Listen vorhanden. Evidenz: `backend/prisma/schema.prisma`, `docs/dev/DB_INDEXES.md`.
- Operability/Doku: `/api-docs` (Dev), `/api/stats` mit Counters/Features, `.env.example` umfangreich; CI validiert/lintet OpenAPI + build/test. Evidenz: `backend/src/app.ts#L74-L84`, `backend/src/routes/systemRoutes.ts`, `.github/workflows/ci.yml`.

Fazit: Backend-MVP ist funktional vollständig (JA) mit kleineren Deltas (z. B. OpenAPI 405-Referenzen breiter, optionale Contract-Tests fest etablieren).

2. **Statusmatrix (0–5)**

| Bereich                     | Score (0–5) | Kernaussagen | Evidenz |
| --------------------------- | ----------: | ------------ | ------- |
| Architektur                 | 4.5 | Schichten klar (Routes/Controllers/Middleware/Services); /api und /api/v1; CSV/XLSX-Exports konsistent | `backend/src/app.ts#L105-L125`; `backend/src/controllers/*`; `backend/src/utils/csv.ts` |
| Auth/RBAC                   | 4.5 | JWT Auth+Refresh; authorize/authorizeSelfOr; Notifications nur ADMIN/MANAGER | `backend/src/routes/authRoutes.ts#L13-L22`; `backend/src/middleware/auth.ts`; `backend/src/middleware/rbac.ts#L4-L5` |
| Validation/Errors (400/422) | 5.0 | Zod-Validierung, 422 mit VALIDATION_ERROR; globaler Error-Handler mapt Codes | `backend/src/middleware/validate.ts#L15-L20`; `backend/src/app.ts#L165-L176,L200-L229` |
| Notifications               | 4.5 | E-Mail Retry (ENV), RBAC, Rate-Limit; Push-Token/Opt-In; Event-Push Flag | `backend/src/services/emailService.ts#L49-L79`; `backend/src/routes/notificationRoutes.ts#L13-L23`; `backend/src/services/pushService.ts` |
| TimeTracking                | 4.0 | Clock-in/out mit Warnungen; Assign-Checks | `backend/src/controllers/shiftController.ts#L615,L658-L659`, `#L520-L566` |
| Persistenz/Migration        | 4.5 | Prisma Schema + Migrations; Indizes wie geplant | `backend/prisma/schema.prisma`; `docs/dev/DB_INDEXES.md` |
| Tests/CI                    | 4.0 | Umfangreiche Jest-Tests (RBAC/Validation/Exports/Stats); CI build+coverage; OpenAPI validate/lint | `.github/workflows/ci.yml`; `backend/src/__tests__/*` |
| Doku/Operability            | 4.5 | README Runbook; .env.example vollständig; /api-docs Dev; /api/stats reichhaltig | `README.md`; `backend/.env.example`; `backend/src/app.ts#L74-L84`; `backend/src/controllers/systemController.ts` |

3. **Checkliste (Punkt | Status | Evidenz: Datei/Commit/Zeile)**

- RBAC: Notifications nur ADMIN/MANAGER | ✅ | `backend/src/middleware/rbac.ts#L4-L5`; `backend/src/routes/notificationRoutes.ts#L13-L20`; `backend/src/__tests__/notifications.rbac.test.ts`
- E-Mail-Trigger bei Schicht-Events (Feature-Flag) | ✅ | `backend/src/controllers/shiftController.ts#L108-L125,L233-L246`; `backend/src/services/emailService.ts#L81-L89`; `backend/.env.example` (EMAIL_NOTIFY_SHIFTS)
- Konsistente 400/422 + Validierung | ✅ | `backend/src/middleware/validate.ts#L15-L20`; `backend/src/app.ts#L165-L176,L200-L229`; `backend/src/validations/*`
- Serverseitige Pagination/Filter/Sort (Sites/Shifts) | ✅ | `backend/src/controllers/siteController.ts#L10-L64`; `backend/src/controllers/shiftController.ts#L22-L84`
- Tests/CI grün | ⚠️ | CI-Workflow + Badge vorhanden, Live-Status nicht verifiziert lokal. `.github/workflows/ci.yml`; `README.md` (Badge)
- `.env.example`/README aktuell | ✅ | `backend/.env.example`; `README.md` (Runbook/ENV)

4. **Nächster größerer Meilenstein ODER Minimal-Delta**

- Given valid OpenAPI docs, When contract-tests run nightly, Then Dredd passes against `/api/v1` for auth/sites/shifts/users/incidents.
- Given OpenAPI paths, When unsupported methods are called, Then 405 with MethodNotAllowed is consistently documented per path (and implemented).
- Given large lists, When requesting CSV exports, Then streaming is used and responses remain under memory thresholds.
- Given Events feature, When `PUSH_NOTIFY_EVENTS=true` and device tokens exist, Then `sendPushToUsers` dispatches and disables invalid tokens.
- Given RBAC docs, When reading README, Then a consolidated RBAC matrix exists including Incidents/Push/Events with negative examples.
- Given CI pipeline, When running, Then OpenAPI lint runs as required and fails on breaking errors (warnings allowed).

5. **Tagesplan (3–5 Tasks, je 30–90 Min)**

- Task: Contract-Tests Workflow finalisieren; Ziel: Stabiler Dredd-Lauf; Dateien: `.github/workflows/contract-tests.yml`, `docs/dev/openapi.yaml`; Testplan: Manuell `workflow_dispatch` ausführen, Dredd-Exit 0 prüfen.
- Task: OpenAPI 405-Responses ergänzen; Ziel: Alle Kernpfade mit 405 referenziert; Dateien: `docs/dev/openapi.yaml`; Testplan: `npx @redocly/cli lint`, Muster-Requests gegen Prism prüfen.
- Task: CSV-Streaming für große Exporte; Ziel: Memory-schonender Export; Dateien: `backend/src/utils/csv.ts`, Controller-Exporte; Testplan: Generiere >100k Zeilen, beobachte Heap, Response-Stream intakt.
- Task: RBAC-Matrix konsolidieren; Ziel: README erweitert; Dateien: `README.md`; Testplan: Review gegen `routes/*`, negative Tests vorhanden.
- Task: Stats erweitern um OpenAPI-/build-Infos; Ziel: `/api/stats` zeigt Spec-Version und Build SHA; Dateien: `backend/src/controllers/systemController.ts`; Testplan: Jest-Erweiterung, Response-Felder prüfen.

6. **Konkrete Kommandos (nur anzeigen, nicht ausführen)**

```bash
# Git-Übersicht (nur lesen)
git log --oneline -n 10
git branch -vv
git status

# Tests/Build lokal
cd backend
npm ci
npm run typecheck
npm run build
npm test

# OpenAPI Validate/Lint
npx swagger-cli@latest validate docs/dev/openapi.yaml
npx @redocly/cli@latest lint docs/dev/openapi.yaml --format=github

# Contract-Tests (lokal)
npx @stoplight/prism-cli@latest mock docs/dev/openapi.yaml &
npx dredd@latest docs/dev/openapi.yaml http://localhost:3001/api/v1

# Prisma
npx prisma generate
npx prisma migrate dev
```

7. **Findings & Evidenz**

- OpenAPI Grundstruktur + Servers: `docs/dev/openapi.yaml#L1-L9`.
- Fehler-Responses und ValidationError zentral: `docs/dev/openapi.yaml#L660-L718`, `#L700-L718`.
- Auth-Endpunkte: `docs/dev/openapi.yaml#L752-L880`; Implementierung: `backend/src/routes/authRoutes.ts#L13-L22`; `backend/src/controllers/authController.ts`.
- Sites Pfade inkl. 201/400/422/409, Pagination/Filter/Sort: `docs/dev/openapi.yaml#L1410-L1560`; Implementierung: `backend/src/controllers/siteController.ts`.
- 405 MethodNotAllowed definiert und implementiert: `docs/dev/openapi.yaml#L752-L880` (Definition `L752`), `backend/src/middleware/methodNotAllowed.ts#L5-L9`; Routen `router.all(...)`.
- Zod-Validation + 422: `backend/src/middleware/validate.ts#L15-L20`; Schemata in `backend/src/validations/*` (auth/site/time/...).
- Notifications RBAC + RateLimit: `backend/src/middleware/rbac.ts#L4-L5`; `backend/src/middleware/rateLimit.ts#L1-L45`; Routen: `backend/src/routes/notificationRoutes.ts#L13-L23`; Tests: `backend/src/__tests__/notifications.ratelimit*.test.ts`, `notifications.rbac.test.ts`.
- E-Mail Retry (ENV-basiert): `backend/src/services/emailService.ts#L49-L79`; Flags in `backend/.env.example` (SMTP_RETRY_*).
- Push-Service (Tokens/FCM/Disable invalid): `backend/src/services/pushService.ts` (`getActiveTokens`, `sendEachForMulticast` mit Deaktivierung).
- TimeTracking Warnungen: `backend/src/controllers/shiftController.ts#L615`, `#L658-L659`; Tests: `backend/src/__tests__/timetracking.warnings.test.ts`.
- Persistenz + Indizes: `backend/prisma/schema.prisma` (Users.email unique; Sites unique name+address; Shifts startTime/status indices); `docs/dev/DB_INDEXES.md`.
- Listen-Exports CSV/XLSX: Users/Sites/Shifts Controller, Accept-Header Switches; z. B. `backend/src/controllers/siteController.ts#L28-L53`, `L54-L78`; Tests: `sites.export.*.test.ts`, `shifts.export.*.test.ts`, `users.export.*.test.ts`.
- /api-docs (Dev): `backend/src/app.ts#L74-L84` (Swagger UI, /api-docs); `/api/stats`: `backend/src/routes/systemRoutes.ts`, `backend/src/controllers/systemController.ts`.
- CI-Workflows: Build/Test/Coverage + OpenAPI validate/lint: `.github/workflows/ci.yml`; Contract-Tests (optional, nightly): `.github/workflows/contract-tests*.yml`.
- README/Runbook/.env: `README.md` (Run, Exporte, RBAC, Errors), `backend/.env.example` vollständig.

8. **Risiken & Blocker**

- OpenAPI 405-Referenzen nicht auf allen Pfaden explizit dokumentiert → Gegenmaßnahme: Pfade mit `components.responses.MethodNotAllowed` ergänzen.
- Contract-Tests optional/nicht obligatorisch → Gegenmaßnahme: CI-Gate für Kernpfade aktivieren (separater required Job).
- CSV/XLSX Export speichert voll im Speicher → Gegenmaßnahme: Streaming/Chunking implementieren + Lasttests.
- Push mit FCM optional; ohne FCM nur Mock → Gegenmaßnahme: Produktions-Setup/Doku für FCM vervollständigen, Secrets-Handling prüfen.
- Testflakiness möglich durch Prisma/Generate in CI → Gegenmaßnahme: deterministische Test-Seeds/Mocks, `prisma generate` als fester CI-Schritt (vorhanden, aber prüfen).

APPROVAL_NEEDED: EXECUTE
