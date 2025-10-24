# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### In Planung
- Phase 7: Objekt-Monitoring & Reporting Dashboard
- Mobile-App für Kontrollgänge (NFC-Scanner)
- Advanced Analytics & KI-basierte Vorschläge

---

## [1.16.1] - 2025-10-23

### 🐛 Bugfixes
- **Frontend API-Port korrigiert**: Port 3001 → 3000 in `lib/api.ts`
- **Customer-Detail-Route hinzugefügt**: Fehlende Route `/customers/:id` implementiert
- **Admin-Password zurückgesetzt**: Auf `password123` wie gewünscht

### ✨ Neue Features
- **CustomerDetail-Komponente** (310 LOC): Umfassende Kundenansicht mit allen Details
  - Haupt- und Nebenansprechpartner
  - Firmensitz und Rechnungsadresse
  - Zahlungskonditionen (Zahlungsziel, Rabatt, Steuernummer)
  - Liste aller zugeordneten Objekte mit Links
  - Bearbeiten-Button und Metadaten

### 🌱 Daten & Seeding
- **6 Sicherheitskonzept-Templates erstellt**:
  - 24/7 Objektschutz Standard (168h, 4500€)
  - Tagschicht Bürogebäude (60h, 1800€)
  - Nachtschicht Industrie (56h, 2400€)
  - Event-Sicherheit Standard (40h, 2800€)
  - Einzelhandel Ladendetektiv (48h, 2200€)
  - Baustellen-Bewachung (84h, 2800€)
- **Dashboard Test-Schichten**: 3 kritische Schichten für Testing
- **Seeding-Scripts**: `seed-templates.js`, `create-urgent-shift-today.js`

### 🛠️ Technisches
- **Neue Scripts**:
  - `backend/seed-templates.js` - Template-Initialisierung
  - `backend/check-templates.js` - Template-Verification
  - `backend/create-urgent-shift-today.js` - Dashboard Test-Daten
  - `backend/reset-admin-password.js` - Password-Reset-Utility
  - `backend/check-users.js` - User-Verification

### 📚 Dokumentation
- Session-Dokumentation: `docs/sessions/SESSION_2025-10-23.md`
- CHANGELOG.md erstellt
- TODO.md aktualisiert

---

## [1.16.0] - 2025-10-22

### 🎉 Große Features: Phase 6 Complete - Intelligenter Objekt-Anlage-Wizard

#### Phase 6a: Backend - Kunden & Templates (v1.16.0a)
- **Customer Model**: Vollständige Kunden-Verwaltung
  - Firmen-Stammdaten (Name, Branche, Steuernummer)
  - Haupt- und Nebenansprechpartner (JSON)
  - Firmensitz + Rechnungsadresse
  - Zahlungskonditionen (Zahlungsziel, Rabatt)
- **SiteTemplate Model**: Wiederverwendbare Sicherheitskonzept-Vorlagen
  - Gebäudetyp-spezifisch (OFFICE, INDUSTRIAL, RETAIL, EVENT, CONSTRUCTION, OTHER)
  - Schichtmodell, Stunden/Woche, Personal-Bedarf
  - Aufgaben-Liste, Qualifikations-Anforderungen
  - Basis-Preis für Kalkulation
- **Backend APIs**:
  - Customer-CRUD: 5 Endpoints (GET, POST, PUT, DELETE, Search)
  - Template-CRUD: 5 Endpoints (GET, POST, PUT, DELETE)
  - RBAC: ADMIN (Templates), MANAGER (Customers, Sites)
- **Migration**: 20251022145323_add_wizard_models_and_customer

#### Phase 6b: Frontend - 8-Schritt-Wizard (v1.16.0b)
- **Wizard-Container** (250 LOC):
  - Progress-Bar mit 8 Schritten
  - Navigation (Vor/Zurück/Abbrechen)
  - Auto-Save mit LocalStorage
  - Visual Indicator im Header
- **Schritt 1: Kunde auswählen** (CustomerStep):
  - Fuzzy-Search nach Firma/Branche/Stadt
  - Inline-Kundenanlage (CustomerQuickForm)
  - Bestehenden Kunden auswählen
