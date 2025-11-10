# Schichtplanung v2.0 - Testdaten Dokumentation

## Übersicht

Diese Testdaten decken **ALLE Features** der Schichtplanung v2.0 ab und ermöglichen umfassendes Testing:

- ✅ **9 Konflikttypen** vollständig demonstriert
- ✅ **Clearance-Status** (ACTIVE, EXPIRED, EXPIRING_SOON, NOT_CLEARED)
- ✅ **Auto-Fill** mit verschiedenen Mitarbeiter-Profilen
- ✅ **Compliance-Warnungen** (Workload, Ruhezeit, Aufeinanderfolgende Tage)
- ✅ **Qualifikations-Checks**
- ✅ **Template-System** (7 ShiftTypes)

---

## Installation

### 1. Testdaten seeden

```bash
cd backend
npx tsx seed-shift-planning-v2.ts
```

**Ausgabe:**
```
═══════════════════════════════════════════════════════════
  SCHICHTPLANUNG V2.0 - TESTDATEN SEED
═══════════════════════════════════════════════════════════

🌱 Seeding Schichtplanung v2.0 Testdaten...
  📋 Erstelle Shift Templates...
  🏢 Erstelle Test-Sites...
  👥 Erstelle Test-Mitarbeiter...
  🔐 Erstelle Object Clearances...
  ⚙️ Erstelle Employee Preferences...
  📅 Erstelle Test-Schichten...
  📊 Erstelle Employee Workload...
✅ Schichtplanung v2.0 Testdaten erfolgreich erstellt!

📊 Zusammenfassung:
  - 7 Shift Templates
  - 5 Test-Sites
  - 12 Test-Mitarbeiter
  - Alle 9 Konflikttypen abgedeckt
  - Auto-Fill ready
```

---

## Test-Mitarbeiter

### 🟢 Optimal verfügbar (für Auto-Fill)

| Email | Name | Clearances | Qualifikationen | Workload |
|-------|------|------------|-----------------|----------|
| `max.optimal@test.de` | Max Optimal | Alle 5 Sites | Erste Hilfe, Waffenschein, Nachtschicht | 32h/Woche |
| `anna.perfekt@test.de` | Anna Perfekt | 3 Sites | Erste Hilfe, Crowd Control, Krisenmanagement | 35h/Woche |
| `tom.verfuegbar@test.de` | Tom Verfügbar | 2 Sites | Erste Hilfe, Nachtschicht | 24h/Woche |

**Verwendung:**
- Auto-Fill wird diese Mitarbeiter als **OPTIMAL** einstufen (Score: 85-100)
- Perfekt für Preview-Tests
- Clearance-Status: **ACTIVE** (Grüne Badges)

---

### 🟠 Clearance-Probleme

| Email | Name | Problem | Status | Visualisierung |
|-------|------|---------|--------|----------------|
| `lisa.noclearance@test.de` | Lisa Keine-Einarbeitung | **KEINE** Clearance | NOT_CLEARED | Rote Badges |
| `peter.expired@test.de` | Peter Abgelaufen | Clearance **abgelaufen** | EXPIRED | Rote Badges |
| `sarah.expiring@test.de` | Sarah Läuft-Bald-Ab | Läuft in 15 Tagen ab | EXPIRING_SOON | Orange Badges |

**Verwendung:**
- Demonstriert **NO_CLEARANCE** Konflikt
- Clearance-Badges werden angezeigt
- Timeline zeigt Ring-Indikatoren

---

### 🔴 Qualifikations-Probleme

| Email | Name | Qualifikationen | Problem |
|-------|------|-----------------|---------|
| `julia.noqual@test.de` | Julia Ohne-Quali | **Keine** | Fehlt komplett |
| `mike.teilqual@test.de` | Mike Teil-Quali | Nur Erste Hilfe | Waffenschein fehlt |

**Verwendung:**
- Demonstriert **MISSING_QUALIFICATIONS** Konflikt
- Inline-Warnungen in ShiftCards
- Auto-Fill stuft als **NOT_RECOMMENDED** ein

---

### ⚠️ Compliance-Probleme

| Email | Name | Problem | Werte |
|-------|------|---------|-------|
| `chris.overworked@test.de` | Chris Überlastet | Überlastung | 52h/Woche (> 48h Limit) |
| `emma.stressed@test.de` | Emma Gestresst | Zu viele Tage | 7 aufeinanderfolgende Tage |

**Verwendung:**
- Demonstriert **WEEKLY_HOURS_EXCEEDED** Konflikt
- Demonstriert **CONSECUTIVE_DAYS_EXCEEDED** Konflikt
- Workload-Warnungen im Auto-Fill

---

### ✅ Normal verfügbar

| Email | Name | Beschreibung |
|-------|------|--------------|
| `david.normal@test.de` | David Normal | Standard-Profil, 3 Sites, moderate Workload |
| `sophie.standard@test.de` | Sophie Standard | Standard-Profil, 2 Sites, flexible |

**Verwendung:**
- Baseline für Vergleiche
- Auto-Fill: **GOOD** Score (70-85)

