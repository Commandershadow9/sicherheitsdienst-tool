# Einsätze / Events – Konzept

Ziel: Planbare Einheiten (Einsätze/Events) abbilden, die Start/Ende, Ort/Site, Dienstanweisungen und eingesetzte Mitarbeiter bündeln. Geeignet für Übersicht (Chef) und für die operativen Mitarbeiter (klare Anweisungen und Beteiligung).

## Kernfelder
- id: UUID
- title: kurzer Titel (z. B. „Messe Berlin – Tag 1“)
- description: optionale Beschreibung
- siteId: optionale Referenz auf `Site`
- startTime / endTime: Zeitraum des Einsatzes
- serviceInstructions: ausführliche Dienstanweisungen (Text/Markdown)
- assignedEmployeeIds: Liste von Mitarbeiter‑IDs (UUIDs), die dem Einsatz zugeordnet sind
- createdAt / updatedAt: Zeitstempel

## Beziehungen / Zusammenspiel
- Ein Einsatz kann mehrere Schichten umfassen, typischerweise werden Schichten (Shifts) weiterhin für Zeiterfassung genutzt.
- Der Einsatz dient als „Dach“ mit Gesamtinformationen (Anweisungen, Überblick, Gesamtlaufzeit). Schichten bleiben granular.

## RBAC
- ADMIN, DISPATCHER: Erstellen/Ändern/Löschen von Einsätzen
- AUTH (alle Rollen): Lesen; Mitarbeiter sehen Einsätze, zu denen sie zugewiesen sind

## API (Entwurf)
- GET `/api/events` – Liste (Pagination/Filter/Sort analog zu anderen Listen)
- POST `/api/events` – Anlegen
- GET `/api/events/{id}` – Details
- PUT `/api/events/{id}` – Aktualisieren
- DELETE `/api/events/{id}` – Löschen
- Exporte: CSV/XLSX über `Accept` (analog Users/Sites/Shifts)

## Validierung
- Start muss vor Ende liegen
- optionale Felder (description, siteId) zulässig
- `assignedEmployeeIds` muss existierende Benutzer referenzieren (Servervalidierung)

## Akzeptanzkriterien
- CRUD + RBAC greifen wie beschrieben
- OpenAPI enthält Schemas/Beispiele; Redoc/Swagger‑Validation grün
- Liste inkl. Filter/Sort nach `startTime`, `endTime`, `title`, `siteId`
- Exporte (CSV/XLSX) liefern korrekte Spalten und Auswahl gemäß Filter/Sort
- (Optional) PDF‑Bericht pro Einsatz mit Kerndaten + Anweisungen

## Folgearbeiten (optional)
- Benachrichtigungen bei Änderungen (E‑Mail + Push an zugewiesene Mitarbeiter)
- Anhänge (Dokumente/Bilder) mit Upload‑Policy
- Abhängigkeit/Verknüpfung zu konkreten Schichten (Aggregationen/Übersicht)
