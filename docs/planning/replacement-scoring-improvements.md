# Replacement-Scoring Verbesserungen

> **Status:** Geplant (nicht jetzt implementieren)
> **Ziel:** Scoring-System präziser, transparenter und nutzerfreundlicher machen

---

## 🎯 Ziele

1. **Visualisierung verbessern** → Farbkodierung intuitiv (niedrig = grün)
2. **Tie-Breaker einführen** → Bei gleichem Score MA mit mehr Ruhe bevorzugen
3. **Vorschau-Berechnung** → Auslastung NACH Zuweisung anzeigen
4. **Ruhezeit genauer** → Exakte Stunden statt "24h" wenn >24h
5. **Scoring transparenter** → Nutzer versteht warum MA X besser ist als MA Y

---

## 🔴 Identifizierte Probleme

### 1. Visualisierung verwirrend
**Problem:**
- 5% Auslastung wird ROT angezeigt
- Nutzer denkt: "Rot = schlecht"
- Tatsächlich: Niedrige Auslastung = GUT für Zuweisung

**Lösung:**
```typescript
// Frontend: Farblogik umkehren für Auslastung
function getUtilizationColor(percent: number): string {
  if (percent < 30) return 'green';      // Wenig ausgelastet → GUT
  if (percent < 70) return 'yellow';     // Normal → OK
  if (percent < 90) return 'orange';     // Hoch → VORSICHT
  return 'red';                          // Überlastet → SCHLECHT
}
```

### 2. Ruhezeit ungenau
**Problem:**
- UI zeigt immer "24h", auch wenn MA 36h frei hatte
- Verlust von wichtiger Information

**Lösung:**
```typescript
// Exakte Ruhezeit zurückgeben
interface CandidateResponse {
  // ...
  restHours: number;        // z.B. 36.5
  restHoursFormatted: string; // "36h 30m"
}
```

### 3. Vorschau fehlt
**Problem:**
- Nutzer sieht nur: "Auslastung: 5%"
- Weiß nicht: Wie hoch wird Auslastung NACH Zuweisung?

**Lösung:**
```typescript
interface CandidateResponse {
  workload: {
    current: number;           // 5%
    afterAssignment: number;   // 15% (5% + 10% durch neue Schicht)
    targetUtilization: number; // 70-90% optimal
  };
}
```

**UI-Darstellung:**
```
Auslastung: 5% → 15% ✅
          (nach Zuweisung)
```

### 4. Tie-Breaker fehlt
**Problem:**
- MA1: 70% Auslastung, 36h Ruhe → Score 85
- MA2: 70% Auslastung, 24h Ruhe → Score 85
- System kann nicht unterscheiden

**Lösung:**
```typescript
// In calculateComplianceScore oder separater Tie-Breaker
export function calculateTieBreaker(
  restHours: number,
  consecutiveRestDays: number
): number {
  // Bonus für mehr als Minimum-Ruhe
  let bonus = 0;
  if (restHours > 24) {
    bonus += Math.min((restHours - 24) / 24, 0.5); // Max +0.5 pro 24h extra
  }
  if (consecutiveRestDays > 1) {
    bonus += consecutiveRestDays * 0.1; // +0.1 pro Ruhetag
  }
  return bonus;
}

// In calculateTotalScore:
const tieBreaker = calculateTieBreaker(restHours, restDays);
return baseScore + tieBreaker;
```

### 5. Auslastungs-Definition unklar
**Problem:**
- Nutzer weiß nicht: Wann ist ein MA 100% ausgelastet?
- Ist 160h = 100%? 200h = 100%?

**Lösung:**
- `targetMonthlyHours` pro MA **individuell** (aus `EmployeePreferences`)
- **Abhängig vom Vertrag:**
  - Vollzeit: 160h/Monat (Standard)
  - Teilzeit (50%): 80h/Monat
  - Minijob (520€): ~40-50h/Monat
  - Custom: Vom MA/Chef eingetragen
- Berechnung: `currentHours / targetMonthlyHours * 100`

**Dokumentation im UI:**
```
Auslastung: 80h / 160h = 50%
Optimal: 70-90% (112-144h)
Vertrag: Vollzeit (160h/Monat)
```

**⚠️ WICHTIG: Datenqualität**
- Werte müssen korrekt eingetragen sein (MA oder Chef)
- Ohne korrekte `targetMonthlyHours` → Scoring falsch!
- Siehe: "Dateneingabe-Anforderungen" unten

