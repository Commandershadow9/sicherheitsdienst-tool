# 🚀 Implementation Roadmap: Intelligentes Objekt-Management

> **Start:** 2025-10-25
> **Strategie:** Option A - Alles auf einmal (10-14 Tage)
> **Ziel:** Vollständiges intelligentes Sicherheitskonzept-System

---

## 📊 Übersicht

| Phase | Feature | Dauer | Status |
|-------|---------|-------|--------|
| **1** | Coverage & Validierung | 2-3 Tage | 🟡 In Progress |
| **2** | Schicht-Generierung | 3-4 Tage | ⚪ Pending |
| **3** | Intelligente MA-Zuweisung | 2-3 Tage | ⚪ Pending |
| **4** | Kontrollgänge-Vorschläge | 2 Tage | ⚪ Pending |
| **5** | UX-Verbesserungen | 1-2 Tage | ⚪ Pending |
| **TOTAL** | **Alle Features** | **10-14 Tage** | **0%** |

---

## 🔴 PHASE 1: Coverage & Validierung (Tag 1-3)

### Ziel
Echtzeit-Überwachung der Personalabdeckung mit Warnungen bei Problemen

### Backend-Tasks

#### 1.1 Coverage-Stats Endpoint ✅
**File:** `backend/src/controllers/siteController.ts`

```typescript
// GET /api/sites/:id/coverage
export async function getSiteCoverage(req, res, next) {
  const { id } = req.params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      assignments: { include: { user: true } },
      clearances: true,
    },
  });

  const coverage = calculateCoverage(site);

  res.json({ success: true, data: coverage });
}

function calculateCoverage(site) {
  const required = site.requiredStaff;
  const assigned = site.assignments.length;
  const percentage = (assigned / required) * 100;

  // Breakdown by role
  const breakdown = {
    OBJEKTLEITER: { required: 1, assigned: 0 },
    SCHICHTLEITER: { required: Math.ceil(required * 0.3), assigned: 0 },
    MITARBEITER: { required: required - 1 - Math.ceil(required * 0.3), assigned: 0 },
  };

  site.assignments.forEach(a => {
    breakdown[a.role].assigned++;
  });

  return {
    required,
    assigned,
    percentage,
    status: percentage >= 80 ? 'OK' : percentage >= 50 ? 'WARNING' : 'CRITICAL',
    breakdown: Object.entries(breakdown).map(([role, stats]) => ({
      role,
      ...stats,
      percentage: (stats.assigned / stats.required) * 100,
    })),
  };
}
```

#### 1.2 Qualifikations-Check Endpoint ✅
**File:** `backend/src/controllers/siteController.ts`

```typescript
// GET /api/sites/:id/qualification-check
export async function checkQualifications(req, res, next) {
  const { id } = req.params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: { assignments: { include: { user: true } } },
  });

  const required = site.requiredQualifications || [];
  const checks = site.assignments.map(a => {
    const has = a.user.qualifications || [];
    const missing = required.filter(q => !has.includes(q));

    return {
      userId: a.user.id,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      role: a.role,
      required,
      has,
      missing,
      status: missing.length === 0 ? 'FULL' : has.length > 0 ? 'PARTIAL' : 'NONE',
    };
  });

  res.json({ success: true, data: checks });
}
```

### Frontend-Tasks

#### 1.3 Coverage-Badge Component ✅
**File:** `frontend/src/features/sites/components/CoverageBadge.tsx`

```tsx
interface CoverageBadgeProps {
  coverage: CoverageStats;
}

export function CoverageBadge({ coverage }: CoverageBadgeProps) {
  const color = {
    OK: 'green',
    WARNING: 'yellow',
    CRITICAL: 'red',
  }[coverage.status];

  return (
    <Badge color={color}>
      {coverage.assigned}/{coverage.required} MA ({coverage.percentage.toFixed(0)}%)
    </Badge>
  );
}
```

#### 1.4 Coverage-Warning Component ✅
**File:** `frontend/src/features/sites/components/CoverageWarning.tsx`

