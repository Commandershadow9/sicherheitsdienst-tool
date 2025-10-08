# Session Notes – Kontinuitäts-Tracking

**Zweck**: Diese Datei dient als Gedächtnis zwischen Sessions, um sicherzustellen, dass die Dokumentation immer aktuell ist und wichtige Kontextinformationen nicht verloren gehen.

---

## 🚀 Quick Start für neue Chat-Sessions

**Wichtig**: Claude hat KEIN Gedächtnis zwischen Chats! Jeder neue Chat startet bei Null.

### Beim Start eines neuen Chats sage einfach:

> "Lies SESSION_NOTES.md und TODO.md durch und sag mir wo wir stehen"

oder kürzer:

> "Lies die Doku und mach weiter"

### Claude wird dann automatisch:
1. ✅ Diese Datei lesen (Architektur-Entscheidungen, letzte Session, bekannte Issues)
2. ✅ `docs/TODO.md` lesen (offene Aufgaben, Prioritäten)
3. ✅ `CHANGELOG.md` scannen (letzte Änderungen)
4. ✅ Dir eine Zusammenfassung geben: "Wir stehen bei X, nächste Schritte: Y, bekannte Probleme: Z"

### Nach jedem Feature/Fix wird Claude automatisch aktualisieren:
- `docs/TODO.md` (Aufgaben abhaken, neue hinzufügen)
- `docs/SESSION_NOTES.md` (letzte Session, neue Learnings)
- `CHANGELOG.md` (Änderungen dokumentieren)
- `docs/releases/bugfix-*.md` (bei Bugfixes)

---

## Wichtige Erinnerungen

### Dokumentations-Pflege
- **IMMER** nach abgeschlossenen Features/Fixes die `docs/TODO.md` aktualisieren
- **IMMER** neue Bugs/Issues in diesem Dokument vermerken
- **IMMER** beim Start einer neuen Session diese Datei zuerst lesen

### Aktuelle Architektur-Entscheidungen

#### Express.js Routen-Reihenfolge (WICHTIG!)
- **Regel**: Spezifische Routen IMMER VOR generischen Routen definieren
- **Beispiel**: `/:id/preview-warnings` MUSS VOR `/:id` stehen
- **Grund**: Express matched die erste passende Route → generische Routen würden alles fangen
- **Betroffene Files**: Alle `*Routes.ts` Dateien im Backend

#### Prisma Migration Drift Problem
- **Status**: DB hat Migrationen, die lokal fehlen (20251003194454_add_absence_documents, 20251003202545_add_object_clearances)
- **Ursache**: Migrations wurden direkt in Prod-DB angewendet, aber nicht ins Git committed
- **Temporäre Lösung**: `documents` Select im absenceController auskommentiert
- **TODO**: Migration-State synchronisieren (siehe TODO.md)

### Bekannte Einschränkungen (Stand 2025-10-04)

1. **Absence Documents Upload**:
   - Feature existiert im Code, aber DB-Tabelle fehlt
   - Controller hat Documents-Select temporär disabled
   - Upload-Routes existieren, werden aber 404/500 geben

2. **Test-Daten**:
   - Script: `npm run seed` (im backend/)
   - Voraussetzung: DATABASE_URL muss gesetzt sein
   - Erstellt: 8 Mitarbeiter, 4 Sites, 35 Schichten, 8 Abwesenheits-Szenarien

3. **Frontend UX-Verbesserung geplant**:
   - User findet "auf Mitarbeiter-Namen klicken" nicht intuitiv
   - Alternative: Dedicated "Details" Button in Tabelle?
   - Status: Wartet auf User-Feedback nach Testing

## Letzte Session (2025-10-04 - Fortsetzung)

