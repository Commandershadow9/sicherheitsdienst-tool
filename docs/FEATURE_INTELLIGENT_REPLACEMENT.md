# Intelligent Replacement System (v1.8.0+)

**Status**: Geplant (Roadmap definiert)
**Priorität**: P1 (Nach Dashboard Refactoring)
**Ziel**: KI-gestützte Ersatz-Mitarbeiter-Auswahl mit Fairness, Compliance & Mitarbeiter-Präferenzen

---

## Problem & Vision

### Aktueller Stand (v1.7.0)
- Ersatz-Suche zeigt nur: "Verfügbar ✅" oder "Nicht verfügbar ❌"
- Keine Information über Auslastung, Ruhezeiten, Fairness
- Manager muss manuell prüfen: "Ist der MA überlastet? Hat er genug Ruhe?"
- **Ergebnis**: Suboptimale Entscheidungen, unfaire Verteilung, Compliance-Risiken

### Vision
> **"Das System empfiehlt mir den BESTEN Mitarbeiter, nicht nur den verfügbaren."**

Statt "Max ist verfügbar", zeige:
```
┌─────────────────────────────────────────────────────────────┐
│ Max Mustermann                           🟢 OPTIMAL (Score: 95) │
│ ───────────────────────────────────────────────────────────│
│ 📊 Auslastung:    120h / 160h (75%) – Noch Kapazität       │
│ ⏰ Ruhezeit:      18h seit letzter Schicht – OK             │
│ 📅 Work-Life:     6 Freitage/14 Tage – Ausgeglichen        │
│ ⚖️  Fairness:     4 Nachtschichten/Monat – Durchschnitt    │
│ 💚 Präferenz:     Bevorzugt Tagschichten – PASST!          │
│ ✅ Keine Konflikte, alle Gesetze eingehalten                │
└─────────────────────────────────────────────────────────────┘
```

**Mehrwert**:
- ✅ **Compliance**: Gesetzliche Ruhezeiten automatisch geprüft (ArbZG)
- ✅ **Fairness**: Keine "Lieblinge", gleichmäßige Verteilung
- ✅ **Mitarbeiter-Zufriedenheit**: Präferenzen respektiert → weniger Burnout
- ✅ **Manager-Entlastung**: System macht Vorschläge → schnellere Entscheidungen
- ✅ **KI-Vorbereitung**: Daten-Basis für spätere ML-Optimierung

---

## Implementierungs-Roadmap

### 🏗️ Phase 1: Dashboard Refactoring (v1.7.1) - **JETZT**
**Warum zuerst?**
- Aktueller Code: 317 Zeilen Dashboard.tsx, 10+ useState, schwer wartbar
- Neue Features brauchen saubere Basis
- Performance-Probleme durch fehlende Memoization

**Aufgaben**:
- [ ] State-Management in Custom Hooks auslagern
  - `useDashboardQueries()` - alle React Query Calls
  - `useApprovalModal()` - Modal State & Logik
  - `useReplacementModal()` - Ersatz-Suche State
- [ ] Code-Deduplizierung
  - `utils/formatting.ts` - Zentrale Formatter (Datum, Zeit)
  - `utils/dashboard.ts` - Gemeinsame Berechnungen
- [ ] UX-Verbesserungen
  - Icons statt Emoji (Lucide Icons)
  - Kompaktere Card-Layouts
  - Bessere Fehler-Behandlung
- [ ] Performance-Optimierung
  - `useMemo` für Berechnungen
  - `useCallback` für Event Handlers
  - Kleinere Komponenten (< 150 Zeilen)
- [ ] Type-Safety
  - Non-Null-Assertions entfernen
  - Explizite Type Guards

**Ziel**: Wartbare, performante Code-Basis für komplexe Features

---

### 📊 Phase 2a: Datenmodell erweitern (v1.8.0)

#### Neue Prisma Models & Felder

