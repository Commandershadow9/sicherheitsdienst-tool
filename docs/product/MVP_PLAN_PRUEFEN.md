# MVP Plan prüfen (Cut)

## Zielgruppe
Kleine bis mittlere Sicherheitsdienste mit ca. 10–150 Mitarbeitenden, die Schichtpläne erstellen, prüfen und dokumentieren müssen.

## Kernproblem
Personaleinsatz muss nachvollziehbar geplant und geprüft werden (Verfügbarkeit, Qualifikationen, Konflikte), inklusive Dokumentation/Nachweisen für interne Abstimmung und Kundenkommunikation.

## Kern-Flow im Tool
1. **Plan erstellen** – Schichten/Sites definieren, Mitarbeitende zuweisen.
2. **Check** – System prüft vorhandene Regeln (Konflikte, Verfügbarkeit, Clearances).
3. **Report** – Ergebnisse sichtbar machen (Dashboard, Exporte).
4. **Akzeptieren/Ändern** – Plan anpassen und erneut prüfen.

## Was die KI macht (und was nicht)
**KI unterstützt:**
- Warnungen und Erklärungen zu Konflikten/Abweichungen.
- Vorschläge, welche Mitarbeitenden geeignet sein könnten (Replacement-Logik).
- Hinweise auf fehlende Daten (z. B. Qualifikationen/Clearances).

**KI macht nicht:**
- Keine rechtsverbindlichen Entscheidungen oder DSGVO-/Arbeitsrecht-Garantien.
- Keine automatische, endgültige Schichtplanung ohne menschliche Freigabe.

## Inputs / Outputs
**Inputs**
- Mitarbeitende, Rollen, Qualifikationen/Clearances
- Sites/Objekte, Anforderungen
- Schichten/Zeiträume
- Abwesenheiten
- Vorfälle/Incidents (optional, für Kontext/Benachrichtigungen)

**Outputs**
- Konflikt-/Abweichungsanzeigen (z. B. Überschneidungen, fehlende Qualifikation)
- Vorschläge zur Ersatz-/Zuweisung
- Exporte (CSV/XLSX) und Statusübersichten
- Audit-Logs (asynchron, mit Backoff)

## Minimaler MVP-Umfang (bereits vorhanden)
- Objekte/Sites anlegen und verwalten.
- Mitarbeitende und Rollenverwaltung.
- Schichten erstellen und Mitarbeitende zuweisen.
- Abwesenheiten pflegen.
- Konflikt-/Ersatzlogik im Backend (Replacement/Scoring vorhanden).
- Dokumenten-Uploads (Magic-Bytes validiert).
- Exporte (CSV/XLSX) für Listen/Schichten.
- Basis-Dashboard und Stats.

## Open Points
- Exakte Regeldefinitionen für „Plan prüfen“ (Arbeitszeitrecht, interne Policies) sind nicht formalisiert.
- Einheitliche, formale „Planfreigabe“ (Status/Workflow) ist nicht spezifiziert.