### Abgeschlossene Arbeiten (Session 1)
1. ✅ Express Routen-Reihenfolge Bug behoben (absenceRoutes.ts)
2. ✅ Query Validation für sortBy/sortDir erweitert
3. ✅ 401 Unauthorized bei User-Dropdown behoben
4. ✅ DB-Fehler mit temporärem Fix umgangen
5. ✅ Docker Images neu gebaut und deployed
6. ✅ Ersatz-Mitarbeiter Zuweisung implementiert (inkl. Auto-Refresh)
7. ✅ MANAGER Berechtigung für Shift-Zuweisung hinzugefügt
8. ✅ **ENTSCHEIDUNG**: Dashboard v1.7.0 vor Objekt-Management v1.8.0

### Abgeschlossene Arbeiten (Session 2 - Dashboard Backend)
9. ✅ **Dashboard Backend API komplett implementiert**:
   - ✅ dashboardController.ts (4 Endpoints: critical, pending-approvals, warnings, stats)
   - ✅ dashboardRoutes.ts (Routes mit RBAC für ADMIN/MANAGER)
   - ✅ app.ts aktualisiert (Routes registriert bei /api und /api/v1)
   - ✅ TypeScript Fehler behoben (ShiftStatus.PLANNED/ACTIVE statt strings)
   - ✅ Docker Build & Deploy erfolgreich
   - ✅ Alle 4 Endpoints manuell getestet mit curl:
     - GET /api/dashboard/critical → funktioniert
     - GET /api/dashboard/pending-approvals → funktioniert
     - GET /api/dashboard/warnings?days=7 → funktioniert (8 Warnungen gefunden)
     - GET /api/dashboard/stats → funktioniert (11 Mitarbeiter, 8 verfügbar)

### Session 3 (2025-10-05) – Dashboard Frontend gestartet ✅
1. ✅ Neue Dashboard Feature-Struktur angelegt (`frontend/src/features/dashboard/`)
2. ✅ Types & API-Layer erstellt (`types.ts`, `api.ts`)
3. ✅ UI-Komponenten umgesetzt:
   - CriticalShiftsCard, PendingApprovalsCard, WarningsCard, StatsCard
   - QuickApprovalModal mit Kapazitätsprüfung (nutzt `previewCapacityWarnings`)
4. ✅ `DashboardPage.tsx` komplett neu gebaut:
   - React Query für alle vier Endpoints (+60s Auto-Refresh)
   - Manueller Refresh-Button (`RefreshCcw`)
   - Quick-Actions (Approve/Reject) direkt im Dashboard inkl. Toasts
   - AbsenceDetailModal integriert (Details per Klick)
5. ✅ ESLint (`npm run lint`) läuft wieder grün (Naming-Fix in AbsencesList)

### Session 3 – Fortsetzung (2025-10-05) – Ersatzsuche & Tests ✅
6. ✅ Shift-basierte Ersatz-Suche implementiert:
   - Neuer Service `findReplacementCandidatesForShift` (`backend/src/services/replacementService.ts`)
   - Endpoint `GET /api/shifts/:id/replacement-candidates` (RBAC: ADMIN/MANAGER/DISPATCHER)
   - `shiftController` + `shiftRoutes` erweitert
7. ✅ Dashboard erweitert:
   - Ersatz-Suche Buttons in Critical/Warncards → öffnet vorhandenes ReplacementCandidatesModal
   - Ladezustände & Button-Disable für laufende Suche
   - Responsive Tweaks (flex-Kombinationen + Spinner States)
8. ✅ Tests ergänzt (`frontend/src/features/dashboard/__tests__/QuickApprovalModal.test.tsx`):
   - Verifiziert Warnungsanzeige & Happy Path Genehmigen/Ablehnen (Trim der Notiz)