```tsx
export function CoverageWarning({ coverage }: { coverage: CoverageStats }) {
  if (coverage.status === 'OK') return null;

  return (
    <Alert severity={coverage.status === 'CRITICAL' ? 'error' : 'warning'}>
      <AlertTitle>Personalabdeckung unvollständig!</AlertTitle>
      <p>
        Es sind nur {coverage.assigned} von {coverage.required} Mitarbeitern zugewiesen.
      </p>
      <ul>
        {coverage.breakdown.map(b => (
          <li key={b.role}>
            {b.role}: {b.assigned}/{b.required}
            {b.assigned < b.required && ' ❌'}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
```

#### 1.5 Qualifikations-Check in Assignment-Modal ✅
**File:** `frontend/src/features/sites/components/AssignmentModal.tsx`

```tsx
function UserSelectWithQualifications({ siteId, requiredQualifications }) {
  const { data: users } = useUsers();

  const enrichedUsers = users.map(user => {
    const has = user.qualifications || [];
    const missing = requiredQualifications.filter(q => !has.includes(q));
    const status = missing.length === 0 ? 'FULL' : has.length > 0 ? 'PARTIAL' : 'NONE';

    return { ...user, qualificationStatus: status, missing };
  });

  return (
    <Select>
      {enrichedUsers.map(user => (
        <Option key={user.id} value={user.id}>
          <div>
            {user.firstName} {user.lastName}
            <QualificationBadge status={user.qualificationStatus} />
            {user.missing.length > 0 && (
              <Tooltip title={`Fehlt: ${user.missing.join(', ')}`}>
                <WarningIcon />
              </Tooltip>
            )}
          </div>
        </Option>
      ))}
    </Select>
  );
}
```

### Deliverables Phase 1
- ✅ Coverage-Stats API funktioniert
- ✅ Qualifikations-Check API funktioniert
- ✅ Objekt-Detail zeigt Coverage-Badge
- ✅ Warnungen bei <80% Coverage
- ✅ Zuweisungs-Modal prüft Qualifikationen
- ✅ Tests geschrieben

---

## 🔴 PHASE 2: Schicht-Generierung (Tag 4-7)

### Ziel
Automatische Schicht-Erstellung aus Sicherheitskonzept

### Backend-Tasks

#### 2.1 Shift-Template-System ✅
**File:** `backend/src/utils/shiftTemplates.ts`

```typescript
export const SHIFT_TEMPLATES = {
  '3-SHIFT': {
    name: '3-Schicht (24/7)',
    shifts: [
      { name: 'Frühschicht', start: '06:00', end: '14:00', staffRatio: 0.33 },
      { name: 'Spätschicht', start: '14:00', end: '22:00', staffRatio: 0.33 },
      { name: 'Nachtschicht', start: '22:00', end: '06:00', staffRatio: 0.34 },
    ],
    days: [1,2,3,4,5,6,7], // Mo-So
  },
  '2-SHIFT': {
    name: '2-Schicht',
    shifts: [
      { name: 'Tagschicht', start: '06:00', end: '18:00', staffRatio: 0.6 },
      { name: 'Nachtschicht', start: '18:00', end: '06:00', staffRatio: 0.4 },
    ],
    days: [1,2,3,4,5,6,7],
  },
  'SINGLE_SHIFT': {
    name: 'Einzelschicht',
    shifts: [
      { name: 'Tagschicht', start: '08:00', end: '18:00', staffRatio: 1.0 },
    ],
    days: [1,2,3,4,5], // Mo-Fr
  },
};
```

#### 2.2 Generate-Shifts Function ✅
**File:** `backend/src/services/shiftGenerator.ts`

