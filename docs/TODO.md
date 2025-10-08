# TODO / Roadmap (aktueller Stand)

Stand: 2025-10-08 (nach v1.9.2 Planung und Code-Refactoring)

## Kurzfristig (P1, 1–2 Tage)

### Bugfixes 2025-10-04 ✅
- [x] **Express Routen-Reihenfolge Bug (absenceRoutes.ts)**:
  - Problem: `/:id/preview-warnings` wurde nach `/:id` definiert → 404 Fehler
  - Fix: Spezifische Routen (mit mehr Segmenten) jetzt VOR generischen Routen
  - Betrifft: preview-warnings, replacement-candidates, approve/reject/cancel
- [x] **Absences Query Validation Bug**:
  - Problem: Frontend sendet `sortDir=asc`, aber Backend-Validierung erlaubte es nicht → 400 Error
  - Fix: `sortBy` und `sortDir` zu `listAbsenceQuerySchema` hinzugefügt
- [x] **401 Unauthorized bei Mitarbeiter-Dropdown**:
  - Problem: User-Query wurde ausgeführt bevor User geladen war
  - Fix: `enabled: isManager && !!user` statt nur `isManager` in AbsencesList.tsx
- [x] **DB-Fehler bei Absences-Liste**:
  - Problem: `absence_documents` Tabelle fehlt in DB (Migration drift)
  - Temporärer Fix: Documents-Select im Controller auskommentiert
  - ✅ Migration & Controller wieder aktiv (2025-10-08): Tabelle vorhanden, Dokumente werden erneut geladen
- [x] **Ersatz-Mitarbeiter Zuweisung funktioniert nicht**:
  - Problem: Nur Alert, keine echte Zuweisung
  - Fix: API-Call zu POST /shifts/:id/assign implementiert
  - Fix: Auto-Refresh nach Zuweisung (visuelle Bestätigung)
  - Fix: MANAGER zu authorize() hinzugefügt (shiftRoutes.ts:50)

### Abwesenheiten: Abgeschlossen ✅
- [x] **v1.6.0 - Detailansicht & Kontext**:
  - [x] Urlaubsantrag-Detailansicht (Modal mit vollständigen Informationen)
  - [x] Urlaubstage-Saldo (EmployeeProfile.annualLeaveDays, Berechnung & Anzeige)
  - [x] Objekt-Zuordnung anzeigen (ObjectClearances mit Status-Icons)
  - [x] Betroffene Schichten mit Kapazitätswarnungen
  - [x] Ersatz-Mitarbeiter-Suche (API + UI mit "Ersatz finden" Button)
  - [x] Krankmeldung Manager-Benachrichtigung
  - [x] Test-Daten Script (`npm run seed`)
  - Release: v1.6.0 (2025-10-04)
- [x] Abwesenheiten Phase 2: Dokument-/Attest-Uploads (v1.5.0)
- [x] Kalender-Ansicht (v1.5.1)
- [x] Kapazitätswarnung mit Preview (v1.5.1)
- [x] Abwesenheiten-Benachrichtigungen: Approve/Reject/Cancel (v1.5.0)
- [x] Profil & Auth Tests: Vitest + Integrationstest für Absence-Konflikte (v1.5.0)
- [x] Bug-Fix: Admin-erstellte Urlaube nicht auto-genehmigen (v1.5.1)
- [x] Manager-Dashboard: Badge + Quick-Filter (v1.5.1)

- ## Kurzfristig (Status: abgeschlossen)
- [x] Login-Limiter Observability
  - Akzeptanz: Auth-Login-Limiter exportiert Prometheus-Zähler (Hits, Blocked); Dashboard + Alert-Empfehlung dokumentiert.
- [x] Login-Limiter QA
  - Akzeptanz: Integrationstest deckt ENV-Overrides (`LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`) ab; Dev-Doku erklärt Default/Fallback klar (README/Troubleshooting aktualisiert, QA-Notiz).
- [x] Frontend Feedback für 429 Login
  - Akzeptanz: UI zeigt dedizierten Hinweis + Retry-Countdown, wenn API 429 liefert; UX-Review bestätigt.
- [x] Login-Limiter Reset-Logik verbessern
  - TTL/Auto-Reset greift jetzt auch ohne manuellen Redis-Flush; Tests decken Ablauf nach 200 ms ab, README/Troubleshooting ergänzt.
