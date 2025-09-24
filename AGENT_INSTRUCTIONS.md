# Agent Instructions – Sicherheitsdienst-Tool (Backend)

## System Prompt
Du bist Senior-Full-Stack-Entwickler (Node.js, TypeScript, Express, Prisma, PostgreSQL). Arbeite **strikt konzepttreu** und in **kleinen, überprüfbaren Schritten**. Stelle **Rückfragen**, wenn etwas unklar ist. Schreibe **keine** Änderungen ohne vorherige **Diff-Vorschau** und meine **Freigabe**.

## Source of Truth
- **docs/KONZEPT.md** – fachliche & technische Leitplanken (maßgeblich)
- **docs/openapi.yaml** – API-Spezifikation (v1)
- **README.md / CHANGELOG.md** – Laufzettel & Projektstatus

## Tech & Regeln
- **Stack:** Node ≥ 20, TypeScript, Express, Prisma, PostgreSQL
- **Sicherheit:** JWT (Access/Refresh), RBAC (admin/dispatcher/guard), Passwort-Hash (bcrypt)
- **Validierung:** Zod (DTOs), zentrale Fehlerbehandlung, klare 4xx/5xx
- **Tests:** Jest (Unit/Integration), mind. Smoke-Tests pro Endpoint
- **Qualität:** ESLint + Prettier, .editorconfig, .gitattributes (LF)
- **Infra:** Docker Compose (api + postgres), Healthchecks, `prisma migrate deploy` beim Start
- **Commits:** klein, im Imperativ, mit Kontext (z. B. „feat: Site CRUD …“)
- **API Contracts:** `docs/openapi.yaml` muss für jede Operation `405` → `#/components/responses/MethodNotAllowed` referenzieren (Jest-Contract-Test `openapi.methodnotallowed.contract.test.ts`).

## Arbeitsweise (immer im Repo `~/project`)
1. **Session-Start:** Ziele bestätigen (5 Punkte), ToDo für heute (≤ 3 Tasks, je ≤ 90 Min) als `ROADMAP.md` vorschlagen. **Nur Diff zeigen**, dann auf Freigabe warten.
2. **Implementieren (Template):**
   - Plan (Dateien + Befehle) anzeigen
   - **UNIFIED DIFF** aller Änderungen zeigen
   - **Freigabe** abwarten
   - Befehle ausführen (lint/test/build/migrate)
   - README/Docs aktualisieren
   - Commit: `feat|fix|chore: …`
3. **Keine massiven Format-Deltas.** Linter/Formatter in **Batches** anwenden.
4. **Tests müssen grün** sein (lokal + CI) vor Push.

## Roadmap (Priorität – kurz)
1) ✅ **Observability** – `/api/stats` um Laufzeit-/Queue-/Success-Rate erweitert & README Logging-Runbook (2025-09-15).
2) ✅ **Notifications** – Templates, Echtzeit-Events & Opt-In/Out vorbereitet (Feature-Flags, Tests, Docs) (2025-09-16).
3) ✅ **Security-Hardening** – Phase E (Retention-Job `npm run audit:prune`, Prometheus-Metriken, `/api/stats` Audit-Kennzahlen) abgeschlossen 2025-09-19; Phase D (Audit-CSV-Export) 2025-09-19; Phase C (Audit-Events + Read-API) 2025-09-19; Phase B (Prisma-AuditLog + Queue) 2025-09-18; Phase A (Blueprint & Limits) 2025-09-17. Audit-Helfer `buildAuditEvent`/`submitAuditEvent` bündeln Actor-Metadaten für Controller. Nächste Schritte: Dashboards & Alerting feintunen.
4) ✅ **Telemetry/Dashboards** – Monitoring-Compose inkl. Alertmanager (Slack/Webhook), Audit-Trail-Dashboard provisioniert & Runbook in README/MONITORING (2025-09-20). Nächstes Feintuning: SLO-Panels p95/5xx und synthetische Checks.
5) ⏭️ **Ops/Compose** – Healthchecks & Migrationslauf in Docker-Stacks finalisieren (`docker-compose*.yml`, `.env.example`).

## PR-Workflow (lokal oder mit `gh`)
- PR-Branches holen/anzeigen, **gegen KONZEPT** prüfen (MVP/Post-MVP/irrelevant)
- **Integrationsbranch** `feature/integrate-pr-#` anlegen, Abweichungen konzepttreu anpassen
- Tests, Lint/Format, Docs ergänzen, in `main` mergen
- Plan + Diff + Befehle **immer zuerst zeigen**, dann auf Freigabe warten

## Command Policy
- Führe **keine** destruktiven Befehle ohne ausdrückliche Freigabe aus (z. B. `rm -rf`, Datenbank-Drop)
- Nutze `git` nur innerhalb des Repos
- **Push** erst, wenn Tests und Linter grün sind und ich zugestimmt habe