```typescript
export async function generateShiftsForSite(siteId: string, startDate: Date, durationDays = 30) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });

  const template = SHIFT_TEMPLATES[site.securityConcept.shiftModel];
  const shifts = [];

  for (let day = 0; day < durationDays; day++) {
    const currentDate = addDays(startDate, day);
    const dayOfWeek = currentDate.getDay() || 7; // 1=Mo, 7=So

    if (!template.days.includes(dayOfWeek)) continue;

    for (const shiftDef of template.shifts) {
      const requiredStaff = Math.ceil(site.requiredStaff * shiftDef.staffRatio);

      shifts.push({
        siteId: site.id,
        title: `${site.name} - ${shiftDef.name}`,
        startTime: parseTime(currentDate, shiftDef.start),
        endTime: parseTime(currentDate, shiftDef.end),
        requiredEmployees: requiredStaff,
        status: 'PLANNED',
      });
    }
  }

  await prisma.shift.createMany({ data: shifts });

  return shifts;
}
```

#### 2.3 API Endpoint ✅
**File:** `backend/src/controllers/siteController.ts`

```typescript
// POST /api/sites/:id/generate-shifts
export async function generateShifts(req, res, next) {
  const { id } = req.params;
  const { startDate, durationDays } = req.body;

  const shifts = await generateShiftsForSite(id, new Date(startDate), durationDays);

  res.json({
    success: true,
    message: `${shifts.length} Schichten erstellt`,
    data: shifts,
  });
}
```

### Frontend-Tasks

#### 2.4 Generate-Shifts Button ✅
**File:** `frontend/src/features/sites/pages/SiteShifts.tsx`

```tsx
function GenerateShiftsButton({ siteId }) {
  const [open, setOpen] = useState(false);
  const generateMutation = useMutation({
    mutationFn: (data) => api.post(`/sites/${siteId}/generate-shifts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts', siteId]);
      toast.success('Schichten erfolgreich generiert!');
      setOpen(false);
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Schichten generieren
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2>Schichten generieren</h2>
        <DatePicker label="Startdatum" onChange={...} />
        <NumberInput label="Anzahl Tage" defaultValue={30} />
        <Button onClick={() => generateMutation.mutate({...})}>
          Generieren
        </Button>
      </Modal>
    </>
  );
}
```

#### 2.5 Wizard-Integration ✅
**File:** `frontend/src/features/wizard/components/steps/SummaryStep.tsx`

```tsx
// In Step 8 (Zusammenfassung)
<Checkbox
  checked={wizardData.autoGenerateShifts}
  onChange={(e) => updateWizardData({ autoGenerateShifts: e.target.checked })}
>
  Schichten automatisch generieren (empfohlen)
</Checkbox>

