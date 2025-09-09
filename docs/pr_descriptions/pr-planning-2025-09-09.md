# PR: Planung – Analyse & Tickets (2025-09-09)

## Kontext
- Analyse-Report: `docs/planning/analysis-2025-09-09.md`
- Ticketliste: `docs/planning/tickets-2025-09-09.md`

## Ziel
- Die aufgeführten Tickets anlegen, priorisieren und nacheinander abarbeiten.
- OpenAPI/Backend-Konformität herstellen und Incidents-Funktion vollständig liefern.

## Checkliste (verlinkt zu Issues)
- [ ] P0: Incidents CRUD + List/Filter/Export (issue: TBA)
- [ ] P0: OpenAPI ErrorResponse harmonisieren (issue: TBA)
- [ ] P1: Request-ID Middleware + Log-Korrelation (issue: TBA)
- [ ] P1: Rate-Limit für auth/login & refresh (issue: TBA)
- [ ] P1: PrismaClient Singleton (issue: TBA)
- [ ] P1: /stats erweitern (Basics) (issue: TBA)
- [ ] P2: OpenAPI Fehlerbeispiele (Push/E-Mail) (issue: TBA)
- [ ] P2: README Operations/Runbook (issue: TBA)
- [ ] P2: 404/405 in OpenAPI dokumentieren (issue: TBA)
- [ ] P2: E-Mail Retry (einfach) (issue: TBA)

## Hinweise
- Nach Erstellung der Issues können die Einträge oben zu "Closes #<nr>" aktualisiert werden.
- Label-Vorschlag: `planning`, `P0|P1|P2`.
- CI: OpenAPI validate + lint dürfen nicht fehlschlagen.

## QA / Abnahme
- Alle Acceptance Criteria pro Ticket erfüllt.
- CI status grün (typecheck, build, tests, coverage artifact, openapi validate/lint).
