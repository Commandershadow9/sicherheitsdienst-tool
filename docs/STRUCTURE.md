# Projekt-Überblick & Dokumentationsstruktur

## Quellcode

| Bereich | Pfad | Zweck |
| --- | --- | --- |
| Backend | `backend/` | Express + Prisma API, Seeds, Tests |
| Frontend | `frontend/` | Vite/React UI, Hooks, Playwright |
| Infrastruktur | `docker-compose*.yml`, `monitoring/`, `docs/ops/` | Betriebs-Setup, Monitoring, Backups |

## Wichtige Dokumente

- `README.md`: Einstieg, Quickstart, zentrale Links
- `GETTING_STARTED.md`: Schritt-für-Schritt für Dev-Umgebung (+ DB-Creds) 
- `docs/ARCHITECTURE.md`: Modulübersicht Backend/Frontend
- `docs/RBAC.md`: Rollen & Zugriffsmodelle
- `docs/TODO.md`: Backlog/Planung (nutzt Hinweise auf abgeschlossene Milestones)
- `docs/FEATURE_*.md`: detailierte Feature-Specs (Dashboard, Ersatzsuche, Events)
- `docs/ops/*`: Admin-/Ops-Runbooks (Monitoring, Alerts, DSGVO, HTTPS)
- `docs/testing/contract-tests.md`: OpenAPI Contract Tests Guide
- `AGENT_INSTRUCTIONS.md`: KI-Agent Arbeitsanweisung (Aktualisieren falls Prozess geändert)

## Strukturentscheidungen (Oktober 2025)

### Backend

- Abwesenheitscontroller modularisiert: Dokument-Endpoints → `absenceDocumentsController.ts`; Kapazitäts-/Urlaubssaldo-Logik → `services/absenceCapacityService.ts`; Shared-Helper → `controllers/absenceShared.ts`
- Ersatz-Scoring Utils in `services/replacementScoreUtils.ts` (von `intelligentReplacementService.ts` re-exportiert)
- `seedHelpers.ts` führt `resetSeedData` & `createUserWithPassword` ein; Seeds (`seedData.ts`, `seedTestScenarios.ts`) nutzen diese Helper
- DB-Defaults (Dev): `admin/admin123`, DB `sicherheitsdienst_db` (README/Getting Started/Compose aktualisiert)

### Frontend

- Abwesenheitsdetail nutzt `useReplacementCandidates` Hook (`features/absences/hooks/`)
- Playwright-Tests teilen sich Login-Helper (`frontend/tests/support/auth.ts`, `env.ts`)

### Tests

- Neuer Integrationstest `src/services/__tests__/replacementService.v2.test.ts` prüft Ersatzsuche mit DB-Anbindung (erfordert `DATABASE_URL` beim Testlauf)

## Offen / Folgeschritte

- `docs/ROADMAP.md` enthält veraltete Planung (bis v1.13.0). Neu konsolidieren oder mit `docs/TODO.md` zusammenführen.
- Agentinstruktionen (`AGENT_INSTRUCTIONS.md`) spiegeln älteren Workflow (Diff-Preview, Freigabe). Für aktuelle Autonomie ggf. neue Version erstellen.

