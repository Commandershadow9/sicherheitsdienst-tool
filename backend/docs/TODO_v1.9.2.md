# TODO v1.9.2 - Bug Fixes & Improvements

**Ziel-Release**: v1.9.2
**Geplant für**: KW 41/2025
**Status**: Planning

Siehe [BUGS_v1.9.1.md](./BUGS_v1.9.1.md) für detaillierte Bug-Beschreibungen.

---

## 🔴 Phase 1 - Critical Bug Fixes (Priorität: CRITICAL/HIGH)

### ✅ BUG-005: Genehmigte/Beantragte Abwesenheiten nicht berücksichtigt [CRITICAL]

**Geschätzter Aufwand**: 3-4h

#### Backend Tasks:
    - [x] `replacementService.ts` - APPROVED Absences filtern
  ```typescript
  // Location: findReplacementCandidatesForShiftV2()
  const approvedAbsentUserIds = new Set(
    absences.filter(a => a.status === 'APPROVED').map(a => a.userId)
  )
  ```

    - [x] `replacementService.ts` - REQUESTED Absences laden
  ```typescript
  const requestedAbsences = await prisma.absence.findMany({
    where: {
      status: 'REQUESTED',
      startsAt: { lt: shift.endTime },
      endsAt: { gt: shift.startTime },
    },
    select: { userId: true, startsAt: true, endsAt: true, type: true }
  })
  ```

    - [x] `intelligentReplacementService.ts` - Warning für REQUESTED Absence hinzufügen
  ```typescript
  if (hasPendingAbsenceRequest) {
    warnings.push({
      type: 'PENDING_ABSENCE_REQUEST',
      severity: 'WARNING',
      message: `⚠️ Urlaubsantrag offen: ${formatPeriod(absence.startsAt, absence.endsAt)}`
    })
  }
  ```

    - [x] Types erweitern
  ```typescript
  // CandidateScore.warnings.type erweitern:
  type: 'REST_TIME' | 'OVERWORKED' | 'CONSECUTIVE_DAYS' | 'PREFERENCE_MISMATCH' | 'PENDING_ABSENCE_REQUEST'
  ```

#### Frontend Tasks:
    - [x] `types.ts` - Warning Type erweitern
    - [x] `ReplacementCandidatesModalV2.tsx` - PENDING_ABSENCE_REQUEST Warning anzeigen
  ```tsx
  {warning.type === 'PENDING_ABSENCE_REQUEST' && (
    <WarningBadge
      severity="warning"
      icon={Calendar}
      message={warning.message}
    />
  )}
  ```

#### Testing:
    - [x] Test: MA mit APPROVED Urlaub erscheint NICHT in Liste
    - [x] Test: MA mit APPROVED Krankmeldung erscheint NICHT in Liste
    - [x] Test: MA mit REQUESTED Urlaub erscheint MIT Warning
    - [x] Test: Warning zeigt korrektes Datum
    - [x] Test: Multiple overlapping absences

**Fertig wenn**: Ersatz-Kandidaten mit genehmigten Abwesenheiten werden komplett ausgeschlossen, beantrage Abwesenheiten zeigen prominente Warnung.

---

### ✅ BUG-001: Score-Berechnung nicht live/interaktiv [HIGH]

**Geschätzter Aufwand**: 4-6h

#### Analyse:
Problem: `employee_workloads` Tabelle wird nicht nach jeder Schicht-Zuweisung aktualisiert.

**Option A** - Workload nach Assignment aktualisieren:
```typescript
// Location: shiftController.assignUserToShift()
await updateEmployeeWorkload(userId, shift.startTime)
```

**Option B** - Live-Berechnung aus Assignments (bevorzugt):
```typescript
// Location: intelligentReplacementService.calculateCandidateScore()
// Statt employee_workloads zu laden:
const currentMonthShifts = await prisma.shiftAssignment.findMany({
  where: {
    userId,
    shift: {
      startTime: { gte: monthStart, lt: monthEnd }
    },
    status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED', 'COMPLETED'] }
  },
  include: { shift: true }
})

const totalHours = currentMonthShifts.reduce((sum, a) => {
  const duration = (a.shift.endTime - a.shift.startTime) / (1000 * 60 * 60)
  return sum + duration
}, 0)
```

