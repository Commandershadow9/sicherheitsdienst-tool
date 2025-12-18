# 🧠 Feature: Intelligentes Objekt-Management

> **Status:** Geplant (25.10.2025)
> **Ziel:** Vollständiges Sicherheitskonzept mit Automatismen und Assistenten

---

## 🎯 Vision

> "Ich stelle mir das so vor, dass ich über das Tool ein vollständiges Sicherheitskonzept anlegen kann, intelligent, vereinfacht und mit vielen Automatismen und Hilfestellungen."

**Aktuell:** Wizard erstellt Objekte, aber ohne Intelligenz
**Soll:** Vom Sicherheitskonzept bis zur fertigen Schichtplanung - alles intelligent verknüpft

---

## ❌ Identifizierte Probleme

### 1. **Coverage-Validierung fehlt** 🔴 HIGH

**Problem:**
- Objekt fordert 6 MA, nur 3 zugewiesen
- Keine Warnung/Fehler angezeigt
- User weiß nicht, dass Coverage unvollständig ist

**Soll-Zustand:**
- ✅ **Echtzeit-Coverage-Anzeige**
  - "3 von 6 MA zugewiesen (50%)" - Badge ROT
  - "6 von 6 MA zugewiesen (100%)" - Badge GRÜN
- ✅ **Warnungen bei unvollständiger Coverage**
  - Objekt-Detail: Warnbox "Zu wenig Personal zugewiesen!"
  - Objekt-Liste: Warnsymbol bei <80% Coverage
- ✅ **Breakdown nach Rollen**
  - Objektleiter: 1/1 ✅
  - Schichtleiter: 1/2 ⚠️
  - Mitarbeiter: 1/3 ❌

**Technisch:**
```typescript
interface CoverageStats {
  required: number;
  assigned: number;
  coverage: number; // Percentage 0-100
  breakdown: {
    role: string;
    required: number;
    assigned: number;
  }[];
  status: 'OK' | 'WARNING' | 'CRITICAL'; // >80%, 50-80%, <50%
}
```

**Endpoints:**
- `GET /api/sites/:id/coverage` - Gibt Coverage-Stats zurück
- Backend berechnet aus: `requiredStaff` vs. `assignments.length`

---

### 2. **Qualifikations-Abgleich fehlt** 🔴 HIGH

**Problem:**
- Zugewiesene MA haben nicht die geforderten Qualifikationen
- Kein Abgleich zwischen `user.qualifications[]` und `site.requiredQualifications[]`
- Keine Warnungen

**Soll-Zustand:**
- ✅ **Automatischer Abgleich bei Zuweisung**
  - Frontend prüft Qualifikationen BEVOR Zuweisung
  - Warnung: "Thomas Müller fehlt: §34a GewO"
- ✅ **Ausnahmen möglich mit Hinweis**
  - "Trotzdem zuweisen" Button
  - Notiz: "Ausnahme: In Ausbildung, wird nachgeholt"
- ✅ **Übersicht in Objekt-Detail**
  - ✅ Lisa Manager: §34a GewO, Erste Hilfe, Management
  - ⚠️ Julia Becker: Erste Hilfe (fehlt: §34a GewO)
  - ❌ Thomas Müller: Keine Qualifikationen

**Technisch:**
```typescript
interface QualificationCheck {
  user: User;
  required: string[];
  has: string[];
  missing: string[];
  status: 'FULL' | 'PARTIAL' | 'NONE';
  allowOverride: boolean;
}
```

**UI:**
- Zuweisungs-Modal: Qualifikations-Badge (grün/gelb/rot)
- User-Select: Filtern nach "Hat Qualifikationen"

---

### 3. **Clearances-Konzept unklar** 🟡 MEDIUM

**Problem:**
- User versteht nicht was "Clearances (11) MA" bedeutet
- Clearances = Einarbeitungsstand, aber nicht erklärt
- Unterschied zu Assignments unklar

**Soll-Zustand:**
- ✅ **Klarere Benennung**
  - "Clearances" → "Einarbeitung"
  - Tab-Name: "Einarbeitung (11 MA)"
- ✅ **Erklärung in UI**
  - Tooltip: "Einarbeitungsstand der Mitarbeiter für dieses Objekt"
  - 3 Status: TRAINING (gelb), ACTIVE (grün), REVOKED (rot)
- ✅ **Automatische Clearance-Erstellung**
  - Bei Assignment → Auto-Create Clearance mit Status TRAINING
  - Nach 2 Wochen → Reminder "Training abschließen?"
- ✅ **Clearance in Replacement-Scoring**
  - MA mit Clearance ACTIVE = Score Bonus (+20%)
  - MA mit TRAINING = Score Neutral
  - MA ohne Clearance = Score Malus (-20%)

