# Empfohlene Datenbank-Indizes

> Ziel: Häufige Anfragen (Listen/Filter/Sort) effizienter machen. Migrations werden beim nächsten `prisma migrate dev`/`deploy` erzeugt.

## Users (Tabelle `users`)
- email: bereits UNIQUE (impliziter Index)
- @@index(lastName, firstName) – Sortierung/Filter nach Name
- @@index(createdAt) – Sortierung/Archiv
- @@index(isActive) – Filter aktive/inaktive
- @@index(role) – Filter nach Rolle

## Sites (Tabelle `sites`)
- UNIQUE(name, address): vorhanden
- @@index(name) – Volltext-/Prefix-Suche (contains)
- @@index(city) – Filter Stadt
- @@index(postalCode) – Filter PLZ

## Shifts (Tabelle `shifts`)
- @@index(startTime) – Listen/Sortierung nach Start
- @@index(status) – Filter Status
- @@index(siteId, startTime) – Site-bezogene Listen (zeitlich sortiert)

## ShiftAssignments (Tabelle `shift_assignments`)
- UNIQUE(userId, shiftId): vorhanden
- @@index(shiftId) – Auflösungen pro Schicht

## TimeEntries (Tabelle `time_entries`)
- @@index(userId, startTime) – Verlauf je User (neueste zuerst)

## Hinweise
- Postgres verwendet B‑Tree-Indizes standardmäßig (gut für Gleichheit/Range/Sort).
- Für `contains`-Suchen auf Textfeldern kann optional ein GIN-Index mit `pg_trgm` sinnvoll sein; aktuell bleiben wir bei B‑Tree für einfache Filter.
- Prüfe nach Deploy mit `EXPLAIN ANALYZE` reale Queries und passe ggf. an.
