# Schichtplanung Frontend - Dokumentation

## Übersicht

Das Schichtplanungs-Frontend bietet eine intuitive Benutzeroberfläche für intelligente Schichtplanung mit Drag & Drop, Konflikt-Visualisierung und Auto-Fill-Funktionalität.

## Komponenten-Struktur

```
shift-planning/
├── pages/
│   └── ShiftPlanningPage.tsx          # Haupt-Seite mit Tab-Navigation
├── components/
│   ├── PlanningDashboard.tsx          # Konflikt-Dashboard
│   ├── ShiftMatrixDnD.tsx             # Drag & Drop Matrix
│   ├── ShiftTimeline.tsx              # Gantt-Style Timeline
│   ├── ShiftDetailModal.tsx           # Schicht-Details Modal
│   └── AutoFillModal.tsx              # Auto-Fill Dialog
├── utils/
│   ├── clearanceUtils.ts              # Clearance-Check Logik
│   └── dndBackend.ts                  # DnD Backend-Auswahl
└── api.ts                             # API-Client
```

## Features

### 1. Dashboard
**Komponente:** `PlanningDashboard.tsx`

**Features:**
- Real-time Konflikt-Analyse mit React Query
- Stats-Karten (Total, Critical, High, Status-Übersicht)
- Top 5 kritische Konflikte
- Gruppierung nach Konflikttyp
- Quick-Actions: Auto-Fill Button

**Usage:**
```tsx
<PlanningDashboard
  weekOffset={0}
  onViewConflict={(conflict) => console.log(conflict)}
  onAutoFill={() => setShowAutoFill(true)}
/>
```

---

### 2. Matrix mit Drag & Drop
**Komponente:** `ShiftMatrixDnD.tsx`

**Features:**
- React DnD mit Multi-Backend (Desktop + Mobile)
- Draggable Mitarbeiter-Karten mit Clearance-Badges
- Droppable Schicht-Karten
- Inline Compliance-Warnungen
- Visual Feedback (isDragging, isOver, canDrop)
- Touch-Support mit 200ms Delay

**Usage:**
```tsx
<ShiftMatrixDnD
  shifts={shifts}
  initialDate={new Date()}
  onShiftClick={(shift) => setSelectedShift(shift)}
/>
```

**Drag & Drop Flow:**
1. User greift Mitarbeiter-Karte
2. Ziehen über Schicht-Karte (Drop-Zone leuchtet blau)
3. Loslassen → API-Call `assignUserToShift`
4. React Query invalidiert Cache → UI aktualisiert

**Mobile:**
- Halten (200ms) um Drag zu starten
- Verschieben ohne Scrolling
- Loslassen auf Drop-Zone

---

### 3. Timeline
**Komponente:** `ShiftTimeline.tsx`

**Features:**
- Gantt-Style Visualisierung
- Mitarbeiter-basierte Rows
- Prozentuale Positionierung
- Clearance-Checks mit Ring-Indikator
- Zeit-Marker (24h-Intervalle)

**Usage:**
```tsx
<ShiftTimeline
  shifts={shifts}
  startDate={startDate}
  endDate={endDate}
  onShiftClick={(shift) => setSelectedShift(shift)}
/>
```

---

### 4. Modals

#### ShiftDetailModal
**Features:**
- Schicht-Details anzeigen
- Liste zugewiesener Mitarbeiter
- Remove-Buttons
- Auto-Fill Kandidaten mit Score-Display
- Mutation mit React Query

**Usage:**
```tsx
<ShiftDetailModal
  shift={selectedShift}
  isOpen={!!selectedShift}
  onClose={() => setSelectedShift(null)}
/>
```

#### AutoFillModal
**Features:**
- Preview/Confirm Workflow
- Stats (Total, Filled, Partial, Unfilled)
- Result-Liste mit Status-Indikatoren
- Zeit-Period Filter

**Usage:**
```tsx
<AutoFillModal
  isOpen={showAutoFill}
  onClose={() => setShowAutoFill(false)}
  startDate={startDate}
  endDate={endDate}
/>
```

---

## Clearance-System

### Utility-Funktionen
**File:** `utils/clearanceUtils.ts`

#### `checkClearanceForSite(clearances, siteId)`
Prüft Clearance-Status eines Mitarbeiters für einen Site.

**Returns:**
```typescript
{
  status: 'CLEARED' | 'EXPIRED' | 'NOT_CLEARED' | 'EXPIRING_SOON',
  clearance?: ObjectClearance,
  message: string,
  severity: 'success' | 'warning' | 'error' | 'info',
  color: string
}
```

#### `checkQualifications(userQualifications, requiredQualifications)`
Prüft ob Mitarbeiter erforderliche Qualifikationen hat.

**Returns:**
```typescript
{
  hasAll: boolean,
  missing: string[],
  message: string,
  severity: 'success' | 'warning' | 'error',
  color: string
}
```

#### `checkCompliance(clearances, qualifications, siteId, requiredQualifications)`
Kombinierte Prüfung von Clearance + Qualifikationen.

**Returns:**
```typescript
{
  isCompliant: boolean,
  clearanceCheck: ClearanceCheck,
  qualificationCheck: QualificationCheck,
  warnings: Array<{ type: string, message: string, severity: 'warning' | 'error' }>
}
```

---

## API-Client

**File:** `api.ts`