9. ✅ Playwright E2E: `e2e/specs/dashboard-quick-actions.spec.ts` (Quick-Actions + Ersatzsuche, nutzt Seed-Manager)
10. ✅ Tooling: `npm run lint`, `npm run test -- QuickApprovalModal` grün
11. ✅ Migration-Drift geschlossen: `absence_documents`, `object_clearances` als nachträgliche SQL-Migrationen hinzugefügt
12. ✅ Pending-Approvals UX verbessert: detaillierte Schichtliste inkl. Kapazitätsstatus + softer Refresh nach Ersatz-Zuweisung
13. ✅ Backend-Kapazitätsberechnung nutzt tatsächliche Schichtzuweisungen (keine bloßen Clearance-Pools mehr)
14. ✅ Dev-Setup: `.env` auf `PUBLIC_HOST=localhost` gestellt, Docker-Compose neu ausgerollt, DB-Reset + `npm run seed`
15. ✅ Replacement-Modal meldet jetzt den zugewiesenen Mitarbeiter + Dashboard zeigt sofortigen Status/Toast
16. ✅ Pending-Karten: Scrollbares Schicht-Panel, Expand/Collapse, 3-Linien Teaser, Hinweise zu Neubefüllung

### Session 4 (2025-10-04) – Intelligent Replacement Planung 🚀
**User-Feedback**: Dashboard funktioniert, aber Code-Qualität verbesserungswürdig
**Neue Anforderung**: "Ich will sehen wie ausgelastet Mitarbeiter sind, Ruhezeiten, Präferenzen - das System soll den BESTEN empfehlen, nicht nur den verfügbaren"

1. ✅ Doku gelesen und aktuellen Stand analysiert
2. ✅ Problembereiche identifiziert:
   - Dashboard.tsx: 317 Zeilen, 10+ useState (schwer wartbar)
   - Duplizierter Code (Formatter in mehreren Cards)
   - Keine Memoization → Performance-Probleme
   - Emoji statt Icons (unprofessionell)
3. ✅ **ENTSCHEIDUNG**: Option A - Refactoring ZUERST, dann Intelligent Replacement
4. ✅ **Komplette Feature-Spec erstellt**: `docs/FEATURE_INTELLIGENT_REPLACEMENT.md` (1200+ Zeilen)

### Session 5 (2025-10-08) – Konsolidierter Seed & Präferenz-Editor
- ✅ Einheitsseed implementiert (`npm run seed`): legt komplette Demo-Landschaft an (Admins, Dispatcher, 10 Kernmitarbeiter, Replacement-Kandidaten, Sites, Clearances, Präferenzen, Workloads, Schichten, Abwesenheiten, Events, Vorfälle).
- ✅ Altes Duo (`seed:test-absences`, `seed:intelligent-replacement`) entfernt, Doku/Guides auf neuen Gesamtseed umgestellt (README, HEUTE_ABEND_TESTEN, Roadmap, Release Notes, Quick-Commands).
- ✅ Dashboard-Karte erweitert: zeigt jetzt zusätzlich `Zugewiesen`, `Abwesend`, `Bereits abgedeckt`, damit Überbuchungen transparent bleiben.
- ✅ Employee-Preferences-API (GET/PUT `/api/users/:id/preferences`) + Frontend-Editor (`/users/:id/preferences`, `/users/me/preferences`) verdrahtet; neuer Vitest für API-Stubs (`user.preferences.test.ts`).
- ✅ Intelligent-Replacement-Jobs aktiviert (Workload-/Fairness-Cron) + Compliance-Hook nach Schichtzuweisungen.
- ⚠️ Offene Punkte für morgen: Login-Limiter Reset-Logik (TTL), Integrationstest für `GET /api/dashboard/critical`, Performance-Test Replacement-Service (siehe TODO).
   - Phase 1: Dashboard Refactoring (v1.7.1)
   - Phase 2a: Datenmodell (EmployeePreferences, EmployeeWorkload, ComplianceViolation)
   - Phase 2b: Backend Scoring-Engine (Workload/Compliance/Fairness/Preference Scores)
   - Phase 2c: Frontend Intelligente UI
   - Phase 3: KI-Integration (später)
5. ✅ TODO.md aktualisiert mit kompletter Roadmap
6. ✅ SESSION_NOTES.md aktualisiert