- [x] Dashboard-Kritikdaten automatisiert prüfen
  - Neuer Integrationstest validiert `GET /api/dashboard/critical` inkl. Feldern `assignedEmployees`, `absentEmployees`, `coveredAbsences`, `coverageBufferBeforeAbsences`.
- [x] Replacement-API Performance-Check abschließen
  - Performance-Test nutzt reale Scoring-Engine mit 50 Kandidaten und bleibt stabil unter 500 ms.
- [x] Seed-Dokumentation in README synchron halten
  - README beschreibt nun explizit das Zurücksetzen der Testdaten via `npm run seed`.

### Kurzfristig (nächste Session)
- [ ] Abwesenheiten: ICS/Kalender-Export spezifizieren und MVP-Implementierung für `/api/absences/export.ics` vorbereiten (siehe `docs/planning/absences.md`).
- [ ] Replacement-Service Observability: Prometheus-Kennzahlen für Score-Berechnung und Performance in `/api/stats` einspeisen.
- [ ] Dashboard UX: StatsCard klickbar machen und Navigation zu gefilterten Ansichten hinterlegen (Feature-Note in `docs/FEATURE_DASHBOARD.md`).

- [x] Monitoring: Alert-Routing (Grafana/Alertmanager) gegen Ops-Kanal verdrahten
  - Akzeptanz: Neue Audit-Warnungen (Queue, Direct/Flush-Failures, Prune) laufen im gewünschten Kanal auf.
- [x] Monitoring: Audit-Dashboard (`svc-audit-trail`) auf Prod-Grafana importieren & Panels feinjustieren
  - Akzeptanz: Queue/Failures/Prune-Panels zeigen Daten aus Produktions-Prometheus.
- [x] Monitoring-Dokumentation: Compose-Ports (Prometheus 9090, Grafana 3300) & Betriebs-Checkliste finalisieren
  - Akzeptanz: README / MONITORING.md enthalten klare Schritte für Deploy & Betrieb, inkl. Skripte `import-dashboard.sh` und `reload-prometheus.sh`.

- [x] Monitoring: Synthetische Checks (Blackbox Exporter) für SLOs
  - Akzeptanz: Blackbox‑Exporter als Service in `docker-compose.monitoring.yml`, Prometheus‑Job `blackbox` (HTTP‑Probe `/healthz`/`/readyz`), Panels in `latency-and-errors` zeigen Ergebnisse; MONITORING.md enthält Konfig‑Snippet.
- [x] ENV/Onboarding: `.env.example` verlinken und Root‑.env erklären
  - Akzeptanz: GETTING_STARTED.md verlinkt `.env.example` (Root) und erläutert kurz, wann Root‑.env (Monitoring/Compose) vs. Service‑`.env.example` (backend/frontend) genutzt wird.
- [x] Alert‑Routing validieren (Slack/Webhook)
  - Akzeptanz: Test‑Alerts erscheinen im konfigurierten Slack‑Audit‑Kanal (`ALERTMANAGER_SLACK_AUDIT_CHANNEL`) und Ops‑Webhook empfängt `severity=critical`; Vorgehen in MONITORING.md dokumentiert.
- [x] CI‑Sichtbarkeit schärfen
  - Akzeptanz: `metrics-smoke` zusätzlich zeitgesteuert (cron) ausführen; Artefakt‑Links in Benachrichtigungen verweisen auf Reports/Dashboards.
- [x] Doku‑Feinschliff (Ports/Dashboards)
  - Akzeptanz: README nennt unterschiedliche Grafana‑Ports (Dev‑Compose 3002 vs. Monitoring 3300) und listet Import‑Befehle für `latency-and-errors`, `top-routes-p95`, `top-routes-5xx`.

Erledigt:
- [x] Auth Login-Limiter konfigurierbar (ENV `LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`, sichere Defaults, Compose Override, Docs aktualisiert).
- [x] Seeds nutzen gemeinsame Helper (`resetSeedData`, `createUserWithPassword`) (2025-10-08)
- [x] Swagger UI (Dev) unter `/api-docs` mit YAML‑Quelle (`/api-docs-spec/openapi.yaml`).
- [x] Users: RBAC‑Negativtests ergänzen (403/401) – analog zu Sites/Shifts
  - Akzeptanz: Tests schlagen korrekt bei EMPLOYEE/anonymous an; CI grün.
