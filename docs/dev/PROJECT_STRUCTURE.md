# Projekt-Struktur & Navigation

**Zuletzt aktualisiert:** 2025-10-23
**Zweck:** Schnelle Orientierung für neue Entwickler und KI-Assistenten

---

## 📁 Haupt-Verzeichnisse

```
sicherheitsdienst-tool/
├── backend/              # Node.js/Express API
├── frontend/             # React/Vite SPA
├── docs/                 # Komplette Projektdokumentation
├── .claude/              # Claude Code Konfiguration
└── docker-compose*.yml   # Container-Orchestrierung
```

---

## 🔧 Backend (`/backend`)

### Verzeichnis-Struktur
```
backend/
├── src/
│   ├── controllers/      # Request-Handler (Business-Logik)
│   ├── routes/          # Express-Routen-Definitionen
│   ├── middleware/      # Auth, RBAC, Error-Handling
│   ├── services/        # Business-Logik-Services
│   ├── utils/           # Hilfsfunktionen
│   ├── types/           # TypeScript Type-Definitionen
│   ├── __tests__/       # Integration-Tests (Jest)
│   ├── app.ts           # Express-App-Konfiguration
│   └── server.ts        # Server-Entry-Point
├── prisma/
│   ├── schema.prisma    # Datenmodell-Definition
│   ├── migrations/      # Datenbank-Migrationen
│   └── seed.ts          # Test-Daten-Generator
├── storage/
│   └── documents/       # Hochgeladene Dokumente (LUKS-verschlüsselt)
├── dist/                # Kompiliertes JavaScript (Build-Output)
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Wichtige Dateien

**Controllers** (`src/controllers/`)
- `authController.ts` - Login, Logout, Token-Refresh
- `userController.ts` - Benutzer-CRUD
- `shiftController.ts` - Schicht-Management
- `siteController.ts` - Objekt-Verwaltung (Phase 1-6)
- `clearanceController.ts` - Objekt-Einarbeitungen
- `documentController.ts` - Dokument-Management (Phase 2)
- `incidentController.ts` - Wachbuch & Vorfälle (Phase 3)
- `controlController.ts` - Kontrollgänge & NFC (Phase 4)
- `calculationController.ts` - Kalkulation & Angebote (Phase 5)
- `customerController.ts` - Kunden-Verwaltung (Phase 6)
- `templateController.ts` - Sicherheitskonzept-Templates (Phase 6)
- `dashboardController.ts` - Dashboard-Widgets
- `absenceController.ts` - Abwesenheits-Management

**Services** (`src/services/`)
- `intelligentReplacement.ts` - Automatische Vertretungs-Vorschläge (Scoring-System)
- `emailService.ts` - Email-Versand (Nodemailer)
- `pushNotificationService.ts` - Push-Notifications
- `pdfGenerator.ts` - PDF-Erstellung (PDFKit)

**Middleware** (`src/middleware/`)
- `auth.ts` - JWT-Authentifizierung & RBAC
- `security.ts` - Helmet, CORS, Rate-Limiting
- `errorHandler.ts` - Globaler Error-Handler
- `requestId.ts` - Request-ID-Tracking

**Prisma Schema** (`prisma/schema.prisma`)
- 40+ Datenmodelle
- Wichtigste Models:
  - `User`, `Shift`, `ShiftAssignment`, `TimeEntry`
  - `Site`, `SiteImage`, `SiteAssignment`, `ObjectClearance`
  - `SiteDocument`, `SiteIncident`, `SiteCalculation`
  - `Customer`, `SiteTemplate`
  - `ControlPoint`, `ControlRound`, `ControlScan`
  - `Absence`, `EmployeeProfile`, `EmployeeDocument`

---

## 🎨 Frontend (`/frontend`)

### Verzeichnis-Struktur
```
frontend/
├── src/
│   ├── components/      # Wiederverwendbare UI-Komponenten
│   │   ├── ui/         # Basis-Komponenten (Button, Modal, etc.)
│   │   └── layout/     # Layout-Komponenten (Sidebar, Header)
│   ├── features/        # Feature-Module (Domain-Driven)
│   │   ├── auth/       # Login, Authentifizierung
│   │   ├── users/      # Benutzer-Verwaltung
│   │   ├── shifts/     # Schicht-Management
│   │   ├── sites/      # Objekt-Verwaltung (Phase 1-6)
│   │   ├── absences/   # Abwesenheiten
│   │   ├── incidents/  # Vorfälle (alt, vor Phase 3)
│   │   ├── dashboard/  # Dashboard-Widgets
│   │   ├── customers/  # Kunden-Verwaltung (Phase 6)
│   │   ├── templates/  # Template-Management (Phase 6)
│   │   └── wizard/     # Objekt-Anlage-Wizard (Phase 6)
│   ├── pages/           # Top-Level-Pages
│   ├── lib/             # Hilfsfunktionen
│   ├── types/           # TypeScript-Typen
│   ├── router.tsx       # React-Router-Konfiguration
│   ├── App.tsx          # Root-Komponente
│   └── main.tsx         # Entry-Point
├── public/              # Statische Assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Feature-Module (Domain-Driven Design)