### Session 6 (2025-10-08) – Rate-Limiter & Dashboard QA ✅
- 🔁 Login-Limiter: Redis-basierter Store setzt TTL jetzt automatisch (kein manueller Flush nötig); Test prüft Reset-Fenster (200 ms) + README/Troubleshooting Hinweis ergänzt.
- 📊 Dashboard Critical Endpoint: Integrationstest verifiziert neue Felder (`assignedEmployees`, `absentEmployees`, `coveredAbsences`, `coverageBufferBeforeAbsences`) samt Reason-Liste/Knappe Abdeckung.
- ⚙️ Replacement-Service: Performance-Test nutzt reale Scoring-Engine (keine Mock-Scores) für 50 Kandidaten <500 ms; Prisma-Mocks liefern deterministische Workload/Teamdaten.
- 📚 Docs: README enthält Abschnitt „Testdaten zurücksetzen“ (`npm run seed`), TODO/Session Notes aktualisiert.

### Session 5 (2025-10-04) – Dashboard Refactoring & Intelligent Replacement Phase 2a ✅
**Arbeitsmodus**: Fortsetzung nach Token-Erschöpfung aus Session 4
**Ziele**: Dashboard v1.7.1 Refactoring abschließen + Intelligent Replacement Phase 2a (Datenmodell)

#### Dashboard Refactoring v1.7.1 - KOMPLETT ✅
1. ✅ **Custom Hooks extrahiert** (5 neue Dateien):
   - `frontend/src/features/dashboard/hooks/useDashboardQueries.ts` - React Query Logik
   - `frontend/src/features/dashboard/hooks/useApprovalModal.ts` - Approval Modal State + Mutations
   - `frontend/src/features/dashboard/hooks/useReplacementModal.ts` - Replacement Modal State
   - `frontend/src/features/dashboard/hooks/useAbsenceDetail.ts` - Detail Modal State
   - `frontend/src/features/dashboard/hooks/useManualRefresh.ts` - Refresh-Logik mit Toasts
   - **Ergebnis**: Dashboard.tsx von 317 → 171 Zeilen (-46%)

2. ✅ **Code-Deduplizierung**:
   - `frontend/src/utils/formatting.ts` - Zentrale Formatter (dateFormatter, timeFormatter, shortDateFormatter, etc.)
   - Entfernt aus: CriticalShiftsCard.tsx, PendingApprovalsCard.tsx, WarningsCard.tsx
   - Wiederverwendbare Funktionen: formatDate(), formatTime(), formatDateTime(), formatShiftWindow()

3. ✅ **Icons statt Emojis** (Lucide Icons):
   - StatsCard: 📊 → BarChart3 (h-5 w-5 text-blue-600)
   - CriticalShiftsCard: 🔴 → AlertCircle (h-5 w-5 text-destructive)
   - PendingApprovalsCard: 🟡 → Clock (h-5 w-5 text-yellow-600)
   - WarningsCard: 🟠 → AlertTriangle (h-5 w-5 text-orange-600)
   - Actions: 🔍 → Search, 👁️ → Eye, ❌ → X, ✅ → Check

4. ✅ **Performance-Optimierung**:
   - Dashboard.tsx: Alle Event Handler mit useCallback() wrapped
   - Dashboard.tsx: loadingShiftId mit useMemo() berechnet
   - PendingApprovalsCard: Badge-Klassen in Helper-Funktionen extrahiert (getCriticalBadgeClass, getLeaveBadgeClass)
   - PendingApprovalsCard: toggleExpanded() mit useCallback()
   - CriticalShiftsCard: content bereits mit useMemo() optimiert

5. ✅ **Type-Safety-Fixes**:
   - PendingApproval Type zu Dashboard.tsx imports hinzugefügt
   - Implizite any Types in Callback-Funktionen behoben
   - Test-Suite angepasst: QuickApprovalModal.test.tsx (shiftDetails: [] hinzugefügt)
   - TypeScript Compiler: 0 Fehler ✅