**UI-Verbesserungen:**
- Clearance-Badge mit Fortschritts-Balken
- "Einarbeitung starten" Button bei neuer Zuweisung

---

### 4. **Schichten-Generierung fehlt** 🔴 CRITICAL

**Problem:**
- Schichten-Tab ist leer
- Sicherheitskonzept definiert "3-Schicht 24/7" (168h/Woche)
- Keine automatische Schicht-Erstellung

**Soll-Zustand:**
- ✅ **Automatische Schicht-Generierung aus Sicherheitskonzept**
  - Template "24/7 Objektschutz" → Generiert 21 Schichten (7 Tage × 3 Schichten)
  - Frühschicht: 06:00-14:00 (Mo-So)
  - Spätschicht: 14:00-22:00 (Mo-So)
  - Nachtschicht: 22:00-06:00 (Mo-So)

- ✅ **Schicht-Templates**
  - Schichtmodell "3-SHIFT" → 3 Schichten à 8h
  - Schichtmodell "2-SHIFT" → 2 Schichten à 12h
  - Schichtmodell "SINGLE_SHIFT" → 1 Schicht (z.B. 08:00-18:00)

- ✅ **Wizard-Integration**
  - Schritt 3 (Sicherheitskonzept): Schichtzeiten definieren
  - Schritt 8 (Zusammenfassung): "Schichten werden automatisch erstellt"
  - Bei Objekt-Erstellung: Schichten in DB anlegen

- ✅ **Personalplanung pro Schicht**
  - 6 MA gefordert → Verteilen auf Schichten
  - Frühschicht: 2 MA
  - Spätschicht: 2 MA
  - Nachtschicht: 2 MA

**Technisch:**
```typescript
interface ShiftTemplate {
  shiftModel: '3-SHIFT' | '2-SHIFT' | 'SINGLE_SHIFT';
  shifts: {
    name: string;
    startTime: string; // "06:00"
    endTime: string;   // "14:00"
    requiredStaff: number;
    days: number[]; // [1,2,3,4,5,6,7] = Mo-So
  }[];
}

function generateShifts(site: Site, startDate: Date) {
  const template = getShiftTemplate(site.securityConcept.shiftModel);
  const shifts = [];

  for (let day = 0; day < 30; day++) { // 30 Tage voraus
    for (const shiftDef of template.shifts) {
      shifts.push({
        siteId: site.id,
        title: `${site.name} - ${shiftDef.name}`,
        startTime: addDays(startDate, day) + shiftDef.startTime,
        endTime: addDays(startDate, day) + shiftDef.endTime,
        requiredEmployees: shiftDef.requiredStaff,
        status: 'PLANNED',
      });
    }
  }

  return shifts;
}
```

---

### 5. **Kontrollgänge-Generierung fehlt** 🟡 MEDIUM

**Problem:**
- Kontrollgänge-Tab leer
- Sicherheitskonzept hat Task "PATROLS"
- Keine Vorschläge für Kontrollpunkte

**Soll-Zustand:**
- ✅ **Automatische Kontrollpunkt-Vorschläge**
  - Wenn Task "PATROLS" → Vorschlagen: "Rundgang Außen", "Rundgang Etagen"
  - Wenn Task "ACCESS_CONTROL" → Vorschlagen: "Haupteingang", "Nebeneingang"
  - Wenn Gebäudetyp "OFFICE" + 12 Etagen → Vorschlagen: 12 Kontrollpunkte

- ✅ **Wizard-Integration**
  - Schritt 5 (Kontrollgänge): Vorgeschlagene Punkte anzeigen
  - "Automatisch generieren" Button
  - Manuell hinzufügen/entfernen möglich

- ✅ **NFC-Tag-Generierung**
  - Auto-Generate UUID für jeden Kontrollpunkt
  - QR-Code direkt generieren
  - Print-Funktion für Tags

**Vorschläge basierend auf:**
- `buildingType` (OFFICE, RETAIL, INDUSTRIAL, etc.)
- `floorCount` (Etagen)
- `securityConcept.tasks[]` (ACCESS_CONTROL, PATROLS, etc.)

---

### 6. **Positionen/Rollen/Aufgaben unklar** 🟡 MEDIUM

**Problem:**
- Welche Positionen gibt es?
- Was sind deren Aufgaben?
- Wer besetzt sie?

**Soll-Zustand:**
- ✅ **Positions-Übersicht in Objekt-Detail**
  - Tab "Personal" → Breakdown nach Rollen:
    - **Objektleiter** (1/1): Lisa Manager
      - Aufgaben: Koordination, Kundenkontakt, Schichtplanung
    - **Schichtleiter** (1/2): Julia Becker
      - Aufgaben: Schichtführung, Briefing, Kontrolle
    - **Mitarbeiter** (1/3): Thomas Müller
      - Aufgaben: Patrols, Access Control, Incident Reporting