- **Schritt 2: Objekt-Grunddaten** (ObjectStep):
  - Name, Adresse, Stadt, PLZ
  - Gebäudetyp-Auswahl (6 Typen)
  - Geschoss-Anzahl, Quadratmeter
  - Geo-Koordinaten (optional)
- **Schritt 3: Sicherheitskonzept** (SecurityConceptStep, 582 LOC):
  - Template-Modus: Vorlagen-Auswahl nach Gebäudetyp
  - Manueller Modus: Vollständige Konfiguration
  - **Template-Anpassung**: Templates laden Daten in manuellen Modus (User-Request!)
  - Aufgaben-Management (Add/Remove)
  - Schichtmodell-Auswahl (6 Optionen)
  - Stunden/Woche, Personal-Bedarf, Qualifikationen
- **Schritt 4: Personal & Zuweisungen** (StaffStep):
  - Objektleiter-Auswahl (optional)
  - Schichtleiter-Auswahl (optional)
  - Mitarbeiter-Auswahl (optional)
- **Schritt 5: Kontrollgänge** (ControlPointsStep):
  - NFC-Kontrollpunkte definieren (optional)
  - Name, Beschreibung, Scan-Intervall
- **Schritt 6: Kalkulation** (CalculationStep):
  - Stundensatz-Eingabe (Pflicht)
  - Auto-Berechnung: Monatspreis, Jahrespreis
  - Basis-Notizen für Angebot
- **Schritt 7: Dokumente & Notfallkontakte** (DocumentsStep):
  - Notfallkontakte hinzufügen (Name, Telefon, Rolle)
  - Interne Notizen
- **Schritt 8: Zusammenfassung** (SummaryStep, 400 LOC):
  - Review aller 8 Schritte
  - Vollständigkeits-Check
  - "Objekt anlegen"-Button
  - Fortschritts-Anzeige während Erstellung

#### Phase 6c: Integration & Features (v1.16.0c)
- **API-Integration**: `useCreateSite()` Hook (React Query)
- **Payload-Transformation** (207 LOC):
  - Alle 8 Wizard-Schritte → Backend-Payload
  - Site-Daten, Customer-Relation, Security-Concept
  - Assignments, Control-Points, Calculation
- **Validierung**: `useWizardValidation.ts` (123 LOC)
  - Step-by-Step Validation
  - Final Validation vor Submit
  - Error-Display pro Schritt
- **LocalStorage Auto-Save**:
  - Auto-Speicherung bei jedem Schritt
  - Auto-Restore bei Reload
  - Auto-Clear bei Abbruch/Erfolg
- **Navigation**:
  - Nach Erfolg → `/sites/{siteId}`
  - Blockierung bei fehlenden Pflichtfeldern
- **Error Handling**:
  - Toast-Notifications (Erfolg/Fehler)
  - Validation Warnings (gelbe Box)

#### Phase 6d: Testing & Dokumentation (v1.16.0d)
- **Frontend Unit Tests** (Vitest): 40 Tests
  - `useWizardValidation.test.ts`: 25 Tests (350 LOC)
  - `api.test.ts`: 15 Tests (240 LOC)
- **Backend Integration Tests** (Jest): 10 Tests
  - Wizard Integration Suite
  - Complete Payload, Minimal Payload, Validation
  - Customer & Template API Tests
- **TypeScript**: 0 Errors, Build erfolgreich
- **Dokumentation**: Vollständig aktualisiert

### 📁 Neue Dateien
**Frontend:**
- `src/types/wizard.ts` - WizardData Interface
- `src/types/customer.ts` - Customer Types
- `src/types/template.ts` - Template Types
- `src/features/wizard/components/SiteWizard.tsx` (250 LOC)
- `src/features/wizard/components/steps/*.tsx` (8 Komponenten, ~3000 LOC)
- `src/features/wizard/hooks/useWizardValidation.ts` (123 LOC)
- `src/features/wizard/hooks/useCreateSite.ts` (207 LOC)
- `src/features/customers/` - Customer-Management (3 Komponenten)
- `src/features/templates/` - Template-Management (API)