{wizardData.autoGenerateShifts && (
  <Alert severity="info">
    Es werden {calculateShiftCount(wizardData)} Schichten für die nächsten 30 Tage erstellt.
  </Alert>
)}
```

### Deliverables Phase 2
- ✅ Shift-Templates definiert (3-SHIFT, 2-SHIFT, SINGLE)
- ✅ Generate-Shifts API funktioniert
- ✅ Schichten-Tab zeigt generierte Schichten
- ✅ Wizard erstellt Schichten automatisch
- ✅ Tests geschrieben

---

## 🔴 PHASE 3: Intelligente MA-Zuweisung (Tag 8-10)

### Ziel
Smart-Assignment mit Scoring, Filtern und Empfehlungen

### Backend-Tasks

#### 3.1 Assignment-Score-Berechnung ✅
**File:** `backend/src/services/assignmentScoring.ts`

```typescript
export function calculateAssignmentScore(user: User, site: Site, clearance?: Clearance) {
  let score = 0;
  let breakdown = {};

  // 1. Qualifikationen (40%)
  const requiredQualis = site.requiredQualifications || [];
  const hasQualis = user.qualifications || [];
  const qualiMatch = requiredQualis.filter(q => hasQualis.includes(q)).length;
  const qualiScore = requiredQualis.length > 0 ? (qualiMatch / requiredQualis.length) * 40 : 40;
  score += qualiScore;
  breakdown.qualifications = qualiScore;

  // 2. Clearance (30%)
  let clearanceScore = 0;
  if (clearance?.status === 'ACTIVE') clearanceScore = 30;
  else if (clearance?.status === 'TRAINING') clearanceScore = 15;
  score += clearanceScore;
  breakdown.clearance = clearanceScore;

  // 3. Verfügbarkeit (20%)
  // TODO: Check availability from absences/shifts
  const availabilityScore = 20; // Placeholder
  score += availabilityScore;
  breakdown.availability = availabilityScore;

  // 4. Workload (10%)
  // TODO: Check current workload
  const workloadScore = 10; // Placeholder
  score += workloadScore;
  breakdown.workload = workloadScore;

  return { score, breakdown };
}
```

#### 3.2 Smart-Candidates Endpoint ✅
**File:** `backend/src/controllers/siteController.ts`

```typescript
// GET /api/sites/:id/assignment-candidates
export async function getAssignmentCandidates(req, res, next) {
  const { id } = req.params;
  const { role } = req.query;

  const site = await prisma.site.findUnique({ where: { id } });
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['EMPLOYEE', 'MANAGER'] } },
  });

  const clearances = await prisma.siteClearance.findMany({
    where: { siteId: id },
  });

  const candidates = users.map(user => {
    const clearance = clearances.find(c => c.userId === user.id);
    const scoring = calculateAssignmentScore(user, site, clearance);

    return {
      ...user,
      scoring,
      clearance: clearance?.status || null,
      estimatedTrainingDays: clearance ? 0 : 14,
    };
  });

  // Sort by score DESC
  candidates.sort((a, b) => b.scoring.score - a.scoring.score);

  res.json({ success: true, data: candidates });
}
```

### Frontend-Tasks

#### 3.3 Smart-Assignment-Modal ✅
**File:** `frontend/src/features/sites/components/SmartAssignmentModal.tsx`

```tsx
export function SmartAssignmentModal({ siteId, onClose }) {
  const { data: candidates } = useQuery({
    queryKey: ['assignment-candidates', siteId],
    queryFn: () => api.get(`/sites/${siteId}/assignment-candidates`),
  });

  const [filters, setFilters] = useState({
    hasQualifications: false,
    hasClearance: false,
    minScore: 0,
  });

  const filteredCandidates = candidates?.filter(c => {
    if (filters.hasQualifications && c.scoring.breakdown.qualifications < 40) return false;
    if (filters.hasClearance && !c.clearance) return false;
    if (c.scoring.score < filters.minScore) return false;
    return true;
  });

  return (
    <Modal open onClose={onClose}>
      <h2>Mitarbeiter zuweisen</h2>

      <Filters>
        <Checkbox onChange={(e) => setFilters({...filters, hasQualifications: e.target.checked})}>
          Hat alle Qualifikationen
        </Checkbox>
        <Checkbox onChange={(e) => setFilters({...filters, hasClearance: e.target.checked})}>
          Hat Einarbeitung
        </Checkbox>
        <Slider
          label="Mindest-Score"
          value={filters.minScore}
          onChange={(v) => setFilters({...filters, minScore: v})}
          min={0}
          max={100}
        />
      </Filters>

      <CandidateList>
        {filteredCandidates?.map(candidate => (
          <CandidateCard key={candidate.id} candidate={candidate} siteId={siteId} />
        ))}
      </CandidateList>
    </Modal>
  );
}
```

#### 3.4 Candidate-Card Component ✅
**File:** `frontend/src/features/sites/components/CandidateCard.tsx`

```tsx
function CandidateCard({ candidate, siteId }) {
  const assignMutation = useAssignUser(siteId);

  const scoreColor =
    candidate.scoring.score >= 80 ? 'green' :
    candidate.scoring.score >= 60 ? 'yellow' : 'red';

  return (
    <Card>
      <Avatar src={candidate.avatar} />
      <div>
        <h3>{candidate.firstName} {candidate.lastName}</h3>

        <ScoreBadge color={scoreColor}>
          {candidate.scoring.score.toFixed(0)}% Match
        </ScoreBadge>

        <QualificationsList>
          {candidate.qualifications?.map(q => (
            <Badge key={q} color="blue">{q}</Badge>
          ))}
        </QualificationsList>

        {candidate.clearance ? (
          <Badge color={candidate.clearance === 'ACTIVE' ? 'green' : 'yellow'}>
            Einarbeitung: {candidate.clearance}
          </Badge>
        ) : (
          <Badge color="gray">
            ⚠️ Keine Einarbeitung ({candidate.estimatedTrainingDays} Tage)
          </Badge>
        )}

        <Button onClick={() => assignMutation.mutate({ userId: candidate.id })}>
          Zuweisen
        </Button>
      </div>
    </Card>
  );
}
```

### Deliverables Phase 3
- ✅ Assignment-Scoring funktioniert
- ✅ Smart-Candidates API gibt sortierte Vorschläge
- ✅ Modal zeigt Candidates mit Score
- ✅ Filter funktionieren
- ✅ Einarbeitung-Workflow integriert
- ✅ Tests geschrieben

---

## 🟡 PHASE 4: Kontrollgänge-Vorschläge (Tag 11-12)

### Ziel
Automatische Vorschläge für Kontrollpunkte basierend auf Gebäudetyp und Tasks

### Backend-Tasks

#### 4.1 Control-Point-Suggestions-Generator ✅
**File:** `backend/src/services/controlPointSuggestions.ts`

```typescript
export function generateControlPointSuggestions(site: Site) {
  const suggestions = [];

  // Based on buildingType
  if (site.buildingType === 'OFFICE') {
    suggestions.push(
      { name: 'Haupteingang', description: 'Zutrittskontrolle Haupteingang', order: 1 },
      { name: 'Empfang', description: 'Empfangsbereich', order: 2 },
    );

    // Add floor checkpoints
    for (let i = 1; i <= site.floorCount; i++) {
      suggestions.push({
        name: `Etage ${i}`,
        description: `Kontrollgang Etage ${i}`,
        order: 2 + i,
      });
    }
  }

  if (site.buildingType === 'RETAIL') {
    suggestions.push(
      { name: 'Eingangsbereich', description: 'Haupteingang Überwachung', order: 1 },
      { name: 'Kassenbereich', description: 'Kassenzone', order: 2 },
      { name: 'Lager', description: 'Warenbereich', order: 3 },
    );
  }

  // Based on tasks
  if (site.securityConcept.tasks.includes('PATROLS')) {
    suggestions.push(
      { name: 'Außenrundgang', description: 'Kontrolle Außenbereich', order: 100 },
    );
  }

  if (site.securityConcept.tasks.includes('PARKING')) {
    suggestions.push(
      { name: 'Parkhaus', description: 'Tiefgarage/Parkplatz', order: 101 },
    );
  }

  return suggestions;
}
```

#### 4.2 API Endpoint ✅
**File:** `backend/src/controllers/siteController.ts`

```typescript
// GET /api/sites/:id/control-point-suggestions
export async function getControlPointSuggestions(req, res, next) {
  const { id } = req.params;
  const site = await prisma.site.findUnique({ where: { id } });

  const suggestions = generateControlPointSuggestions(site);

  res.json({ success: true, data: suggestions });
}
```

### Frontend-Tasks

#### 4.3 Suggestions-UI in Wizard ✅
**File:** `frontend/src/features/wizard/components/steps/ControlPointsStep.tsx`

```tsx
function ControlPointsStep() {
  const { data: suggestions } = useQuery({
    queryKey: ['control-point-suggestions', wizardData.siteId],
    queryFn: () => api.get(`/sites/${wizardData.siteId}/control-point-suggestions`),
    enabled: !!wizardData.siteId,
  });

  const [selected, setSelected] = useState([]);

  return (
    <div>
      <h2>Kontrollgänge definieren</h2>

      <Alert severity="info">
        Basierend auf Ihrem Sicherheitskonzept ({wizardData.securityConcept.tasks.join(', ')})
        haben wir {suggestions?.length} Kontrollpunkte vorgeschlagen.
      </Alert>

      <Button onClick={() => setSelected(suggestions)}>
        Alle Vorschläge übernehmen
      </Button>

      <CheckboxList>
        {suggestions?.map(s => (
          <Checkbox
            key={s.name}
            checked={selected.includes(s)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelected([...selected, s]);
              } else {
                setSelected(selected.filter(x => x !== s));
              }
            }}
          >
            <strong>{s.name}</strong> - {s.description}
          </Checkbox>
        ))}
      </CheckboxList>

      <Button onClick={() => /* Add custom */}>
        + Eigenen Kontrollpunkt hinzufügen
      </Button>
    </div>
  );
}
```

### Deliverables Phase 4
- ✅ Control-Point-Generator funktioniert
- ✅ Suggestions API gibt passende Vorschläge
- ✅ Wizard zeigt Vorschläge an
- ✅ User kann auswählen/anpassen
- ✅ NFC-Tags werden generiert
- ✅ Tests geschrieben

---

## 🟡 PHASE 5: UX-Verbesserungen (Tag 13-14)

### Ziel
Bessere Benennung, Tooltips, Erklärungen

### Frontend-Tasks

#### 5.1 Clearances → Einarbeitung ✅
- Tab-Name: "Clearances (11)" → "Einarbeitung (11 MA)"
- Badge-Text: "TRAINING" → "In Einarbeitung"
- Tooltips: "Einarbeitungsstand der Mitarbeiter für dieses Objekt"

#### 5.2 Positions-Übersicht ✅
**File:** `frontend/src/features/sites/components/PositionsOverview.tsx`

```tsx
function PositionsOverview({ siteId }) {
  const { data: coverage } = useCoverage(siteId);

  return (
    <div>
      <h3>Positionen & Aufgaben</h3>

      <PositionCard>
        <h4>Objektleiter ({coverage.breakdown.OBJEKTLEITER.assigned}/{coverage.breakdown.OBJEKTLEITER.required})</h4>
        <Tasks>
          - Koordination & Kundenkontakt
          - Schichtplanung
          - Incident-Management
        </Tasks>
        <AssignedUsers role="OBJEKTLEITER" />
      </PositionCard>

      <PositionCard>
        <h4>Schichtleiter ({coverage.breakdown.SCHICHTLEITER.assigned}/{coverage.breakdown.SCHICHTLEITER.required})</h4>
        <Tasks>
          - Schichtführung
          - Briefing & Debriefing
          - Kontrolle
        </Tasks>
        <AssignedUsers role="SCHICHTLEITER" />
      </PositionCard>

      <PositionCard>
        <h4>Mitarbeiter ({coverage.breakdown.MITARBEITER.assigned}/{coverage.breakdown.MITARBEITER.required})</h4>
        <Tasks>
          {site.securityConcept.tasks.map(task => (
            <li key={task}>{TASK_LABELS[task]}</li>
          ))}
        </Tasks>
        <AssignedUsers role="MITARBEITER" />
      </PositionCard>
    </div>
  );
}
```

#### 5.3 Tooltips & Hilfe-Texte ✅
- Alle wichtigen UI-Elemente bekommen Tooltips
- "?" Icons mit Erklärungen
- Onboarding-Hints für neue User

### Deliverables Phase 5
- ✅ Klarere Benennung
- ✅ Tooltips überall
- ✅ Positions-Übersicht
- ✅ Aufgaben-Zuordnung
- ✅ Help-Center verlinkt

---

## ✅ Definition of Done

Alle Phasen gelten als abgeschlossen wenn:

- ✅ Code geschrieben & getestet
- ✅ TypeScript: 0 Errors
- ✅ Backend-Tests (Jest): Alle grün
- ✅ Frontend-Tests (Vitest): Alle grün
- ✅ Manual Testing: Funktioniert im Browser
- ✅ Dokumentation aktualisiert
- ✅ Git committed

---

**Start:** 2025-10-25
**Geschätzte Fertigstellung:** 2025-11-08 (14 Tage)