- [x] OpenAPI Feinschliff – operationId/Beispiele für Randendpunkte prüfen/ergänzen
  - Akzeptanz: Redocly lint ohne neue Errors; konsistente Beispieldaten.
- [x] README Quickstart (Docker Compose) – kurzer Abschnitt mit `.env.example`, `docker-compose up`, Healthcheck‑Hinweis
  - Akzeptanz: Schritte reproduzierbar; Hinweis auf `prisma migrate deploy`.
- [x] Error‑Responses Smoke‑Tests – 401/422 prüfen (Shape: code/message/details/errors)
  - Akzeptanz: 2–3 schlanke Tests, keine Ports/DB nötig.

## Mittelfristig (P2)

### Mittelfristig – Geplante Releases
- **v1.10.0 Präferenzen-Editor** (1-2 Wochen) – Mitarbeiter kann Präferenzen pflegen; API `GET/PUT /api/employees/:id/preferences` + UI-Formular
- **v1.11.0 Workload-Dashboard** (2-3 Wochen) – Mitarbeiter sehen Auslastung/Fairness; API `GET /api/employees/:id/workload`
- **v1.12.0 Team-Fairness-Übersicht** (3-4 Wochen) – Manager-Vergleichstabelle, Filter & Exporte
- **v1.13.0 Automatische Workload-Berechnung** (4-5 Wochen) – Cron-Jobs, Compliance-Violations, Benachrichtigungen


### Manager-Dashboard v1.7.0 ✅ ABGESCHLOSSEN (mit Refactoring-Bedarf)
**Entscheidung 2025-10-04**: Dashboard VOR Objekt-Management
- **User-Feedback**: "Abwesenheiten interessieren mich nur wenn es Probleme gibt"
- **Ziel**: Workflow-orientiert statt daten-orientiert
- [x] **Dashboard-Konzept & Wireframe**: ✅ docs/FEATURE_DASHBOARD.md
- [x] **Backend API-Endpoints**: ✅ FERTIG & GETESTET
- [x] **Frontend Dashboard-Page**: ✅ FUNKTIONIERT (aber Code-Qualität verbesserungswürdig)
  - ⚠️ **Problem**: Dashboard.tsx hat 317 Zeilen, 10+ useState, schwer wartbar
  - ⚠️ **Problem**: Duplizierter Code (Formatter in mehreren Cards)
  - ⚠️ **Problem**: Keine Memoization → Performance-Probleme
  - ⚠️ **Problem**: Emoji statt Icons (unprofessionell)

### Dashboard Refactoring v1.7.1 ✅ ABGESCHLOSSEN
**Warum**: Saubere Basis für komplexe Features (Intelligent Replacement)
**Siehe**: `docs/FEATURE_INTELLIGENT_REPLACEMENT.md` → Phase 1
**Datum**: 2025-10-04

- [x] **State-Management vereinfachen**:
  - [x] `useDashboardQueries()` Hook extrahiert (Dashboard.tsx: 317→171 Zeilen)
  - [x] `useApprovalModal()` Hook extrahiert
  - [x] `useReplacementModal()` Hook extrahiert
  - [x] `useAbsenceDetail()` Hook extrahiert
  - [x] `useManualRefresh()` Hook extrahiert
- [x] **Code-Deduplizierung**:
  - [x] `utils/formatting.ts` - Zentrale Formatter erstellt
  - [x] Duplikate aus CriticalShiftsCard, PendingApprovalsCard, WarningsCard entfernt
  - [x] Intl.DateTimeFormat-Instanzen vereinheitlicht
- [x] **UX-Verbesserungen**:
  - [x] Icons statt Emoji (Lucide Icons: AlertCircle, Clock, BarChart3, etc.)
  - [x] Konsistente Icon-Größen und Farben
  - [x] Bessere visuelle Hierarchie
- [x] **Performance-Optimierung**:
  - [x] `useMemo` für berechnete Werte (loadingShiftId in Dashboard)
  - [x] `useCallback` für alle Event Handlers
  - [x] CriticalShiftsCard bereits mit useMemo optimiert
  - [x] Badge-Klassen in Helper-Funktionen extrahiert
- [x] **Type-Safety**:
  - [x] PendingApproval Type zu Dashboard imports hinzugefügt
  - [x] Test-Suite aktualisiert (QuickApprovalModal.test.tsx)
  - [x] 0 TypeScript-Compiler-Fehler