### Interfaces
```typescript
interface ShiftTemplate {
  id: string;
  name: string;
  shiftType: 'REGULAR' | 'NIGHT' | 'WEEKEND' | 'HOLIDAY' | 'EMERGENCY' | 'SPECIAL';
  startTime: string;
  endTime: string;
  requiredStaff: number;
  requiredQualifications: string[];
  wageMultiplier?: number;
  color?: string;
}

interface ShiftConflict {
  id: string;
  type: 'UNASSIGNED' | 'UNDERSTAFFED' | 'NO_CLEARANCE' | ...;
  severity: 'critical' | 'high' | 'medium' | 'low';
  shift: Shift;
  details: string;
  affected: string[];
  suggestions: string[];
}

interface AutoFillResult {
  shiftId: string;
  shiftTitle: string;
  status: 'FILLED' | 'PARTIAL' | 'UNFILLED';
  staffingLevel: string;
  assignedUsers: Array<{
    userId: string;
    userName: string;
    score: number;
    recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  }>;
  reason?: string;
}
```

### API-Funktionen
```typescript
// Templates
fetchShiftTemplates(options?)
createShiftTemplate(data)
applyTemplate(templateId, options)

// Konflikte
analyzeConflicts(options)

// Auto-Fill
previewAutoFill(options)
executeAutoFill(options)
```

---

## Performance-Optimierungen

### React.memo
Alle Sub-Komponenten sind memoized:
- `EmployeeCard`
- `ShiftCard`

### useCallback
Event-Handler sind memoized:
```typescript
const handleDrop = useCallback(
  (userId, shiftId) => assignMutation.mutate({ userId, shiftId }),
  [assignMutation]
);
```

### useMemo
Berechnete Daten:
- `matrixData` - 7-Tage Matrix-Struktur
- `timelineData` - Mitarbeiter-Timeline-Rows
- `complianceIssues` - Compliance-Checks
- `dndBackend` - Backend-Auswahl

---

## Styling

### Tailwind-Klassen
Alle Komponenten nutzen Tailwind CSS für konsistentes Styling:
- **Status-Farben:** `text-{color}-600 bg-{color}-50 border-{color}-200`
- **Icons:** Lucide-React Icons (consistent 12-16px)
- **Transitions:** `transition-all` für smooth Animationen

### Clearance-Badges
- **Cleared:** `ShieldCheck` (Grün)
- **Warning:** `ShieldAlert` (Orange)
- **Error:** `ShieldAlert` (Rot)

---

## Mobile-Support

### Touch-Backend
**File:** `utils/dndBackend.ts`

Automatische Backend-Auswahl:
```typescript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  return {
    backend: TouchBackend,
    options: {
      enableMouseEvents: true,
      delayTouchStart: 200,    // Scroll vs. Drag
      touchSlop: 5            // Min. 5px Bewegung
    }
  };
}
```

### Responsive Design
- **Matrix:** Grid-Layout mit `grid-cols-7`
- **Timeline:** Flex-Layout mit scrollbaren Bereichen
- **Dashboard:** Responsive Cards mit `flex-wrap`

---

## State-Management

### React Query
Alle API-Calls nutzen React Query:
```typescript
const { data: shifts, isLoading } = useQuery({
  queryKey: ['shifts', startDate, endDate],
  queryFn: () => fetchShifts({ startDate, endDate })
});
```

**Mutations:**
```typescript
const assignMutation = useMutation({
  mutationFn: ({ userId, shiftId }) => assignUserToShift(shiftId, userId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    toast.success('Mitarbeiter zugewiesen');
  }
});
```

### Local State
- `viewMode` - Aktiver Tab (dashboard | matrix | timeline)
- `weekOffset` - Wochen-Navigation Offset
- `selectedShift` - Ausgewählte Schicht für Modal
- `showAutoFill` - AutoFill-Modal Visibility

---

## Troubleshooting

### Drag & Drop funktioniert nicht
**Problem:** Keine Reaktion beim Drag
**Lösung:**
1. Prüfe React DnD Installation
2. Checke `getDnDBackend()` Implementierung
3. Validiere `DndProvider` Wrapping

### Clearance-Badges nicht sichtbar
**Problem:** Keine Badges bei Mitarbeitern
**Lösung:**
1. Backend: Prüfe `objectClearances` Include
2. Frontend: Validiere `user.objectClearances` in API-Response
3. Checke `checkClearanceForSite()` Logik

### Performance-Probleme
**Problem:** Langsame UI bei vielen Schichten
**Lösung:**
1. Prüfe React.memo auf Components
2. Validiere useCallback auf Handlers
3. Reduziere Query-Frequency (staleTime erhöhen)

---

## Best Practices

### Component-Design
- Nutze React.memo für Performance
- useCallback für Event-Handler
- useMemo für berechnete Daten
- Kleine, wiederverwendbare Komponenten

### API-Calls
- React Query für Caching
- Mutations mit Optimistic Updates
- Error-Handling mit Toast-Notifications
- Loading-States für UX

### Styling
- Tailwind für Konsistenz
- Icons von Lucide-React (12-16px)
- Transitions für smooth UX
- Responsive Design (Mobile-First)

---

## Weiterentwicklung

### Geplante Features
- [ ] Keyboard-Navigation für Accessibility
- [ ] Dark-Mode Support
- [ ] Virtualisierung für große Listen
- [ ] Offline-Support (PWA)
- [ ] Undo/Redo Funktionalität

---

## Support

Bei Fragen oder Problemen:
- **Backend-Docs:** `/backend/docs/SHIFT_PLANNING_V2.md`
- **Component-Tests:** Prüfe Browser-Console für Errors
- **API-Debugging:** React Query DevTools aktivieren