**Backend:**
- `src/controllers/customerController.ts`
- `src/controllers/templateController.ts`
- `src/routes/customerRoutes.ts`
- `src/routes/templateRoutes.ts`
- `prisma/migrations/20251022145323_add_wizard_models_and_customer/`

### 🔧 Geänderte Dateien
- `src/router.tsx` - Wizard-Route hinzugefügt
- `src/components/layout/Sidebar.tsx` - "Neues Objekt (Wizard)" Link
- `backend/src/app.ts` - Customer & Template Routes registriert
- `backend/prisma/schema.prisma` - Customer & SiteTemplate Models

---

## [1.15.0d] - 2025-10-21

### ✨ Neue Features: Phase 5d - Erweiterte Kalkulations-Features
- **Archive-Funktion**: Status → ARCHIVED
- **Reject-Modal**: Mit Notizen und Grund-Auswahl
- **Email-Modal**: Empfänger-Auswahl, CC/BCC, Custom Message
- **Frontend-Buttons**:
  - PDF-Download-Button
  - Email-Versand-Button
  - Archive-Button
  - Duplicate-Button

---

## [1.15.0c] - 2025-10-21

### ✨ Neue Features: Phase 5c - PDF-Generator & Email
- **PDF-Generator** mit PDFKit (150 LOC):
  - Professional PDF-Template
  - Header mit Logo-Placeholder
  - Detaillierte Kalkulations-Tabelle
  - Formatierung (Währungen, Prozente)
- **Email-Versand**:
  - HTML-Template mit Preis-Box
  - Text-Fallback
  - PDF als Attachment
  - Deep-Links zur Kalkulation

### 📁 Neue Dateien
- `backend/src/utils/pdfGenerator.ts`
- `backend/src/utils/emailTemplates.ts`

---

## [1.15.0b] - 2025-10-20

### ✨ Neue Features: Phase 5b - Kalkulationen Frontend
- **Kalkulationen-Tab** in SiteDetail:
  - Liste mit Status-Badges
  - Version-Anzeige
  - Erstellt-von/am Information
- **Status-Workflow UI**:
  - DRAFT → SENT → ACCEPTED/REJECTED
  - Buttons je nach Status
  - Visuelle Status-Badges

### 📁 Neue Dateien
- `frontend/src/features/sites/pages/CalculationForm.tsx`

---

## [1.15.0a] - 2025-10-20

### 🎉 Große Features: Phase 5a - Objekt-Kalkulation Backend
- **PriceModel**: Wiederverwendbare Preis-Templates
  - Stundenpreise (normal, Nacht, Sonn-/Feiertag)
  - Gemeinkosten-Zuschläge
  - Gewinn-Marge
  - Versionierung
- **SiteCalculation**: Objekt-spezifische Kalkulationen
  - Personalkosten (Brutto → Netto → Arbeitgeberanteil)
  - Gemeinkosten-Berechnung
  - Gewinn-Berechnung
  - Status-Workflow (DRAFT, SENT, ACCEPTED, REJECTED, ARCHIVED)
  - Version-Management
- **Migration**: 20251020123456_add_price_models_site_calculations

### 📁 Neue Dateien
- `backend/src/controllers/calculationController.ts`
- `backend/src/routes/calculationRoutes.ts`

---

## [1.14.0c] - 2025-10-19

### 📚 Dokumentation: Phase 4c - Mobile-Konzept
- Mobile-App Konzept dokumentiert
- NFC-Scanner-Workflow definiert
- Offline-First Strategie
- PWA-Bereitschaft geprüft

### 📁 Neue Dateien
- `docs/planning/mobile-app-konzept.md`

---

## [1.14.0b] - 2025-10-19

### ✨ Neue Features: Phase 4b - Kontrollgänge Desktop-Frontend
- **Kontrollpunkte-Tab** in SiteDetail:
  - Kontrollpunkt-Liste mit QR-Codes
  - CRUD-Funktionen (Create, Edit, Delete)
  - NFC-Tag-Generierung (UUID v4)
  - QR-Code-Anzeige pro Punkt
- **Kontrollgänge-Übersicht**:
  - Timeline-View
  - Scan-Details
  - Status-Anzeige

