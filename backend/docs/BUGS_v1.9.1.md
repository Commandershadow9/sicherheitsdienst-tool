# Bugs & Feature Requests v1.9.1

**Datum**: 2025-10-07
**Gefunden während**: Dashboard & Intelligent Replacement Testing

---

## 🐛 BUG-001: Score-Berechnung nicht live/interaktiv

### Problem
Wenn ein Ersatz-MA (z.B. MA A) zur ersten Schicht zugewiesen wird und man dann die zweite betroffene Schicht bearbeitet, wird MA A immer noch mit **0 Einsätzen** angezeigt, obwohl er gerade zur ersten Schicht zugewiesen wurde.

### Erwartetes Verhalten
- Score-Berechnung muss **alle bereits zugewiesenen Schichten** des Monats berücksichtigen
- Nach jeder Zuweisung muss die Berechnung **automatisch aktualisiert** werden
- Die Berechnung muss **live/interaktiv** sein und den aktuellen Stand der Schicht-Zuweisungen reflektieren

### Betroffene Dateien
- `backend/src/services/intelligentReplacementService.ts` - Workload Calculation
- `backend/src/services/replacementService.ts` - findReplacementCandidatesForShiftV2
- `backend/src/controllers/absenceController.ts` - getReplacementCandidates
- `backend/src/controllers/shiftController.ts` - assignUserToShift

### Lösungsansatz
1. Nach jeder Shift-Assignment die `employee_workloads` Tabelle aktualisieren
2. Alternativ: Bei der Score-Berechnung die tatsächlichen Assignments aus der DB abfragen statt aus `employee_workloads`
3. Cache-Invalidierung nach Assignment-Änderungen

### Priorität
🔴 **HIGH** - Kritisch für korrekte Ersatz-Empfehlungen

---

## 🐛 BUG-002: Urlaubsanspruch wird nicht korrekt berechnet

### Problem
Die Urlaubstage-Anzeige ist nicht korrekt:
- **Angezeigt**: 30 Tage verfügbar
- **Beantragt**: 5 Tage
- **Verbleibend**: 30 Tage ❌ (sollte 25 sein!)

### Erwartetes Verhalten
- Verfügbare Tage = Jahresanspruch - Genommene Tage - Beantragte Tage
- Die Berechnung muss **interaktiv** sein
- Bei Genehmigung/Ablehnung muss sich die Anzeige sofort aktualisieren

### Betroffene Dateien
- `backend/src/controllers/absenceController.ts` - calculateLeaveDaysSaldo
- `frontend/src/features/absences/AbsenceDetailModal.tsx` - Anzeige der Saldo-Daten

### Beispiel
```
Jahresanspruch: 30 Tage
Bereits genommen (APPROVED): 3 Tage
Beantragt (REQUESTED): 5 Tage
---
Verfügbar: 30 - 3 = 27 Tage
Nach Genehmigung: 27 - 5 = 22 Tage
```

### Priorität
🟡 **MEDIUM** - Wichtig für korrekte Urlaubsplanung

---

## 🐛 BUG-003: Schichtenliste bei Ersatzsuche zu lang und nicht informativ

### Problem
Bei der Ersatzsuche werden **alle aktiven Schichten** eines MA aufgelistet:
- Ein MA kann 16-32+ Schichten pro Monat haben
- **Ohne Datum** ist die Liste nicht informativ
- Die Liste ist zu lang und unübersichtlich
- Bei der Ersatzsuche interessiert primär: **Wo muss ich neu besetzen?**

### Erwartetes Verhalten
- **Ersatzsuche-View**: Schichtenliste **entfernen** oder auf betroffene Schichten limitieren
- **MA-Profil**: Vollständige Schichtenliste **mit Datum** anzeigen

### Betroffene Komponenten
```
AbsenceDetailModal.tsx - Betroffene Schichten Sektion
├── Zeigt: shift.title (ohne Datum)
└── Problem: Kann 16-32+ Einträge sein
```