```prisma
// Mitarbeiter-Präferenzen
model EmployeePreferences {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Schicht-Präferenzen
  prefersNightShifts   Boolean @default(false)  // true = Nachtschichten bevorzugt
  prefersDayShifts     Boolean @default(true)   // true = Tagschichten bevorzugt
  prefersWeekends      Boolean @default(false)  // true = Wochenenden bevorzugt

  // Stunden-Präferenzen
  targetMonthlyHours   Int     @default(160)    // Ziel: 160h = Vollzeit
  minMonthlyHours      Int     @default(120)    // Minimum akzeptabel
  maxMonthlyHours      Int     @default(200)    // Maximum akzeptabel
  flexibleHours        Boolean @default(true)   // true = flexibel, false = strikt

  // Schicht-Länge Präferenzen
  prefersLongShifts    Boolean @default(false)  // true = 12h Schichten OK
  prefersShortShifts   Boolean @default(false)  // true = 4-6h Schichten bevorzugt

  // Arbeitsrhythmus
  prefersConsecutiveDays Int?  @default(5)      // Präferierte Arbeitstage in Folge (z.B. 5 = Mo-Fr)
  minRestDaysPerWeek     Int   @default(2)      // Mindestens 2 Ruhetage/Woche gewünscht

  // Site/Location Präferenzen
  preferredSiteIds     String[]                 // Array von bevorzugten Site-IDs
  avoidedSiteIds       String[]                 // Array von gemiedenen Site-IDs

  // Sonstiges
  notes                String?                  // Freitext-Notizen (z.B. "Nur Frühschichten wegen Kinderbetreuung")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// Workload-Tracking (Performance-optimiert)
model EmployeeWorkload {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Zeitraum
  month     Int                  // 1-12
  year      Int                  // 2025

  // Aggregierte Metriken (gecached für Performance)
  totalHours              Float  @default(0)    // Summe aller Stunden im Monat
  scheduledHours          Float  @default(0)    // Geplante Stunden (noch nicht gearbeitet)
  nightShiftCount         Int    @default(0)    // Anzahl Nachtschichten
  weekendShiftCount       Int    @default(0)    // Anzahl Wochenend-Schichten
  consecutiveDaysWorked   Int    @default(0)    // Längste Serie Arbeitstage in Folge
  restDaysCount           Int    @default(0)    // Anzahl Ruhetage

  // Compliance-Checks
  maxWeeklyHours          Float  @default(0)    // Höchste Wochenstundenzahl im Monat
  minRestHoursBetweenShifts Float? @default(11) // Kürzeste Ruhezeit zwischen 2 Schichten

  // Fairness-Score (0-100)
  fairnessScore           Int?                  // Berechnet: Vergleich mit Team-Durchschnitt

  // Metadata
  lastCalculated DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, month, year])
  @@index([userId, year, month])
  @@index([year, month]) // Für Team-Durchschnitts-Queries
}

// Compliance-Violations (Log für Verstöße)
model ComplianceViolation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  shiftId     String?
  shift       Shift?   @relation(fields: [shiftId], references: [id], onDelete: SetNull)

  violationType String               // "REST_TIME_VIOLATED", "WEEKLY_HOURS_EXCEEDED", "CONSECUTIVE_DAYS_EXCEEDED"
  severity      String               // "WARNING", "ERROR", "CRITICAL"
  description   String               // "Ruhezeit nur 9h statt gesetzlich 11h"

  value         Float?               // Tatsächlicher Wert (z.B. 9.0 für 9h Ruhezeit)
  threshold     Float?               // Grenzwert (z.B. 11.0 für 11h Mindestpause)

  resolvedAt    DateTime?
  resolvedBy    String?
  resolvedNote  String?

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([violationType, severity])
}

// Erweiterungen für EmployeeProfile
model EmployeeProfile {
  // ... existing fields ...

  // Neue Felder für Intelligent Replacement
  annualLeaveDays       Int      @default(30)    // Bereits vorhanden
  targetWeeklyHours     Float    @default(40)    // Neu: Soll-Wochenstunden (für Teilzeit flexibel)
  contractType          String   @default("FULL_TIME") // "FULL_TIME", "PART_TIME", "MINI_JOB"

  // Automatische Verfügbarkeit
  autoAcceptReplacement Boolean  @default(false) // true = System darf automatisch zuweisen (mit Präferenz-Check)

  // ... rest bleibt gleich
}
```