#### Intelligent Replacement Phase 2a - Datenmodell KOMPLETT ✅
6. ✅ **Prisma Schema erweitert** (`backend/prisma/schema.prisma`):
   - **EmployeePreferences** Model (Zeile 293-329):
     - Schicht-Präferenzen: prefersNightShifts, prefersDayShifts, prefersWeekends
     - Stunden: targetMonthlyHours (160), minMonthlyHours (120), maxMonthlyHours (200)
     - Site-Präferenzen: preferredSiteIds[], avoidedSiteIds[]
     - Arbeitsrhythmus: prefersConsecutiveDays (5), minRestDaysPerWeek (2)
     - Schicht-Länge: prefersLongShifts, prefersShortShifts
   - **EmployeeWorkload** Model (Zeile 332-365):
     - Aggregierte Metriken: totalHours, scheduledHours, nightShiftCount, weekendShiftCount
     - Compliance: maxWeeklyHours, minRestHoursBetweenShifts (11h default)
     - Tracking: consecutiveDaysWorked, restDaysCount
     - Fairness-Score: fairnessScore (0-100)
     - Performance: Unique Index auf (userId, month, year)
   - **ComplianceViolation** Model (Zeile 368-392):
     - Violations: violationType, severity (WARNING/ERROR/CRITICAL)
     - Tracking: value, threshold (z.B. 9.0 vs 11.0 für Ruhezeit)
     - Resolution: resolvedAt, resolvedBy, resolvedNote
     - Indexes: (userId+createdAt), (violationType+severity)
   - **EmployeeProfile** erweitert (Zeile 238-241):
     - targetWeeklyHours: Float (40h default)
     - contractType: String (FULL_TIME default)
     - autoAcceptReplacement: Boolean (false default)

7. ✅ **User & Shift Relations erweitert**:
   - User: preferences, workload[], complianceViolations[]
   - Shift: complianceViolations[]

8. ✅ **Migration erstellt**:
   - `backend/prisma/migrations/20251004212443_add_intelligent_replacement_models/migration.sql`
   - DB resettet (Drift behoben: alte Migrationen synchronisiert)
   - Migration erfolgreich angewendet ✅

9. ✅ **Seed-Script erweitert** (`backend/src/utils/seedData.ts`):
   - Delete-Statements für neue Tabellen hinzugefügt
   - Default-Präferenzen für alle 5 Test-User erstellt (Admin, Dispatcher, Employee1-3)
   - Standard-Werte: Tagschicht bevorzugt, 160h/Monat, flexible Stunden, 5 Tage/Woche
   - Test erfolgreich: `npm run seed` läuft grün ✅

10. ✅ **Dokumentation aktualisiert**:
    - `docs/TODO.md`: Dashboard Refactoring v1.7.1 als ✅ ABGESCHLOSSEN markiert
    - `docs/TODO.md`: Phase 2a als ✅ ABGESCHLOSSEN markiert (2025-10-04)
    - `docs/SESSION_NOTES.md`: Diese Session dokumentiert

#### Intelligent Replacement Phase 2b - Backend Scoring-Engine KOMPLETT ✅
11. ✅ **intelligentReplacementService.ts erstellt** (`backend/src/services/intelligentReplacementService.ts` - 650+ Zeilen):
    - **4 Scoring-Funktionen** implementiert:
      - `calculateWorkloadScore()`: 70-90% Auslastung = Score 100, >110% = Score 0
      - `calculateComplianceScore()`: ArbZG §5 (11h Ruhe), §3 (48h/Woche), Max 6 Tage
      - `calculateFairnessScore()`: Vergleich Nachtschichten & Ersatz-Einsätze mit Team
      - `calculatePreferenceScore()`: Nacht/Tag, Stunden-Level, Sites, Wochenende
    - **Gewichtung in calculateTotalScore()**:
      - Compliance: 40% (höchste Prio - gesetzliche Anforderungen!)
      - Preference: 30% (Mitarbeiter-Zufriedenheit)
      - Fairness: 20% (gerechte Verteilung)
      - Workload: 10% (Auslastung)
    - **Haupt-Funktion calculateCandidateScore()**:
      - Lädt User mit Preferences & Workload
      - Berechnet alle 4 Sub-Scores
      - Generiert Metriken (Auslastung, Ruhezeit, Konsekutive Tage, etc.)
      - Erstellt Warnungen (REST_TIME, OVERWORKED, CONSECUTIVE_DAYS, PREFERENCE_MISMATCH)
      - Bestimmt Recommendation (OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED)
      - Weist Farben zu (green/yellow/orange/red)
    - **Helper-Funktionen**:
      - findLastShiftEnd() - Findet letzte beendete Schicht
      - calculateConsecutiveDays() - Zählt Arbeitstage in Folge (14-Tage-Fenster)
      - calculateTeamAverages() - Berechnet Team-Durchschnitte für Fairness
      - getRecommendation() - Mappt Score zu Recommendation Level
      - calculateShiftDuration() - Berechnet Schicht-Länge in Stunden