Jedes Feature-Modul folgt dieser Struktur:
```
features/<feature>/
├── api.ts              # React Query Hooks (API-Calls)
├── types.ts            # TypeScript-Interfaces
├── pages/              # Feature-spezifische Pages
├── components/         # Feature-spezifische Komponenten
└── __tests__/          # Tests (Vitest)
```

**Beispiel: sites-Feature**
```
features/sites/
├── api.ts              # useSites(), useSite(), useCreateSite(), etc.
├── calculationApi.ts   # Kalkulations-API (Phase 5)
├── types.ts            # Site, SiteImage, SiteCalculation, etc.
├── pages/
│   ├── SitesList.tsx
│   ├── SiteDetail.tsx  # 7 Tabs: Übersicht, Clearances, Dokumente, etc.
│   ├── SiteForm.tsx
│   ├── ControlPointForm.tsx
│   ├── ControlRoundDetail.tsx
│   └── CalculationForm.tsx
└── __tests__/
    └── SiteWizard.test.ts
```

### Wichtige Komponenten

**UI-Komponenten** (`components/ui/`)
- `button.tsx`, `modal.tsx`, `input.tsx`, `select.tsx`
- `skeleton.tsx`, `spinner.tsx`, `badge.tsx`
- `toast.tsx` - Notifications (Sonner)

**Layout** (`components/layout/`)
- `Layout.tsx` - Haupt-Layout mit Sidebar
- `Sidebar.tsx` - Navigation
- `Header.tsx` - Top-Bar

**Wizard** (`features/wizard/`)
- `SiteWizard.tsx` - Wizard-Container (250 LOC)
- `components/steps/` - 8 Wizard-Schritte:
  - `CustomerStep.tsx` - Kunde auswählen/anlegen
  - `ObjectStep.tsx` - Objekt-Grunddaten
  - `SecurityConceptStep.tsx` - Sicherheitskonzept (582 LOC)
  - `StaffStep.tsx` - Personal-Zuweisung
  - `ControlPointsStep.tsx` - Kontrollpunkte
  - `CalculationStep.tsx` - Kalkulation
  - `DocumentsStep.tsx` - Dokumente & Notfallkontakte
  - `SummaryStep.tsx` - Zusammenfassung (400 LOC)

---

## 📚 Dokumentation (`/docs`)

### Hauptdokumentation (neue Struktur)
```
docs/
├── product/        # Produkt- & Feature-Dokumentation, Releases, Roadmap
├── dev/            # Entwicklerdoku, API, Architektur, Tests
├── ops/            # Betrieb, Deployment, Runbooks
└── security/       # Security, RBAC, Analysen
```

### Produkt-Dokumente (Auszug)
```
docs/product/
├── FEATURE_OBJEKT_MANAGEMENT.md
├── CHANGELOG.md
├── TODO.md
├── releases/
└── planning/
```

### Dev-Dokumente (Auszug)
```
docs/dev/
├── ARCHITECTURE.md
├── PROJECT_STRUCTURE.md
├── API_CHEATSHEET.md
├── openapi.yaml
└── sessions/
```

### Operations (Auszug)
```
docs/ops/
├── README.md
├── DEPLOYMENT_CHECKLIST.md
└── setup-https-letsencrypt.md
```

---

## 🔧 Claude Code Konfiguration (`/.claude`)