#### Tasks:
- [ ] `intelligentReplacementService.ts` - Workload live aus Assignments berechnen
- [ ] `intelligentReplacementService.ts` - Nachtschichten live zählen
- [ ] `intelligentReplacementService.ts` - Consecutive Days live berechnen
- [ ] Performance testen (N+1 Queries vermeiden)
- [ ] Optional: employee_workloads als Cache beibehalten, aber nach Assignment invalidieren

#### Testing:
- [ ] Test: MA A wird Schicht 1 zugewiesen
- [ ] Test: Bei Schicht 2 Ersatzsuche hat MA A jetzt 1 Einsatz mehr
- [ ] Test: Score von MA A sinkt entsprechend
- [ ] Test: Auslastung % steigt korrekt
- [ ] Test: Mehrere Zuweisungen hintereinander

**Fertig wenn**: Nach jeder Schicht-Zuweisung reflektiert der Score die neue Auslastung sofort.

---

## 🟡 Phase 2 - UX Improvements (Priorität: MEDIUM)

### ✅ BUG-004: Dashboard aktualisiert nicht automatisch [MEDIUM]

**Geschätzter Aufwand**: 1h

#### Tasks:
- [ ] `AbsenceDetailModal.tsx` - QueryClient importieren
  ```typescript
  import { useQueryClient } from '@tanstack/react-query'
  const queryClient = useQueryClient()
  ```

- [ ] `AbsenceDetailModal.tsx` - onAssignSuccess erweitern
  ```typescript
  onAssignSuccess={() => {
    queryClient.invalidateQueries(['dashboard-stats'])
    queryClient.invalidateQueries(['critical-shifts'])
    queryClient.invalidateQueries(['upcoming-warnings'])
    refreshAbsenceData()
    toast.success('Ersatz zugewiesen - Dashboard wird aktualisiert')
  }}
  ```

- [ ] Alternative: Global Event System
  ```typescript
  // Event Bus für Dashboard-Updates
  eventBus.emit('shift:assigned', { shiftId, userId })
  ```

#### Testing:
- [ ] Test: Nach Zuweisung Dashboard-Stats aktualisieren sich
- [ ] Test: Kritische Schichten-Liste aktualisiert sich
- [ ] Test: Warnungen aktualisieren sich
- [ ] Test: Keine unnötigen Refetches

**Fertig wenn**: Nach Ersatz-Zuweisung aktualisiert sich das Dashboard automatisch ohne manuellen Reload.

---

### ✅ BUG-002: Urlaubsanspruch wird nicht korrekt berechnet [MEDIUM]

**Geschätzter Aufwand**: 2-3h

#### Analyse:
```typescript
// Aktuell (falsch):
remainingDays: 30 - 0 = 30 ❌
remainingAfterApproval: 30 - 5 = 25

// Korrekt:
takenDays: APPROVED absences (days)
requestedDays: REQUESTED absences (days)
remainingDays: 30 - takenDays - requestedDays
```

#### Tasks:
- [ ] `absenceController.ts` - calculateLeaveDaysSaldo() fixen
  ```typescript
  const takenDays = await prisma.absence.aggregate({
    where: { userId, type: 'VACATION', status: 'APPROVED' },
    _sum: { /* days calculation */ }
  })

  const requestedDays = await prisma.absence.aggregate({
    where: { userId, type: 'VACATION', status: 'REQUESTED' },
    _sum: { /* days calculation */ }
  })

  return {
    annualLeaveDays: 30,
    takenDays: takenDays._sum || 0,
    requestedDays: requestedDays._sum || 0,
    remainingDays: 30 - (takenDays._sum || 0),
    remainingAfterApproval: 30 - (takenDays._sum || 0) - (requestedDays._sum || 0)
  }
  ```

- [ ] Helper-Funktion: Tage zwischen zwei Daten berechnen
  ```typescript
  function calculateDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  ```

#### Testing:
- [ ] Test: 30 Tage Anspruch, 3 genommen → 27 verfügbar
- [ ] Test: 30 Tage Anspruch, 3 genommen, 5 beantragt → 27 verfügbar, 22 nach Genehmigung
- [ ] Test: Nach Genehmigung aktualisiert sich Saldo
- [ ] Test: Nach Ablehnung bleibt Saldo gleich