- ✅ **Aufgaben-Zuordnung**
  - Sicherheitskonzept-Tasks werden Rollen zugeordnet
  - "ACCESS_CONTROL" → Objektleiter + Mitarbeiter
  - "PATROLS" → Mitarbeiter
  - "KEY_MANAGEMENT" → Objektleiter

---

### 7. **Intelligente MA-Zuweisung fehlt** 🔴 CRITICAL

**Problem:**
- "Neuen MA zuweisen" → Fenster zeigt keine MA
- Keine Vorschläge basierend auf:
  - Qualifikationen
  - Clearances
  - Verfügbarkeit
  - Einarbeitungsstand

**Soll-Zustand:**
- ✅ **Smart-Assignment-Modal**
  - **Suche funktioniert** (aktuell broken!)
  - **Filter:**
    - "Hat Qualifikationen" (§34a GewO, Erste Hilfe)
    - "Hat Clearance für Objekt" (ACTIVE/TRAINING)
    - "Verfügbar" (keine Schicht zur Zeit)
  - **Sortierung nach Score:**
    - 100%: Alle Qualifikationen + Clearance ACTIVE
    - 80%: Alle Qualifikationen + Clearance TRAINING
    - 60%: Teilweise Qualifikationen + keine Clearance
    - <40%: Keine Qualifikationen

- ✅ **MA-Karten mit Details:**
  ```
  [Avatar] Thomas Müller
  ✅ §34a GewO, Erste Hilfe
  ⚠️ Einarbeitung: In Training (50%)
  📅 Verfügbar: Mo-Fr 8-16 Uhr
  💼 Score: 85%
  ```

- ✅ **Einarbeitung-Workflow:**
  - Bei Zuweisung ohne Clearance: "Einarbeitung starten?"
  - Geschätzte Dauer: 2 Wochen
  - Auto-Reminder nach 2 Wochen

---

## 🏗️ Implementierungs-Plan

### Phase 1: Coverage & Validierung (2-3 Tage) 🔴 CRITICAL
1. Coverage-Stats Backend (`/api/sites/:id/coverage`)
2. Coverage-Anzeige Frontend (Badges, Warnungen)
3. Qualifikations-Abgleich bei Zuweisung
4. Warnung bei unvollständiger Coverage

### Phase 2: Schicht-Generierung (3-4 Tage) 🔴 CRITICAL
1. Shift-Template-System (3-SHIFT, 2-SHIFT, etc.)
2. `generateShifts()` Funktion
3. Wizard-Integration (Schritt 8)
4. Schichten-Tab Anzeige

### Phase 3: Intelligente MA-Zuweisung (2-3 Tage) 🔴 CRITICAL
1. Smart-Assignment-Modal Fix (Suche funktioniert!)
2. Score-Berechnung (Quali + Clearance + Verfügbarkeit)
3. Filter & Sortierung
4. Einarbeitung-Workflow

### Phase 4: Kontrollgänge-Vorschläge (2 Tage) 🟡 MEDIUM
1. Kontrollpunkt-Vorschläge-Generator
2. Wizard-Integration
3. Auto-NFC-Tag-Generierung

### Phase 5: UX-Verbesserungen (1-2 Tage) 🟡 MEDIUM
1. Clearances umbenennen → "Einarbeitung"
2. Tooltips & Erklärungen
3. Positions-Übersicht
4. Aufgaben-Zuordnung

---

## 🎯 Prioritäten (Vorschlag)

### **MUSS HABEN (v1.17.0):**
1. Coverage-Validierung & Warnungen
2. Schicht-Generierung aus Sicherheitskonzept
3. Intelligente MA-Zuweisung (Fix + Smart-Suggestions)

### **SOLLTE HABEN (v1.17.1):**
4. Qualifikations-Abgleich mit Warnungen
5. Kontrollgänge-Vorschläge

### **NETT ZU HABEN (v1.17.2):**
6. Clearances UX-Verbesserungen
7. Positionen/Aufgaben-Übersicht

---

## 📊 Geschätzter Aufwand

- **Phase 1 (Coverage):** 2-3 Tage
- **Phase 2 (Schichten):** 3-4 Tage
- **Phase 3 (Smart-Assignment):** 2-3 Tage
- **Phase 4 (Kontrollgänge):** 2 Tage
- **Phase 5 (UX):** 1-2 Tage

**Gesamt:** 10-14 Tage (2-3 Wochen)

---

## 🚀 Nächste Schritte

1. **User-Feedback:** Prioritäten klären
2. **Phase 1 starten:** Coverage-Validierung implementieren
3. **Iterativ ausbauen:** Nach Feedback anpassen

---

**Erstellt:** 2025-10-25
**Status:** Konzept - Wartet auf User-Freigabe