### Intelligent Replacement System v1.8.0 - **IN ARBEIT** 🤖
**Vision**: "System empfiehlt den BESTEN Mitarbeiter, nicht nur den verfügbaren"
**Siehe**: Komplette Spec in `docs/FEATURE_INTELLIGENT_REPLACEMENT.md`

#### Phase 2a: Datenmodell (Prisma Schema) ✅ ABGESCHLOSSEN (2025-10-04)
- [x] **EmployeePreferences** Model:
  - [x] Schicht-Präferenzen (prefersNightShifts, prefersDayShifts, prefersWeekends)
  - [x] Stunden-Präferenzen (targetMonthlyHours: 160, minMonthlyHours: 120, maxMonthlyHours: 200)
  - [x] Site-Präferenzen (preferredSiteIds[], avoidedSiteIds[])
  - [x] Arbeitsrhythmus (prefersConsecutiveDays: 5, minRestDaysPerWeek: 2)
  - [x] Schicht-Länge (prefersLongShifts, prefersShortShifts)
  - [x] Notizen (Freitext für Besonderheiten)
- [x] **EmployeeWorkload** Model:
  - [x] Aggregierte Metriken (totalHours, scheduledHours, nightShiftCount, weekendShiftCount)
  - [x] Compliance-Checks (maxWeeklyHours, minRestHoursBetweenShifts: 11h default)
  - [x] Tracking (consecutiveDaysWorked, restDaysCount)
  - [x] Fairness-Score (0-100)
  - [x] Performance-optimiert mit month/year unique key + indexes
- [x] **ComplianceViolation** Model:
  - [x] Log für Verstöße (violationType, description)
  - [x] Severity-Level (WARNING, ERROR, CRITICAL)
  - [x] Werte-Tracking (value, threshold)
  - [x] Resolution-Tracking (resolvedAt, resolvedBy, resolvedNote)
  - [x] Indexes für Performance (userId+createdAt, violationType+severity)
- [x] **EmployeeProfile** Erweiterungen:
  - [x] targetWeeklyHours: Float (40h default)
  - [x] contractType: String (FULL_TIME default)
  - [x] autoAcceptReplacement: Boolean (false default)
- [x] **Migration & Seeds**:
  - [x] Prisma Migration `20251004212443_add_intelligent_replacement_models` erfolgreich
  - [x] Seed-Script erweitert: Default-Präferenzen für alle 5 Test-User
  - [x] User Relations erweitert (preferences, workload, complianceViolations)
  - [x] Shift Relations erweitert (complianceViolations)
  - [x] **Datei**: `backend/prisma/migrations/20251004212443_add_intelligent_replacement_models/migration.sql`

#### Phase 2b: Backend Scoring-Engine ✅ ABGESCHLOSSEN (2025-10-04)
- [x] **intelligentReplacementService.ts** erstellt:
  - [x] `calculateWorkloadScore()` - Auslastungs-Bewertung (70-90% = optimal)
  - [x] `calculateComplianceScore()` - ArbZG §5 (11h Ruhe), §3 (48h/Woche)
  - [x] `calculateFairnessScore()` - Team-Durchschnitts-Vergleich
  - [x] `calculatePreferenceScore()` - Mitarbeiter-Präferenzen Match
  - [x] `calculateTotalScore()` - Gewichtung: Compliance 40%, Preference 30%, Fairness 20%, Workload 10%
  - [x] `calculateCandidateScore()` - Haupt-Funktion mit Metriken & Warnungen
  - [x] Helper-Funktionen: findLastShiftEnd, calculateConsecutiveDays, calculateTeamAverages
- [x] **API-Endpoint implementiert**:
  - [x] `GET /api/shifts/:id/replacement-candidates-v2` (shiftController.ts)
  - [x] Route registriert (shiftRoutes.ts) - VOR allgemeiner /:id Route
  - [x] RBAC: ADMIN, MANAGER, DISPATCHER
  - [x] Rückgabe: Sortierte Kandidaten mit totalScore, recommendation, color, metrics, warnings
  - [x] Fallback-Handling bei Scoring-Fehlern
  - [x] Meta-Informationen: totalCandidates, optimalCandidates, goodCandidates
- [ ] **Cron-Jobs einrichten** (optional - kann später implementiert werden):
  - [ ] Tägliche Workload-Berechnung (01:00 Uhr)
  - [ ] Compliance-Check nach Shift-Assignment (Hook)
  - [ ] Wöchentliche Fairness-Score-Updates (Montag 02:00 Uhr)