**Fertig wenn**: Urlaubsanspruch zeigt korrekte Zahlen und aktualisiert sich nach Genehmigung/Ablehnung.

---

## 🟢 Phase 3 - Polish (Priorität: LOW)

### ✅ BUG-003: Schichtenliste bei Ersatzsuche zu lang [LOW]

**Geschätzter Aufwand**: 1-2h

#### Design-Entscheidung:
**Option C** (Minimal): Nur Anzahl + Zeitraum anzeigen

```tsx
// Vorher:
{affectedShifts.map(shift => (
  <div key={shift.id}>{shift.title}</div>
))}

// Nachher:
<div className="rounded bg-muted p-3">
  <div className="flex items-center gap-2">
    <AlertTriangle className="h-4 w-4 text-warning" />
    <span className="font-medium">
      {affectedShifts.length} Schichten betroffen
    </span>
  </div>
  <div className="text-sm text-muted-foreground mt-1">
    {formatPeriod(absence.startsAt, absence.endsAt)}
  </div>
</div>
```

#### Tasks:
- [ ] `AbsenceDetailModal.tsx` - Betroffene Schichten Sektion vereinfachen
- [ ] Optional: "Details anzeigen" Collapse für vollständige Liste
- [ ] Styling anpassen

#### Testing:
- [ ] Test: 1 Schicht → "1 Schicht betroffen"
- [ ] Test: 16 Schichten → "16 Schichten betroffen"
- [ ] Test: Zeitraum wird korrekt angezeigt
- [ ] Test: Optional Collapse funktioniert

**Fertig wenn**: Kompakte Anzeige mit Anzahl und Zeitraum, optional aufklappbar für Details.

---

## 📋 Release Checklist v1.9.2

### Pre-Release:
- [ ] Alle Tests grün (Backend + Frontend)
- [ ] Migration erstellt und getestet
- [ ] Seed Scripts aktualisiert
- [ ] Dokumentation vollständig
- [ ] CHANGELOG.md aktualisiert

### Testing:
- [ ] BUG-005 Tests (Absences)
- [ ] BUG-001 Tests (Score Live)
- [ ] BUG-004 Tests (Auto-Refresh)
- [ ] BUG-002 Tests (Urlaubsanspruch)
- [ ] BUG-003 Tests (Schichtenliste)
- [ ] Regressions-Tests (alle v1.8.0 Features)

### Deployment:
- [ ] Docker Images bauen
- [ ] Database Migration ausführen
- [ ] Backup erstellen
- [ ] Deployment auf Production
- [ ] Smoke Tests auf Production

### Post-Release:
- [ ] Release Notes veröffentlichen
- [ ] Discord Notification senden
- [ ] GitHub Release erstellen
- [ ] Dokumentation auf Wiki aktualisieren

---

## 🎯 Success Metrics

**v1.9.2 ist erfolgreich wenn**:

1. ✅ MA mit genehmigten Abwesenheiten erscheinen NICHT mehr in Ersatzlisten
2. ✅ MA mit beantragten Abwesenheiten zeigen prominente Warnung
3. ✅ Score-Berechnung reflektiert Echtzeit-Zuweisungen (keine verzögerten Updates)
4. ✅ Dashboard aktualisiert sich automatisch nach Ersatz-Zuweisung
5. ✅ Urlaubsanspruch zeigt korrekte verfügbare Tage
6. ✅ Betroffene Schichten kompakt und informativ dargestellt

**Keine neuen Bugs eingeführt** ✅

---

## 📝 Notes

### Performance Considerations:
- **BUG-001**: Live-Berechnung aus Assignments könnte N+1 Queries verursachen
  - Lösung: `include` statt separate Queries
  - Monitoring: Response-Zeit für Ersatz-Kandidaten < 500ms

### Breaking Changes:
- Keine Breaking Changes geplant
- API-Responses bleiben kompatibel

### Migration Strategy:
- `employee_workloads` bleibt bestehen (für Reports/Analytics)
- Aber: Score-Berechnung nutzt live Assignments

---

**Erstellt**: 2025-10-07
**Letzte Aktualisierung**: 2025-10-07
**Status**: Planning → In Progress (nach Approval)
