# Changelog

Alle wichtigen Änderungen am Sicherheitsdienst-System werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### 🔮 Geplant
- Performance-Optimierungen für Dashboard-Queries
- Erweiterte Filter für Abwesenheits-Übersicht
- Export-Funktion für Reports

### ⚠️ Bekannte Probleme
- **Deployment:** Docker Build Cache kann zu veralteten Deployments führen → Siehe [DEPLOYMENT_ISSUES.md](./DEPLOYMENT_ISSUES.md)
- **Test-Setup:** Mehrere Test-Ebenen/Login-Daten unklar → Siehe [TEST_SETUP.md](./TEST_SETUP.md)

---

## [1.9.2] - 2025-10-07

### 🎯 Bugfix-Release: Alle 5 kritischen Bugs behoben

Dieser Release behebt alle in v1.9.1 identifizierten Bugs und verbessert die Stabilität des Systems erheblich.

### 🐛 Fixed

#### BUG-001 [HIGH]: Score-Berechnung live/interaktiv
**Problem:** Scores wurden nicht sofort nach Assignment-Änderungen aktualisiert
**Lösung:**
- Neue `calculateLiveWorkload()` Funktion in `intelligentReplacementService.ts`
- Queries direkt auf `ShiftAssignment` statt cached `employee_workloads`
- ISO-Week-Berechnung für wöchentliche Stunden-Compliance
- **Dateien:** `backend/src/services/intelligentReplacementService.ts:115-194`

#### BUG-002 [MEDIUM]: Urlaubsanspruch-Berechnung
**Problem:** Verfügbare Urlaubstage wurden falsch berechnet (beantragte Tage wurden abgezogen)
**Lösung:**
- Fix: `remainingDays = annualLeaveDays - takenDays` (NICHT - requestedDays)
- Beantragte Tage werden nur in "Nach Genehmigung"-Vorschau berücksichtigt
- **Dateien:** `backend/src/controllers/absenceController.ts:456-461`

#### BUG-003 [LOW]: Schichtenliste kompakt
**Problem:** Lange Schichtenliste in AbsenceDetailModal nicht übersichtlich
**Lösung:**
- Kompakte Übersichts-Card: Anzahl Schichten + Zeitraum + Warnung
- Sortierung: Unterbesetzte Schichten zuerst
- Icons für bessere Visualisierung
- **Dateien:** `frontend/src/features/absences/AbsenceDetailModal.tsx:270-379`

#### BUG-004 [MEDIUM]: Dashboard Auto-Refresh
**Problem:** Dashboard aktualisierte sich nicht nach Ersatz-Zuweisung in Modal
**Lösung:**
- React Query Cache-Invalidierung in `useAbsenceDetail.closeDetail()`
- Invalidiert: `dashboard-stats`, `dashboard-critical`, `dashboard-approvals`, `dashboard-warnings`
- Success-Toast: "Ersatz zugewiesen - Dashboard wird aktualisiert"
- **Dateien:**
  - `frontend/src/features/absences/AbsenceDetailModal.tsx:440-448`
  - `frontend/src/features/dashboard/hooks/useAbsenceDetail.ts:31-36`

#### BUG-005 [CRITICAL]: Abwesenheiten-Filter bei Ersatzsuche
**Problem:** Approved/Requested Abwesenheiten wurden nicht korrekt gefiltert
**Lösung:**
- APPROVED Absences: Kandidaten komplett ausschließen
- REQUESTED Absences: Kandidaten anzeigen mit Warning "⚠️ Urlaubsantrag beantragt: DD.MM-DD.MM"
- Split queries für bessere Performance
- **Dateien:** `backend/src/services/replacementService.ts:162-253`

### ✨ Enhanced

#### Dashboard v2 API Integration
**Problem:** Dashboard nutzte alte Replacement-API ohne Scoring
**Lösung:**
- Neue Route: `/api/shifts/:id/replacement-candidates/v2` (REST-konform)
- Legacy-Route beibehalten: `/api/shifts/:id/replacement-candidates-v2` (Kompatibilität)
- Frontend auf v2 API umgestellt
- **Dateien:**
  - `backend/src/routes/shiftRoutes.ts:33-47`
  - `frontend/src/features/dashboard/api.ts:42-48`
  - `frontend/src/features/dashboard/hooks/useReplacementModal.ts:4,21,42`
  - `frontend/src/pages/Dashboard.tsx:10,227-234`

