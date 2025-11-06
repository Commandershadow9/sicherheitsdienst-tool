# TODO / Roadmap (Stand: 2025-10-23)

> Abgeschlossene Aufgaben liegen jetzt in `docs/TODO_ARCHIVE.md`.

## Kurzfristig (P1, 1–2 Tage)

### ✅ Aktuell abgeschlossen (v1.16.1 - 2025-10-23)
- [x] **v1.16.1** Template-System aktiviert: 6 Sicherheitskonzept-Templates erstellt ✅
- [x] **v1.16.1** CustomerDetail-Route implementiert (fehlte im Router) ✅
- [x] **v1.16.1** Dashboard Test-Schichten: Kritische Schichten für HEUTE ✅
- [x] **v1.16.1** Bugfixes: Frontend API Port (3000), Admin-Password-Reset ✅

### ✅ Vorherige Versionen
- [x] **v1.10.0** Abwesenheiten: ICS-/Kalender-Export (API `GET /api/absences/export.ics`, RFC 5545 konform) ✅
- [x] **v1.10.0** Replacement-Service Observability: Prometheus-Metriken für Score-/Laufzeitwerte und Zusammenfassung in `/api/stats` ✅
- [x] **v1.10.0** Replacement UX-Verbesserungen: Farbkodierung, Ruhezeit-Anzeige, Auslastungs-Vorschau, Tie-Breaker ✅
- [x] **v1.10.1** Fairness-Score: Präferenzen für Nachtschichten berücksichtigen (MA mit Nachtschicht-Wunsch nicht mehr bestrafen) ✅
- [x] **v1.10.1** UX: Inline-Bestätigung statt Pop-up, kontextuelle Badges (Nachtschicht nur bei Nachtschichten) ✅
- [x] **v1.7.0** Dashboard UX: StatsCard klickbar mit EmployeeListModal und Backend-Endpoints (`docs/FEATURE_DASHBOARD.md` Phase 4) ✅

## Mittelfristig (P2, 2–8 Wochen)

### 🏢 Objekt-Management Suite (v1.11.0 - v1.17.0) - **GROSSES FEATURE-SET**
**Priorität: HOCH** - Blockiert mehrere Features, Fundament für Schicht-Planung & Replacement
**Gesamt-Aufwand**: 20-28 Tage (7 Phasen)
**Vollständiges Konzept**: `docs/FEATURE_OBJEKT_MANAGEMENT.md`

---

#### Phase 1: Objekt-Grundlagen (v1.11.0 - v1.11.1) ⭐ **90% ABGESCHLOSSEN**
**Aufwand**: 3-5 Tage | **Status**: Backend ✅ Frontend ✅ UX Enhancement ✅ | Offen: RBAC, Tests, Docs

- [x] Konzept entwickeln (Anforderungen, Datenmodell, User-Stories) ✅
- [x] Datenmodell-Migration erstellen (Prisma Schema) ✅
  - [x] Site-Erweiterungen (customerName, emergencyContacts, status, requiredQualifications)
  - [x] SiteImage (Objektfotos, Gebäudepläne)
  - [x] SiteAssignment (Objektleiter/Schichtleiter-Zuweisungen)
- [x] Backend-Implementation ✅
  - [x] Site Controller erweitern (CRUD mit neuen Feldern)
  - [x] Image-Upload-Endpoint mit FormData-Handling
  - [x] Clearances-Endpoints (Create, Complete Training, Revoke)
  - [x] Coverage-Stats-Endpoint
  - [x] **Scoring-System erweitern** (Object-Clearance-Score mit 5 Komponenten) ⭐
  - [x] Replacement-Endpoint erweitert (Clearance berücksichtigt)
- [x] Frontend-Implementation ✅ (v1.11.0)
  - [x] Objekt-Liste (Filter: Status, Kunde)
  - [x] Objekt-Detail-Seite (4 Tabs: Übersicht, Clearances, Schichten, Bilder)
  - [x] Objekt-Formular (Create & Edit mit allen Feldern)
  - [x] Bild-Upload-Dialog (mit Kategorien)
  - [x] Clearances-Verwaltung (Create, Training abschließen, Widerrufen)
  - [x] Assignments-Verwaltung (Objektleiter, Schichtleiter, Mitarbeiter)
  - [x] **Replacement-Modal erweitern** (Clearance-Badge mit Status-Anzeige) ⭐