12. ✅ **API-Endpoint erstellt**:
    - **shiftController.ts** erweitert (Zeile 880-1027):
      - `getReplacementCandidatesV2()` - Neue Funktion für intelligente Suche
      - Verwendet alte Logik (findReplacementCandidatesForShift) für Kandidaten-Ermittlung
      - Berechnet Scores für alle Kandidaten mit Promise.all (parallel)
      - Fallback-Handling: Score 50 (ACCEPTABLE) bei Fehler + Warning
      - Sortierung: Beste Scores zuerst (descending by totalScore)
      - Meta-Daten: totalCandidates, optimalCandidates, goodCandidates
    - **shiftRoutes.ts** erweitert (Zeile 33-39):
      - Route `/:id/replacement-candidates-v2` VOR `:id/replacement-candidates` (Reihenfolge!)
      - RBAC: ADMIN, MANAGER, DISPATCHER
      - Method: GET

13. ✅ **Unit-Tests implementiert** (`backend/src/services/__tests__/intelligentReplacementService.test.ts` - 230+ Zeilen):
    - **31 Tests, alle ✓**:
      - calculateWorkloadScore: 6 Tests (optimal/good/acceptable/underutilized/overworked)
      - calculateComplianceScore: 6 Tests (full compliance/rest penalties/weekly hours/consecutive days/combined/clamp)
      - calculateFairnessScore: 5 Tests (perfect/night shift deviation/replacement deviation/combined/clamp)
      - calculatePreferenceScore: 9 Tests (no prefs/night vs day/hours level/sites/long shifts/clamp)
      - calculateTotalScore: 5 Tests (weights/compliance priority/zeros/all 100s/typical cases)
    - **Test-Ausführung**: 1.558s, 100% passed ✅

## Phase 2c: Frontend Intelligente UI (2025-10-05) ✅

### UI-Komponenten erstellt

1. ✅ **ScoreRing** (`frontend/src/components/ui/score-ring.tsx`):
   - SVG-basierter Kreis-Chart (0-100)
   - Farbcodiert: green/yellow/orange/red
   - 3 Größen: sm/md/lg
   - Score-Wert in der Mitte
   - Optionales Label

2. ✅ **MetricBadge** (`frontend/src/components/ui/metric-badge.tsx`):
   - Icon + Label + Wert
   - Status-basierte Farben (success/warning/error/neutral)
   - Lucide Icons Integration
   - 2 Größen: sm/md

3. ✅ **WarningBadge** (`frontend/src/components/ui/warning-badge.tsx`):
   - Warnungs-Icon + Text
   - 3 Severity-Stufen: info/warning/error
   - Farbcodierte Hintergründe und Icons
   - Icons: Info, AlertTriangle, AlertCircle

### API & Types

4. ✅ **ReplacementCandidateV2 Type** (`frontend/src/features/absences/types.ts`):
   - Vollständiger Type mit score, metrics, warnings
   - Recommendation Enum: OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED
   - Color Enum: green/yellow/orange/red
   - Metriken: currentHours, targetHours, utilizationPercent, restHours, etc.

5. ✅ **getReplacementCandidatesV2** API-Funktion (`frontend/src/features/absences/api.ts`):
   - GET /shifts/:id/replacement-candidates-v2
   - Optional absentUserId Parameter
   - Vollständige Type-Safety mit Response-Typen
   - Meta-Informationen: totalCandidates, optimalCandidates, goodCandidates