### Lösungsvorschlag
**Option A - Minimal Info:**
```
Betroffene Schichten: 6 Schichten (14.10. - 19.10.2025)
```

**Option B - Kompakte Liste:**
```
14.10. Shopping West - Tagschicht
15.10. Shopping West - Tagschicht
16.10. Shopping West - Tagschicht
... (3 weitere)
```

**Option C - Nur Anzahl:**
```
⚠️ 6 Schichten müssen neu besetzt werden
```

### Priorität
🟢 **LOW** - UX-Verbesserung, nicht kritisch

---

## 🐛 BUG-004: Dashboard aktualisiert nicht automatisch nach Zuweisung

### Problem
Nach der Zuweisung von Ersatz-Mitarbeitern zu allen betroffenen Schichten:
1. User kehrt zum Dashboard zurück
2. Dashboard zeigt **veraltete Daten** (z.B. "3 kritische Schichten")
3. User muss **manuell aktualisieren** (F5 / Reload-Button)

### Erwartetes Verhalten
- Nach erfolgreicher Zuweisung sollte das Dashboard **automatisch** aktualisiert werden
- Alternativ: React Query Cache invalidieren nach Assignment

### Betroffene Dateien
- `frontend/src/features/absences/AbsenceDetailModal.tsx` - onAssignSuccess Callback
- `frontend/src/pages/Dashboard.tsx` - useQuery für Dashboard Stats

### Lösungsansatz
```typescript
// Option A: Cache Invalidation
const queryClient = useQueryClient()

const handleAssignSuccess = () => {
  queryClient.invalidateQueries(['dashboard-stats'])
  queryClient.invalidateQueries(['critical-shifts'])
  toast.success('Ersatz zugewiesen - Dashboard aktualisiert')
}

// Option B: Auto-Refetch
const { data, refetch } = useQuery({
  queryKey: ['dashboard-stats'],
  refetchOnWindowFocus: true, // Auto-refetch on focus
})
```

### Priorität
🟡 **MEDIUM** - UX-Problem, aber Workaround existiert (F5)

---

## 🐛 BUG-005: Genehmigte/Beantragte Abwesenheiten nicht bei Ersatzsuche berücksichtigt

### Problem
**Kritisches Problem für Dienstplanung:**

#### Szenario 1: Genehmigte Abwesenheit
1. MA A ist krank (2 Wochen, APPROVED)
2. Dashboard zeigt: "Objekt B unterbesetzt - MA A fehlt"
3. User weist **MA C** als Ersatz zu (für 14 Schichten)
4. ✅ MA C erscheint als verfügbar
5. ❌ **ABER**: MA C hat bereits genehmigten Urlaub für 3 dieser Tage!

#### Szenario 2: Beantragter Urlaub (noch kritischer!)
1. Morgens: MA A krank gemeldet (2 Wochen)
2. Manager weist MA C als Ersatz zu (3 betroffene Tage)
3. Später: Manager sieht Urlaubsantrag von MA C (für genau diese 3 Tage!)
4. ⚠️ **Dilemma**:
   - Urlaub ablehnen → MA C unzufrieden
   - Urlaub genehmigen → Dienstplan wieder kaputt, neu planen

### Erwartetes Verhalten

#### Genehmigte Abwesenheiten (APPROVED):
```
❌ MA C
   Status: NICHT VERFÜGBAR
   Grund: Genehmigter Urlaub 15.-17.10.2025
   → Darf NICHT als Ersatz-Kandidat erscheinen
```

#### Beantragte Abwesenheiten (REQUESTED):
```
⚠️ MA D
   Score: 85 (OPTIMAL)
   ⚠️ WARNUNG: Hat Urlaub beantragt 16.-18.10.2025 (3 Tage überlappen)
   → Erscheint in Liste, aber mit deutlicher Warnung
```

### Betroffene Dateien
- `backend/src/services/replacementService.ts` - findReplacementCandidatesForShiftV2
  ```typescript
  // Aktuell: Filtert nur APPROVED absences
  const absences = await prisma.absence.findMany({
    where: { status: 'APPROVED', ... }
  })

  // NEU: Auch REQUESTED berücksichtigen
  ```