- [x] **UX Enhancement** (v1.11.1) ✅
  - [x] React-Select Dropdowns mit Suche
  - [x] Skeleton Loading States
  - [x] Animationen & Transitions
  - [x] Moderneres Design (Gradients, Shadows, Icons)
  - [x] Responsive Design (Mobile-optimiert)
- [ ] RBAC-Logik erweitern (Site-Zuweisungen feingranular prüfen, Ownership-Checks)
- [ ] Tests (Unit + Integration)
- [ ] Dokumentation finalisieren (API + README)

**Nächste Schritte (Phase 1 - Optional):**
- RBAC-Checks für Objektleiter/Schichtleiter auf Controller-Ebene ergänzen.
- Jest-Szenarien für neue Endpoints & Scoring-Gewichtungen anlegen.
- Dokumentation finalisieren.

**Empfehlung**: Phase 1 ist funktional komplett. RBAC/Tests können am Ende von Phase 2-3 gebündelt werden.

**Abhängigkeiten**: Keine - kann sofort starten
**Blockt**: Alle weiteren Phasen
**Wichtig**: Integration mit Intelligent Replacement System (siehe `docs/planning/scoring-objekt-integration.md`)

---

#### Phase 2: Dokument-Management (v1.12.0 - v1.12.2) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 2-3 Tage | **Status**: Produktionsbereit ✅

- [x] Datenmodell: SiteDocument (kategorisiert, versioniert) ✅
- [x] Backend: Upload/Download/Versionierung (Multer) ✅
- [x] Frontend: Dokumenten-Übersicht (kategorisiert) ✅
- [x] Dienstanweisungen-Viewer (PDF/Markdown/Text) ✅
- [x] **Dokument-Viewer**: PDF (iframe), Markdown (react-markdown), Text (pre) ⭐
- [x] **UI Features**: View/Download/Delete-Buttons, Fullscreen-Toggle ✅

**Commits**:
- v1.12.0: Backend (Prisma, Controller, Routes)
- v1.12.1: Multer Integration (File Upload)
- v1.12.2: Document Viewer (Frontend)

**Abhängigkeiten**: Phase 1
**Liefert**: Vollständige Dokumentenablage mit Viewer

---

#### Phase 3: Wachbuch & Vorfälle (v1.13.0 - v1.13.2) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 3-4 Tage | **Status**: Produktionsbereit ✅

- [x] Datenmodell: SiteIncident (11 Kategorien, Schweregrad, Status) ✅
- [x] Backend: CRUD-Endpoints (6 Endpoints) ✅
- [x] Frontend: Wachbuch-Tab mit Timeline-View ✅
- [x] Vorfall-Melde-Dialog (CreateIncidentModal) ✅
- [x] Mutations (Create, Update, Resolve, Delete) ✅

**Commits**:
- v1.13.0: Backend (SiteIncident Model, Controller, Routes)
- v1.13.1: Frontend MVP (Timeline-View mit Badges)
- v1.13.2: Frontend CRUD (CreateIncidentModal, 4 Mutations, Delete-Bestätigung)

**Abhängigkeiten**: Phase 2
**Liefert**: Digitales Wachbuch mit CRUD (100% fertig, produktionsbereit)

---

#### Phase 3.5: Erweiterte Wachbuch-Features (v1.13.3 - v1.13.8) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 1-2 Wochen | **Status**: Produktionsbereit ✅

**Phase 3.5a: Edit, Resolve, Filter + RBAC (v1.13.3) ✅ ABGESCHLOSSEN**
- [x] Backend: Ownership/RBAC-Checks (24h-Regel, Objektleiter, etc.) ✅
- [x] Frontend: Filter (Status, Severity, Category) ✅
- [x] Frontend: Edit-Dialog mit Pre-Fill ✅
- [x] Frontend: Resolve-Dialog ✅
- [x] Frontend: Action-Buttons mit Berechtigungsprüfung ✅

**Phase 3.5b: Schicht-Kontext & Historie (v1.13.4) ✅ ABGESCHLOSSEN**
- [x] Backend: shiftId zu SiteIncident Model (Migration erstellt) ✅
- [x] Backend: shift populated in Controller ✅
- [x] Frontend: Schicht-Kontext Box (MA im Dienst) ✅
- [x] Beteiligte Personen strukturiert (Array mit name-Field)
- [x] Bearbeitungs-Historie (IncidentHistory Model)
- [x] Timeline: Wer hat wann was geändert

