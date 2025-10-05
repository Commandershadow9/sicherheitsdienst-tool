# Manager-Dashboard (v1.7.0)

**Status**: In Entwicklung
**Priorität**: P1 (Hohe User-Nachfrage)
**Ziel**: Workflow-orientierte Übersicht statt daten-orientierter Liste

## Problem & User-Feedback

**Aktuelles Problem**:
- Manager müssen durch lange Listen navigieren
- Viel irrelevante Information (z.B. alle genehmigten Urlaube)
- Nicht klar was HEUTE wichtig ist

**User-Zitat**:
> "Abwesenheiten interessieren mich nur wenn es Probleme gibt. Ich will ein Dashboard: Was muss ich HEUTE tun?"

## Vision

Ein **actionable Dashboard** das zeigt:
1. ✅ **Was muss ich JETZT tun?** (Heute kritisch)
2. ⚠️ **Was braucht meine Aufmerksamkeit?** (Ausstehende Genehmigungen)
3. 📊 **Worauf muss ich mich vorbereiten?** (7-Tage-Vorschau)
4. 📈 **Wie ist die Lage?** (Übersichts-Statistiken)

## UI-Konzept (Wireframe)

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 Manager-Dashboard                              [Aktualisieren] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔴 HEUTE KRITISCH (3)                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️ Shoppingcenter West - Tagschicht (08:00-16:00)          │  │
│  │    Benötigt: 3 MA | Verfügbar: 1 MA | 2 FEHLEN             │  │
│  │    Grund: Max M. (Urlaub), Tom K. (krank)                  │  │
│  │    [🔍 Ersatz suchen]                                       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ⚠️ Krankenhaus Mitte - Nachtschicht (22:00-06:00)          │  │
│  │    Benötigt: 2 MA | Verfügbar: 0 MA | 2 FEHLEN             │  │
│  │    [🔍 Ersatz suchen]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🟡 AUSSTEHENDE GENEHMIGUNGEN (2)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Lisa Müller - Sonderurlaub (08.-10.10.2025)                │  │
│  │ ⚠️ Krankenhaus kritisch unterbesetzt (2 Schichten)          │  │
│  │ [✅ Genehmigen] [❌ Ablehnen] [👁️ Details]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Sarah Becker - Urlaub (15.10.-19.11.2025)                  │  │
│  │ ⚠️ Überschreitet Jahresanspruch um 5 Tage                   │  │
│  │ [✅ Genehmigen] [❌ Ablehnen] [👁️ Details]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🟠 NÄCHSTE 7 TAGE: KAPAZITÄTSWARNUNGEN (1)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔶 Morgen (05.10): Bürokomplex Nord - Tagschicht           │  │
│  │    Benötigt: 2 MA | Verfügbar: 1 MA                        │  │
│  │    [🔍 Ersatz suchen]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  📊 ÜBERSICHT (Heute)                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ Mitarbeiter │ Verfügbar   │ Im Urlaub   │ Krank           │  │
│  │ Gesamt: 15  │ 12 (80%)    │ 2 (13%)     │ 1 (7%)          │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                                                                   │
│  [→ Alle Abwesenheiten] [→ Schichtplan] [→ Mitarbeiter]          │
└─────────────────────────────────────────────────────────────────┘
```

## Backend API-Spezifikation

### GET /api/dashboard/critical
**Beschreibung**: Heute kritische Schichten (unterbesetzt)

**Response**:
```json
{
  "data": [
    {
      "shiftId": "cm...",
      "shiftTitle": "Shoppingcenter West - Tagschicht",
      "siteName": "Shoppingcenter West",
      "startTime": "2025-10-04T08:00:00Z",
      "endTime": "2025-10-04T16:00:00Z",
      "requiredEmployees": 3,
      "availableEmployees": 1,
      "shortage": 2,
      "reasons": [
        { "employeeName": "Max Mustermann", "reason": "Urlaub (APPROVED)" },
        { "employeeName": "Tom Klein", "reason": "Krankmeldung (APPROVED)" }
      ]
    }
  ]
}
```

### GET /api/dashboard/pending-approvals
**Beschreibung**: Ausstehende Abwesenheits-Genehmigungen mit Kontext

**Response**:
```json
{
  "data": [
    {
      "absenceId": "cm...",
      "employee": {
        "id": "cm...",
        "firstName": "Lisa",
        "lastName": "Müller",
        "email": "lisa.mueller@test.de"
      },
      "type": "SPECIAL_LEAVE",
      "startsAt": "2025-10-08T00:00:00Z",
      "endsAt": "2025-10-10T23:59:59Z",
      "requestedDays": 3,
      "reason": "Behördentermin",
      "warnings": {
        "affectedShifts": 2,
        "criticalShifts": 2,
        "leaveDaysExceeded": false
      }
    }
  ]
}
```

### GET /api/dashboard/warnings?days=7
**Beschreibung**: Kapazitätswarnungen für nächste N Tage

**Response**:
```json
{
  "data": [
    {
      "date": "2025-10-05",
      "shiftId": "cm...",
      "shiftTitle": "Bürokomplex Nord - Tagschicht",
      "siteName": "Bürokomplex Nord",
      "startTime": "2025-10-05T08:00:00Z",
      "endTime": "2025-10-05T16:00:00Z",
      "requiredEmployees": 2,
      "availableEmployees": 1,
      "shortage": 1
    }
  ]
}
```

### GET /api/dashboard/stats
**Beschreibung**: Übersichts-Statistiken für heute

**Response**:
```json
{
  "data": {
    "totalEmployees": 15,
    "availableToday": 12,
    "onVacation": 2,
    "onSickLeave": 1,
    "pendingApprovals": 2,
    "criticalShiftsToday": 3,
    "upcomingWarnings": 1
  }
}
```

## Frontend-Komponenten

### Datei-Struktur
```
frontend/src/features/dashboard/
├── DashboardPage.tsx              # Haupt-Dashboard
├── CriticalShiftsCard.tsx         # 🔴 Heute kritisch
├── PendingApprovalsCard.tsx      # 🟡 Ausstehende Genehmigungen
├── WarningsCard.tsx               # 🟠 7-Tage Vorschau
├── StatsCard.tsx                  # 📊 Übersicht
├── QuickApprovalModal.tsx         # Quick-Approve/Reject Dialog
├── api.ts                         # API-Calls
└── types.ts                       # TypeScript Types
```

### Route-Integration
```typescript
// App.tsx oder Router
{
  path: '/dashboard',
  element: <DashboardPage />,
  requiresAuth: true,
  requiresRole: ['ADMIN', 'MANAGER']
}
```

## Interaktionen & Quick-Actions

### 1. Kritische Schicht → Ersatz suchen
- Button "🔍 Ersatz suchen" öffnet Modal
- Zeigt verfügbare Mitarbeiter (gleiche Logik wie Abwesenheits-Detail)
- Direkte Zuweisung möglich
> ✅ Umsetzung (2025-10-05): `GET /api/shifts/:id/replacement-candidates` liefert Kandidaten inkl. Clearance-Infos.

### 2. Ausstehende Genehmigung → Approve/Reject
- Button "✅ Genehmigen" öffnet Bestätigungs-Dialog:
  - Wenn Warnungen existieren: Zeige sie an
  - Optional: Notiz hinzufügen
  - Bestätigen → API-Call → Dashboard aktualisiert
- Button "❌ Ablehnen" öffnet Dialog für Ablehnungsgrund
- Button "👁️ Details" öffnet bekanntes AbsenceDetailModal
- Betroffene Schichten werden je Antrag mit Status angezeigt:
  - ⚠️ Unterbesetzt – Ersatz dringend
  - ℹ️ Kapazität ausreichend, Ersatz trotzdem einplanen (Backfill empfohlen)

### 3. Auto-Refresh
- Dashboard aktualisiert sich alle 60 Sekunden
- Manueller Refresh-Button oben rechts
- Nach Quick-Actions: Automatische Aktualisierung

## Implementierungs-Reihenfolge

### Phase 1: Backend (Tag 1) ✅ ABGESCHLOSSEN (2025-10-04)
1. ✅ Controller erstellen: `dashboardController.ts` (450 Zeilen)
2. ✅ Routes erstellen: `dashboardRoutes.ts`
3. ✅ 4 Endpoints implementieren (critical, pending-approvals, warnings, stats)
4. ✅ Routes in app.ts registriert (/api/dashboard, /api/v1/dashboard)
5. ✅ TypeScript Kompilierung erfolgreich
6. ✅ Docker Build & Deploy erfolgreich
7. ✅ Alle Endpoints manuell mit curl getestet
8. ⏭️ Tests schreiben (optional - verschoben auf später)

### Phase 2: Frontend (Tag 1-2) – IN ARBEIT
1. ✅ Types definieren (`types.ts`)
2. ✅ API-Calls (`api.ts`)
3. ✅ Komponenten bauen:
   - ✅ CriticalShiftsCard (Prio 1)
   - ✅ PendingApprovalsCard (Prio 1)
   - ✅ StatsCard (Prio 2)
   - ✅ WarningsCard (Prio 2)
4. ✅ DashboardPage zusammenbauen (Auto-Refresh + manueller Refresh)
5. ✅ QuickApprovalModal (Approve/Reject inkl. Kapazitätswarnungen)
6. ✅ Ersatz-Suche direkt aus Dashboard (Shift-Kandidaten via `/api/shifts/:id/replacement-candidates`)
7. ✅ UI-Finetuning & Responsives Layout (Button-States, Mobile Flex-Anpassungen)
8. ✅ Vitest-Abdeckung QuickApprovalModal (Warnungsanzeige & Actions)
9. ✅ Playwright E2E: Dashboard Quick-Actions & Ersatzsuche (`dashboard-quick-actions.spec.ts`)
10. ✅ Pending-Karten: kompakte Badges, scrollbare Schichtliste, Expand/Collapse
11. ✅ Replacement-Flow meldet zugewiesenen Kandidaten + unmittelbares Refresh (Toast)

### Phase 3: Integration & Testing (Tag 2)
1. [x] Route registrieren
2. [x] Navigation anpassen (Dashboard als neue Startseite für Manager?)
3. [ ] Manuelle Tests mit Seed-Daten
4. [ ] Responsive Design prüfen (Mobile QA ausstehend)

## Offene Fragen / Entscheidungen

1. **Navigation**: Soll Dashboard die neue Startseite für Manager sein?
   - Vorschlag: Ja, Login → redirect to /dashboard (statt /absences)

2. **Refresh-Intervall**: 60 Sekunden ok?
   - Alternative: WebSocket für Real-Time Updates (später)

3. **Mitarbeiter-Rolle**: Sehen Employees auch ein Dashboard?
   - Vorschlag: Ja, aber vereinfacht (nur eigene Abwesenheiten, eigene Schichten)

4. **Badge-Counts**: Soll Navigation Badges haben?
   - Vorschlag: Ja, "Ausstehend (2)" im Sidebar/Header

## Akzeptanzkriterien

- [x] Manager sieht auf einen Blick kritische Schichten von HEUTE
- [x] Quick-Actions funktionieren (Genehmigen/Ablehnen ohne Navigation)
- [x] Dashboard aktualisiert sich nach Actions automatisch
- [x] Ersatz-Suche funktioniert direkt aus Dashboard
- [ ] Responsive auf Desktop & Tablet
- [ ] Lädt in < 2 Sekunden (mit Test-Daten)

---

**Erstellt**: 2025-10-04
**Von**: Claude (Sonnet 4.5) mit User-Feedback
**Next Steps**: Mobile QA & Integrationstests ergänzen