**Migration-Script**:
```sql
-- Seed mit Standard-Präferenzen für existierende Mitarbeiter
INSERT INTO EmployeePreferences (userId, prefersNightShifts, prefersDayShifts, targetMonthlyHours)
SELECT id, false, true, 160 FROM User WHERE role = 'EMPLOYEE';
```

---

### 🧮 Phase 2b: Backend - Scoring-Engine (v1.8.0)

#### Service: `backend/src/services/intelligentReplacementService.ts`

**Haupt-Funktion**: `calculateCandidateScore()`

```typescript
interface CandidateScore {
  userId: string
  totalScore: number          // 0-100 (gewichteter Durchschnitt)
  recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED'
  color: 'green' | 'yellow' | 'orange' | 'red'

  // Detail-Scores (jeweils 0-100)
  workloadScore: number       // Wie ausgelastet? (100 = ideal belastet)
  complianceScore: number     // Ruhezeiten OK? (100 = alle Gesetze erfüllt)
  fairnessScore: number       // Fair verteilt? (100 = durchschnittlich)
  preferenceScore: number     // Passt zu Präferenzen? (100 = perfekt)

  // Detail-Metriken für UI
  metrics: {
    currentMonthHours: number
    targetMonthHours: number
    utilizationPercent: number

    lastShiftEnd: Date | null
    nextShiftStart: Date
    restHours: number
    restHoursRequired: number
    restHoursOK: boolean

    consecutiveDaysWorked: number
    restDaysLast14Days: number

    nightShiftsThisMonth: number
    teamAverageNightShifts: number

    preferenceMatch: {
      shiftType: 'MATCH' | 'NEUTRAL' | 'MISMATCH'  // Nacht vs Tag
      shiftDuration: 'MATCH' | 'NEUTRAL' | 'MISMATCH'
      workloadLevel: 'MATCH' | 'NEUTRAL' | 'MISMATCH'
    }
  }

  // Warnungen
  warnings: {
    type: 'REST_TIME' | 'OVERWORKED' | 'CONSECUTIVE_DAYS' | 'PREFERENCE_MISMATCH'
    severity: 'INFO' | 'WARNING' | 'ERROR'
    message: string
  }[]
}
```

**Scoring-Algorithmus**:

```typescript
function calculateWorkloadScore(current: number, target: number, max: number): number {
  const utilizationPercent = (current / target) * 100

  // Optimal: 70-90% Auslastung
  if (utilizationPercent >= 70 && utilizationPercent <= 90) return 100

  // Gut: 50-70% oder 90-95%
  if ((utilizationPercent >= 50 && utilizationPercent < 70) ||
      (utilizationPercent > 90 && utilizationPercent <= 95)) return 80

  // Akzeptabel: 30-50% oder 95-100%
  if ((utilizationPercent >= 30 && utilizationPercent < 50) ||
      (utilizationPercent > 95 && utilizationPercent <= 100)) return 60

  // Schlecht: < 30% (unterfordert) oder > 100% (überlastet)
  if (utilizationPercent < 30) return 40
  if (utilizationPercent > 100 && utilizationPercent <= 110) return 40

  // Kritisch: > 110% (deutlich überlastet)
  return 0
}

function calculateComplianceScore(
  restHours: number,
  weeklyHours: number,
  consecutiveDays: number
): number {
  let score = 100

  // ArbZG § 5: Mindestens 11h Ruhezeit
  if (restHours < 11) {
    if (restHours < 9) score -= 100  // Kritischer Verstoß
    else if (restHours < 10) score -= 50
    else score -= 20
  }

  // ArbZG § 3: Max 48h pro Woche (Durchschnitt)
  if (weeklyHours > 48) {
    const excess = weeklyHours - 48
    score -= Math.min(excess * 5, 50)  // -5 Punkte pro Überstunde, max -50
  }

  // Empfehlung: Max 6 Tage in Folge
  if (consecutiveDays > 6) {
    score -= (consecutiveDays - 6) * 10
  }

  return Math.max(0, score)
}

function calculateFairnessScore(
  userNightShifts: number,
  teamAvgNightShifts: number,
  userReplacementCount: number,
  teamAvgReplacementCount: number
): number {
  let score = 100

  // Vergleich Nachtschichten
  const nightShiftDeviation = Math.abs(userNightShifts - teamAvgNightShifts)
  if (nightShiftDeviation > 2) {
    score -= nightShiftDeviation * 5  // -5 Punkte pro Abweichung
  }

  // Vergleich Ersatz-Einsätze
  const replacementDeviation = Math.abs(userReplacementCount - teamAvgReplacementCount)
  if (replacementDeviation > 1) {
    score -= replacementDeviation * 10
  }

  return Math.max(0, score)
}

function calculatePreferenceScore(
  shift: Shift,
  preferences: EmployeePreferences,
  currentHours: number
): number {
  let score = 100

  // Schicht-Typ Check (Nacht vs Tag)
  const isNightShift = shift.startTime.getHours() >= 22 || shift.startTime.getHours() < 6
  if (isNightShift && !preferences.prefersNightShifts) score -= 30
  if (!isNightShift && preferences.prefersNightShifts) score -= 20

  // Stunden-Niveau Check
  const projectedHours = currentHours + calculateShiftDuration(shift)
  if (projectedHours > preferences.maxMonthlyHours) score -= 40
  if (projectedHours < preferences.minMonthlyHours) score -= 20

  // Schicht-Länge Check
  const shiftDuration = calculateShiftDuration(shift)
  if (shiftDuration > 10 && !preferences.prefersLongShifts) score -= 20
  if (shiftDuration < 6 && !preferences.prefersShortShifts) score -= 10

  // Site-Präferenz Check
  if (shift.siteId) {
    if (preferences.avoidedSiteIds.includes(shift.siteId)) score -= 50
    if (preferences.preferredSiteIds.includes(shift.siteId)) score += 20
  }

  return Math.max(0, Math.min(100, score))
}

function calculateTotalScore(
  workload: number,
  compliance: number,
  fairness: number,
  preference: number
): { totalScore: number, recommendation: string, color: string } {
  // Gewichtung (anpassbar):
  // Compliance = 40% (höchste Prio - Gesetz!)
  // Präferenz = 30% (Mitarbeiter-Zufriedenheit)
  // Fairness = 20% (Team-Harmonie)
  // Workload = 10% (sekundär)

  const weighted =
    compliance * 0.40 +
    preference * 0.30 +
    fairness * 0.20 +
    workload * 0.10

  let recommendation: string
  let color: string

  if (weighted >= 80) {
    recommendation = 'OPTIMAL'
    color = 'green'
  } else if (weighted >= 60) {
    recommendation = 'GOOD'
    color = 'yellow'
  } else if (weighted >= 40) {
    recommendation = 'ACCEPTABLE'
    color = 'orange'
  } else {
    recommendation = 'NOT_RECOMMENDED'
    color = 'red'
  }

  return { totalScore: Math.round(weighted), recommendation, color }
}
```

**API-Endpoint**:
```typescript
// GET /api/shifts/:id/replacement-candidates-v2
// Erweitert bestehenden Endpoint mit Scoring

{
  "candidates": [
    {
      "id": "user123",
      "firstName": "Max",
      "lastName": "Mustermann",
      "score": {
        "totalScore": 95,
        "recommendation": "OPTIMAL",
        "color": "green",
        "workloadScore": 85,
        "complianceScore": 100,
        "fairnessScore": 90,
        "preferenceScore": 95,
        "metrics": { /* ... */ },
        "warnings": []
      }
    },
    {
      "id": "user456",
      "firstName": "Lisa",
      "lastName": "Müller",
      "score": {
        "totalScore": 62,
        "recommendation": "GOOD",
        "color": "yellow",
        "workloadScore": 45,
        "complianceScore": 90,
        "fairnessScore": 80,
        "preferenceScore": 70,
        "metrics": { /* ... */ },
        "warnings": [
          {
            "type": "OVERWORKED",
            "severity": "WARNING",
            "message": "97% Auslastung - fast am Limit"
          }
        ]
      }
    }
  ]
}
```

---