### 📁 Neue Dateien
- `frontend/src/features/sites/pages/ControlPointForm.tsx`
- `frontend/src/features/sites/pages/ControlRoundDetail.tsx`

---

## [1.14.0a] - 2025-10-19

### 🎉 Große Features: Phase 4a - Kontrollgänge Backend
- **ControlPoint Model**: NFC-Kontrollpunkte
  - Name, Beschreibung, Standort
  - NFC-Tag-ID (UUID)
  - QR-Code-Fallback
  - Scan-Intervall (Minuten)
- **ControlRound Model**: Kontrollgang-Sessions
  - Zugeordneter Mitarbeiter
  - Start/End-Zeit
  - Status (IN_PROGRESS, COMPLETED, INCOMPLETE)
- **ControlScan Model**: Einzelne Scans
  - Scan-Zeit
  - Zugeordneter Punkt & Runde
  - Optional: Notizen, Fotos
- **Backend APIs**:
  - ControlPoint-CRUD: 7 Endpoints
  - ControlRound-CRUD: 6 Endpoints
  - NFC-Tag-Management
- **Migration**: 20251019145323_add_control_points_nfc_system

---

## [1.13.8] - 2025-10-18

### ✨ Neue Features: Phase 3.5c - Email & Push Notifications
- **Email-Notifications** bei CRITICAL/HIGH Vorfällen:
  - HTML-Template mit Severity-Farben
  - Text-Fallback
  - Deep-Links zum Wachbuch
  - Empfänger: ADMIN + MANAGER mit emailOptIn=true
- **Push-Notifications**:
  - Integration mit bestehendem Push-System
  - Fire-and-Forget Async Pattern
- **Docker Integration**:
  - Mailhog Container für Email-Testing
  - Web UI: http://localhost:8025

### 📁 Neue Dateien
- `backend/src/services/emailService.ts` - Email-Versand

---

## [1.13.7] - 2025-10-18

### ✨ Neue Features: Phase 3.5b - Dashboard Widget
- **Dashboard-Widget**: "Kritische Vorfälle (24h)"
  - Anzahl CRITICAL/HIGH Vorfälle
  - Auto-Refresh (60 Sekunden)
  - Links zu Objekt-Details
  - Summary-Badges

### 📁 Neue Dateien
- `frontend/src/features/dashboard/CriticalIncidentsCard.tsx`

---

## [1.13.3] - 2025-10-18

### ✨ Neue Features: Phase 3.5a - Erweiterte Wachbuch-Features
- **Edit-Funktion**: Bestehende Vorfälle bearbeiten
- **Resolve-Dialog**: Vorfälle auflösen mit Resolution-Notes
- **Filter-System**: Nach Status, Schweregrad, Kategorie
- **RBAC erweitert**: Feingranulare Berechtigungen
- **Schicht-Kontext**: Vorfälle können Schichten zugeordnet werden

---

## [1.13.2] - 2025-10-17

### ✨ Neue Features: Phase 3 CRUD Complete
- **CreateIncidentModal** (8 Felder):
  - Titel, Beschreibung, Kategorie, Schweregrad
  - Vorfallzeit, Ort, Beteiligte Personen
- **4 React Query Mutations**:
  - Create, Update, Resolve, Delete
  - Optimistic Updates
  - Toast-Notifications
- **Delete-Bestätigung**: Sicherheits-Modal

---

## [1.13.1] - 2025-10-17