- [x] **Tests**:
  - [x] Unit-Tests für alle 5 Scoring-Funktionen (31 Tests, alle ✓)
  - [x] Testabdeckung: Workload (6), Compliance (6), Fairness (5), Preference (9), Total (5)
  - [x] **Datei**: `backend/src/services/__tests__/intelligentReplacementService.test.ts`
  - [ ] Integration-Tests für API-Endpoint (kann später ergänzt werden)
  - [ ] Performance-Test: < 500ms für Kandidaten-Scoring (kann später ergänzt werden)

#### Phase 2c: Frontend Intelligente UI ✅ ABGESCHLOSSEN (2025-10-05)
- [x] **ReplacementCandidatesModalV2 erstellt**:
  - [x] Score-basierte Card-Anzeige (Farben: grün/gelb/orange/rot)
  - [x] Metriken-Grid (Auslastung, Ruhezeit, Nachtschichten, Ersätze)
  - [x] Warnungs-Badges anzeigen
  - [x] Detail-Scores aufklappbar (Compliance/Präferenz/Fairness/Workload)
  - [x] Sortierung: Beste Kandidaten zuerst (vom Backend)
  - [x] v2 API Integration (`GET /shifts/:id/replacement-candidates-v2`)
- [x] **Neue UI-Komponenten**:
  - [x] `ScoreRing` - Kreis-Chart (0-100) mit SVG
  - [x] `MetricBadge` - Icon + Label + Wert + Status-Farbe
  - [x] `WarningBadge` - Warnungs-Icon + Text (Info/Warning/Error)
  - [x] Lucide Icons Integration (BarChart3, Clock, Moon, Users, etc.)
- [x] **Frontend-Backend Integration**:
  - [x] `ReplacementCandidateV2` Type in types.ts
  - [x] `getReplacementCandidatesV2()` API-Funktion in api.ts
  - [x] AbsenceDetailModal auf v2 API umgestellt
  - [x] TypeScript 0 Fehler