---

## Test-Schichten (Konflikttypen)

### 1. ⚠️ UNASSIGNED (Critical)
```
Titel: "⚠️ UNASSIGNED: Frühschicht ohne Mitarbeiter"
Site: Flughafen Terminal A
Datum: Montag, 06:00-14:00
Required: 2
Assigned: 0
```
**Test:** Dashboard zeigt als CRITICAL an

---

### 2. ⚠️ UNDERSTAFFED (Critical)
```
Titel: "⚠️ UNDERSTAFFED: Nur 1 von 3 Mitarbeitern"
Site: Flughafen Terminal A
Datum: Dienstag, 00:00-08:00
Required: 3
Assigned: 1 (Max Optimal)
```
**Test:** Dashboard zeigt "1/3" an, Auto-Fill schlägt 2 Kandidaten vor

---

### 3. ⚠️ NO_CLEARANCE (High)
```
Titel: "⚠️ NO_CLEARANCE: Lisa ohne Einarbeitung"
Site: Flughafen Terminal A
Datum: Dienstag, 08:00-16:00
Required: 2
Assigned: 1 (Lisa - KEINE Clearance)
```
**Test:**
- Rotes Badge bei Lisa in Matrix
- Inline-Warnung: "Keine Objekt-Einarbeitung"
- Timeline zeigt roten Ring

---

### 4. ⚠️ MISSING_QUALIFICATIONS (High)
```
Titel: "⚠️ MISSING_QUALIFICATIONS: Waffenschein fehlt"
Site: Flughafen Terminal A
Datum: Mittwoch, 06:00-14:00
Required Quali: Erste Hilfe, Waffenschein
Assigned: 1 (Mike - nur Erste Hilfe)
```
**Test:**
- Inline-Warnung: "Waffenschein fehlt"
- Orange Badge in ShiftCard

---

### 5. ⚠️ DOUBLE_BOOKING (High)
```
Schicht A: Donnerstag, 08:00-16:00 (Site: Flughafen)
Schicht B: Donnerstag, 12:00-20:00 (Site: Shopping Mall)
Assigned: Max Optimal (beide Schichten)
Überlappung: 4 Stunden
```
**Test:**
- Dashboard zeigt DOUBLE_BOOKING
- Timeline visualisiert Überlappung

---

### 6. ⚠️ REST_TIME_VIOLATION (Medium)
```
Nachtschicht: Freitag, 22:00 - Samstag 06:00 (Tom)
Frühschicht: Samstag, 08:00-16:00 (Tom)
Pause: Nur 2 Stunden (< 11h Mindestpause)
```
**Test:**
- Dashboard zeigt REST_TIME_VIOLATION
- Details: "Nur 2h Ruhezeit"

---

### 7. ⚠️ WEEKLY_HOURS_EXCEEDED (Medium)
```
Mitarbeiter: Chris Überlastet
Schichten: 6x 8h = 48h (in 1 Woche)
Limit: 48h
```
**Test:**
- Dashboard zeigt WEEKLY_HOURS_EXCEEDED
- Workload-Anzeige rot

---

### 8. ⚠️ CONSECUTIVE_DAYS_EXCEEDED (Low)
```
Mitarbeiter: Emma Gestresst
Schichten: 7 aufeinanderfolgende Tage
Empfehlung: Max. 6 Tage
```
**Test:**
- Dashboard zeigt LOW Severity
- Suggestion: "Pause einplanen"

---

### 9. ⚠️ OVERSTAFFED (Low)
```
Titel: "⚠️ OVERSTAFFED: 4 von 2 Mitarbeitern"
Site: Flughafen Terminal A
Datum: Sonntag, 10:00-18:00
Required: 2
Assigned: 4 (Max, Anna, Tom, Lisa)
```
**Test:**
- Dashboard zeigt "4/2" an
- Suggestion: "2 Mitarbeiter entfernen"

---

## Test-Sites

| Name | Stadt | Typ | Min. Staff | Clearance Required |
|------|-------|-----|------------|--------------------|
| Flughafen Terminal A | Frankfurt | Airport | 3 | Ja |
| Shopping Mall Zentrum | München | Shopping Center | 2 | Ja |
| Industriepark Nord | Hamburg | Industrial | 4 | Ja |
| Bürokomplex Süd | Stuttgart | Office | 1 | Nein |
| Event-Arena | Köln | Event Venue | 6 | Ja |

---

## Shift Templates

| Name | ShiftType | Zeit | Staff | Qualifikationen | Zuschlag |
|------|-----------|------|-------|-----------------|----------|
| Frühschicht Standard | REGULAR | 06:00-14:00 | 2 | Erste Hilfe | 1.0x |
| Spätschicht Standard | REGULAR | 14:00-22:00 | 2 | Erste Hilfe | 1.0x |
| Nachtschicht | NIGHT | 22:00-06:00 | 3 | Erste Hilfe, Nachtschicht | 1.25x |
| Wochenende Tagschicht | WEEKEND | 08:00-20:00 | 2 | Erste Hilfe | 1.5x |
| Feiertag Bewachung | HOLIDAY | 00:00-24:00 | 4 | Erste Hilfe, Waffenschein | 2.0x |
| Notfall-Einsatz | EMERGENCY | 00:00-12:00 | 5 | Erste Hilfe, Krisenmanagement, Waffenschein | 2.5x |
| Event-Security | SPECIAL | 18:00-02:00 | 6 | Erste Hilfe, Crowd Control | 1.75x |