### Modal-Implementierung

6. ✅ **ReplacementCandidatesModalV2** (`frontend/src/features/absences/ReplacementCandidatesModalV2.tsx`):
   - **Score-Ring**: Zeigt Gesamt-Score (0-100) mit Farbe
   - **Recommendation-Badge**: OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED
   - **Metriken-Grid**:
     - Auslastung (BarChart3) - Status basierend auf 70-90% optimal
     - Ruhezeit (Clock) - Status basierend auf >= 11h
     - Nachtschichten (Moon) - Aktuell vs. Team-Durchschnitt
     - Ersätze (Users) - Aktuell vs. Team-Durchschnitt
   - **Warnungs-Badges**: Array von Warnungen aus Backend
   - **Detail-Scores aufklappbar**: Workload/Compliance/Fairness/Präferenz
   - **Farbcodierte Cards**: Grün/Gelb/Orange/Rot basierend auf Recommendation
   - **Sortierung**: Backend liefert bereits nach Score sortiert

7. ✅ **AbsenceDetailModal Integration** (`frontend/src/features/absences/AbsenceDetailModal.tsx`):
   - Umstellung auf v2 API (`getReplacementCandidatesV2`)
   - State-Update auf `ReplacementCandidateV2[]`
   - Modal-Rendering mit `ReplacementCandidatesModalV2`
   - TypeScript 0 Fehler ✅

### Offene Punkte
- [x] **v1.7.0 Backend**: Manager-Dashboard API ✅ FERTIG
- [x] **v1.7.0 Frontend**: Dashboard UI ✅ FERTIG
- [x] **v1.7.1**: Dashboard Refactoring ✅ ABGESCHLOSSEN (2025-10-04)
  - [x] State-Management in Custom Hooks (5 Hooks extrahiert)
  - [x] Code-Deduplizierung (utils/formatting.ts erstellt)
  - [x] UX: Icons statt Emoji (Lucide Icons konsequent genutzt)
  - [x] Performance: Memoization (useCallback + useMemo implementiert)
  - [x] Type-Safety: 0 TypeScript-Fehler ✅
- [x] **v1.8.0**: Intelligent Replacement System ✅ ABGESCHLOSSEN (Phase 2a-2c)
  - [x] **Phase 2a - Datenmodell**: ✅ ABGESCHLOSSEN (2025-10-04)
    - [x] EmployeePreferences, EmployeeWorkload, ComplianceViolation Models
    - [x] EmployeeProfile erweitert
    - [x] Migration + Seeds erfolgreich
  - [x] **Phase 2b - Backend Scoring-Engine**: ✅ ABGESCHLOSSEN (2025-10-04)
    - [x] intelligentReplacementService.ts (650+ Zeilen)
    - [x] calculateWorkloadScore(), calculateComplianceScore(), calculateFairnessScore(), calculatePreferenceScore()
    - [x] GET /api/shifts/:id/replacement-candidates-v2
    - [x] 31 Unit-Tests, alle ✓
  - [x] **Phase 2c - Frontend Intelligente UI**: ✅ ABGESCHLOSSEN (2025-10-05)
    - [x] ReplacementCandidatesModalV2 mit Score-basierter Anzeige
    - [x] ScoreRing, MetricBadge, WarningBadge UI-Komponenten
    - [x] v2 API Integration in AbsenceDetailModal
    - [x] TypeScript 0 Fehler
  - [ ] **Phase 3 - KI-Integration** (Später)
    - [ ] Predictive Scheduling (ML-Modell)
    - [ ] Automatische Zuweisung (mit Opt-In)
    - [ ] Workload-Dashboard für Manager
    - [ ] Team-Fairness-Übersicht
- [ ] **v2.0+**: KI-Integration (Predictive Scheduling, Auto-Assignment, Optimierung)
- [x] Migration Drift beheben ✅ (2025-10-04)