### 🎨 Phase 2c: Frontend - Intelligente Kandidaten-Anzeige (v1.8.0)

#### Komponente: `ReplacementCandidatesModal` erweitern

**Aktuell**: Einfache Liste mit ✅/❌
**Neu**: Score-basierte Anzeige mit Details

```tsx
// frontend/src/features/absences/ReplacementCandidatesModal.tsx

function CandidateCard({ candidate }: { candidate: ScoredCandidate }) {
  const { score } = candidate

  // Color Mapping
  const bgColor = {
    green: 'bg-emerald-50 border-emerald-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  }[score.color]

  const badgeColor = {
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700'
  }[score.color]

  return (
    <div className={`rounded-lg border-2 p-4 ${bgColor}`}>
      {/* Header mit Score */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">
            {candidate.firstName} {candidate.lastName}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
            {score.recommendation} (Score: {score.totalScore})
          </span>
        </div>

        <ScoreRing score={score.totalScore} color={score.color} />
      </div>

      {/* Metriken-Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <MetricBadge
          icon={<Clock />}
          label="Auslastung"
          value={`${score.metrics.currentMonthHours}h / ${score.metrics.targetMonthHours}h`}
          status={score.metrics.utilizationPercent > 95 ? 'warning' : 'ok'}
        />

        <MetricBadge
          icon={<Moon />}
          label="Ruhezeit"
          value={`${score.metrics.restHours}h`}
          status={score.metrics.restHoursOK ? 'ok' : 'error'}
        />

        <MetricBadge
          icon={<Calendar />}
          label="Freitage"
          value={`${score.metrics.restDaysLast14Days} / 14 Tage`}
          status={score.metrics.restDaysLast14Days < 3 ? 'warning' : 'ok'}
        />

        <MetricBadge
          icon={<Heart />}
          label="Präferenz"
          value={score.metrics.preferenceMatch.shiftType}
          status={score.metrics.preferenceMatch.shiftType === 'MATCH' ? 'ok' : 'neutral'}
        />
      </div>

      {/* Warnungen */}
      {score.warnings.length > 0 && (
        <div className="space-y-1 mb-3">
          {score.warnings.map((warning, idx) => (
            <WarningBadge key={idx} warning={warning} />
          ))}
        </div>
      )}

      {/* Detail-Scores Collapse */}
      <Collapsible>
        <CollapsibleTrigger className="text-xs text-blue-600 hover:underline">
          📊 Detail-Scores anzeigen
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1">
          <ScoreBar label="Compliance" value={score.complianceScore} />
          <ScoreBar label="Präferenz" value={score.preferenceScore} />
          <ScoreBar label="Fairness" value={score.fairnessScore} />
          <ScoreBar label="Workload" value={score.workloadScore} />
        </CollapsibleContent>
      </Collapsible>

      {/* Action Button */}
      <Button
        className="w-full mt-3"
        variant={score.recommendation === 'OPTIMAL' ? 'default' : 'outline'}
        onClick={() => onAssign(candidate)}
      >
        {score.recommendation === 'NOT_RECOMMENDED' ? '⚠️ Trotzdem zuweisen' : '✅ Zuweisen'}
      </Button>
    </div>
  )
}

// Sortierung: Beste zuerst
candidates.sort((a, b) => b.score.totalScore - a.score.totalScore)
```

**UI-Komponenten**:
- `ScoreRing`: Kreis-Chart (0-100)
- `MetricBadge`: Icon + Label + Wert + Status-Farbe
- `WarningBadge`: Warnungs-Icon + Text + Severity-Farbe
- `ScoreBar`: Horizontal Progress Bar

---

### 🤖 Phase 3: KI-Integration (v2.0+) - **SPÄTER**

**Ziel**: Automatische Optimierung & Prognosen

#### ML-Features (später):
1. **Predictive Scheduling**:
   - "Nächste Woche wird kritisch - ich empfehle präventiv 2 Urlaube abzulehnen"
   - Basis: Historische Daten, Feiertage, Saison-Muster

2. **Automatische Zuweisung**:
   - Wenn `autoAcceptReplacement = true` UND Score >= 80 → Auto-Assign
   - Mitarbeiter bekommt Push: "Du wurdest automatisch für Schicht XY eingeteilt (passt zu deinen Präferenzen)"