```
.claude/
├── .clinerules              # Claude Code Projektregeln
├── commands/                # Slash-Commands
└── hooks/                   # Pre/Post-Hooks (z.B. Tests)
```

**Wichtig für KI-Assistenten:**
- `.clinerules` enthält Projekt-spezifische Konventionen
- Commands definieren wiederverwendbare Workflows
- Hooks automatisieren Tests vor Commits

---

## 🗂️ Wichtige Konzepte & Patterns

### 1. RBAC (Role-Based Access Control)
**Rollen:**
- `ADMIN` - Vollzugriff
- `MANAGER` - Einsatzleiter (Objekte, Schichten, Personal)
- `DISPATCHER` - Leitstelle (Schichten zuweisen, Abwesenheiten genehmigen)
- `EMPLOYEE` - Mitarbeiter (eigene Schichten, Abwesenheiten)

**Implementation:**
- Backend: `middleware/auth.ts` (`authenticate`, `authorize`)
- Frontend: `RequireRole` Komponente

### 2. Intelligent Replacement System
**Scoring-Komponenten:**
- Workload (25%) - Auslastung & Ruhezeiten
- Compliance (35%) - Qualifikationen & Rechtliches
- Fairness (15%) - Gleichverteilung der Schichten
- Präferenz (25%) - Mitarbeiter-Wünsche
- Object-Clearance (20%) - Objekt-Einarbeitung (seit Phase 1)

**Implementation:**
- `backend/src/services/intelligentReplacement.ts`
- `frontend/src/features/absences/ReplacementCandidatesModalV2.tsx`

### 3. Objekt-Management-Suite (Phase 1-6)
**Vollständiger Lebenszyklus:**
1. **Kundenanfrage** → Customer-Management (Phase 6)
2. **Angebot erstellen** → Kalkulation & PDF (Phase 5)
3. **Objekt anlegen** → 8-Schritt-Wizard (Phase 6)
4. **Personal einarbeiten** → Clearances (Phase 1)
5. **Dokumente hinterlegen** → Dokument-Management (Phase 2)
6. **Schichten planen** → Shift-Management
7. **Kontrollgänge definieren** → NFC-System (Phase 4)
8. **Vorfälle dokumentieren** → Wachbuch (Phase 3)
9. **Abrechnung** → Billing (geplant: Phase 8)

### 4. Datenmodell-Beziehungen
**Zentrale Entitäten:**
```
User ──1:N─→ ShiftAssignment ──N:1─→ Shift ──N:1─→ Site
User ──1:N─→ ObjectClearance ──N:1─→ Site
User ──1:N─→ Absence
Site ──N:1─→ Customer
Site ──1:N─→ SiteImage
Site ──1:N─→ SiteDocument
Site ──1:N─→ SiteIncident
Site ──1:N─→ SiteCalculation
Site ──1:N─→ ControlPoint ──1:N─→ ControlScan ──N:1─→ ControlRound
```

---

## 🧪 Testing

### Backend-Tests (Jest)
```bash
cd backend
npm test                    # Alle Tests
npm test -- shifts         # Nur Shift-Tests
npm run test:coverage      # Mit Coverage-Report
```

**Test-Dateien:** `backend/src/__tests__/*.test.ts`

### Frontend-Tests (Vitest)
```bash
cd frontend
npm test                    # Alle Tests
npm test -- wizard         # Nur Wizard-Tests
npm run test:coverage      # Mit Coverage
```

**Test-Dateien:** `frontend/src/**/__tests__/*.test.ts`

---

## 🚀 Development-Workflow

### 1. Neue Feature-Branch erstellen
```bash
git checkout -b feature/your-feature-name
```

### 2. Backend-Änderungen
```bash
cd backend

# Datenmodell ändern
vim prisma/schema.prisma

# Migration erstellen
npx prisma migrate dev --name add_your_feature

# Controller/Routes implementieren
vim src/controllers/yourController.ts
vim src/routes/yourRoutes.ts

# Tests schreiben
vim src/__tests__/your.test.ts

# Tests ausführen
npm test
```

### 3. Frontend-Änderungen
```bash
cd frontend

# API-Hook erstellen
vim src/features/your-feature/api.ts

# Komponenten implementieren
vim src/features/your-feature/pages/YourPage.tsx

# Tests schreiben
vim src/features/your-feature/__tests__/YourPage.test.ts

# Tests ausführen
npm test
```