---

## 🔧 Dateneingabe-Anforderungen (KRITISCH!)

**Damit das Scoring korrekt funktioniert, müssen folgende Daten gepflegt werden:**

### Pro Mitarbeiter (EmployeePreferences)
Diese Werte **MÜSSEN** vom MA selbst oder vom Chef/Manager eingetragen werden:

| Feld | Pflicht? | Standard | Beispiele |
|------|----------|----------|-----------|
| `targetMonthlyHours` | ✅ JA | 160h | Vollzeit: 160h, Teilzeit 50%: 80h, Minijob: 45h |
| `minMonthlyHours` | ✅ JA | 120h | 75% von target |
| `maxMonthlyHours` | ✅ JA | 200h | 125% von target (Überstunden-Limit) |
| `prefersNightShifts` | ⚠️ Empfohlen | false | MA-spezifisch |
| `prefersDayShifts` | ⚠️ Empfohlen | true | MA-spezifisch |
| `prefersWeekends` | ⚠️ Empfohlen | false | MA-spezifisch |
| `prefersLongShifts` | ⚠️ Empfohlen | false | 10h+ Schichten |
| `prefersShortShifts` | ⚠️ Empfohlen | false | 6h- Schichten |
| `preferredSiteIds` | Optional | [] | Objekte die MA bevorzugt |
| `avoidedSiteIds` | Optional | [] | Objekte die MA meiden will |

**Vertragstypen → targetMonthlyHours Mapping:**
```typescript
// Beispiel-Werte (müssen an reale Verträge angepasst werden)
const TARGET_HOURS = {
  FULL_TIME: 160,      // 40h/Woche × 4 Wochen
  PART_TIME_75: 120,   // 30h/Woche × 4 Wochen
  PART_TIME_50: 80,    // 20h/Woche × 4 Wochen
  MINI_JOB: 45,        // 520€/Monat ÷ ~11.50€/h
  CUSTOM: null,        // Manuell vom Chef eingetragen
};
```

### Pro Objekt/Site
**Später (wenn Objekt-Management kommt):**
- Qualifikations-Anforderungen
- Bevorzugte MA für dieses Objekt
- Mindest-Einarbeitungszeit

### Datenqualitäts-Checks
**Empfohlene Validierungen beim Speichern:**
```typescript
// Beispiel-Validierung
if (maxMonthlyHours < minMonthlyHours) {
  throw new Error('maxMonthlyHours muss >= minMonthlyHours sein');
}
if (targetMonthlyHours < 1 || targetMonthlyHours > 300) {
  throw new Error('targetMonthlyHours unrealistisch (1-300h)');
}
```

**⚠️ Folgen bei fehlenden/falschen Daten:**
- Scoring ist ungenau oder komplett falsch
- MA werden unfair bevorzugt/benachteiligt
- Compliance-Verstöße (Überstunden) werden nicht erkannt

**TODO für später:**
- [ ] UI für MA: "Meine Präferenzen bearbeiten" (bereits implementiert?)
- [ ] UI für Chef: "MA-Präferenzen überprüfen/anpassen"
- [ ] Onboarding-Wizard: Neue MA → Präferenzen beim Anlegen erfassen
- [ ] Validierung: Warnung wenn `targetMonthlyHours` nicht gesetzt
- [ ] Bulk-Import: CSV mit Vertragsdaten → Präferenzen befüllen

---

## 🧪 Test-Szenarien für Scoring-Verbesserungen

### Szenario 1: Gleiche Auslastung, unterschiedliche Ruhezeit
```
MA1: Thomas Müller
  - Auslastung: 120h / 160h = 75%
  - Ruhezeit: 36h
  - Score (alt): 85
  - Score (neu): 85.5 (Tie-Breaker +0.5)

MA2: Sarah Weber
  - Auslastung: 120h / 160h = 75%
  - Ruhezeit: 24h
  - Score (alt): 85
  - Score (neu): 85.0

Ergebnis: MA1 wird bevorzugt ✅
```

### Szenario 2: Präferenzen fließen korrekt ein
```
Schicht: Nachtschicht 22:00-06:00 (8h)

MA1: Präferiert Nachtschichten
  - Preference Score: 100

MA2: Präferiert KEINE Nachtschichten
  - Preference Score: 70 (-30 Malus)

Ergebnis: MA1 wird bevorzugt ✅
```