#### Phase 2d: Login-Problem & Docker-Migration ✅ ABGESCHLOSSEN (2025-10-05)
**Problem**: Nach v1.8.0 Implementierung kein Login mehr möglich
**Root Cause**: Backend-Port-Wechsel (3000→3001), Vite .env-Caching, Docker-Netzwerk-Issues
- [x] **Infrastruktur-Migration**:
  - [x] Backend von lokal zu Docker verschoben (sicherheitsdienst-api)
  - [x] DATABASE_URL von localhost zu db:5432 angepasst
  - [x] Backend listen auf 0.0.0.0 statt localhost (externe Erreichbarkeit)
  - [x] CORS für externe IP konfiguriert (http://37.114.53.56:5173)
- [x] **Frontend-Konfiguration**:
  - [x] VITE_API_BASE_URL auf Port 3001 aktualisiert
  - [x] Frontend-Container neu erstellt (--env-file .env)
  - [x] Vite-Cache gelöscht (node_modules/.vite)
- [x] **Troubleshooting-Dokumentation**:
  - [x] `docs/TROUBLESHOOTING_LOGIN.md` erstellt
  - [x] Diagnose-Kommandos dokumentiert
  - [x] Häufige Fehlerquellen und Lösungen
- [x] **Test & Verifikation**:
  - [x] Backend Health-Check: ✅ 200 OK
  - [x] CORS-Header: ✅ Access-Control-Allow-Origin korrekt
  - [x] Login-Flow: ✅ Funktioniert (admin@sicherheitsdienst.de)
  - [x] Frontend-Backend-Kommunikation: ✅ Port 3001
- [ ] **Mitarbeiter-Präferenzen-Editor** (optional, später):
  - [ ] Route `/employees/:id/preferences`
  - [ ] Formular für alle Präferenz-Felder
  - [ ] Validierung & Speicherung
- [ ] **Workload-Dashboard** (optional, später):
  - [ ] Route `/employees/:id/workload`
  - [ ] Visualisierung: Auslastung, Nachtschichten, Freitage
  - [ ] Compliance-Status, Fairness-Score
  - [ ] Verlauf (6 Monate)
- [ ] **Team-Fairness-Übersicht** (optional, später):
  - [ ] Route `/team/fairness`
  - [ ] Tabelle: Alle Mitarbeiter vergleichen
  - [ ] Sortierung nach verschiedenen Metriken
- [ ] **E2E-Tests** (optional, später):
  - [ ] Playwright: Scoring-Anzeige bei Ersatz-Suche
  - [ ] Playwright: Präferenzen-Editor
  - [ ] Playwright: Workload-Dashboard

### ⚠️ AKTUELL: Testdaten wiederherstellen (URGENT)
**Problem**: Nach Docker-Migration keine Testdaten mehr im Dashboard
**Betroffene Seeds**:
- [ ] Gesamt-Seed (`npm run seed`) erneut ausführen
- [ ] Verifikation: Dashboard zeigt wieder Critical Shifts, Pending Approvals, Warnings

**Nächste Schritte**:
1. [ ] Seed-Scripts in Docker-Umgebung ausführen
2. [ ] Dashboard testen: Alle 4 Test-Kandidaten sichtbar?
3. [ ] Ersatz-Mitarbeiter-Scoring testen: Farben (grün/gelb/orange/rot) korrekt?
4. [ ] Metriken-Anzeige testen: Auslastung, Ruhezeit, Nachtschichten
5. [ ] E2E-Test: Kompletter Workflow (Abwesenheit anlegen → Ersatz finden → Zuweisen)

#### Phase 3: KI-Integration v2.0 (Später)
- [ ] Predictive Scheduling (ML-Modell)
- [ ] Automatische Zuweisung (mit Opt-In)
- [ ] Optimierungs-Algorithmus (Constraint Solver)
- [ ] Learning from Feedback

- [x] Migration Drift beheben: `absence_documents` & `object_clearances` ✅ (2025-10-05)

### Objekt-Management (v1.8.0) - NACHGEORDNET
- [ ] **Objekt-Verwaltung UI** (Maske zum Anlegen/Bearbeiten):
  - **Basis-Informationen**:
    - Name, Standort, Adresse
    - Verträge, Konzepte, Abrechnungsdaten hochladen (PDF, Dokumente)
    - RBAC: Mitarbeiter sehen nur relevante Infos, Chef sieht alles
  - **Schicht-Planung**:
    - **Standard-Schichten**: "Täglich 06:00-14:00, 2 MA benötigt"
      - Wochentag-basiert (Mo-Fr, Sa-So unterschiedlich)
      - Wiederkehrende Schichten definieren
    - **Sonder-Schichten**: "Nur bei Event XY, 18:00-02:00, 5 MA"
      - Event-gesteuert (nur wenn bestimmtes Event aktiv)
      - Temporäre Schichten für spezielle Anlässe
    - Anzahl benötigter Mitarbeiter pro Schicht
    - Zeitfenster (von-bis) konfigurieren
  - **Qualifikationen & Anforderungen**:
    - Welche Qualifikationen brauchen MA? (§34a, Brandschutz, etc.)
    - Mindestanforderungen definieren
    - Automatische Prüfung bei Zuweisung
  - **Dokumente & Konzepte**:
    - Sicherheitskonzepte hinterlegen
    - Einsatzpläne, Notfallpläne
    - Verträge mit Kunde
    - Abrechnungsunterlagen
  - **Übersichtliche Darstellung**:
    - Alle Infos in Tabs/Sektionen organisiert
    - Schneller Überblick über aktuelle Besetzung
    - Integration mit Planungskonzept
- [ ] **Einarbeitungs-Management**:
  - UI zum Erstellen/Bearbeiten von ObjectClearance
  - "Mitarbeiter XY für Objekt Z einarbeiten"
  - Ablaufdatum (validUntil) verwalten
  - Status ändern (ACTIVE/EXPIRED/REVOKED)
  - Bulk-Einarbeitung (alle Mitarbeiter für Objekt)
  - Automatische Warnungen bei ablaufenden Einarbeitungen

### Absences & Events
- [ ] **Absences ICS & Kalender**:
  - ICS-Export für Abwesenheiten (Pro Nutzer/Team)
  - iCal-Feed für externe Kalender (Google, Outlook)
  - Dokumentation (`docs/planning/absences.md`)
- [ ] **Event-Planung mit Kapazitätsprüfung**:
  - UI für große Events (15+ Mitarbeiter)
  - Automatische Kapazitätsprüfung bei Event-Erstellung
  - Partner-Firmen-Integration (Konzept entwickeln)
  - Vorlaufzeit-Warnungen (Event in 2 Wochen, nur 50% Kapazität)

### Monitoring & Performance
- [ ] **Grafana/Alerts erweitert**:
  - Panels für Absence-Queues, Login-Error-Rate
  - Slack-Alert bei wachsenden Abwesenheitskonflikten
  - Dashboard für ObjectClearance-Status (Ablaufende Einarbeitungen)
- [ ] **Storage Evaluierung**:
  - S3/MinIO für Dokument-Uploads
  - Verschlüsselungskonzept ausarbeiten
  - Migration von lokalem Storage zu S3

### Abgeschlossen ✅
- [x] XLSX‑Exports lokal stabilisieren
- [x] Reporting/Exports: CSV/Excel für Listen (Employees/Sites/Shifts)
- [x] Performance: DB‑Index‑Vorschläge
- [x] Notifications: Rate‑Limit produktionsreif
- [x] Codequalität: ESLint‑Warnungen reduzieren

## Langfristig / Post‑MVP (P3)
- [x] Erweiterte Benachrichtigungen (Real‑Events, Templates, Opt‑In) (2025-09-16)
- [x] Observability: erweiterte /stats (Laufzeit, Queue, Mail‑Erfolg), Log‑Konfiguration in README (2025-09-15)
- [ ] Sicherheits‑Hardening: Rate‑Limit selektiv auf weitere Endpunkte; Audit‑Trail
  - [x] Selektive Rate-Limits für Schicht-Zuweisung & Clock-in/out (`SHIFT_ASSIGN_RATE_LIMIT_*`, `SHIFT_CLOCK_RATE_LIMIT_*`, Tests/Doku)
  - [ ] Audit-Trail (Schema, Logging-Utility, Read-API, Retention)
    - [x] Phase B: Prisma-Modell `AuditLog`, Logging-Service mit Retry-Queue, Tests & Doku (2025-09-18)
    - [x] Phase C: Audit-Events in Mutationen (Auth/Shifts/Notifications) + erste Read-API (2025-09-19)
    - [x] Phase D: CSV-Export + `/api/stats` Kennzahlen (Audit) (2025-09-19)
    - [x] Phase E: Retention-Job (`npm run audit:prune`), Prometheus-Metriken, `/api/stats` Kennzahlen (2025-09-19)

## Neues Feature: Einsätze/Events
- [x] Datenmodell (Prisma): `Event` mit Feldern `id, title, description, siteId?, startTime, endTime, serviceInstructions (Text/Markdown), assignedEmployeeIds[]` + Indizes
- [x] API/Controller/Routes: CRUD `/api/events` mit RBAC (ADMIN/DISPATCHER: schreiben; alle Auth: lesen)
- [x] Validation (Zod): Create/Update Schemas; Zeitlogik (start < end)
- [x] OpenAPI: Schemas/Paths inkl. Beispiele; List‑Parameter analog zu anderen Listen; operationId
- [x] Exporte: CSV/XLSX für Listen; PDF‑Bericht je Event
- [x] Tests: Unit + Route (RBAC, Validation, CRUD, Exporte, PDF)
- [x] Push: Geräte‑Tokens, optional FCM, Event‑Push (Flag), Admin‑Opt‑In/Out

## Arbeitsweise / Hinweise
- Branch‑Strategie: `feature/<kurzer-name>` je Task; kleine, überprüfbare Commits.
- Vor jedem Merge: Lint/Typecheck/Tests grün; OpenAPI Lint warn‑only toleriert.
- Doku immer mitführen: README + CHANGELOG + ggf. OpenAPI.
- `.env.example` aktualisieren, wenn neue ENV hinzukommen.

## Langfristig (Vision)
- **v2.0.0 Predictive Scheduling** – ML-Modell, Forecasting
- **v2.1.0 Automatische Zuweisung (Opt-In)** – Auto-Assignment >85 Score, Notifications, Audit
- **v2.2.0 Constraint Solver** – Optimierungsziel Zufriedenheit/Kosten
- **v2.3.0 Feedback Loop** – Mitarbeiter Feedback für ML
- **Objekt-Management Suite** – Objekt-UI, Qualifikationen, Einarbeitungsmanagement
- **Event-Planung & ICS** – Großveranstaltungen, Kapazitätswarnungen, Kalenderfeeds
- **Storage/Infra Roadmap** – S3/MinIO, Multi-Tenancy, Billing