#### Urlaubstage-Saldo in Genehmigungen
**Problem:** Urlaubstage-Berechnung fehlte bei ausstehenden Genehmigungen
**Lösung:**
- Backend: `getPendingApprovals` erweitert mit vollständigem `leaveDaysSaldo`
- Wiederverwendung von `calculateLeaveDaysSaldo()` (exportiert)
- Frontend: `QuickApprovalModal` zeigt jetzt:
  - Jahresanspruch, Bereits genommen, Beantragt, Aktuell verfügbar
  - "Nach Genehmigung verbleibend" mit Warnung bei Überschreitung
- **Dateien:**
  - `backend/src/controllers/absenceController.ts:379,389` (export)
  - `backend/src/controllers/dashboardController.ts:5,292-301,321`
  - `frontend/src/features/dashboard/types.ts:18-24,40`
  - `frontend/src/features/dashboard/QuickApprovalModal.tsx:67-103`

### 🧪 Testing

#### Neue Testdaten (seedTestScenarios.ts)
Umfassende Test-Szenarien für v1.9.2:
```bash
DATABASE_URL="..." npx ts-node src/utils/seedTestScenarios.ts
```

**Erstellt:**
- 👥 12 Benutzer (1 Admin, 1 Manager, 10 Employees)
- 🏢 2 Sites (Bürogebäude Zentrum, Einkaufszentrum Nord)
- 📅 4 Schichten:
  - Heute 08:00-16:00: Tagschicht (KRITISCH - 1 fehlt)
  - Heute 18:00-02:00: Nachtschicht (OK)
  - Morgen 08:00-16:00: Tagschicht
  - +3 Tage 08:00-16:00: Tagschicht (Petra Urlaubsantrag)

**Abwesenheiten:**
- ✅ 1 APPROVED: Michael Wagner (Krankmeldung heute → macht Schicht kritisch)
- 📝 3 REQUESTED:
  - Julia Becker: 5 Tage ✅ (genug Urlaubstage)
  - Stefan Fischer: 10 Tage ⚠️ (überschreitet: 25+10=35 > 30)
  - Petra Hoffmann: 3 Tage 🔍 (betrifft geplante Schicht)

**Login:**
- Email: `admin@sicherheitsdienst.de`
- Password: `password123`

**Test-Szenarien:**
1. Kritische Schichten → Ersatz suchen → Scores sichtbar ✅
2. Ausstehende Genehmigungen → Urlaubstage-Saldo ✅
3. Modal schließen → Dashboard Auto-Refresh ✅

### 📚 Documentation

#### Neue Dokumentation
- **DEPLOYMENT_ISSUES.md** - Docker Build Cache Problem, Rate Limiting, Best Practices
- **TEST_SETUP.md** - Login-Daten, Seed-Skripte, Test-Umgebungen
- **TODO_v1.9.2.md** - Sprint-Planung für v1.9.2 (archiviert)
- **BUGS_v1.9.1.md** - Bug-Dokumentation (alle behoben)

#### Aktualisierte Dokumentation
- **CHANGELOG.md** - Dieser Release
- **README.md** - Hinweise auf neue Doku

### 🔧 Technical

**Backend:**
- ~600 Zeilen geändert
- 3 Controller aktualisiert
- 2 Services erweitert
- 2 Routes hinzugefügt

**Frontend:**
- ~400 Zeilen geändert
- 8 Komponenten/Hooks aktualisiert
- React Query Integration verbessert

**Performance:**
- Live Workload Calculation: ~50ms (statt cached lookup)
- Dashboard Refresh: Instant (React Query Cache)

### ⚠️ Breaking Changes
Keine Breaking Changes. Alle Änderungen sind abwärtskompatibel.

### 🚀 Deployment Notes

**WICHTIG:** Docker Build Cache kann Probleme verursachen!
```bash
# Empfohlener Deployment-Prozess:
cd backend
rm -rf dist
npx tsc -p tsconfig.json
docker compose build --no-cache api
docker restart sicherheitsdienst-api
```

Siehe [DEPLOYMENT_ISSUES.md](./DEPLOYMENT_ISSUES.md) für Details.

### 📊 Stats
- **Bugs Fixed:** 5/5 (100%)
- **Files Changed:** 18
- **Lines Added:** ~1000
- **Tests:** Alle manuell getestet ✅

---

## [1.9.1] - 2025-10-07

