# Schichtplanung v2.0 - Dokumentation

## Übersicht

Das Schichtplanungs-System v2.0 ist eine umfassende Lösung für intelligente Schichtplanung mit automatischer Konflikt-Erkennung, Smart-Matching und Auto-Fill-Funktionalität.

## Architektur

### Backend-Services

#### 1. **shiftTemplateService.ts**
Verwaltet wiederverwendbare Schicht-Templates für häufig verwendete Schichtmuster.

**Funktionen:**
- `createShiftTemplate(data)` - Erstellt ein neues Template
- `getShiftTemplates(options)` - Holt alle Templates (mit Filtern)
- `updateShiftTemplate(id, data)` - Aktualisiert ein Template
- `deleteShiftTemplate(id)` - Löscht ein Template
- `applyTemplateToSite(options)` - Wendet Template auf Site an (erstellt Schichten)

**Beispiel:**
```typescript
const template = await createShiftTemplate({
  name: 'Nachtschicht Standard',
  shiftType: 'NIGHT',
  startTime: '22:00',
  endTime: '06:00',
  requiredStaff: 3,
  requiredQualifications: ['Erste Hilfe'],
  customerId: 'customer-123'
});

// Template anwenden
const shifts = await applyTemplateToSite({
  templateId: template.id,
  siteId: 'site-456',
  dates: [
    new Date('2025-01-10'),
    new Date('2025-01-11'),
    new Date('2025-01-12')
  ]
});
```

#### 2. **shiftConflictService.ts**
Analysiert Schichten auf Konflikte und Compliance-Verstöße.

**9 Konflikttypen:**
1. `UNASSIGNED` - Keine Mitarbeiter zugewiesen (CRITICAL)
2. `UNDERSTAFFED` - Zu wenige Mitarbeiter (CRITICAL)
3. `NO_CLEARANCE` - Mitarbeiter ohne Objekt-Einarbeitung (HIGH)
4. `MISSING_QUALIFICATIONS` - Fehlende Qualifikationen (HIGH)
5. `DOUBLE_BOOKING` - Mitarbeiter mehrfach gleichzeitig zugewiesen (HIGH)
6. `REST_TIME_VIOLATION` - Ruhezeit-Verstoß (MEDIUM)
7. `WEEKLY_HOURS_EXCEEDED` - Wöchentliche Höchststunden überschritten (MEDIUM)
8. `CONSECUTIVE_DAYS_EXCEEDED` - Zu viele aufeinanderfolgende Arbeitstage (LOW)
9. `OVERSTAFFED` - Zu viele Mitarbeiter zugewiesen (LOW)

**Severity-Stufen:**
- `critical` - Sofortiger Handlungsbedarf
- `high` - Dringend, rechtliche/Sicherheits-Probleme
- `medium` - Wichtig, Compliance-Verstöße
- `low` - Optional, Optimierungsvorschläge

**Beispiel:**
```typescript
const conflicts = await analyzeShiftConflicts({
  startDate: new Date('2025-01-10'),
  endDate: new Date('2025-01-17'),
  siteId: 'site-456', // Optional
  userId: 'user-789'  // Optional
});

conflicts.forEach(conflict => {
  console.log(`${conflict.severity.toUpperCase()}: ${conflict.type}`);
  console.log(`Schicht: ${conflict.shift.title}`);
  console.log(`Details: ${conflict.details}`);
  console.log(`Betroffene: ${conflict.affected.length}`);
});
```

#### 3. **shiftAutoFillService.ts**
Automatische Schichtzuweisung mit intelligentem Matching-Algorithmus.

**Funktionen:**
- `previewAutoFill(options)` - Vorschau ohne Speicherung
- `autoFillShifts(options)` - Führt Auto-Fill aus und speichert

**Status-Typen:**
- `FILLED` - Vollständig besetzt
- `PARTIAL` - Teilweise besetzt
- `UNFILLED` - Nicht besetzt

**Scoring-System:**
- 90-100: OPTIMAL (Grün)
- 70-89: GOOD (Gelb)
- 50-69: ACCEPTABLE (Orange)
- 0-49: NOT_RECOMMENDED (Rot)

**Scoring-Faktoren:**
- **Workload** (35%): Auslastung vs. Zielstunden
- **Compliance** (30%): Ruhezeiten, Wochenstunden, Aufeinanderfolgende Tage
- **Fairness** (20%): Gleichmäßige Verteilung
- **Preference** (15%): Mitarbeiter-Präferenzen