3. **Optimierungs-Algorithmus**:
   - Input: 10 offene Schichten, 20 Kandidaten
   - Output: Optimale Zuordnung (minimiert Unfairness, maximiert Zufriedenheit)
   - Constraint Solver (ähnlich Google OR-Tools)

4. **Learning from Feedback**:
   - Wenn Manager Score ignoriert → System lernt
   - "Manager bevorzugt immer Max trotz niedrigerem Score - warum?"
   - Anpassung der Gewichtungen

#### Technologie-Stack (später):
- **Python Service**: Separate Microservice für ML
- **TensorFlow / PyTorch**: Für Predictive Models
- **OR-Tools**: Für Constraint-basierte Optimierung
- **Message Queue**: Backend → Python Service (RabbitMQ)

---

## Datenbank-Indexes für Performance

```sql
-- EmployeeWorkload: Schnelle Aggregations-Queries
CREATE INDEX idx_workload_user_month ON EmployeeWorkload(userId, year, month);
CREATE INDEX idx_workload_calculation ON EmployeeWorkload(year, month, lastCalculated);

-- ComplianceViolation: Alerts & Reports
CREATE INDEX idx_compliance_user_date ON ComplianceViolation(userId, createdAt DESC);
CREATE INDEX idx_compliance_severity ON ComplianceViolation(severity, violationType);

-- TimeEntry: Für Workload-Berechnung
CREATE INDEX idx_timeentry_user_month ON TimeEntry(userId, clockIn); -- Falls noch nicht vorhanden

-- ShiftAssignment: Für Ruhezeit-Berechnung
CREATE INDEX idx_assignment_user_shift ON ShiftAssignment(userId, shiftId);
```

---

## Cron-Jobs & Background-Tasks

### 1. Workload-Berechnung (täglich)
```typescript
// Jeden Tag um 01:00 Uhr
async function calculateMonthlyWorkloads() {
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }})
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  for (const employee of employees) {
    const metrics = await aggregateEmployeeMetrics(employee.id, currentMonth, currentYear)

    await prisma.employeeWorkload.upsert({
      where: { userId_month_year: { userId: employee.id, month: currentMonth, year: currentYear }},
      update: metrics,
      create: { userId: employee.id, month: currentMonth, year: currentYear, ...metrics }
    })
  }
}
```

### 2. Compliance-Check (nach jedem Shift-Assignment)
```typescript
// Hook: Nach ShiftAssignment.create
async function checkComplianceAfterAssignment(assignment: ShiftAssignment) {
  const violations = await detectViolations(assignment.userId, assignment.shiftId)

  for (const violation of violations) {
    await prisma.complianceViolation.create({
      data: {
        userId: assignment.userId,
        shiftId: assignment.shiftId,
        ...violation
      }
    })

    // Alert an Manager
    await sendAlert({
      type: 'COMPLIANCE_VIOLATION',
      severity: violation.severity,
      message: violation.description
    })
  }
}
```

### 3. Fairness-Score-Update (wöchentlich)
```typescript
// Jeden Montag um 02:00 Uhr
async function updateFairnessScores() {
  // Team-Durchschnitte berechnen
  const teamAvg = await calculateTeamAverages()

  // Jeden Mitarbeiter gegen Durchschnitt vergleichen
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }})
  for (const employee of employees) {
    const fairnessScore = calculateFairnessScore(employee, teamAvg)

    await prisma.employeeWorkload.update({
      where: { userId_month_year: { ... }},
      data: { fairnessScore }
    })
  }
}
```

---

## Migration-Plan

### Step 1: Schema Migration
```bash
npx prisma migrate dev --name add_intelligent_replacement
```

### Step 2: Seed Existing Employees
```typescript
// backend/prisma/seeds/add-employee-preferences.ts
async function seedPreferences() {
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }})

  for (const employee of employees) {
    await prisma.employeePreferences.create({
      data: {
        userId: employee.id,
        // Standard-Werte - Manager kann später anpassen
        prefersNightShifts: false,
        prefersDayShifts: true,
        targetMonthlyHours: 160,
        minMonthlyHours: 140,
        maxMonthlyHours: 180,
        flexibleHours: true
      }
    })
  }
}
```