### Szenario 3: Schichtlängen-Präferenz
```
Schicht: 12h-Dienst

MA1: prefersLongShifts = true
  - Preference Score: 100

MA2: prefersLongShifts = false
  - Preference Score: 90 (-10 Malus)

Ergebnis: MA1 wird bevorzugt ✅
```

### Szenario 4: Auslastungs-Farbe korrekt
```
MA1: 5% → GRÜN (wenig ausgelastet, gut!)
MA2: 50% → GELB (normal)
MA3: 80% → ORANGE (hoch, aber ok)
MA4: 95% → ROT (fast Limit)
```

---

## 📊 Gewichtung überprüfen

**Aktuell:**
```typescript
const WEIGHTS = {
  workload: 0.1,      // 10% - Sehr niedrig!
  compliance: 0.4,    // 40% - Höchste Priorität
  fairness: 0.2,      // 20%
  preference: 0.3,    // 30%
};
```

**Frage:** Sollte Workload-Gewicht höher sein?
- Aktuell nur 10% → MA mit 5% und 95% Auslastung fast gleich bewertet
- Vorschlag: 20% Workload, 30% Compliance?

**Diskussion später klären!**

---

## 🚀 Implementierungs-Reihenfolge (Vorschlag)

### Phase 1: Backend - Daten ergänzen
- [ ] REST-API: `restHours` exakt zurückgeben (nicht nur ">=24h")
- [ ] REST-API: `workload.afterAssignment` berechnen
- [ ] Tie-Breaker-Logik implementieren

### Phase 2: Frontend - UX verbessern
- [ ] Farbkodierung umkehren (niedrig = grün)
- [ ] Auslastung: "5% → 15%" anzeigen
- [ ] Ruhezeit: "36h 30m" statt "24h"
- [ ] Tooltip: Warum dieser Score? (Breakdown zeigen)

### Phase 3: Tests & Validierung
- [ ] Unit-Tests: Tie-Breaker-Szenarien
- [ ] Integration-Tests: Echte DB-Daten mit verschiedenen Präferenzen
- [ ] UI-Test: Farbkodierung korrekt?

### Phase 4: Dokumentation
- [ ] README: Scoring-System erklären
- [ ] API-Docs: Response-Felder dokumentieren
- [ ] User-Guide: "Wie interpretiere ich Scores?"

---

## 💡 Weitere Ideen (Nice-to-Have)

1. **Scoring-Breakdown im UI:**
   ```
   Gesamt: 86 Punkte
   ├─ Compliance: 40/40 ✅ (Ruhezeit ok, Stunden ok)
   ├─ Präferenzen: 30/30 ✅ (Mag Nachtschichten)
   ├─ Fairness: 18/20 ⚠️ (Schon 2 Ersätze mehr als Ø)
   └─ Auslastung: 8/10 ⚠️ (Etwas niedrig)
   ```

2. **Filter: "Nur MA mit Score >80 zeigen"**

3. **Sorting-Optionen:**
   - Nach Gesamtscore (default)
   - Nach Ruhezeit
   - Nach Präferenz-Match

4. **Prediction:**
   - "MA hat 80% Chance, diese Schicht anzunehmen" (basierend auf Historie)

---

## 📚 Betroffene Dateien

### Backend
- `backend/src/services/replacementScoreUtils.ts` - Scoring-Logik
- `backend/src/services/intelligentReplacementService.ts` - API-Response
- `backend/src/controllers/shiftController.ts` - Endpunkt

### Frontend
- `frontend/src/features/absences/hooks/useReplacementCandidates.ts` - API-Call
- `frontend/src/features/absences/components/ReplacementCandidateCard.tsx` - UI
- `frontend/src/utils/scoringHelpers.ts` - Farb-Logik (neu?)

### Tests
- `backend/src/services/__tests__/replacementScoreUtils.test.ts` (neu)
- `backend/src/services/__tests__/replacementService.v2.test.ts` (erweitern)

---

## 🔗 Referenzen

- Aktuelle Scoring-Logik: `backend/src/services/replacementScoreUtils.ts`
- Präferenzen-Modell: `backend/prisma/schema.prisma` (EmployeePreferences)
- Workload-Modell: `backend/prisma/schema.prisma` (EmployeeWorkload)
- TODO: `docs/TODO.md` (P1: Replacement Observability)

---

**Nächster Schritt:** Wenn du bereit bist, sage Bescheid → Ich erstelle einen UNIFIED DIFF für Phase 1! 🚀
