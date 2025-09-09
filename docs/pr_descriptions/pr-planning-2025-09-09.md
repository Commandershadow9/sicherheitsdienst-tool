# PR: Planung – Analyse & Tickets (2025-09-09)

## Kurz-Zusammenfassung (Phasen 1–5)
- Spec-Alignment: OpenAPI-Fehlerschema vereinheitlicht, Beispiele aktualisiert; 405-Komponente ergänzt.
- Stabilität: Prisma-Singleton; Rate-Limit für Login/Refresh; Request-ID in Logs; einfache Request-Zähler in /stats.
- Incidents E2E: CRUD + Listen/Filter + CSV/XLSX; RBAC (ADMIN/MANAGER schreiben, AUTH lesen); Zod-Validation; Tests; OpenAPI angepasst.
- Hardening: 405-Handling auf allen Routern inkl. Allow-Header; Negative RBAC-Tests (Incidents anonymous/employee) und TimeTracking-Warnungen.
- Notifications: E-Mail Retry (1x) mit Tests; 5xx-Fehlerbeispiele für Push/E-Mail in OpenAPI.
- Operability: README-Runbook (Start/Stop, Health/Stats, Logs/Request-ID, Rate-Limits, SMTP/Retry, ENV-Matrix).
- Doku & CI: Roadmap/Changelog aktualisiert; Leitfaden für Contract-Tests (Prism/Dredd) und CI-Vorschlag beigefügt.

## Kontext
- Analyse-Report: `docs/planning/analysis-2025-09-09.md`
- Ticketliste: `docs/planning/tickets-2025-09-09.md`
- Branch: `planning/analysis-20250909`

## Zusammenfassung (Phasen 1–5)
- Phase 1 – Spec/Stable: OpenAPI Fehlerschema harmonisiert (`success:false`, `code`), Prisma‑Singleton, Auth Rate‑Limit (ENV), Request‑ID Logging.
- Phase 2 – Incidents E2E: CRUD/Listen/Filter + CSV/XLSX, RBAC (ADMIN/MANAGER schreiben, AUTH lesen), Tests, OpenAPI.
- Phase 3 – Hardening: RBAC negative (anonymous/employee) für Incidents, TimeTracking‑Warnungen; 405/Incidents‑List in OpenAPI.
- Phase 4 – Notifications Reliability: E‑Mail Retry (1x) + Tests; 5xx Beispiele für Push/Email in OpenAPI.
- Phase 5 – Operability: README Runbook; /stats mit Request‑Zählern; ENV‑Beispiele (SMTP Retry).

## Ziel
- Die aufgeführten Tickets anlegen, priorisieren und nacheinander abarbeiten.
- OpenAPI/Backend-Konformität herstellen und Incidents-Funktion vollständig liefern.

## Checkliste (verlinkt zu Issues)
- [x] P0: Incidents CRUD + List/Filter/Export (issue: TBA)
- [x] P0: OpenAPI ErrorResponse harmonisieren (issue: TBA)
- [x] P1: Request-ID Middleware + Log-Korrelation (issue: TBA)
- [x] P1: Rate-Limit für auth/login & refresh (issue: TBA)
- [x] P1: PrismaClient Singleton (issue: TBA)
- [x] P1: /stats erweitern (Basics) (issue: TBA)
- [x] P2: OpenAPI Fehlerbeispiele (Push/E-Mail) (issue: TBA)
- [x] P2: README Operations/Runbook (issue: TBA)
- [x] P2: 404/405 in OpenAPI dokumentieren (issue: TBA)
- [x] P2: E-Mail Retry (einfach) (issue: TBA)

## Hinweise
- Nach Erstellung der Issues können die Einträge oben zu "Closes #<nr>" aktualisiert werden.
- Label-Vorschlag: `planning`, `P0|P1|P2`.
- CI: OpenAPI validate + lint dürfen nicht fehlschlagen.

## QA / Abnahme
- Alle Acceptance Criteria pro Ticket erfüllt.
- CI status grün (typecheck, build, tests, coverage artifact, openapi validate/lint).