**Phase 3.5c: Dashboard & Notifications (v1.13.7 - v1.13.8) ✅ ABGESCHLOSSEN**
- [x] **Dashboard-Widget "Kritische Vorfälle"** (v1.13.7) ✅
  - [x] Backend Stats API (`GET /api/stats/critical-incidents`)
  - [x] Frontend CriticalIncidentsCard Component
  - [x] Integration in Dashboard (rechte Spalte)
  - [x] Auto-Refresh (60 Sekunden)
  - [x] Summary-Badges (CRITICAL, HIGH counts)
  - [x] Links zu Objekt-Details
- [x] **Email-Notifications** (v1.13.8) ✅
  - [x] sendCriticalIncidentEmail() Funktion
  - [x] HTML-Template (Severity-basierte Farben)
  - [x] Text-Fallback-Version
  - [x] Deep-Links zum Wachbuch
  - [x] Automatischer Versand bei CRITICAL/HIGH
  - [x] Empfänger: ADMIN + MANAGER mit emailOptIn=true
- [x] **Push-Notifications** (v1.13.8) ✅
  - [x] sendPushToUsers() Integration
  - [x] Empfänger: ADMIN + MANAGER mit pushOptIn=true
  - [x] Fire-and-Forget Async Pattern
- [x] **Docker Integration** (v1.13.8) ✅
  - [x] Mailhog Container für Email-Testing
  - [x] Web UI: http://localhost:8025
  - [x] SMTP-Konfiguration in .env
- [x] **Testing** ✅
  - [x] Test-Email erfolgreich versendet
  - [x] Email in Mailhog empfangen
  - [x] HTML-Template verifiziert
  - [x] Deep-Links funktionieren

**Commits**:
- v1.13.3: Edit, Resolve, Filter + RBAC (Phase 3.5a Complete)
- v1.13.4: Schicht-Kontext (Phase 3.5b Teil 1)
- v1.13.7a: Backend Stats API (Dashboard Widget)
- v1.13.7: Frontend Dashboard Widget
- v1.13.8: Email & Push Notifications (Phase 3.5c Complete)

**Abhängigkeiten**: Phase 3
**Liefert**: Erweiterte Wachbuch-Funktionen mit professionellen Features (KOMPLETT)

**Optional noch offen** (nicht kritisch für Produktionseinsatz):
- [ ] @mentions System (z.B. @Max im Beschreibungsfeld → Notification)
- [ ] Email-Templates anpassbar (Admin-UI für Templates)
- [ ] SMS-Notifications (zusätzlich zu Email/Push)

---

#### Phase 4: Kontrollgänge & NFC-Rundenwesen (v1.14.0a - v1.14.0c) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 4-5 Tage | **Status**: Produktionsbereit ✅

**Phase 4a: Backend (v1.14.0a) ✅**
- [x] Datenmodell: ControlPoint, ControlRound, ControlPointScan ✅
- [x] Backend: Kontrollpunkte-CRUD (7 Endpoints) ✅
- [x] Backend: Kontrollgänge-CRUD (6 Endpoints) ✅
- [x] NFC-Tag-ID Verwaltung (UUID-basiert) ✅
- [x] QR-Code-Fallback (für Geräte ohne NFC) ✅
- [x] RBAC: ADMIN, MANAGER, DISPATCHER ✅

**Phase 4b: Desktop-Frontend (v1.14.0b) ✅**
- [x] Frontend: Kontrollpunkte-Tab in SiteDetail ✅
- [x] Kontrollpunkt-CRUD (Create, Edit, Delete) ✅
- [x] NFC-Tag-Generierung (UUID v4) ✅
- [x] QR-Code-Anzeige pro Kontrollpunkt ✅
- [x] Kontrollgänge-Übersicht (Timeline-View) ✅

**Phase 4c: Mobile-Konzept (v1.14.0c) ✅**
- [x] Mobile-App Konzept dokumentiert ✅
- [x] NFC-Scanner-Workflow definiert ✅
- [x] Offline-First Strategie ✅
- [x] PWA-Bereitschaft geprüft ✅

**Commits**:
- v1.14.0a: Backend (Prisma Migration, Controller, Routes)
- v1.14.0b: Desktop-Frontend (Kontrollpunkt-Verwaltung)
- v1.14.0c: Mobile-Konzept & Dokumentation

