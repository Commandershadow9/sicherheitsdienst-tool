# TODO / Roadmap (Stand: 2025-10-17)

> Abgeschlossene Aufgaben liegen jetzt in `docs/TODO_ARCHIVE.md`.

## Kurzfristig (P1, 1–2 Tage)
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

#### Phase 3: Wachbuch & Vorfälle (v1.13.0)
**Aufwand**: 3-4 Tage | **Status**: Geplant

- [ ] Datenmodell: SiteIncident (kategorisiert, Schweregrad)
- [ ] Backend: CRUD, Benachrichtigungen (Email)
- [ ] Frontend: Wachbuch (Timeline-View)
- [ ] Vorfall-Melde-Dialog (Mobile-optimiert)
- [ ] Filter & PDF-Export

**Abhängigkeiten**: Phase 2
**Liefert**: Digitales Wachbuch

---

#### Phase 4: Kontrollgänge & NFC-Rundenwesen (v1.14.0)
**Aufwand**: 4-5 Tage | **Status**: Geplant

- [ ] Datenmodell: ControlPoint, ControlRound, ControlPointScan
- [ ] Backend: Kontrollpunkte-CRUD, NFC-Tag-Verwaltung
- [ ] NFC-Service: Web NFC API Integration
- [ ] Frontend: Kontrollpunkte-Verwaltung (Desktop)
- [ ] Mobile: NFC-Scanner-Interface (PWA)
- [ ] QR-Code-Fallback (für Geräte ohne NFC)
- [ ] Auswertungen & Reports

**Abhängigkeiten**: Phase 3
**Liefert**: NFC-basierte Kontrollgänge
**Wichtig**: NFC-Tags müssen beschafft werden

---

#### Phase 5: Übergabe-Protokolle (v1.15.0)
**Aufwand**: 2-3 Tage | **Status**: Geplant

- [ ] Datenmodell: Equipment, EquipmentHandover
- [ ] Backend: Ausrüstungs-Tracking
- [ ] Frontend: Übergabe/Rückgabe-Dialoge
- [ ] Schichtwechsel-Workflow
- [ ] History & Reports

**Abhängigkeiten**: Phase 4
**Liefert**: PSA & Ausrüstungs-Tracking

---

#### Phase 6: Kalkulation & Akquise (v1.16.0)
**Aufwand**: 3-4 Tage | **Status**: Geplant

- [ ] Datenmodell: SiteInquiry, SiteCalculation, SiteOffer
- [ ] Backend: Kalkulations-Engine (automatisch mit Override)
- [ ] PDF-Generator: Angebots-Erstellung
- [ ] Frontend: Anfragen-Verwaltung (Kanban-Board)
- [ ] Kalkulationstool (Hybrid: Auto + Manual)
- [ ] Status-Workflow (Anfrage → Angebot → Auftrag)

**Abhängigkeiten**: Phase 5
**Liefert**: Von Kundenanfrage zum Angebot
**Langfristig**: KI-gestützte Kalkulation (v1.17.0+)

---

#### Phase 7: Abrechnungssystem (v1.17.0)
**Aufwand**: 3-4 Tage | **Status**: Geplant

- [ ] Datenmodell: SiteBilling, BillingItem
- [ ] Backend: Stundenerfassung aus Schichten
- [ ] PDF-Generator: Rechnungs-Erstellung
- [ ] Frontend: Abrechnungs-Übersicht (pro Monat/Objekt)
- [ ] Export-Funktion (CSV für Buchhaltung)

**Abhängigkeiten**: Phase 6
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

## Langfristig (P3+)
- [ ] Predictive Scheduling & Auto-Assignment (v2.x Roadmap).
- [ ] Storage/Infra: S3/MinIO-Umstieg inkl. Verschlüsselungs-/Migrationkonzept.
- [ ] KI-Integration: ML-Modell für Auto-Assignment, Optimierungs-Algorithmen.