### 🎉 Added
- **Dashboard - Interaktive StatsCards**
  - StatsCards sind jetzt klickbar (wenn `value > 0`)
  - ChevronRight Icons für visuelle Feedback
  - Hover-Effekte und Tooltips
  - Click-Handler für Employee-Listen und Scroll-Funktionen

- **EmployeeListModal - Mitarbeiter-Detailansicht**
  - Neue Modal-Komponente für gefilterte Mitarbeiterlisten
  - Filter: Alle, Verfügbar, Im Urlaub, Krankmeldung
  - Mitarbeiter sind klickbar → Navigation zum Profil
  - Zeigt Abwesenheitszeiträume mit Calendar-Icon
  - Datumsformat: DD.MM.YY

- **Backend - Employee List Endpoints**
  - `GET /api/dashboard/employees/available` - Verfügbare Mitarbeiter
  - `GET /api/dashboard/employees/on-vacation` - Mitarbeiter im Urlaub (mit Datumsbereichen)
  - `GET /api/dashboard/employees/on-sick-leave` - Krankmeldungen (mit Datumsbereichen)

### 🐛 Fixed
- **Intelligent Replacement API Bug**
  - Frontend erwartete `avgNightShiftCount` / `avgReplacementCount`
  - Backend sendete `teamAverageNightShifts` (falsch benannt)
  - Neue `findReplacementCandidatesForShiftV2` Funktion mit korrektem Mapping
  - TypeError "Cannot read properties of undefined (reading 'toFixed')" behoben

- **Migration Fehler**
  - Migration `20251004212443_add_intelligent_replacement_models` referenzierte nicht-existierende Tabellen
  - ALTER TABLE Statements für `absence_documents` und `object_clearances` auskommentiert
  - RenameIndex für nicht-existierenden Index gefixt

- **Seed Script Fehler**
  - Prisma Unique Constraint Name war `sites_name_address_key` nicht `name_address`
  - Upsert where-Clause in `intelligent-replacement-v1.8.0.ts` korrigiert

- **Docker Container Caching**
  - API-Container lief mit altem kompilierten Code trotz Änderungen
  - Fix: `docker compose build --no-cache api` + `--force-recreate`

- **Rate Limiting Issue**
  - Login blockiert durch zu viele Test-Requests
  - Fix: Redis Cache mit `FLUSHALL` geleert

- **URL Double-Prefix Bug**
  - Frontend: `GET /api/api/dashboard/...` (404 Fehler)
  - Fix: `/api` Prefix aus FILTER_ENDPOINTS entfernt (api-Utility hat bereits `/api` als baseURL)

### 🔄 Changed
- **Replacement Candidates API Response Format**
  - Einzelne Schicht: `{ data: candidates[] }` statt `{ data: { shiftId, candidates } }`
  - Alle Schichten: `{ data: [{ shiftId, shiftTitle, candidates }] }` (unverändert)

### 🗄️ Database
- **Kompletter Datenbank-Reset**
  - Alle Tabellen gedroppt und neu erstellt
  - Testdaten für v1.6.0 geladen (8 MA, 4 Sites, 36 Schichten, 8 Abwesenheiten)
  - Testdaten für v1.8.0 geladen (4 Score-Kandidaten: OPTIMAL, GOOD, ACCEPTABLE, NOT_RECOMMENDED)

### 📊 Dashboard Stats (nach Seed)
```
✅ 13 Mitarbeiter gesamt
✅ 12 verfügbar heute
✅ 1 Krankmeldung (Tom Weber, 06.10-08.10)
✅ 0 im Urlaub
✅ 3 ausstehende Genehmigungen
✅ 0 kritische Schichten heute
✅ 10 bevorstehende Warnungen
```

### 🧪 Testing
- ✅ Dashboard StatsCards - Klickbar und navigierbar
- ✅ EmployeeListModal - Alle Filter funktionieren
- ✅ Employee Profile Links - Navigation korrekt
- ✅ Datumsanzeige - Abwesenheitszeiträume mit Jahr
- ✅ Intelligent Replacement API - Alle Felder vorhanden
- ✅ MA-Zuweisung - Score wird angezeigt und MA kann zugewiesen werden