**Abhängigkeiten**: Phase 3
**Liefert**: Vollständiges Kontrollgang-System (NFC + QR) - produktionsbereit

---

#### Phase 5: Objekt-Kalkulation & Angebotserstellung (v1.15.0a - v1.15.0d) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 4-5 Tage | **Status**: Produktionsbereit ✅

**Phase 5a: Backend (v1.15.0a) ✅**
- [x] Datenmodell: PriceModel, SiteCalculation ✅
- [x] Prisma Migration: 20+ Felder für Kalkulation ✅
- [x] Backend: PriceModel-CRUD (5 Endpoints) ✅
- [x] Backend: SiteCalculation-CRUD (5 Endpoints) ✅
- [x] Berechnungs-Logik (Personal, Gemeinkosten, Gewinn) ✅
- [x] RBAC: ADMIN (Templates), MANAGER (Kalkulationen) ✅

**Phase 5b: Desktop-Frontend (v1.15.0b) ✅**
- [x] Kalkulationen-Tab in SiteDetail ✅
- [x] Kalkulations-Liste mit Status-Badges ✅
- [x] Version-Management (Duplicate-Funktion) ✅
- [x] Status-Workflow UI (DRAFT → SENT → ACCEPTED/REJECTED) ✅

**Phase 5c: PDF-Generator & Email (v1.15.0c) ✅**
- [x] PDF-Generator mit PDFKit (150 LOC) ✅
- [x] Professional PDF-Template (Header, Tables, Formatting) ✅
- [x] Email-Versand-Funktion (HTML + Text) ✅
- [x] Email-Template mit Preis-Box & CTA ✅
- [x] GET /pdf Endpoint ✅
- [x] POST /send-email Endpoint ✅

**Phase 5d: Erweiterte Features (v1.15.0d) ✅**
- [x] Archive-Funktion (Status → ARCHIVED) ✅
- [x] Reject-Modal mit Notizen ✅
- [x] Email-Modal mit Empfänger-Auswahl ✅
- [x] Frontend: PDF-Download-Button ✅
- [x] Frontend: Email-Button ✅
- [x] Frontend: Archive & Duplicate Buttons ✅

**Commits**:
- v1.15.0a: Backend (Prisma, PriceModel, SiteCalculation)
- v1.15.0b: Desktop-Frontend (Kalkulationen-Tab)
- v1.15.0c: PDF-Generator & Email-Versand
- v1.15.0d: Erweiterte Features (Archive, Reject-Modal, Email-Modal)

**Abhängigkeiten**: Phase 4
**Liefert**: Vollständiges Kalkulations-System von Angebot bis PDF/Email

---

#### Phase 6: Intelligenter Objekt-Anlage-Wizard (v1.16.0) ⭐ **100% ABGESCHLOSSEN**
**Aufwand**: 5-6 Tage | **Status**: Produktionsbereit ✅

**Phase 6a: Backend - Kunden & Templates (v1.16.0a) ✅**
- [x] Datenmodell: Customer (Kunden-Verwaltung) ✅
- [x] Datenmodell: SiteTemplate (Sicherheitskonzept-Vorlagen) ✅
- [x] Prisma Migration: 20251022145323 (Customer + Template Models) ✅
- [x] Backend: Customer-CRUD (5 Endpoints) ✅
- [x] Backend: Template-CRUD (5 Endpoints) ✅
- [x] RBAC: ADMIN (Templates), MANAGER (Customers, Sites) ✅

**Phase 6b: Frontend - 8-Schritt-Wizard (v1.16.0b) ✅**
- [x] Wizard-Container mit Progress-Bar (8 Schritte) ✅
- [x] **Schritt 1: Kunde** - Suche + Inline-Neuanlage (CustomerStep, CustomerQuickForm) ✅
- [x] **Schritt 2: Objekt-Grunddaten** - Name, Adresse, Gebäudetyp, Größe ✅
- [x] **Schritt 3: Sicherheitskonzept** - Template-Auswahl + Anpassung (582 LOC) ✅
  - Template-basierter & Manueller Modus
  - Template-Daten in manuellen Modus laden (Anpassungen möglich) ⭐
  - Aufgaben-Management (Add/Remove Tasks)
  - Schichtmodell, Stunden/Woche, Mitarbeiter-Bedarf