### 4. Dokumentation aktualisieren
```bash
# TODO.md aktualisieren
vim docs/product/TODO.md

# CHANGELOG.md ergänzen
vim docs/product/CHANGELOG.md

# Feature-Dokumentation schreiben
vim docs/product/FEATURE_YOUR_FEATURE.md

# Session-Log erstellen (bei größeren Features)
vim docs/dev/sessions/SESSION_YYYY-MM-DD.md
```

### 5. Commit & Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

---

## 🔍 Schnellsuche: "Wo finde ich...?"

### "Wo ist die Login-Logik?"
- Backend: `backend/src/controllers/authController.ts`
- Frontend: `frontend/src/features/auth/`
- Middleware: `backend/src/middleware/auth.ts`

### "Wo werden Schichten verwaltet?"
- Backend: `backend/src/controllers/shiftController.ts`
- Frontend: `frontend/src/features/shifts/`
- Datenmodell: `Shift`, `ShiftAssignment` in `schema.prisma`

### "Wo ist das Replacement-System?"
- Backend: `backend/src/services/intelligentReplacement.ts`
- Frontend: `frontend/src/features/absences/ReplacementCandidatesModalV2.tsx`
- Dokumentation: `docs/product/planning/scoring-objekt-integration.md`

### "Wo ist der Wizard?"
- Frontend: `frontend/src/features/wizard/`
- Wizard-Container: `SiteWizard.tsx`
- Schritte: `components/steps/`
- Dokumentation: `docs/product/planning/workflow-wizard-objekt-anlegen.md`

### "Wo sind die Kalkulationen?"
- Backend: `backend/src/controllers/calculationController.ts`
- Frontend: `frontend/src/features/sites/pages/CalculationForm.tsx`
- PDF-Generator: `backend/src/utils/pdfGenerator.ts`

### "Wo ist das Wachbuch?"
- Backend: `backend/src/controllers/incidentController.ts`
- Frontend: `frontend/src/features/sites/pages/SiteDetail.tsx` (Wachbuch-Tab)
- Datenmodell: `SiteIncident` in `schema.prisma`

### "Wo sind die NFC-Kontrollgänge?"
- Backend: `backend/src/controllers/controlController.ts`
- Frontend: `frontend/src/features/sites/pages/ControlPointForm.tsx`
- Datenmodell: `ControlPoint`, `ControlRound`, `ControlScan`

### "Wo ist die Email-Logik?"
- Backend: `backend/src/services/emailService.ts`
- Templates: Inline in `emailService.ts`
- Config: `.env` (SMTP_HOST, SMTP_PORT, etc.)

### "Wo sind die Seeding-Scripts?"
- Standard: `backend/prisma/seed.ts`
- Templates: `backend/seed-templates.js`
- Test-Schichten: `backend/create-urgent-shift-today.js`
- Password-Reset: `backend/reset-admin-password.js`

---

## 📖 Weitere Ressourcen

**Für neue Entwickler:**
1. Lesen: `GETTING_STARTED.md` (Step-by-Step Setup)
2. Lesen: `docs/dev/ARCHITECTURE.md` (System-Übersicht)
3. Lesen: `docs/product/FEATURE_OBJEKT_MANAGEMENT.md` (Phase 1-8 Konzept)
4. Durcharbeiten: `docs/dev/sessions/` (Entwicklungs-Historie)

**Für KI-Assistenten:**
1. Lesen: `.claude/.clinerules` (Projekt-Konventionen)
2. Lesen: `docs/dev/PROJECT_STRUCTURE.md` (DIESES DOKUMENT)
3. Lesen: `docs/product/CHANGELOG.md` (Was wurde wann gemacht?)
4. Prüfen: `docs/product/TODO.md` (Was ist offen?)

**Für Operations:**
1. Lesen: `docs/ops/README.md`
2. Lesen: `docs/ops/DEPLOYMENT_CHECKLIST.md`
3. Lesen: `docs/ops/system-health.md`

---

**Letzte Aktualisierung:** 2025-10-23, 21:30 Uhr (Session v1.16.1)
**Nächste Review:** Bei Phase 7 Implementation