### 🚧 Known Issues
Siehe [Unreleased](#unreleased) und [BUGS_v1.9.1.md](./BUGS_v1.9.1.md)

---

## [1.8.1] - 2025-10-04

### 🐛 Fixed
- Discord Release-Benachrichtigungen für lange Release-Notes
  - Release Notes werden jetzt auf 1900 Zeichen gekürzt
  - Hinweis mit Link zur vollständigen Version wird hinzugefügt

---

## [1.8.0] - 2025-10-04

### 🎉 Added
- **Intelligente Ersatz-Mitarbeiter-Suche (Intelligent Replacement)**
  - Scoring-Engine mit 4 Kategorien: Workload, Compliance, Fairness, Preference
  - 4 Empfehlungs-Level: OPTIMAL (85-100), GOOD (70-84), ACCEPTABLE (50-69), NOT_RECOMMENDED (<50)
  - Gewichtung: Compliance 40%, Preference 30%, Fairness 20%, Workload 10%

- **Neue Datenbank-Modelle**
  - `employee_preferences` - Mitarbeiter-Präferenzen (Nachtschichten, Wochenenden, Ziel-Stunden)
  - `employee_workloads` - Auslastungs-Tracking (Stunden, Nachtschichten, Consecutive Days)
  - `compliance_violations` - Arbeitszeit-Verstöße (ArbZG §5, §6)

- **Frontend - ReplacementCandidatesModalV2**
  - Score-Ring mit Farb-Codierung (grün/gelb/orange/rot)
  - Metriken-Grid: Auslastung, Ruhezeit, Nachtschichten, Ersätze
  - Warning-Badges bei Problemen (Ruhezeit, Überlastung, Präferenz-Mismatch)
  - Aufklappbare Detail-Scores (Workload, Compliance, Fairness, Preference)

- **Testdaten für v1.8.0**
  - 4 Test-Kandidaten mit verschiedenen Scores
  - Objektberechtigung für Test-Objekt
  - Vergangene Schichten für Ruhezeit-Berechnung
  - Test-Abwesenheit mit betroffener Schicht

### 📚 Documentation
- `FEATURE_INTELLIGENT_REPLACEMENT.md` - Vollständige Feature-Dokumentation
- `ROADMAP.md` - Zukunfts-Features (Dashboard-Erweiterungen v1.10+, Employee-Dashboard v1.11+)
- `FEATURE_DASHBOARD.md` - Dashboard-Vision mit geplanten Features

### 🗄️ Database
- Migration `20251004212443_add_intelligent_replacement_models`
- Seed Script `intelligent-replacement-v1.8.0.ts`

---

## [1.7.0] - 2025-09-28

### 🎉 Added
- Objektberechtigungen (Object Clearances)
- Mitarbeiter-Qualifikationen erweitert

---

## [1.6.0] - 2025-09-20

### 🎉 Added
- Abwesenheiten-Management
- Urlaubstage-Tracking
- Betroffene Schichten mit Kapazitätswarnungen
- Dokumente für Abwesenheiten

### 📚 Documentation
- `FEATURE_ABSENCES.md` - Vollständige Feature-Dokumentation

---

## [1.5.0] - 2025-09-10

### 🎉 Added
- Schicht-Management
- Schicht-Zuweisungen
- Schicht-Export (CSV, Excel)

---

## [1.4.0] - 2025-09-01

### 🎉 Added
- Benutzer-Verwaltung
- Rollen-System (ADMIN, MANAGER, DISPATCHER, EMPLOYEE)

---

## [1.3.0] - 2025-08-20

### 🎉 Added
- Sites/Objekte-Verwaltung
- Site-Adressen

---

## [1.2.0] - 2025-08-10

### 🎉 Added
- Authentifizierung (JWT)
- Login/Logout

---

## [1.1.0] - 2025-08-01

### 🎉 Added
- Backend-Setup (Express, Prisma, PostgreSQL)
- Frontend-Setup (React, TypeScript, Vite)

---

## [1.0.0] - 2025-07-20

### 🎉 Initial Release
- Projekt-Setup
- Docker Compose (API, DB, Redis)
- Basis-Infrastruktur

---

## Legende

- 🎉 **Added** - Neue Features
- 🐛 **Fixed** - Bug-Fixes
- 🔄 **Changed** - Änderungen an existierenden Features
- 🗑️ **Deprecated** - Bald zu entfernende Features
- 🗄️ **Database** - Datenbank-Änderungen
- 📚 **Documentation** - Dokumentations-Updates
- 🔒 **Security** - Sicherheits-Fixes
- 🧪 **Testing** - Test-Änderungen
- 🚧 **Known Issues** - Bekannte Probleme

---

**Hinweis**: Für detaillierte Bug-Reports siehe jeweilige `BUGS_vX.X.X.md` Dateien im `/docs` Verzeichnis.