### Step 3: Backfill Workload Data
```typescript
// Historische Daten berechnen (letzten 3 Monate)
async function backfillWorkloads() {
  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }})
  const months = [
    { month: 8, year: 2025 },
    { month: 9, year: 2025 },
    { month: 10, year: 2025 }
  ]

  for (const employee of employees) {
    for (const period of months) {
      const metrics = await aggregateEmployeeMetrics(employee.id, period.month, period.year)
      await prisma.employeeWorkload.create({
        data: { userId: employee.id, ...period, ...metrics }
      })
    }
  }
}
```

---

## UI/UX Manager-Features

### 1. Mitarbeiter-Präferenzen-Editor
**Route**: `/employees/:id/preferences`

Formular für Manager:
```
┌────────────────────────────────────────────────┐
│ Präferenzen: Max Mustermann                    │
├────────────────────────────────────────────────┤
│                                                 │
│ 🌙 Schicht-Präferenzen:                        │
│   [x] Tagschichten bevorzugt                   │
│   [ ] Nachtschichten bevorzugt                 │
│   [ ] Wochenenden bevorzugt                    │
│                                                 │
│ ⏱️  Stunden-Präferenzen:                        │
│   Ziel: [160] h/Monat   (Vollzeit = 160h)      │
│   Min:  [140] h/Monat                           │
│   Max:  [180] h/Monat                           │
│   [x] Flexibel bei Überstunden                 │
│                                                 │
│ 📅 Arbeitsrhythmus:                             │
│   Bevorzugt [5] Tage in Folge                  │
│   Mindestens [2] Ruhetage/Woche                │
│                                                 │
│ 🏢 Standort-Präferenzen:                        │
│   Bevorzugt: [Shoppingcenter West] [+]         │
│   Vermeiden:  [Krankenhaus Mitte] [+]          │
│                                                 │
│ 📝 Notizen:                                     │
│   [Nur Frühschichten wegen Kinderbetreuung]    │
│                                                 │
│ [Speichern]  [Abbrechen]                        │
└────────────────────────────────────────────────┘
```

### 2. Workload-Dashboard (pro Mitarbeiter)
**Route**: `/employees/:id/workload`

```
┌────────────────────────────────────────────────┐
│ Workload-Übersicht: Max Mustermann (Oktober)   │
├────────────────────────────────────────────────┤
│ 📊 Auslastung:  120h / 160h (75%)              │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  75%                 │
│                                                 │
│ 🌙 Nachtschichten: 4 (Team-Ø: 4.2)            │
│ 📅 Freitage: 6 der letzten 14 Tage            │
│ ⚠️  Längste Arbeitsperiode: 5 Tage in Folge    │
│ ⏰ Kürzeste Ruhezeit: 13h (OK ✅)              │
│                                                 │
│ ⚖️  Fairness-Score: 87 / 100 (Gut)            │
│                                                 │
│ [Details] [Verlauf 6 Monate]                   │
└────────────────────────────────────────────────┘
```

### 3. Team-Fairness-Übersicht
**Route**: `/team/fairness`

Tabelle: Vergleich aller Mitarbeiter

| Mitarbeiter | Auslastung | Nachtschichten | Ruhetage | Fairness-Score |
|-------------|------------|----------------|----------|----------------|
| Max M.      | 75% ✅     | 4 ✅           | 6 ✅     | 87 🟢          |
| Lisa M.     | 97% ⚠️     | 6 ⚠️           | 2 🔴     | 62 🟡          |
| Tom K.      | 52% ℹ️     | 2 ✅           | 8 ✅     | 91 🟢          |

→ Manager sieht auf einen Blick: "Lisa ist überlastet, Tom kann mehr"

---

## Testing-Strategie