**Beispiel:**
```typescript
// Vorschau
const preview = await previewAutoFill({
  startDate: new Date('2025-01-10'),
  endDate: new Date('2025-01-17'),
  siteId: 'site-456',
  minScore: 60,
  maxCandidatesPerShift: 5
});

console.log(`Gesamt: ${preview.length} Schichten`);
console.log(`Gefüllt: ${preview.filter(r => r.status === 'FILLED').length}`);
console.log(`Teilweise: ${preview.filter(r => r.status === 'PARTIAL').length}`);
console.log(`Unfilled: ${preview.filter(r => r.status === 'UNFILLED').length}`);

// Ausführen
const results = await autoFillShifts({
  startDate: new Date('2025-01-10'),
  endDate: new Date('2025-01-17'),
  siteId: 'site-456',
  minScore: 70,
  maxCandidatesPerShift: 10
});
```

### API-Endpunkte

#### **POST /api/shift-planning/templates**
Erstellt ein neues Schicht-Template.

**Body:**
```json
{
  "name": "Nachtschicht Standard",
  "shiftType": "NIGHT",
  "startTime": "22:00",
  "endTime": "06:00",
  "requiredStaff": 3,
  "requiredQualifications": ["Erste Hilfe"],
  "wageMultiplier": 1.25,
  "color": "#1E40AF"
}
```

**Permissions:** `ADMIN`, `MANAGER`, `DISPATCHER`

---

#### **GET /api/shift-planning/templates**
Holt alle Templates.

**Query-Parameter:**
- `shiftType` (optional): Filter nach Typ (REGULAR, NIGHT, WEEKEND, HOLIDAY, EMERGENCY, SPECIAL)

---

#### **POST /api/shift-planning/templates/:id/apply**
Wendet Template auf einen Site an.

**Body:**
```json
{
  "siteId": "site-456",
  "dates": ["2025-01-10", "2025-01-11", "2025-01-12"],
  "overrides": {
    "title": "Spezielle Bewachung",
    "requiredEmployees": 5
  }
}
```

---

#### **POST /api/shift-planning/analyze-conflicts**
Analysiert Schichten auf Konflikte.

**Body:**
```json
{
  "startDate": "2025-01-10",
  "endDate": "2025-01-17",
  "siteId": "site-456",
  "userId": "user-789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "id": "conflict-1",
        "type": "UNDERSTAFFED",
        "severity": "critical",
        "shift": {
          "id": "shift-123",
          "title": "Nachtwache",
          "startTime": "2025-01-10T22:00:00Z",
          "endTime": "2025-01-11T06:00:00Z"
        },
        "details": "Unterbesetzt: 1/3 Mitarbeiter",
        "affected": ["user-456"],
        "suggestions": ["2 weitere Mitarbeiter zuweisen"]
      }
    ],
    "stats": {
      "total": 15,
      "critical": 3,
      "high": 5,
      "medium": 4,
      "low": 3
    }
  }
}
```

---

#### **POST /api/shift-planning/auto-fill**
Automatische Schichtzuweisung.

**Body:**
```json
{
  "startDate": "2025-01-10",
  "endDate": "2025-01-17",
  "siteId": "site-456",
  "minScore": 70,
  "maxCandidatesPerShift": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "shiftId": "shift-123",
        "shiftTitle": "Nachtwache",
        "status": "FILLED",
        "staffingLevel": "3/3",
        "assignedUsers": [
          {
            "userId": "user-456",
            "userName": "Max Mustermann",
            "score": 95,
            "recommendation": "OPTIMAL"
          }
        ]
      }
    ],
    "stats": {
      "total": 20,
      "filled": 15,
      "partial": 3,
      "unfilled": 2
    }
  }
}
```

---

#### **POST /api/shift-planning/auto-fill/preview**
Vorschau der Auto-Fill-Ergebnisse ohne Speicherung.

**Body:** Identisch zu `/auto-fill`

---

## Frontend-Komponenten

### 1. **ShiftPlanningPage**
Haupt-Seite mit 3-Tab-Navigation:
- **Dashboard**: Konflikt-Übersicht & Quick-Actions
- **Matrix**: Wöchentliche Matrix mit Drag & Drop
- **Timeline**: Gantt-Style Mitarbeiter-Timeline

**Location:** `frontend/src/features/shift-planning/pages/ShiftPlanningPage.tsx`

---

### 2. **PlanningDashboard**
Zeigt Konflikt-Analyse und Statistiken.

**Features:**
- Real-time Konflikt-Analyse
- Stats-Cards (Total, Critical, High, Status)
- Top 5 kritische Konflikte
- Gruppierung nach Konflikttyp
- Auto-Fill Button

---

### 3. **ShiftMatrixDnD**
Drag & Drop Matrix für Schichtzuweisung.

**Features:**
- React DnD mit Multi-Backend (HTML5 + Touch)
- Draggable Mitarbeiter-Karten
- Droppable Schicht-Karten
- Clearance-Visualisierung
- Inline Compliance-Warnungen
- Mobile Touch-Support

**Location:** `frontend/src/features/shift-planning/components/ShiftMatrixDnD.tsx`

---

### 4. **ShiftTimeline**
Gantt-Style Timeline für Mitarbeiter-Übersicht.