- `backend/src/services/intelligentReplacementService.ts` - Warnings Array
- `frontend/src/features/absences/ReplacementCandidatesModalV2.tsx` - Warning Anzeige

### Lösungsansatz

#### Backend Changes:
```typescript
// 1. APPROVED Absences → Komplett ausschließen
const approvedAbsences = await prisma.absence.findMany({
  where: { status: 'APPROVED', startsAt: { lt: shiftEnd }, endsAt: { gt: shiftStart } }
})

// 2. REQUESTED Absences → Als Warning hinzufügen
const requestedAbsences = await prisma.absence.findMany({
  where: { status: 'REQUESTED', startsAt: { lt: shiftEnd }, endsAt: { gt: shiftStart } }
})

// 3. Bei Score-Berechnung Warning hinzufügen
if (hasRequestedAbsence) {
  warnings.push({
    type: 'PENDING_ABSENCE_REQUEST',
    severity: 'WARNING',
    message: `Urlaubsantrag offen: ${formatPeriod(absence.startsAt, absence.endsAt)}`
  })
}
```

#### Frontend Warning:
```tsx
<WarningBadge
  type="pending-request"
  severity="warning"
  message="⚠️ Urlaubsantrag offen: 16.-18.10.2025"
/>
```

### Priorität
🔴 **CRITICAL** - Verhindert Planungskonflikte und MA-Unzufriedenheit

---

## 📋 Zusammenfassung

| ID | Titel | Priorität | Status | Geschätzter Aufwand |
|----|-------|-----------|--------|---------------------|
| BUG-001 | Score nicht live/interaktiv | 🔴 HIGH | Open | 4-6h |
| BUG-002 | Urlaubsanspruch falsch | 🟡 MEDIUM | Open | 2-3h |
| BUG-003 | Schichtenliste zu lang | 🟢 LOW | Open | 1-2h |
| BUG-004 | Dashboard nicht auto-refresh | 🟡 MEDIUM | Open | 1h |
| BUG-005 | Abwesenheiten nicht berücksichtigt | 🔴 CRITICAL | Open | 3-4h |

**Gesamt geschätzter Aufwand**: 11-16 Stunden

---

## 🔄 Next Steps

### Phase 1 - Critical Fixes (BUG-001, BUG-005)
1. **BUG-005** zuerst fixen (verhindert Planungskonflikte)
   - Backend: Approved Absences filtern
   - Backend: Requested Absences als Warning
   - Frontend: Warning-Anzeige

2. **BUG-001** (Score-Berechnung)
   - Workload nach Assignment aktualisieren
   - Oder: Live-Berechnung aus Assignments

### Phase 2 - UX Improvements (BUG-002, BUG-004)
3. **BUG-004** (Auto-Refresh)
   - QueryClient Cache Invalidation

4. **BUG-002** (Urlaubsanspruch)
   - Berechnung korrigieren

### Phase 3 - Polish (BUG-003)
5. **BUG-003** (Schichtenliste)
   - Kompakte Darstellung

---

## 📝 Testing Notes

### Test-Szenarien für BUG-005:
```
✅ Test 1: MA mit APPROVED Urlaub erscheint NICHT in Ersatzliste
✅ Test 2: MA mit REQUESTED Urlaub erscheint MIT Warning
✅ Test 3: MA mit APPROVED Krankmeldung erscheint NICHT
✅ Test 4: Warning zeigt korrektes Datum an
✅ Test 5: Multiple overlapping absences werden alle gezeigt
```

### Test-Szenarien für BUG-001:
```
✅ Test 1: MA A wird Schicht 1 zugewiesen
✅ Test 2: Bei Schicht 2 hat MA A jetzt 1 Einsatz (nicht 0)
✅ Test 3: Score von MA A sinkt entsprechend
✅ Test 4: Auslastung % steigt
```

---

**Dokumentiert am**: 2025-10-07 02:20 UTC
**Version**: v1.9.1-dev
**Autor**: Development Team