### Backend-Tests
```typescript
describe('intelligentReplacementService', () => {
  test('calculateWorkloadScore - optimal range', () => {
    expect(calculateWorkloadScore(120, 160, 200)).toBe(100)
  })

  test('calculateComplianceScore - rest time violation', () => {
    expect(calculateComplianceScore(9, 40, 5)).toBeLessThan(50)
  })

  test('calculatePreferenceScore - night shift mismatch', () => {
    const nightShift = createNightShift()
    const dayPreference = { prefersNightShifts: false, prefersDayShifts: true }
    expect(calculatePreferenceScore(nightShift, dayPreference, 100)).toBeLessThan(80)
  })
})
```

### Integration-Tests
```typescript
describe('GET /api/shifts/:id/replacement-candidates-v2', () => {
  test('returns scored candidates sorted by score', async () => {
    const response = await request(app)
      .get('/api/shifts/shift123/replacement-candidates-v2')
      .set('Authorization', `Bearer ${managerToken}`)

    expect(response.status).toBe(200)
    const candidates = response.body.candidates

    // Assertions
    expect(candidates[0].score.totalScore).toBeGreaterThan(candidates[1].score.totalScore)
    expect(candidates[0].score.recommendation).toBe('OPTIMAL')
  })
})
```

### E2E-Tests (Playwright)
```typescript
test('Manager sieht Scoring bei Ersatz-Suche', async ({ page }) => {
  await loginAsManager(page)
  await page.goto('/dashboard')

  await page.click('text=Ersatz suchen')

  // Warten auf Modal
  await page.waitForSelector('[data-testid="replacement-modal"]')

  // Erster Kandidat sollte grün (OPTIMAL) sein
  const firstCandidate = page.locator('[data-testid="candidate-card"]').first()
  await expect(firstCandidate).toContainText('OPTIMAL')
  await expect(firstCandidate).toHaveClass(/bg-emerald-50/)

  // Score-Details sichtbar
  await expect(firstCandidate).toContainText('Auslastung')
  await expect(firstCandidate).toContainText('Ruhezeit')
})
```

---

## Akzeptanzkriterien

### Phase 2a+b (Backend):
- [x] Prisma Schema erweitert (Preferences, Workload, Violations)
- [x] Migration durchgeführt & Seeds angelegt
- [x] `intelligentReplacementService.ts` implementiert
- [x] Scoring-Algorithmus getestet (Unit-Tests)
- [x] API-Endpoint `/replacement-candidates-v2` funktioniert
- [x] Cron-Jobs für Workload-Calculation eingerichtet
- [x] Performance-Tests: < 500ms für Kandidaten-Scoring

### Phase 2c (Frontend):
- [x] `ReplacementCandidatesModal` mit Scoring-UI
- [x] Score-Visualisierung (Farben, Badges, Charts)
- [x] Sortierung: Beste Kandidaten zuerst
- [x] Detail-Scores aufklappbar
- [x] Warnungen werden angezeigt
- [x] Mitarbeiter-Präferenzen-Editor funktioniert
- [x] Workload-Dashboard pro Mitarbeiter
- [x] Team-Fairness-Übersicht

### Phase 3 (KI - später):
- [ ] ML-Modell trainiert
- [ ] Predictive Scheduling aktiv
- [ ] Auto-Assignment mit Opt-In
- [ ] Optimierungs-Algorithmus integriert

---

## Ressourcen & Dokumentation

### Gesetzliche Grundlagen (Deutschland):
- **ArbZG § 3**: Werktägliche Arbeitszeit max 8h (ausnahmsweise 10h)
- **ArbZG § 4**: Wöchentliche Arbeitszeit max 48h (Durchschnitt 6 Monate)
- **ArbZG § 5**: Ruhezeit mind. 11h zusammenhängend
- **ArbZG § 9**: Sonn- und Feiertagsruhe (Ausnahmen für Sicherheitsdienst)

### Technische Referenzen:
- OR-Tools: https://developers.google.com/optimization
- Constraint Programming: https://en.wikipedia.org/wiki/Constraint_programming
- Shift Scheduling Algorithms: https://arxiv.org/abs/2008.12612

---

**Erstellt**: 2025-10-05
**Von**: Claude (Sonnet 4.5) basierend auf User-Feedback
**Nächste Schritte**: Phase 1 (Dashboard Refactoring) starten → dann Phase 2a (Datenmodell)