- [x] **Schritt 4: Personal & Zuweisungen** - MA-Auswahl (Optional) ✅
- [x] **Schritt 5: Kontrollgänge** - NFC-Punkte (Optional) ✅
- [x] **Schritt 6: Kalkulation** - Stundensatz & Preisberechnung ✅
- [x] **Schritt 7: Dokumente & Notfallkontakte** - Emergency Contacts ✅
- [x] **Schritt 8: Zusammenfassung** - Review & Erstellen (400 LOC) ✅

**Phase 6c: Integration & Features (v1.16.0c) ✅**
- [x] **API-Integration**: `useCreateSite()` Hook (React Query) ✅
- [x] **Payload-Transformation**: Alle 8 Schritte → Backend-Payload (207 LOC) ✅
- [x] **Validierung**: Step-by-Step + Final Validation ✅
  - Schritt 1: Kunde erforderlich
  - Schritt 2: Name, Adresse, Stadt, PLZ, Gebäudetyp
  - Schritt 3: Sicherheitskonzept (Tasks, Schichtmodell, Stunden, Staff)
  - Schritt 6: Stundensatz > 0
  - Schritt 8: Vollständigkeits-Check aller Pflichtfelder
- [x] **LocalStorage Auto-Save**: Wizard-Fortschritt wird automatisch gespeichert ✅
  - Auto-Restore bei Reload
  - Auto-Clear bei Abbruch/Erfolg
  - Visual Indicator im Header
- [x] **Navigation**: Nach Erfolg → `/sites/{siteId}` ✅
- [x] **Error Handling**: Toast-Notifications + Validation Warnings ✅

**Phase 6d: Testing & Dokumentation (v1.16.0d) ✅**
- [x] **Frontend Unit Tests** (Vitest): 40 Tests ✅
  - `useWizardValidation.test.ts`: 25 Tests (350 LOC)
  - `api.test.ts`: 15 Tests (240 LOC)
- [x] **Backend Integration Tests** (Jest): 10 Tests ✅
  - Wizard Integration Suite in `sites.routes.test.ts`
  - Complete Payload, Minimal Payload, Validation
  - Customer & Template API Tests
- [x] **Clearance API wiederhergestellt** in `api.ts` ✅
- [x] **TypeScript**: 0 Errors, Build erfolgreich ✅
- [x] **Dokumentation**: Vollständig aktualisiert ✅

**Commits**:
- v1.16.0a: Backend (Customer, Template Models + APIs)
- v1.16.0b: Frontend (8-Schritt-Wizard, alle Steps implementiert)
- v1.16.0c: Integration (API, Validation, LocalStorage, Navigation)
- v1.16.0d: Testing & Dokumentation

**Neue Dateien (Frontend)**:
- `src/types/wizard.ts` - WizardData Interface (alle 8 Schritte)
- `src/features/wizard/components/SiteWizard.tsx` (250 LOC)
- `src/features/wizard/components/steps/` (8 Step-Komponenten, ~3000 LOC)
- `src/features/wizard/hooks/useWizardValidation.ts` (123 LOC)
- `src/features/sites/api.ts` (207 LOC mit Clearance API)
- `src/features/customers/` - Customer-Management
- `src/features/templates/` - Template-Management

**Neue Dateien (Backend)**:
- `backend/src/controllers/customerController.ts`
- `backend/src/controllers/templateController.ts`
- `backend/src/routes/customerRoutes.ts`
- `backend/src/routes/templateRoutes.ts`
- `backend/prisma/migrations/20251022145323_add_wizard_models_and_customer/`

**Key Features**:
- ✅ **Template-Anpassung**: Templates laden Daten in manuellen Modus (User-Request!)
- ✅ **Auto-Save**: LocalStorage Persistierung mit Visual Feedback
- ✅ **Validierung**: Real-time + Final Validation mit Error Display
- ✅ **Navigation**: Blockierung bei fehlenden Pflichtfeldern
- ✅ **API Integration**: Vollständige Transformation aller 8 Schritte
- ✅ **TypeScript Strict**: Alle Typen korrekt definiert
- ✅ **Testing**: 50+ Tests (Frontend + Backend)

**Abhängigkeiten**: Phase 5
**Liefert**: Vollständiger Objekt-Anlage-Wizard (8 Schritte) - Produktionsbereit!
**Vollständiges Konzept**: `docs/planning/workflow-wizard-objekt-anlegen.md` ⭐ **IMPLEMENTIERT**