---

## Test-Szenarien

### Szenario 1: Dashboard-Übersicht testen
1. Öffne `/shift-planning`
2. Tab: **Dashboard**
3. **Erwartet:**
   - Stats: ~25 Total Konflikte
   - Critical: 2-3 (UNASSIGNED, UNDERSTAFFED)
   - High: 4-5 (NO_CLEARANCE, MISSING_QUALIFICATIONS, DOUBLE_BOOKING)
   - Medium: 2-3 (REST_TIME_VIOLATION, WEEKLY_HOURS_EXCEEDED)
   - Low: 2 (CONSECUTIVE_DAYS_EXCEEDED, OVERSTAFFED)

---

### Szenario 2: Drag & Drop testen
1. Öffne Tab: **Matrix**
2. Suche Schicht "⚠️ UNDERSTAFFED"
3. Ziehe **Max Optimal** aus einer anderen Schicht
4. Drop auf die unterbesetzte Schicht
5. **Erwartet:**
   - Visual Feedback (blauer Ring)
   - API-Call erfolgreich
   - Toast: "Mitarbeiter zugewiesen"
   - ShiftCard aktualisiert auf "2/3"

---

### Szenario 3: Clearance-Badges testen
1. Tab: **Matrix**
2. Schicht "⚠️ NO_CLEARANCE" ansehen
3. **Erwartet:**
   - Lisa hat rotes ShieldAlert-Icon
   - Tooltip: "Keine Objekt-Einarbeitung"
   - Inline-Warnung in ShiftCard

---

### Szenario 4: Auto-Fill testen
1. Tab: **Dashboard**
2. Klick auf "Auto-Fill" Button
3. Preview ansehen
4. **Erwartet:**
   - ~10 Schichten "FILLED"
   - ~5 Schichten "PARTIAL"
   - ~2 Schichten "UNFILLED"
   - Kandidaten mit Score-Ranking
   - Max Optimal: OPTIMAL (95+)
   - Chris Überlastet: NOT_RECOMMENDED (<60)

---

### Szenario 5: Mobile Touch testen
1. Öffne auf Mobile/Tablet
2. Tab: **Matrix**
3. Halte Mitarbeiter-Karte 200ms gedrückt
4. Verschiebe auf andere Schicht
5. **Erwartet:**
   - Drag startet nach Delay
   - Kein versehentliches Scrolling
   - Drop funktioniert

---

## API-Testing

### Konflikt-Analyse
```bash
curl -X POST http://localhost:3000/api/shift-planning/analyze-conflicts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2025-01-10",
    "endDate": "2025-01-17"
  }'
```

**Erwartete Response:**
- `conflicts.length`: 20-30
- `stats.critical`: 2-3
- `stats.high`: 4-5

---

### Auto-Fill Preview
```bash
curl -X POST http://localhost:3000/api/shift-planning/auto-fill/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2025-01-10",
    "endDate": "2025-01-17",
    "minScore": 70,
    "maxCandidatesPerShift": 5
  }'
```

**Erwartete Response:**
- `results[].status`: "FILLED" | "PARTIAL" | "UNFILLED"
- Kandidaten mit Score > 70

---

## Troubleshooting

### Seed schlägt fehl
**Problem:** "Customer not found"
**Lösung:** Script erstellt automatisch Test-Customer "Testfirma Schichtplanung"

### Keine Konflikte sichtbar
**Problem:** Datum-Range falsch
**Lösung:** Seed erstellt Schichten für aktuelle Woche (Montag-Sonntag)

### Clearance-Badges fehlen
**Problem:** Backend Include fehlt
**Lösung:** Prüfe `shiftController.ts` - muss `objectClearances` includen

---

## Reset Testdaten

```bash
# Alle Testdaten löschen
npx prisma migrate reset

# Neu seeden
npx tsx seed-shift-planning-v2.ts
```

---

## Passwörter

**Alle Test-Mitarbeiter:** `Test1234!`

---

## Zusammenfassung

Diese Testdaten bieten:
- ✅ **Vollständige Abdeckung** aller Features
- ✅ **Realistische Szenarien** für alle 9 Konflikttypen
- ✅ **Diverse Mitarbeiter-Profile** für Auto-Fill
- ✅ **Verschiedene Clearance-Status** für Visualisierung
- ✅ **Compliance-Verstöße** für Warnungen
- ✅ **Template-Vielfalt** für alle ShiftTypes

**Perfekt für:**
- Frontend-Testing (UI/UX)
- Backend-Testing (API)
- Demo-Präsentationen
- QA-Testing
- Performance-Tests
