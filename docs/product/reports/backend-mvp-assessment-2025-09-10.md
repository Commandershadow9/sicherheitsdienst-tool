# Backend MVP Assessment – 2025-09-10

## Executive Summary
- Backend wirkt MVP‑fertig: Auth, Users, Sites, Shifts sind mit RBAC, Validierung, konsistenten Fehlerbildern und Exports umgesetzt; Incidents/Events/Push zusätzlich vorhanden.
- Fehlerformat vereinheitlicht; Zod liefert 422 mit `code: VALIDATION_ERROR`; Prisma-Codes sauber auf 4xx/409/404 gemappt.
- Pagination/Filter/Sort auf Serverseite für Sites und Shifts vorhanden; CSV/XLSX-Exporte implementiert und getestet.
- CI baut, typecheckt, testet und lintet OpenAPI; manuelle und nächtliche Contract‑Tests vorhanden.
- `.env.example` deckt SMTP und `EMAIL_NOTIFY_SHIFTS` ab; README dokumentiert Flags, RBAC, Runbook.
- Konzeptbasis vorhanden (`docs/product/KONZEPT.pdf`), OpenAPI v1 gepflegt.

## „Backend MVP fertig?“ → JA
- RBAC (inkl. Notifications nur ADMIN/MANAGER) mit Middleware und Tests belegt; OpenAPI trägt `x-required-roles`.
- Feature‑Flag `EMAIL_NOTIFY_SHIFTS` steuert Mailversand bei Schicht‑Events; Service mit Retry und Zählung.
- Einheitliche 400/422/… Fehler und Validation; Listenverhalten, Exporte und Accept‑Negotiation implementiert.
- CI laut Repo stabil; Testsuites umfassend vorhanden.

## Checkliste

Punkt | Status | Evidenz (Datei/Commit)
---|---|---
RBAC (Notifications nur ADMIN/MANAGER) | Erledigt | `backend/src/middleware/rbac.ts`, `backend/src/routes/notificationRoutes.ts`, Tests: `backend/src/__tests__/notifications.rbac.test.ts`, OpenAPI: `docs/dev/openapi.yaml` (/notifications/test, x-required-roles)
E-Mail-Trigger bei Schicht-Events (Feature-Flag) | Erledigt | Flag/Controller: `backend/src/controllers/shiftController.ts`, Service/Retry: `backend/src/services/emailService.ts`, Tests: `backend/src/__tests__/shift.notifications.unit.test.ts`, Env: `backend/.env.example`, Doku: `README.md`
Konsistente 400/422-Fehlerbilder + Validierung | Erledigt | Validation: `backend/src/middleware/validate.ts` (422, `code`), Global Handler: `backend/src/app.ts`, Smoke: `backend/src/__tests__/error.responses.smoke.test.ts`, OpenAPI Responses: `docs/dev/openapi.yaml`
Serverseitige Pagination/Filter/Sort (Sites/Shifts) | Erledigt | Controller: `backend/src/controllers/siteController.ts`, `backend/src/controllers/shiftController.ts`; Schemas: `backend/src/validations/*`; Tests: `sites.list.routes.test.ts`, `shifts.list.routes.test.ts`; OpenAPI Params
Tests grün (Anzahl Suiten/Fälle), CI stabil | Eingeschränkt | 57 Suiten/152 Fälle (gezählt), CI-Workflow: `.github/workflows/ci.yml`, Badge/README, `CHANGELOG.md` (Hinweise „grün“). Lokal nicht ausgeführt.
.env.example (SMTP, EMAIL_NOTIFY_SHIFTS) & README-Hinweise | Erledigt | `backend/.env.example` (SMTP_*, `EMAIL_NOTIFY_SHIFTS`, Rate‑Limits, Push), `README.md` (E-Mail/Flags/Runbook)

## Empfehlung – Nächster Meilenstein (Release‑Readiness)
- E2E/Contract‑Tests: Dredd/Prism als optionales CI‑Gate für Kernpfade; nightly grün halten. Akzeptanz: Job läuft fehlerfrei, Logs als Artefakt.
- Docker Release: Multi‑Stage Image bauen und auf GHCR pushen; Compose mit Healthchecks/Migrations. Akzeptanz: Tag‑Release baut/pusht, `docker-compose up -d` läuft gesund.
- Migrations/Seed: `prisma migrate deploy` deterministisch; Seed‑Hinweise im Runbook. Akzeptanz: Frischstart reproduzierbar.
- Security & Rate‑Limits: Helmet/CORS erlaubte Origins eng fassen; Write‑Limiter aktivieren + Tests. Akzeptanz: 429/Headers via Tests verifiziert.
- Observability/Logs: Optional JSON‑Logs; `/stats` deckt Notif‑Counter/Req‑Zähler ab. Akzeptanz: ENV schaltet Format; README ergänzt.
- Versionierte OpenAPI & Release Notes: Spec als Release‑Asset; CHANGELOG gepflegt. Akzeptanz: Release enthält `docs/dev/openapi.yaml` und Notes.

## Heutiger 3‑Task‑Plan (nur Vorschau; keine Ausführung)
- Task 1: Security‑Header/CORS‑Tests ergänzen
  - Dateien: `backend/src/__tests__/security.headers.test.ts`, evtl. `backend/src/app.ts`
  - Kommandos:
    - `git checkout -b test/security-headers`
    - `git add backend/src/__tests__/security.headers.test.ts`
    - `git commit -m "test: verify helmet headers and CORS allowlist"`
    - `cd backend && npm test -- src/__tests__/security.headers.test.ts`
- Task 2: Docker Release Workflow (GHCR)
  - Dateien: `.github/workflows/release.yml`, `README.md`
  - Kommandos:
    - `git checkout -b ci/docker-release`
    - `git add .github/workflows/release.yml README.md`
    - `git commit -m "ci: add GHCR release workflow (build/push image on tag)"`
    - `git tag v1.0.0 && git push origin v1.0.0`  (nur nach Freigabe)
- Task 3: Contract‑Tests an CI anbinden (optional)
  - Dateien: `.github/workflows/ci.yml` (Job-Use der bestehenden Reusable Workflow), ggf. `docs/dev/openapi.yaml`
  - Kommandos:
    - `git checkout -b ci/contract-tests-in-ci`
    - `git add .github/workflows/ci.yml`
    - `git commit -m "ci: wire optional contract-tests job into CI"`
    - `gh workflow run "contract-tests (optional)"` (manuell)

APPROVAL_NEEDED: EXECUTION