---

#### Phase 7: Übergabe-Protokolle (v1.17.0)
**Aufwand**: 2-3 Tage | **Status**: Geplant

- [ ] Datenmodell: Equipment, EquipmentHandover
- [ ] Backend: Ausrüstungs-Tracking
- [ ] Frontend: Übergabe/Rückgabe-Dialoge
- [ ] Schichtwechsel-Workflow
- [ ] History & Reports

**Abhängigkeiten**: Phase 6
**Liefert**: PSA & Ausrüstungs-Tracking

---

#### Phase 8: Abrechnungssystem (v1.18.0)
**Aufwand**: 3-4 Tage | **Status**: Geplant

- [ ] Datenmodell: SiteBilling, BillingItem
- [ ] Backend: Stundenerfassung aus Schichten
- [ ] PDF-Generator: Rechnungs-Erstellung
- [ ] Frontend: Abrechnungs-Übersicht (pro Monat/Objekt)
- [ ] Export-Funktion (CSV für Buchhaltung)

**Abhängigkeiten**: Phase 7
**Liefert**: Vollständige Abrechnungslösung

---

**Gesamt-Abhängigkeiten nach Abschluss**: Schicht-Planung, besseres Replacement, Compliance-Tracking

---

### 👤 MA-Profile erweitern (v1.18.0) - **NACH OBJEKT-MANAGEMENT**
**Priorität: MITTEL** - Verbessert Self-Service & Onboarding
- [ ] **Konzept entwickeln**: Self-Service-Umfang definieren, Freigabe-Prozess planen
- [ ] Self-Service für MA: Eigenes Profil pflegen (Adresse, Kontakt, Notfallkontakt)
- [ ] Dokumente-Upload: Führerschein, Qualifikationen, Zeugnisse (File-Storage erweitern)
- [ ] Qualifikationen beantragen: MA können Qualifikationen einreichen, Chef genehmigt
- [ ] Chef-Funktionen: MA-Profile anlegen, bearbeiten, freigeben (4-Augen-Prinzip)
- [ ] Onboarding-Workflow: Checkliste für neue MA (Dokumente, Training, Clearances)
- [ ] Profil-Freigabe-Prozess: Draft → Review → Approved
- [ ] Benachrichtigungen: MA wird informiert bei Profil-Änderungen/Freigaben

**Geschätzter Aufwand**: 4-6 Tage
**Abhängigkeiten**: Objekt-Management (für Clearances)
**Blockt**: Weniger kritisch, verbessert aber UX & reduziert Admin-Aufwand

---

### 📊 Dashboards & Monitoring (v1.19.0)
- [x] Intelligent Replacement: Cron-Jobs (Workload täglich, Compliance-Hook nach Shift-Zuweisung, Fairness-Update wöchentlich) produktiv geschaltet (server.ts:8) ✅
- [ ] Workload-/Fairness-Dashboards: Manager-Übersicht mit Team-Statistiken, Export-Funktion (CSV/PDF).
- [ ] Intelligent Replacement: Integrationstest für `GET /api/shifts/:id/replacement-candidates-v2` mit Real-Scoring ergänzen.

## Code Quality & Refactoring (v1.17.0 - Ongoing) ⭐ **MAJOR CLEANUP COMPLETE**
**Priorität: MITTEL-HOCH** - Verbessert Wartbarkeit & Entwickler-Erfahrung
**Branch:** `claude/repo-audit-refactoring-011CUp1cMhK4pKWEJPiY7teB`
**Status:** ✅ Phase 1 abgeschlossen (7 major refactorings)

### ✅ Abgeschlossene Refactorings (2025-11-06)

#### Backend Controllers - Single Responsibility Principle
- [x] **shiftController.ts** aufgeteilt (1157 → 581 LOC, -50%) ✅
  - Neue Controller: shiftAssignmentController.ts (440 LOC), shiftTimeTrackingController.ts (164 LOC)
  - Commit: `refactor(controllers): split shiftController into 3 specialized controllers`

- [x] **siteController.ts** aufgeteilt (923 → 260 LOC, -72%) ✅
  - Neue Controller: siteImageController.ts (75 LOC), siteAssignmentController.ts (257 LOC), siteAnalyticsController.ts (532 LOC)
  - Commits: `refactor(backend): extrahiere Image & Assignment Controller`, `refactor(backend): vollständige siteController Aufteilung`