### ✨ Neue Features: Phase 3 Frontend MVP
- **Wachbuch-Tab** in SiteDetail:
  - Timeline-View (chronologisch)
  - Severity-Badges (CRITICAL, HIGH, MEDIUM, LOW)
  - Status-Badges (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
  - Resolution-Anzeige
  - Hover-Effects

---

## [1.13.0] - 2025-10-17

### 🎉 Große Features: Phase 3 - Wachbuch & Vorfälle Backend
- **SiteIncident Model**: Digitales Wachbuch
  - 11 Kategorien (Brand, Einbruch, Diebstahl, etc.)
  - 4 Severity-Levels (CRITICAL, HIGH, MEDIUM, LOW)
  - Status-Workflow (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
  - Beteiligte Personen (JSON-Array)
  - Resolution-Notes
- **Backend APIs**:
  - 6 CRUD-Endpoints
  - RBAC: EMPLOYEE kann melden, ADMIN/MANAGER verwalten
- **Migration**: 20251018030000_add_site_incidents

---

## [1.12.2] - 2025-10-16

### ✨ Neue Features: Phase 2 Complete - Document Viewer
- **Dokument-Viewer**:
  - PDF: iframe-basiert
  - Markdown: react-markdown
  - Text: pre-formattiert
- **UI Features**:
  - View/Download/Delete-Buttons
  - Fullscreen-Toggle
  - Kategorisierung

---

## [1.12.1] - 2025-10-16

### ✨ Neue Features: Phase 2 File Upload
- **Multer Integration**: FormData-Handling
- **Upload-Endpoint**: POST /api/sites/:id/documents
- **Kategorien**: 7 Dokument-Typen

---

## [1.12.0] - 2025-10-16

### 🎉 Große Features: Phase 2 - Dokument-Management Backend
- **SiteDocument Model**: Versioniertes Dokument-System
  - 7 Kategorien (Dienstanweisung, Notfallplan, etc.)
  - Versionierung (previousVersion, isLatest)
  - Auto-Rollback bei Löschung
- **Backend APIs**:
  - Document-CRUD: 6 Endpoints
  - RBAC: ADMIN, MANAGER
- **Migration**: 20251018025212_add_site_documents

---

## [1.11.1] - 2025-10-16

### ✨ Verbesserungen: Phase 1.5 - UX Enhancement
- **React-Select Dropdowns**: Searchable mit Avatar-Icons
- **Skeleton Loading States**: Animierte Platzhalter
- **Animationen & Transitions**:
  - Modal fade-in & zoom-in
  - Tab-Content slide-in
  - Hover-Effects
- **Moderneres Design**:
  - Gradient-Backgrounds
  - Bessere Shadows
  - Icons (Lucide-React)
- **Responsive Design**: Mobile-First Grid

---

## [1.11.0] - 2025-10-16

### 🎉 Große Features: Phase 1 - Objekt-Grundlagen Complete
- **Datenmodell erweitert**:
  - Site: customerName, emergencyContacts, status, requiredQualifications
  - SiteImage: Objektfotos mit Kategorien
  - SiteAssignment: Objektleiter/Schichtleiter
  - ObjectClearance: Einarbeitungs-Tracking
- **Backend-Implementation**:
  - Site-Controller erweitert
  - Image-Upload (FormData)
  - Clearances-Endpoints
  - Coverage-Stats
  - **Scoring-System**: Object-Clearance-Score (5 Komponenten)
- **Frontend-Implementation**:
  - Objekt-Liste mit Filtern
  - Objekt-Detail (4 Tabs)
  - Objekt-Formular (Create & Edit)
  - Clearances-Verwaltung
  - Assignments-Verwaltung
  - **Replacement-Modal**: Clearance-Badge
- **Migration**: 20251016224831_add_sites_clearances

---

## Versionsübersicht

- **v1.16.x**: Phase 6 - Intelligenter Objekt-Anlage-Wizard
- **v1.15.x**: Phase 5 - Objekt-Kalkulation & Angebotserstellung
- **v1.14.x**: Phase 4 - Kontrollgänge & NFC-Rundenwesen
- **v1.13.x**: Phase 3 - Wachbuch & Vorfälle
- **v1.12.x**: Phase 2 - Dokument-Management
- **v1.11.x**: Phase 1 - Objekt-Grundlagen

---

[Unreleased]: https://github.com/yourusername/project/compare/v1.16.1...HEAD
[1.16.1]: https://github.com/yourusername/project/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/yourusername/project/compare/v1.15.0d...v1.16.0
[1.15.0d]: https://github.com/yourusername/project/compare/v1.15.0c...v1.15.0d
[1.15.0c]: https://github.com/yourusername/project/compare/v1.15.0b...v1.15.0c
[1.15.0b]: https://github.com/yourusername/project/compare/v1.15.0a...v1.15.0b
[1.15.0a]: https://github.com/yourusername/project/compare/v1.14.0c...v1.15.0a