### Nächste Schritte für nächste Session
1. **Intelligent Replacement Phase 2b - Backend Scoring-Engine** 🎯:
   - `backend/src/services/intelligentReplacementService.ts` erstellen
   - 4 Scoring-Funktionen implementieren (siehe FEATURE_INTELLIGENT_REPLACEMENT.md)
   - API-Endpoint `/api/shifts/:id/replacement-candidates-v2` erstellen
   - Tests schreiben (Unit + Integration)
2. **Nach Backend**: Phase 2c - Frontend Intelligente UI
3. **Langfristig**: KI-Features (Phase 3) wie in FEATURE_INTELLIGENT_REPLACEMENT.md beschrieben

## Code-Locations (Quick Reference)

### Backend
- Routen: `backend/src/routes/`
  - Dashboard: `backend/src/routes/dashboardRoutes.ts` (NEU v1.7.0)
- Controller: `backend/src/controllers/`
  - Dashboard: `backend/src/controllers/dashboardController.ts` (NEU v1.7.0)
- Validierung: `backend/src/validations/`
- Prisma Schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`

### Frontend
- Features: `frontend/src/features/`
- Absences: `frontend/src/features/absences/`
  - Liste: `AbsencesList.tsx`
  - Detail-Modal: `AbsenceDetailModal.tsx`
  - API-Calls: `api.ts`

### Dokumentation
- TODO-Liste: `docs/TODO.md` (HAUPTDOKUMENT!)
- Feature-Specs: `docs/FEATURE_*.md`
- Session Notes: `docs/SESSION_NOTES.md` (DIESE DATEI!)

## Wartungs-Checkliste (nach jedem Feature/Fix)

- [ ] `docs/TODO.md` aktualisiert?
- [ ] `docs/SESSION_NOTES.md` aktualisiert?
- [ ] `CHANGELOG.md` aktualisiert?
- [ ] Relevante Feature-Docs aktualisiert?
- [ ] Bei Bugfixes: `docs/releases/bugfix-YYYY-MM-DD.md` erstellt?
- [ ] Code kompiliert ohne Fehler?
- [ ] Docker Image gebaut und getestet?
- [ ] Migrations angewendet (falls DB-Änderungen)?
- [ ] User über Fortschritt informiert?

## Dokumentations-Hierarchie (wichtig!)

1. **TODO.md** (Hauptdokument) – Was steht an?
   - Aktuelle Aufgaben nach Priorität
   - Abgeschlossene Features markieren
   - Bekannte Bugs/TODOs tracken

2. **SESSION_NOTES.md** (Kontinuität) – Was muss ich wissen?
   - Architektur-Entscheidungen
   - Bekannte Einschränkungen
   - Quick Reference für Code-Locations
   - Letzte Session zusammenfassen

3. **CHANGELOG.md** (Historie) – Was wurde gemacht?
   - Alle Releases chronologisch
   - Format: [Version] - Datum - Kurztitel
   - Kategorien: Added, Changed, Fixed, Removed, Security

4. **releases/bugfix-*.md** (Details) – Wie wurde es gelöst?
   - Detaillierte Bugfix-Beschreibungen
   - Root Cause Analysis
   - Code-Beispiele vorher/nachher
   - Lessons Learned

5. **FEATURE_*.md** (Specs) – Wie funktioniert es?
   - Feature-Konzepte und Architektur
   - API-Spezifikationen
   - Akzeptanzkriterien

---

**Letzte Aktualisierung**: 2025-10-05 21:10 UTC
**Von**: Codex (GPT-5)

**Status dieser Session**:
- ✅ TODO.md aktualisiert (Dashboard Frontend Fortschritte dokumentiert)
- ✅ SESSION_NOTES.md aktualisiert (Session 3 erfasst)
- ✅ FEATURE_DASHBOARD.md bleibt Referenz für offene Aufgaben
- ✅ Dashboard Frontend Grundgerüst steht (Phase 2, Teil 1)
- ✅ Ersatz-Suche & Vitest ergänzt (Phase 2, Teil 2)
- ✅ Playwright-E2E + Migrationen nachgezogen (Phase 2, Teil 3)