**Features:**
- Prozentuale Positionierung
- Clearance-Checks pro Schicht
- Überlappungs-Visualisierung
- Zeit-Marker (24h-Intervalle)

---

### 5. **ShiftDetailModal**
Detail-Ansicht für einzelne Schichten.

**Features:**
- Zugewiesene Mitarbeiter-Liste
- Remove-Funktionalität
- Auto-Fill Kandidaten-Vorschläge
- Score-basiertes Ranking
- Mutation mit React Query

---

### 6. **AutoFillModal**
Bulk Auto-Fill Dialog.

**Features:**
- Preview/Confirm Workflow
- Stats-Display
- Result-Liste mit Status
- Zeit-Period basiert

---

## Clearance-System

### Clearance-Status
- `CLEARED` - Aktive Einarbeitung
- `EXPIRING_SOON` - Läuft in <30 Tagen ab
- `EXPIRED` - Abgelaufen
- `NOT_CLEARED` - Keine Einarbeitung

### Visualisierung
- **Matrix:** Badges bei Mitarbeitern (ShieldCheck/ShieldAlert Icons)
- **Timeline:** Ring um Schicht-Blöcke
- **Inline-Warnungen:** Orange Badges in ShiftCards

### Compliance-Checks
Die `checkCompliance()` Funktion prüft:
1. Clearance-Status für Site
2. Erforderliche Qualifikationen
3. Kombinierte Warnungen

---

## Performance-Optimierungen

### Frontend
1. **React.memo** für ShiftCard und EmployeeCard
2. **useCallback** für Event-Handler
3. **useMemo** für Matrix-Daten und Backend-Selection
4. **Lazy-Loading** für Modals

### Backend
1. **Batch-Queries** mit Prisma
2. **Indexed Database-Fields**
3. **Caching** via React Query (Frontend)

---

## Tests

### Backend Unit-Tests
Location: `backend/src/__tests__/`

**Test-Suites:**
1. `shiftConflictService.test.ts` - 9 Konflikttypen + Severity
2. `shiftAutoFillService.test.ts` - Auto-Fill Logik + Scoring
3. `shiftTemplateService.test.ts` - Template CRUD + Apply

**Run Tests:**
```bash
cd backend
npm test shift
```

---

## Best Practices

### Templates
- Erstelle Standard-Templates für häufig verwendete Schichten
- Nutze `wageMultiplier` für Zuschläge (Nacht, Wochenende)
- Setze klare `requiredQualifications` für Sicherheitskritische Schichten

### Konflikt-Management
- Prüfe täglich auf CRITICAL Konflikte
- Adressiere HIGH Konflikte vor Schichtbeginn
- Verwende Auto-Fill für Vorschläge, nicht blind ausführen

### Auto-Fill
- Setze `minScore` mindestens auf 60
- Nutze Preview vor finaler Ausführung
- Prüfe PARTIAL/UNFILLED Results manuell

### Clearances
- Halte Clearances aktuell (`validUntil`)
- Setze `status: SUSPENDED` statt zu löschen
- Prüfe regelmäßig auf ablaufende Clearances

---

## Migration von v1.0

### Breaking Changes
- `ShiftMatrix` → `ShiftMatrixDnD` (React DnD)
- Neue API-Endpoints unter `/api/shift-planning`
- Erweiterte `ShiftAssignment` Interface mit Clearances

### Migration-Steps
1. Update Frontend Imports
2. Prisma Migration ausführen: `20251109230347_add_shift_planning_v2`
3. Seed Default Templates (optional)
4. Update Frontend Routes

---

## Troubleshooting

### "Keine Kandidaten gefunden"
- Prüfe Clearances der Mitarbeiter für Site
- Prüfe `requiredQualifications`
- Reduziere `minScore` Schwellenwert

### Drag & Drop funktioniert nicht auf Mobile
- Backend: `react-dnd-touch-backend` installiert?
- Prüfe `getDnDBackend()` Implementierung
- `delayTouchStart: 200ms` für Scroll vs. Drag

### Konflikte werden nicht erkannt
- Prüfe Datum-Range in `analyzeShiftConflicts`
- Checke Prisma-Includes für `assignments` und `user`
- Validiere `ObjectClearance` Daten in DB

---

## Roadmap

### Geplante Features
- [ ] Template-Kalender (wöchentliche/monatliche Patterns)
- [ ] Mitarbeiter-Präferenzen UI
- [ ] Export (PDF, Excel) für Schichtpläne
- [ ] Push-Notifications für Konflikte
- [ ] KI-basierte Optimierung
- [ ] Multi-Site Auto-Fill

---

## Support

Bei Fragen oder Problemen:
- **Dokumentation:** `/backend/docs/SHIFT_PLANNING_V2.md`
- **Tests:** `npm test shift`
- **API:** Swagger/OpenAPI Docs unter `/api/docs`