- [x] **calculationController.ts** aufgeteilt (888 → 408 LOC, -54%) ✅
  - Neue Controller: calculationStatusController.ts (176 LOC), calculationOperationsController.ts (310 LOC)
  - Commit: `refactor(backend): split calculationController into 3 specialized controllers`

- [x] **absenceController.ts** aufgeteilt (597 → 269 LOC, -55%) ✅
  - Neue Controller: absenceApprovalController.ts (226 LOC), absenceExportController.ts (147 LOC)
  - Commit: `refactor(backend): split absenceController into 3 specialized controllers`

- [x] **dashboardController.ts** aufgeteilt (698 → DELETED, -100%) ✅
  - Neue Controller: dashboardShiftController.ts (243 LOC), dashboardApprovalController.ts (223 LOC), dashboardEmployeeController.ts (259 LOC)
  - Commit: `refactor(backend): split dashboardController into 3 specialized controllers`

#### Frontend Components - Custom Hooks Extraction
- [x] **SiteDetail.tsx** refaktoriert (1867 → 1423 LOC, -24%) ✅
  - Neue Hooks: useSiteModals.ts (116 LOC), useSiteQueries.ts (125 LOC), useSiteMutations.ts (449 LOC)
  - Commits: `refactor(frontend): extract queries into useSiteQueries hook`, `refactor(frontend): extrahiere Mutations in useSiteMutations Hook`

- [x] **UserProfile.tsx** refaktoriert (1350 → 1195 LOC, -11.5%) ✅
  - Neue Hooks: useProfileQueries.ts (56 LOC), useProfileMutations.ts (245 LOC)
  - Commit: `refactor(frontend): extract UserProfile hooks (queries + mutations)`

**Gesamt-Impact:**
- ✅ **3,344 LOC** in Haupt-Dateien reduziert (-45%)
- ✅ **16 neue spezialisierte Dateien** erstellt (bessere Organisation)
- ✅ **100% SRP-Konformität** bei refaktorierten Controllern
- ✅ **0 Breaking Changes** - alle Tests bestehen
- ✅ **Avg Controller Size:** 945 LOC → 343 LOC (-64%)

**Dokumentation:**
- ✅ `backend/docs/refactoring/REFACTORING_SUMMARY.md` vollständig aktualisiert
- ✅ Planning-Dateien archiviert (`docs/planning/completed/`)
- ✅ Veraltete Docs bereinigt (`docs/archive/`)

### 🔄 Optionale weitere Refactoring-Kandidaten

#### Backend (Priorität: Niedrig)
- [ ] **siteAnalyticsController.ts** (532 LOC) - Bereits aus siteController extrahiert, gut strukturiert
- [ ] **siteIncidentController.ts** (521 LOC) - Standard CRUD + history, gut organisiert
- [ ] **employeeProfileController.ts** (502 LOC) - Profile + Qualifications + Documents, gut organisiert
- [ ] **userController.ts** (487 LOC) - Standard CRUD, vernünftige Größe

**Hinweis:** Die meisten verbleibenden Controller sind bereits gut organisiert und folgen SRP.

#### Frontend (Priorität: Niedrig-Mittel)
- [ ] **ProtectionMeasuresEditor.tsx** (735 LOC) - Extract form logic to hooks
- [ ] **RiskAssessmentEditor.tsx** (628 LOC) - Extract validation hooks
- [ ] **EmergencyPlanEditor.tsx** (578 LOC) - Extract state management
- [ ] **IncidentsTab.tsx** (568 LOC) - Extract query/mutation hooks

**Aufwand:** 2-4 Tage für Frontend-Komponenten
**Nutzen:** Bessere Wartbarkeit, einfacheres Testing, schnelleres Onboarding
**Empfehlung:** Nur bei konkretem Bedarf (z.B. Erweiterungen geplant)

---

## Langfristig (P3+)
- [ ] Predictive Scheduling & Auto-Assignment (v2.x Roadmap).
- [ ] Storage/Infra: S3/MinIO-Umstieg inkl. Verschlüsselungs-/Migrationkonzept.
- [ ] KI-Integration: ML-Modell für Auto-Assignment, Optimierungs-Algorithmen.
