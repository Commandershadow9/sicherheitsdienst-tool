# Changelog

All notable changes to this project will be documented in this file.

## [1.13.2] - 2025-10-19 – Wachbuch CRUD Complete (Phase 3: 100% ✅)

### Added - Frontend CRUD
- **CreateIncidentModal**:
  - Vollständiges Formular mit 8 Feldern
  - Titel & Beschreibung (Pflichtfelder mit Validierung)
  - Kategorie-Dropdown (11 Optionen: Brand, Einbruch, Diebstahl, etc.)
  - Schweregrad-Dropdown (Kritisch, Hoch, Mittel, Niedrig)
  - Vorfallzeit (datetime-local Input, vorausgefüllt mit jetzt)
  - Ort & Beteiligte Personen (optional)
  - Responsive Grid-Layout (2 Spalten auf Desktop)

- **Incident Mutations** (4 Stück):
  - `createIncidentMutation`: POST /sites/:siteId/incidents
  - `updateIncidentMutation`: PUT /sites/:siteId/incidents/:id
  - `resolveIncidentMutation`: PUT /sites/:siteId/incidents/:id/resolve
  - `deleteIncidentMutation`: DELETE /sites/:siteId/incidents/:id
  - Query Invalidation für automatische Cache-Updates
  - Toast-Notifications für alle Aktionen

- **Delete-Bestätigung Modal**:
  - Sicherheitsabfrage vor Löschen
  - State: `deleteIncidentId`
  - Loading States während Mutation

### Changed - Wachbuch Tab
- "Vorfall melden" Button funktioniert (kein Placeholder mehr)
- Öffnet CreateIncidentModal mit initialen Werten
- State: `createIncidentModal` mit vollständigem Formobjekt

### Technical
- TypeScript: 0 Errors
- Vite Build: Erfolgreich (867.98 kB Bundle)
- Modal Component: `open={true}` Prop korrekt gesetzt
- 264 neue Zeilen Code in SiteDetail.tsx

### Phase 3 Complete
- ✅ Backend: Datenmodell & 6 CRUD-Endpoints
- ✅ Frontend: Timeline-View mit Badges
- ✅ Frontend: CRUD (Create, Update, Resolve, Delete)
- ⚠️ Optional noch offen: Edit/Resolve-Dialoge, Filter, Email-Notifications

## [1.13.1] - 2025-10-18 – Wachbuch & Vorfälle Frontend MVP

### Added - Frontend
- **Wachbuch-Tab in SiteDetail**:
  - Timeline-View mit chronologischer Sortierung
  - Severity-Badges (CRITICAL: rot, HIGH: orange, MEDIUM: gelb, LOW: grau)
  - Status-Badges (OPEN: blau, IN_PROGRESS: blau, RESOLVED: grün, CLOSED: grau)
  - Kategorie & Ort-Anzeige
  - Vorfallzeit & Reporter-Info
  - Resolution-Anzeige (grüne Box bei gelösten Vorfällen)
  - "Vorfall melden" Button (Placeholder für v1.13.2)

### Changed - UI/UX
- Border-Left Farbcodierung (orange) für Vorfälle
- Hover-Effects (shadow transition)
- Responsive Layout für Mobile & Desktop
- Icons (AlertTriangle von Lucide)

### Technical
- Site Type um `incidents[]` erweitert
- activeTab Type um 'incidents' erweitert
- Tab-Array um Vorfälle-Tab erweitert

## [1.13.0] - 2025-10-18 – Wachbuch & Vorfälle Backend

### Added - Datenmodell
- **SiteIncident Model**:
  - 11 Kategorien: FIRE, BREAK_IN, THEFT, VANDALISM, ACCIDENT, MEDICAL_EMERGENCY, DISTURBANCE, PROPERTY_DAMAGE, SUSPICIOUS_PERSON, TECHNICAL_FAILURE, OTHER
  - 4 Severity-Levels: CRITICAL, HIGH, MEDIUM, LOW (nutzt bestehende IncidentSeverity Enum)
  - Status-Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED (nutzt IncidentStatus Enum)
  - Zeiterfassung: occurredAt (Vorfallzeit), reportedAt (Meldezeit), resolvedAt (Lösungszeit)
  - Beteiligte Personen: involvedPersons (JSON-Array)
  - Auflösungs-Notizen: resolution field
  - Migration: `20251018030000_add_site_incidents`

### Added - Backend-API
- **SiteIncident-Controller** (`/api/sites/:siteId/incidents`):
  - `GET /incidents` - Liste mit Filter (category, status, severity)
  - `GET /incidents/:id` - Einzelner Incident
  - `POST /incidents` - Incident erstellen (RBAC: EMPLOYEE+)
  - `PUT /incidents/:id` - Incident aktualisieren (RBAC: ADMIN, MANAGER)
  - `PUT /incidents/:id/resolve` - Incident auflösen (RBAC: ADMIN, MANAGER)
  - `DELETE /incidents/:id` - Incident löschen (RBAC: ADMIN, MANAGER)

### RBAC
- EMPLOYEE kann Vorfälle melden
- ADMIN & MANAGER können verwalten, aktualisieren, auflösen, löschen

## [1.12.2] - 2025-10-18 – Dokument-Viewer

### Added - Frontend
- **DocumentViewerModal Component**:
  - PDF-Viewer: Browser-native via iframe
  - Markdown-Viewer: react-markdown mit prose styling
  - Text-Viewer: Pre-formatted mit monospace
  - Word/Excel: "Download only" Hinweis
  - Fullscreen-Toggle (Maximize/Minimize)
  - Download-Button im Viewer
  - Loading & Error States

### Changed - UI Components
- **Modal Component erweitert**:
  - Size-Support: sm, md, lg, xl, fullscreen
  - ReactNode-Support für komplexe Titles
  - Fullscreen-Modus ohne Margins/Rounded Corners

### Technical
- Package: react-markdown installiert (78 packages)
- View-Button (Eye Icon) in Dokumente-Liste
- Modal mit xl & fullscreen Sizes

## [1.12.1] - 2025-10-18 – Multer File-Upload Integration

### Added - Backend
- **Multer-Middleware** (`uploadDocument.ts`):
  - Disk Storage: uploads/documents
  - Unique Filename: basename-timestamp-random.ext
  - File Filter: PDF, DOC, DOCX, TXT, MD, XLS, XLSX
  - Size Limit: 10 MB

### Changed - Backend
- **documentController** angepasst:
  - uploadDocument nutzt req.file (Multer)
  - Extrahiert filename, filePath, fileSize, mimeType aus Multer
  - downloadDocument Endpoint hinzugefügt (res.download)

### Technical
- Package: multer + @types/multer installiert (v1.4.7)
- POST /documents: uploadDocument.single('document') Middleware
- GET /documents/:id/download: Download-Endpoint
- 405 Handlers aktualisiert

## [1.12.0] - 2025-10-18 – Dokument-Management

### Added - Datenmodell
- **SiteDocument Model**:
  - 7 Kategorien: DIENSTANWEISUNG, NOTFALLPLAN, VERTRAG, BRANDSCHUTZORDNUNG, HAUSORDNUNG, GRUNDRISS, SONSTIGES
  - Versionierung: version field, isLatest flag, previousVersionId (Self-Relation)
  - File-Informationen: filename, filePath, fileSize, mimeType
  - Metadaten: uploadedAt, uploadedBy, updatedAt
  - Migration: `20251018025212_add_site_documents`

### Added - Backend-API
- **Document-Controller** (`/api/sites/:siteId/documents`):
  - `GET /documents` - Liste mit Filter (category, latestOnly)
  - `GET /documents/:id` - Einzelnes Dokument
  - `GET /documents/:id/versions` - Alle Versionen
  - `GET /documents/:id/download` - Dokument herunterladen
  - `POST /documents` - Upload (mit Versionierung)
  - `PUT /documents/:id` - Metadaten aktualisieren
  - `DELETE /documents/:id` - Löschen (auto-rollback auf previousVersion)

### Added - Frontend
- **Dokumente-Tab in SiteDetail**:
  - Dokumenten-Liste mit Version-Badges (v2, v3, "Aktuell")
  - Metadata-Display (Kategorie, Größe, Datum, Uploader)
  - Upload-Dialog (Titel, Beschreibung, Kategorie, File)
  - View/Download/Delete-Buttons
  - Mutations mit Cache-Invalidierung

### RBAC
- ADMIN & MANAGER können Dokumente hochladen, aktualisieren, löschen
- Alle Authenticated User können Dokumente ansehen/downloaden

## [1.11.1] - 2025-10-17 – UX Enhancement (Phase 1.5)

### Added - UI Components
- **React-Select Integration**:
  - UserSelect Component mit Avatar-Icons und Suche
  - Clearance & Assignment Modals verwenden UserSelect
  - Suche nach Name und Email möglich

### Added - Loading States
- **Skeleton Screens**:
  - SkeletonDetailPage für Detail-Views
  - SkeletonForm für Form-Loading
  - SkeletonCard, SkeletonList, SkeletonText Komponenten
  - Spinner im Submit-Button (SiteForm) mit Loader2 Icon
  - Alle "Laden..." durch animierte Skeletons ersetzt

### Changed - UI/UX
- **Animationen & Transitions**:
  - Modal fade-in & zoom-in Animation (200ms)
  - Backdrop blur-effect
  - Tab-Content slide-in Animation (300ms)
  - Hover-Effects auf Cards (border-color, shadow)
  - Smooth transitions (duration-200)

### Changed - Design
- **Moderneres Design**:
  - Cards: rounded-lg → rounded-xl
  - Bessere Shadows (shadow-sm, shadow-md, shadow-lg)
  - Gradient-Backgrounds für Sections (blue-50 → indigo-50, red-50 → rose-50, purple-50 → violet-50)
  - Farbige Section-Headings (blue-900, red-900, purple-900)
  - Modernere Spacing (mb-3 → mb-4)

### Changed - Responsive
- **Mobile-First Design**:
  - Grid: grid-cols-2 → grid-cols-1 md:grid-cols-2
  - Bilder-Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  - Header: flex → flex-col sm:flex-row
  - Buttons: flex-wrap für besseres Wrapping
  - Tab-Navigation: overflow-x-auto für Mobile
  - Modal: mx-4 für Seitenabstand auf Mobile

### Technical
- Package: react-select installiert (v5.10.2)
- Icons: Lucide-React (Building2, Phone, UserCheck, Shield, Calendar, ImageIcon, FileText, Upload, Download, Trash2, Eye, AlertTriangle, Plus, Check, X)

## [1.11.0] - 2025-10-17 – Objekt-Management Phase 1 (Backend-Grundlagen)

### Added - Datenmodell-Erweiterungen
- **Objekt-Management Datenmodell**:
  - **Site-Erweiterungen**: Kunden-Informationen (Name, Firma, E-Mail, Telefon), Notfallkontakte (JSON), Status (INQUIRY, IN_REVIEW, CALCULATING, OFFER_SENT, ACTIVE, INACTIVE, LOST), Anforderungen (requiredStaff, requiredQualifications), Beschreibung & Notizen
  - **SiteImage**: Objekt-Bilder mit Kategorien (EXTERIOR, INTERIOR, FLOOR_PLAN, EQUIPMENT, EMERGENCY, OTHER)
  - **SiteAssignment**: Objekt-Zuweisungen (OBJEKTLEITER, SCHICHTLEITER, MITARBEITER)
  - **ObjectClearance-Erweiterungen**: Training-Details (trainingCompletedAt, trainingHours, approvedBy), TRAINING-Status hinzugefügt
  - Migration: `20251016224831_add_site_management_phase1`

### Added - Backend-API
- **Site-Controller-Erweiterungen**:
  - CRUD-Operationen mit allen neuen Feldern
  - Relation-Loading (Images, Assignments, Clearances) via Query-Parameter
  - Filter-Unterstützung (Status, Kunden-Name, Kunden-Firma)
- **Bilder-Management**:
  - `GET /api/sites/:id/images` - Bilder abrufen (Filter: Kategorie)
  - `POST /api/sites/:id/images` - Bilder hochladen (RBAC: ADMIN, MANAGER, DISPATCHER)
  - `DELETE /api/sites/:siteId/images/:imageId` - Bilder löschen (RBAC: ADMIN, MANAGER)
- **Zuweisungen-Management**:
  - `GET /api/sites/:id/assignments` - Zuweisungen abrufen (Filter: Rolle)
  - `POST /api/sites/:id/assignments` - Zuweisungen erstellen (RBAC: ADMIN, MANAGER)
  - `DELETE /api/sites/:siteId/assignments/:assignmentId` - Zuweisungen löschen (RBAC: ADMIN, MANAGER)
- **Coverage-Stats**:
  - `GET /api/sites/:id/coverage-stats` - Coverage-Statistiken (Clearances vs. requiredStaff, Zuweisungen nach Rolle)
- **Clearances-Controller (NEU)**:
  - `GET /api/clearances` - Alle Clearances (Filter: userId, siteId, status)
  - `POST /api/clearances` - Neue Clearance erstellen (RBAC: ADMIN, MANAGER)
  - `GET /api/clearances/:id` - Einzelne Clearance
  - `PUT /api/clearances/:id` - Clearance aktualisieren (RBAC: ADMIN, MANAGER)
  - `DELETE /api/clearances/:id` - Clearance löschen (RBAC: ADMIN, MANAGER)
  - `POST /api/clearances/:id/complete-training` - Training abschließen (RBAC: ADMIN, MANAGER)
  - `POST /api/clearances/:id/revoke` - Clearance widerrufen (RBAC: ADMIN, MANAGER)

### Added - Intelligent Replacement Scoring v2.0
- **Object-Clearance-Score (20% Gewichtung)**:
  - Neue Scoring-Komponente prüft Objekt-Einarbeitung
  - ACTIVE: 100 Punkte | TRAINING: 50 Punkte | EXPIRED/REVOKED: 0 Punkte
  - Bonus: +10 für abgeschlossenes Training, +5 für frische Clearance (< 30 Tage)
  - Malus: -20 für bald ablaufende Clearance (< 14 Tage)
  - Funktion: `calculateObjectClearanceScore` in `replacementScoreUtils.ts`
- **Angepasste Gewichtungen**:
  - **Alt**: 10% Workload, 40% Compliance, 20% Fairness, 30% Preference
  - **Neu**: 5% Workload, 35% Compliance, 15% Fairness, 25% Preference, **20% Object-Clearance**
- **Replacement-Service erweitert**:
  - `calculateCandidateScore` lädt jetzt automatisch Clearances, wenn Schicht mit Site verknüpft ist
  - `CandidateScore` Interface um `objectClearanceScore` erweitert
  - Abwärtskompatibel: Funktioniert auch ohne Site-Verknüpfung (alte Gewichtungen)

### Changed
- **Validations erweitert**: `siteValidation.ts` unterstützt alle neuen Felder (customerName, customerEmail, status, etc.)

### Documentation
- Vollständiges Feature-Konzept in `docs/FEATURE_OBJEKT_MANAGEMENT.md` (7 Phasen)
- Phase 1 Implementierungsplan in `docs/planning/phase1-objekt-grundlagen.md`
- Scoring-Integration dokumentiert in `docs/planning/scoring-objekt-integration.md`
- TODO.md aktualisiert mit vollständiger Roadmap (v1.11.0 - v1.17.0)

### Internal
- TypeScript: Alle Fehler behoben (userId vs. id, Enum-Casting)
- Prisma Client neu generiert mit neuen Models

---

## [1.10.1] - 2025-10-16 – Intelligent Replacement UX & Fairness Improvements

### Added
- **Fairness-Score berücksichtigt Präferenzen für Nachtschichten**:
  - MA mit `prefersNightShifts: true` + viele Nachtschichten → **+5 Bonus** (fair, da gewünscht)
  - MA mit `prefersDayShifts: true` + viele Nachtschichten → **höhere Strafe** (unfair)
  - MA ohne spezielle Präferenz → normale Fairness-Logik
  - Verhindert unfaire Bestrafung von MA, die gerne Nachtschichten übernehmen
  - Implementierung: `backend/src/services/replacementScoreUtils.ts` (`calculateFairnessScore` erweitert um `preferences` Parameter)
  - Angepasst: `intelligentReplacementService.ts`, `intelligentReplacementJobs.ts` (2 Cron-Jobs)

### Changed
- **Frontend UX-Verbesserungen (Replacement Modal)**:
  - **Bestätigungs-Dialog ersetzt**: Statt `window.confirm()` Pop-up → Inline-Bestätigung
    - Klick auf "Zuweisen" → Button transformiert sich zu "Abbrechen" + "✓ Bestätigen"
    - Dynamischer, cleaner Prozess ohne störendes Browser-Pop-up
    - Toast-Notification mit Score & Auslastungs-Vorschau nach erfolgreicher Zuweisung
  - **Nachtschicht-Badge nur kontextuell**: Badge "Nachtschichten" wird nur bei Nachtschichten (22:00-06:00) angezeigt
    - Reduziert irrelevante Informationen bei Tagschichten
    - Verbesserte Übersichtlichkeit im Replacement-Modal
  - `shiftStartTime` Prop hinzugefügt für Nachtschicht-Erkennung
  - Datei: `frontend/src/features/absences/ReplacementCandidatesModalV2.tsx`

### Fixed
- **`utilizationAfterAssignment` fehlte im Backend-Response**:
  - Feld wurde berechnet, aber nicht im API-Response gemappt → Frontend zeigte "NaN%"
  - Fix: `backend/src/services/replacementService.ts` (Zeile 306 & 342) - Feld zum Response-Mapping hinzugefügt
  - Auslastungs-Vorschau funktioniert jetzt korrekt: "10% → 15%"

### Documentation
- Code-Kommentare in `replacementScoreUtils.ts` erweitert (Präferenz-basierte Fairness-Logik)

---

## [1.10.0] - 2025-10-15 – ICS-Export & Replacement Observability

### Added
- **Abwesenheiten ICS-Kalender-Export**:
  - Neuer Endpoint: `GET /api/absences/export.ics`
  - RFC 5545 konforme iCalendar-Generierung
  - Filter: userId, status, from/to (Zeitraum)
  - RBAC: Alle Rollen, EMPLOYEE sieht nur eigene Abwesenheiten
  - ICS-Status-Mapping: REQUESTED → TENTATIVE, APPROVED → CONFIRMED, REJECTED/CANCELLED → CANCELLED
  - Kategorisierung nach Abwesenheitstyp (Urlaub, Krankheit, Sonderurlaub, Unbezahlt)
  - Ganztags-Events (VALUE=DATE Format)
  - Audit-Log Integration (Action: ABSENCE_EXPORT_ICS)
  - Implementierung: `backend/src/utils/icsGenerator.ts`, `backend/src/controllers/absenceController.ts`

- **Replacement-Service Observability (Prometheus-Metriken)**:
  - 4 neue Metriken für Intelligent Replacement System:
    - `replacement_candidates_evaluated_total` (Counter) - Anzahl bewerteter Kandidaten
    - `replacement_calculation_duration_seconds` (Histogram) - Berechnungsdauer pro Kandidat
    - `replacement_score_total` (Histogram) - Score-Verteilung mit Labels (OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED)
    - `replacement_score_components_avg` (Gauge) - Durchschnittliche Komponenten-Scores (workload, compliance, fairness, preference)
  - `/api/stats` erweitert mit Replacement-Metriken-Sektion
  - Performance-Tracking für Scoring-Algorithmen
  - Implementierung: `backend/src/utils/replacementMetrics.ts`
  - Dokumentation: `MONITORING.md` aktualisiert mit PromQL-Beispiel-Queries

- **Scoring-Verbesserungen (Intelligent Replacement)**:
  - **Tie-Breaker-Logik**: Bei gleichem Score wird MA mit mehr Ruhezeit bevorzugt
    - Bonus für Ruhezeit > 11h (gesetzliches Minimum): +0.25 pro 12h (max +0.5)
    - Bonus für mehr Ruhetage in letzten 14 Tagen: +0.1 pro Tag (max +0.5)
    - Maximaler Tie-Breaker-Bonus: +1.0 Punkt
  - **Auslastungs-Vorschau**: `utilizationAfterAssignment` wird berechnet und in API zurückgegeben
    - Backend: Berechnung der zukünftigen Auslastung (aktuell + Schichtdauer)
    - Frontend: Anzeige "5% → 15%" im UI
  - Implementierung: `backend/src/services/replacementScoreUtils.ts` (`calculateTieBreaker`)

### Changed
- **Frontend UX-Verbesserungen (Replacement Modal)**:
  - **Farbkodierung umgekehrt**: Niedrige Auslastung = GRÜN (gut für Zuweisung), hohe Auslastung = ROT
    - <30%: GRÜN, 30-70%: GRÜN, 70-90%: GELB, 90-100%: GELB, >100%: ROT
    - Farbstatus basiert nun auf `utilizationAfterAssignment` statt `utilizationPercent`
  - **Ruhezeit exakt angezeigt**:
    - ≥24h: "36h 30m" (Stunden + Minuten)
    - <24h: "18.5h" (Dezimal)
  - **Auslastungs-Vorschau**: Badge zeigt "aktuelle% → zukünftige%" (z.B. "5% → 15%")
  - Datei: `frontend/src/features/absences/ReplacementCandidatesModalV2.tsx`

- **Monitoring-Konfiguration**:
  - Prometheus: Job-Config für neue Metriken aktualisiert
  - Docker Compose Monitoring: Service-Konfiguration erweitert

### Fixed
- **Audit-Event API-Aufruf korrigiert**:
  - `submitAuditEvent` benötigt `req` als ersten Parameter
  - `details` → `data` (korrektes Interface-Property)
  - `resourceType` als required field hinzugefügt

- **Frontend-Lint**: Duplicate-Imports behoben
  - `lucide-react` imports konsolidiert (type imports inline)
  - `./types` imports zusammengeführt
  - Dateien: `ReplacementCandidatesModalV2.tsx`, `warning-badge.tsx`, `UserPreferences.tsx`

### Documentation
- `MONITORING.md`: Replacement-Metriken mit PromQL-Queries dokumentiert
- `docs/FEATURE_INTELLIGENT_REPLACEMENT.md`: Status auf "Implementiert" aktualisiert, Verbesserungs-Roadmap hinzugefügt
- `docs/planning/replacement-scoring-improvements.md`: Detaillierter Verbesserungsplan (zukünftige Iterationen)
- Seeds erweitert mit realistischeren Test-Daten für Replacement-Szenarien

---

## [1.8.1] - 2025-10-06 – Discord Notification Fix

### Fixed
- **Discord-Benachrichtigungen für lange Release-Notes**:
  - GitHub Actions Workflow `discord-all.yml` - Release-Event-Handler verbessert
  - Multi-Embed-Support für lange Release-Notes hinzugefügt (analog zu Push-Events)
  - Character-Limit von 1800 → 1600 Zeichen reduziert (sicherer)
  - Schnitt an Zeilenumbrüchen statt mitten im Text
  - Problem: v1.8.0 Release-Notification schlug fehl (HTTP 400: `{"embeds": ["0"]}`)
  - Lösung: Release-Notes werden jetzt auf 2 separate Embeds aufgeteilt wenn >1600 Zeichen
  - Workflow-Logs zeigen jetzt: `Discord HTTP: 204` → `OK` (erfolgreich)

**Technischer Patch** - Keine funktionalen Änderungen, nur CI/CD-Verbesserung.

---

## [1.8.0] - 2025-10-05 – Intelligente Ersatz-Mitarbeiter-Suche 🤖

### Added
- **Intelligentes Replacement System (v1.8.0 - Großes Feature!)**:
  - **Datenmodell (Prisma Schema)**:
    - `EmployeePreferences` Model für individuelle Präferenzen (Schichtarten, Stunden, Objekte, Arbeitsrhythmus)
    - `EmployeeWorkload` Model für aggregierte Metriken (Auslastung, Nachtschichten, Compliance-Tracking)
    - `ComplianceViolation` Model für ArbZG-Verstöße (§3: 48h/Woche, §5: 11h Ruhezeit)
    - Migration: `20251004212443_add_intelligent_replacement_models`
  - **Scoring-Engine (Backend)**:
    - 5 Haupt-Algorithmen mit Tests (31 Unit-Tests, alle ✓):
      - Workload-Score (70-90% Auslastung = optimal)
      - Compliance-Score (ArbZG §3 & §5 Prüfung)
      - Fairness-Score (Team-Durchschnitts-Vergleich)
      - Preference-Score (Mitarbeiter-Präferenzen-Match)
      - Total-Score (Gewichtung: 40% Compliance, 30% Präferenz, 20% Fairness, 10% Workload)
    - Service: `backend/src/services/intelligentReplacementService.ts`
    - API-Endpoint: `GET /api/shifts/:id/replacement-candidates-v2`
    - Response-Struktur: sortierte Kandidaten mit Score, Recommendation (OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED), Color, Metrics, Warnings
  - **Frontend Intelligente UI**:
    - `ReplacementCandidatesModalV2` - Komplett neues Modal mit Scoring-Anzeige
    - 3 neue UI-Komponenten:
      - `ScoreRing` - SVG-Kreis-Chart (0-100) mit Farb-Kodierung
      - `MetricBadge` - Icon + Label + Wert mit Status-Farben
      - `WarningBadge` - Compliance-Warnungen (Info/Warning/Error Severity)
    - Lucide Icons Integration (BarChart3, Clock, Moon, Users, AlertCircle, etc.)
    - Metriken-Grid: Auslastung, Ruhezeit, Nachtschichten, Ersatz-Einsätze
    - Detail-Scores aufklappbar (Compliance/Präferenz/Fairness/Workload)
  - **Test-Daten Seed**:
    - Script: `npm run seed`
    - 4 Test-Kandidaten mit diversen Profilen (OPTIMAL, GOOD, ACCEPTABLE, NOT_RECOMMENDED)
    - Realistische Metriken, Präferenzen, Workload-Daten
  - **Dokumentation**:
    - Komplette Feature-Spec: `docs/FEATURE_INTELLIGENT_REPLACEMENT.md`
    - Seed-Anleitung: `backend/prisma/seeds/README.md` (aktualisiert)

### Fixed
- **Login-Problem nach v1.8.0 Implementierung**:
  - Root Cause: Backend-Port-Wechsel (3000→3001) + Vite .env-Caching + Docker-Netzwerk-Probleme
  - **Backend-Infrastruktur**:
    - Backend von lokal zu Docker verschoben (Container: `sicherheitsdienst-api`)
    - DATABASE_URL: localhost → db:5432 (Docker-Service-Name)
    - Backend listen auf 0.0.0.0 statt localhost (externe Erreichbarkeit)
    - CORS für externe IP konfiguriert (`http://37.114.53.56:5173`)
  - **Frontend-Konfiguration**:
    - VITE_API_BASE_URL auf Port 3001 aktualisiert (`frontend/.env`)
    - Frontend-Container neu erstellt mit `--env-file .env` (Vite lädt .env nur beim Start)
    - Vite-Cache gelöscht (`node_modules/.vite`)
  - **Troubleshooting-Dokumentation**:
    - Neue Doku: `docs/TROUBLESHOOTING_LOGIN.md`
    - Diagnose-Kommandos (Backend-Status, CORS-Header, Login-Test)
    - Häufige Fehlerquellen und Lösungen
  - **Verifikation**:
    - Backend Health-Check: ✅ 200 OK
    - CORS-Header: ✅ `Access-Control-Allow-Origin: http://37.114.53.56:5173`
    - Login-Flow: ✅ Funktioniert (`admin@sicherheitsdienst.de`)
    - Frontend-Backend-Kommunikation: ✅ Port 3001

### Changed
- **Backend PORT-Standardwert**: 3000 → 3001 (Docker-Compose-Default)
- **Backend .env**: DATABASE_URL auskommentiert (wird aus Root-.env geladen)
- **server.ts**: PORT-Parsing mit `parseInt()` (TypeScript strict mode)

### Technical Debt
- ⚠️ **Testdaten verloren**: Nach Docker-Migration müssen Seeds neu ausgeführt werden
- 📝 **TODO**: Integration-Tests für v2 API-Endpoint fehlen noch
- 📝 **TODO**: Performance-Test für Scoring-Engine (Ziel: < 500ms)
- 📝 **TODO**: Cron-Jobs für automatische Workload-Berechnung

### Migration Notes
Wenn du von v1.7.x auf v1.8.0 upgradest:

1. **Datenbank-Migration**:
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

2. **Seed-Daten neu laden**:
   ```bash
   # Test-Abwesenheiten
   docker compose exec api npm run seed

   # Intelligent Replacement Test-Kandidaten
   docker compose exec api npm run seed
   ```

3. **Frontend .env prüfen**:
   ```bash
   # Muss Port 3001 sein!
   VITE_API_BASE_URL=http://37.114.53.56:3001
   ```

4. **Frontend-Container neu erstellen**:
   ```bash
   docker stop project-web-1 && docker rm project-web-1
   docker run -d --name project-web-1 -p 5173:5173 \
     -v $(pwd)/frontend:/web -w /web --env-file frontend/.env \
     node:20 sh -c "npm install && npx vite --host 0.0.0.0 --port 5173"
   ```

## [Unreleased] - 2025-10-04 – v1.7.0 Dashboard Backend & Bugfixes 🎛️

### Added
- **Manager-Dashboard Backend API** (v1.7.0 Phase 1 - Backend komplett):
  - 4 neue Dashboard-Endpoints für ADMIN/MANAGER Rollen:
    - `GET /api/dashboard/critical` - Heute kritische Schichten (unterbesetzt durch Abwesenheiten)
    - `GET /api/dashboard/pending-approvals` - Ausstehende Genehmigungen mit Kontext (betroffene Schichten, Urlaubstage-Check)
    - `GET /api/dashboard/warnings?days=7` - Kapazitätswarnungen für nächste N Tage (1-30)
    - `GET /api/dashboard/stats` - Übersichts-Statistiken (Mitarbeiter, Verfügbarkeit, Abwesenheiten)
  - Controller: `backend/src/controllers/dashboardController.ts` (450 Zeilen)
  - Routes: `backend/src/routes/dashboardRoutes.ts`
  - Dokumentation: `docs/FEATURE_DASHBOARD.md` (vollständige Spec mit UI-Wireframe)
  - Alle Endpoints manuell getestet und funktionsfähig deployed
- **Manager-Dashboard Frontend Grundgerüst** (v1.7.0 Phase 2 - Teil 1):
  - Neue Feature-Struktur unter `frontend/src/features/dashboard/`
  - Karten für kritische Schichten, Genehmigungen, Warnungen & Stats
  - QuickApprovalModal mit Kapazitätsprüfung (`previewCapacityWarnings`)
  - `DashboardPage.tsx` mit React Query (60s Auto-Refresh + manueller Refresh)
  - Direktes Genehmigen/Ablehnen inkl. AbsenceDetailModal
- **Dashboard UX Verfeinerung**:
  - Pending Approvals zeigen jetzt alle betroffenen Schichten inkl. Kapazitätsstatus & Backfill-Hinweis
  - Ersatz-Zuweisungen invalidieren alle Dashboard-Queries (sichtbares Refresh nach Erfolg)
  - Kapazitätslogik berücksichtigt tatsächliche Schichtzuweisungen statt nur Clearance-Pools
- **Shift-Replacement API**:
  - Service `findReplacementCandidatesForShift` extrahiert (backend/src/services/replacementService.ts)
  - Endpoint `GET /api/shifts/:id/replacement-candidates` für ADMIN/MANAGER/DISPATCHER
  - Dashboard Buttons nutzen bestehenden ReplacementCandidatesModal
- **Tests**:
  - Vitest: `QuickApprovalModal` deckt Warnungsanzeige & Happy Path (Approve/Reject) ab
  - Playwright: `dashboard-quick-actions.spec.ts` prüft Genehmigungs-Workflow & Ersatzsuche (Seed-Manager)
- **Prisma Migrationen nachgezogen**:
  - `20251005_add_absence_documents_table` erstellt fehlende Tabelle inkl. FK & Index
  - `20251005_add_object_clearances_table` erstellt Clearances + Enum + Trigger

### Fixed (Session 1 - Bugfixes nach v1.6.0)
- **Express Routen-Reihenfolge Bug**: `/api/absences/:id/preview-warnings` gab 404 zurück
  - Spezifische Routen jetzt VOR generischen Routen definiert
  - Betrifft: preview-warnings, replacement-candidates, approve/reject/cancel
- **Query Validation**: Frontend sendet `sortBy`/`sortDir`, aber Backend erlaubte es nicht → 400 Error
  - `sortBy` und `sortDir` zu `listAbsenceQuerySchema` hinzugefügt
- **401 Unauthorized**: User-Dropdown versuchte zu laden bevor Auth abgeschlossen war
  - Query jetzt mit `enabled: isManager && !!user` statt nur `isManager`
- **DB-Fehler**: `absence_documents` Tabelle fehlt in DB (Migration drift)
  - Temporär: Documents-Select im Controller auskommentiert
  - TODO: Saubere Migration erstellen
- **Ersatz-Mitarbeiter Zuweisung**: Implementiert echte Zuweisung statt nur Alert
  - API-Call zu `POST /shifts/:id/assign` implementiert
  - Auto-Refresh nach Zuweisung für visuelle Bestätigung
  - MANAGER Berechtigung für Shift-Zuweisung hinzugefügt

### Known Issues
- Dokument-Upload für Abwesenheiten weiterhin deaktiviert (Controller noch auf TODO-Liste)
- Dashboard: Mobile QA ≤768px & CI-Integration für Playwright ausstehend

## [v1.6.0] - 2025-10-04 – Detailansicht & Ersatz-Mitarbeiter-Suche 📋

### Added
- **Urlaubsantrag-Detailansicht**: Modal mit vollständigen Informationen
  - Öffnet sich durch Klick auf Mitarbeiter-Namen
  - Zeigt: Zeitraum, Typ, Status, Grund, Entscheidung
  - Backend: `GET /api/absences/:id` liefert erweiterte Daten
- **Urlaubstage-Saldo**: Automatische Berechnung & Anzeige
  - Jahresanspruch aus `EmployeeProfile.annualLeaveDays`
  - Bereits genommen, beantragt, verfügbar
  - Warnung bei Überschreitung
- **Objekt-Zuordnungen anzeigen**: ObjectClearances mit Status-Icons
  - ✅ ACTIVE, ⏳ EXPIRED, ❌ REVOKED
  - Zeigt Site-Name, Adresse, Einweisungsdatum, Gültigkeit
  - Warnung bei abgelaufenen Einweisungen
- **Betroffene Schichten**: Mit Kapazitätswarnungen
  - Zeigt alle Schichten im Abwesenheitszeitraum
  - Kapazitätsberechnung: verfügbar / benötigt
  - ⚠️ Warnung bei Unterbesetzung
- **Ersatz-Mitarbeiter-Suche**: API + UI
  - "Ersatz finden" Button bei unterbesetzten Schichten
  - Backend: `GET /api/absences/:id/replacement-candidates`
  - Filtert nach: ObjectClearance (ACTIVE), keine Konflikte, verfügbar
  - Modal zeigt: Name, Qualifikationen, Verfügbarkeit
- **Krankmeldung Manager-Benachrichtigung**: Auto-approved aber Manager wird informiert
- **Test-Daten Script**: `npm run seed`
  - 8 Mitarbeiter mit unterschiedlichen Urlaubstagen
  - 4 Sites (Shoppingcenter, Büro, Industrie, Krankenhaus)
  - 35 Schichten über 2 Wochen
  - 8 Abwesenheits-Szenarien (REQUESTED, APPROVED, REJECTED, SICKNESS)

### Changed
- Backend: `getAbsenceById` lädt jetzt zusätzliche Daten (ObjectClearances, AffectedShifts, LeaveDaysSaldo)
- Migration: `20251004_add_annual_leave_days` fügt `annual_leave_days INT NOT NULL DEFAULT 30` zu `employee_profiles` hinzu

## [v1.5.0] - 2025-10-03 – Abwesenheiten Phase 2 & Testing 🚀

### Added
- **Abwesenheiten: Dokument-/Attest-Uploads**
  - Backend: `AbsenceDocument` Model mit Migration
  - Backend: API-Endpoints für Upload/Download/Delete von Abwesenheits-Dokumenten
  - Frontend: Upload-Button direkt in Abwesenheiten-Tabelle
  - Frontend: Dokumenten-Vorschau (PDF/Bilder) in neuem Browser-Tab
  - Speicherung in separatem Unterordner: `/srv/documents/absences/{userId}/`
  - Unterstützt: PDF, JPG, PNG (bis 50MB)

- **Abwesenheiten-Benachrichtigungen**
  - E-Mail & Push-Templates für Absences hinzugefügt (`absence-approved`, `absence-rejected`, `absence-cancelled`)
  - Automatische Benachrichtigungen bei Approve/Reject/Cancel
  - Feature-Flags: `EMAIL_NOTIFY_ABSENCES`, `PUSH_NOTIFY_ABSENCES`
  - Respektiert User-Opt-In-Einstellungen (`emailOptIn`, `pushOptIn`)

- **Testing-Infrastruktur**
  - Frontend: Vitest Setup mit jsdom und @testing-library/react
  - Frontend: 6 AuthProvider-Tests (Login, Logout, Hydration, Token-Refresh)
  - Frontend: Test-Setup mit localStorage-Mock
  - Backend: Integrationstest für Absence-Konflikte
  - Insgesamt 16+ Frontend-Tests passing

### Changed
- **Dokumentenspeicherung**: Unterstützt nun optionale Unterordner (z.B. `absences/`)
- **Notification-Templates**: Kategorie `absence` hinzugefügt
- **Abwesenheiten-Tabelle**: Neue Spalte "Dokumente" mit Upload & Vorschau-Funktionalität

### Improved
- Konflikt-Erkennung: Backend liefert bereits Schicht-Konflikte bei Abwesenheits-Erstellung
- Dokumenten-Vorschau: Einheitliche Preview-Funktion für Employee- und Absence-Dokumente

## [v1.4.0] - 2025-10-03 – Security Milestone 🔒

### Security
- **DSGVO-Compliance**: Umfassende Sicherheitsmaßnahmen für hochsensible Gesundheitsdaten implementiert
  - **Verschlüsselung at rest**: LUKS-Verschlüsselung für `/srv/documents` Dokumentenspeicher
  - **Verschlüsselte Backups**: BorgBackup mit AES-256 und Passphrase-Schutz
  - **Virenschutz**: ClamAV scannt täglich um 02:30 Uhr, Quarantäne bei Malware-Fund
  - **Firewall**: UFW aktiv mit Whitelist (nur SSH, API, Frontend, HTTPS-Ports)
  - **Container-Härtung**: Non-root User (UID 1001:GID 109) mit minimalen Berechtigungen
  - **Zugriffskontrolle**: RBAC für Dokumente (nur MANAGER Upload/Delete, DISPATCHER Read-Only)
  - **Audit-Logging**: Alle Zugriffe werden protokolliert
- **Upload-Limit**: Erhöht auf 50MB für große Dokumente (Base64-Encoding berücksichtigt)

### Added
- **DSGVO-Dokumentation**: Vollständige Compliance-Dokumentation erstellt (`docs/ops/dsgvo-compliance.md`)
  - Technische und Organisatorische Maßnahmen (TOM)
  - Verarbeitungsverzeichnis (Art. 30 DSGVO)
  - Löschkonzept
  - Incident Response Plan
  - Betroffenenrechte
  - AVV-Anforderungen dokumentiert
- **HTTPS-Anleitung**: Detaillierte Let's Encrypt Setup-Anleitung für spätere Domain (`docs/ops/setup-https-letsencrypt.md`)
- **Backup-System**:
  - Borg-Backup Repository mit verschlüsselten Archiven
  - Systemd Timer (täglich 03:00 Uhr)
  - Retention-Policy: 7 täglich, 4 wöchentlich, 12 monatlich
  - Restore-Funktion getestet und funktionsfähig
- **Antivirus**:
  - ClamAV-Daemon läuft kontinuierlich
  - Systemd Timer für tägliche Scans (02:30 Uhr)
  - Automatische Quarantäne in `/var/quarantine`
  - Freshclam hält Virendatenbank aktuell
- **Nginx**: Reverse Proxy vorbereitet für HTTPS (temporär deaktiviert bis Domain vorhanden)
- Dokumentenablage: Uploads (PDF/Bild bis 50MB) werden serverseitig dekodiert, virenschutzbereit gespeichert
- Backend: `/health` als Alias für `/healthz` hinzugefügt (Liveness-Check ohne DB-Abhängigkeit)
- Ops: Firewall-Konfigurationsskript (`docs/ops/configure-firewall.sh`)
- Ops: Backup-Setup-Skript (`docs/ops/backup.sh`)
- Ops: Dokumentenspeicher-Setup-Anleitung (`docs/ops/setup-document-storage.sh`)

### Changed
- **Frontend API**: Port-Mapping korrigiert (5173/4173 → 3001 statt 3000)
- **CORS**: Korrekte Origin-Konfiguration für externe IP-Adresse
- **Docker Compose**: Backend-Volume entfernt (verhinderte Verwendung kompilierter Änderungen)
- **Dockerfile**:
  - Logs-Verzeichnis wird mit korrekten Permissions erstellt
  - Alle Dateien gehören `appuser:svc-docstore`
- **ROADMAP**: DSGVO-kritische Aufgaben als hohe Priorität hinzugefügt
- Backend: Bevorstehende Abwesenheiten berücksichtigen jetzt auch laufende genehmigte Abwesenheiten
- Backend: Dokumentpfade zeigen nur noch interne Referenzen; Dateien landen verschlüsslungsfähig im lokalen Storage
- Frontend: Datepicker-Hover, „Kein Ablauf"-Shortcut und aktualisierte Upload-Hinweise
- Docs: Abwesenheits- und Profil-Planung inkl. Storage-Konzept dokumentiert

### Fixed
- Frontend: Profilansicht rendert wieder zuverlässig; Hook-Reihenfolge wurde stabilisiert
- Frontend: Datepicker-Icon bleibt im Dark-Mode sichtbar
- Docker: Healthcheck funktioniert nun zuverlässig – `wget` ist im finalen Image verfügbar
- Frontend: Login-Problem behoben – CORS und ENV-Variablen korrekt konfiguriert
- Backend: Container-Berechtigungen für Logs-Verzeichnis korrigiert
- Backend: Upload-Limit-Fehler behoben (50MB express.json/urlencoded limit)

### Operations
- **Systemd Services**:
  - `borg-backup.service` & `borg-backup.timer` - Automatische Backups
  - `clamscan.service` & `clamscan.timer` - Automatische Virenscans
- **Backup-Test**: Erfolgreich durchgeführt - Restore nach /tmp/restore-test verifiziert
- **Hosting-Provider**: IP-Projects GmbH & Co. KG identifiziert (AVV erforderlich)

## v1.3.1 (2025-10-04) – Hotfix Absence Decisions

### Fixed
- Absence-Status-Updates setzen `decidedById` nur bei echten Entscheidungen und lassen den API-Start im Dev-Compose wieder fehlerfrei durchlaufen (`absenceController`).

### Docs
- Troubleshooting um Hinweis für fehlende `SEED_ON_START`-Variable ergänzt.

## v1.3.0 (2025-10-03) – Abwesenheiten & Profilpflege

### Added
- Abwesenheitsmodul mit RBAC, Konfliktprüfung, CSV/XLSX-Export und Genehmigungsendpunkten (`/api/absences`, `/absences`).
- Überarbeitete Mitarbeiterprofile mit Zeitstatistiken, Qualifikationen, Dokumentverwaltung und Vorschau genehmigter Abwesenheiten.
- Systemdashboard `/system` visualisiert `/api/stats` (Notification-Queues, Audit-Trail, Event-Loop, Feature-Flags).
- Auth-Flow liefert Refresh-Token beim Login, Interceptor persistiert Tokens und erneuert sie 30 s vor Ablauf.

### Changed
- Login-Seite blockiert Rate-Limits mit Countdown, zeigt Netzwerkfehler und führt keinen Hard-Reload mehr aus.
- Frontend-API-Client erkennt lokale Vite-Ports (`5173`/`4173`) und mappt automatisch auf `:3000`, plus Same-Origin-Fallback.
- Incident-UI und Auth-Interceptor wurden vereinheitlicht; Logout-Schaltfläche in der Profilansicht ergänzt.

### Fixed
- Logout funktioniert ohne kompletten Seitenreload; Login-Fehler erscheinen im UI.
- Prisma-Mappings für underscore-Spalten und Migrationsstart im Dev-Stack wurden bereinigt.
- API-Ursprungsfallback verhindert Fehler, wenn `VITE_API_BASE_URL` leer ist; Profilziele nutzen stabile IDs.

### Docs & CI
- README, ARCHITECTURE, RBAC, TODO, TROUBLESHOOTING & API_CHEATSHEET aktualisiert (Absences, Auth-Refresh, Systemdashboard).
- Roadmap überarbeitet (Stand 2025-10-03), neue Aufgaben für Anhänge/Kalender & Release v1.3.0 ergänzt.
- metrics-smoke Reporting verbessert und Monitoring-Dokumentation (Ports, synthetics) erweitert.

## v1.2.0 (2025-09-13)

- ✨ CSV/XLSX-Export → echtes Streaming (100k+), Tests
- 🧩 /api/stats: specVersion + buildSha
- 🛡️ OpenAPI Fixes 405 + Lint/Clean
- 🧪 Contract-Tests Workflow (Prism + Dredd)
- 🚦 Health/Readiness Endpunkte (/healthz, /readyz) + Tests
- 🧰 Dev-Compose: Frontend (Vite) + API, optional Monitoring-Profil
- 🐛 Fixes: Token-Interceptor erzwingen, 429 bei Login in Dev entschärft

Hinweis: Tag vorbereiten: `v1.2.0`

## v1.2.0 – Health & Metrics Hardening
- Added: /healthz (liveness), /readyz (readiness mit deps: db, smtp).
- Added: Prometheus+Grafana Provisioning, Dashboards (p50/p90/p95/p99, 5xx-Rate, Top Routes p95 & 5xx).
- Changed: Health-Smoke SLA → p95 (ENV: SLA_MAX_MS).
- Docs: README „Metrics & Monitoring“, Quickstart, PromQL, .env.example ergänzt.

## v1.2.0-rc.1 – Phase 1 Hardening & Release-Readiness

### Added
- Readiness: optionaler SMTP-Verify in `/readyz` (Flag `READINESS_CHECK_SMTP`, Timeout `READINESS_SMTP_TIMEOUT_MS`), Unit-Tests für `ok`/`fail`/`skip`.
- CI/Release: Docker Build & Push nach GHCR bei Tags `v*` (`.github/workflows/docker-release.yml`), Images `:latest` und `:<tag>`.
- Tests: Verschärfte Security-/CORS-Header-Tests (Helmet-Header, Allowlist, FRONTEND_URL-Fallback).

### Changed
- README: Release-Runbook (GHCR) + Compose‑Snippet ergänzt; System‑Health verlinkt.

## 2025-09-06

### Added
- feat(rbac): RBAC für Notifications – nur Rollen ADMIN/MANAGER; Tests für ADMIN/MANAGER=200, EMPLOYEE=403, anonym=401.
- feat(email): E-Mail-Trigger bei Schicht-Erstellung/-Aktualisierung/-Löschung (Feature-Flag `EMAIL_NOTIFY_SHIFTS=true`), Tests mit gemocktem Mailservice (Flag on/off).
- feat(listing): Serverseitige Pagination/Sort/Filter für Sites, Shifts und Users inkl. Zod-Validierung, Prisma-Queries (`where`/`orderBy`/`skip`/`take`) und einheitlichem Response-Schema; Tests und OpenAPI ergänzt.

### Changed
- chore(ci): CI stabilisiert – tolerante Installation (Fallback auf `npm install`), OpenAPI-Lint via `npx @redocly/cli` (warn-only), Build/Tests grün.
- docs(openapi): Notifications-Endpoint `/notifications/test` um 400/422-Responses mit Beispielen ergänzt; RBAC-Hinweise (`x-required-roles`) für Sites/Shifts/Users dokumentiert; Users‑Endpoints (POST/GET{id}/PUT/DELETE) spezifiziert.
- docs(readme): ENV/SMTP/Feature-Flag (`EMAIL_NOTIFY_SHIFTS`) im Compose-Quickstart; RBAC‑Übersicht und Listen‑Parameter dokumentiert.
- ci(discord): Discord-Workflow robuster und grafisch verbessert (klin­kbarer Titel/URL, Autor‑Badge, Felder pro Event; optionaler CI‑Kanal per `DISCORD_WEBHOOK_CI`).

## 2025-09-05

### Added
- Backend: RBAC-Guard für Notifications implementiert (`notificationsRBAC`), erlaubt nur Rollen `ADMIN` und `MANAGER`.
- Tests: RBAC-Tests für Notifications (ADMIN=200, MANAGER=200, EMPLOYEE=403, anonym=401).

### Changed
- Routes: Notifications-Route (`POST /api/notifications/test`) mit `authenticate` + `notificationsRBAC` gesichert; Validierung unverändert.
- Docs: README um Abschnitt „RBAC Notifications“ (Rollenmatrix) erweitert.
- OpenAPI: `docs/openapi.yaml` für Notifications-Endpoint um 400/422-Responses inkl. Beispielpayloads ergänzt.
- Roadmap: RBAC-Feinschliff für Notifications als erledigt markiert.

## 2025-08-31

### Integrated
- merge: adopt PR #2 concept-aligned
  - MVP-Backend konzepttreu übernommen (Express/TS/Prisma, JWT-Auth, Users/Shifts, Health/Stats).
  - OpenAPI v1 hinzugefügt; Zod-Validierung und zentrale Fehlerbehandlung ergänzt.
  - Artefakte entfernt; `LICENSE`/`.gitignore` bewahrt.
- merge: adopt PR #6 concept-aligned
  - RBAC (authorize), Zod-Validierungen und Logging integriert.
  - Access+Refresh-Token-Flow, `GET /api/auth/me`, Seed-Erweiterungen.
  - CI (Node 20: npm ci → lint → test → build) und Compose-Härtung (Healthcheck, migrate deploy).

### Added
- Site-Entity als Referenz (Prisma-Modell + Migration, Routes/Controller, Zod-DTOs, Tests)
- docs: PR-Analyse, PR-Integration, Branch-Protection, Docker-Start/Logs

### Changed
- docs/openapi.yaml: Einheitliche Fehler-Responses (400/401/403/404/409/422/429/500/503) zentralisiert unter `#/components/responses/*`.
- docs/openapi.yaml: Neues Schema `ValidationError` mit Feldfehlern ergänzt.
- docs/openapi.yaml: Pagination/Filter für `GET /employees` und `GET /sites` (Query-Parameter `page`, `perPage`, `sort`, `order`, `q`, `city`) und paginierte Antwortobjekte (`EmployeesList`, `SitesList`).
- docs/openapi.yaml: Beispiel-Payloads (request/response) für alle relevanten Endpunkte ergänzt.
- README: Abschnitt „OpenAPI Specification“ inkl. lokaler Validierungsanleitung (Redocly/Swagger-CLI) ergänzt.
 - docs/openapi.yaml: Zusätzliche Filter ergänzt (`employees`: `role`, `isActive`; `sites`: `postalCode`).
 - backend: `validate`-Middleware und Global-Error-Handler geben nun 422 (statt 400) bei Zod-Validierungsfehlern zurück.
- prisma: `Site`-Unique-Constraint geändert auf (name, address) inkl. Migration (`20250831195000_site_unique_name_address`).
- README: Site-API-Beispiele um Filter/Sortierung erweitert und Fehlercodes (422/404/409) dokumentiert.
- Backend: DELETE `/api/sites/:id` liefert jetzt 204 (No Content) bei Erfolg; Tests ergänzt.
- docs/openapi.yaml: POST-Statuscodes (201) vereinheitlicht für Employees, Site-Shifts, Incidents, Assignments.
- TimeTracking dokumentiert (README-Beispiele) und OpenAPI-Hinweis auf mögliche Warnungen bei Clock-in/out.

### Notes (Konzepttreu)
- Änderungen folgen docs/KONZEPT.pdf und ROADMAP (OpenAPI v1 erweitert, aber konsistent mit MVP-Fokus Auth/Site). Keine API-Implementierung geändert, nur Spezifikation/Docs.

### DevOps
- GitHub Actions CI-Workflow `.github/workflows/ci.yml`
- `.env.example` erweitert (DB/JWT/Refresh/SMTP)
- Docker Compose: DB-Volume, Healthchecks, API `depends_on: service_healthy`

### CI
- Neues CI-Job `openapi-lint`: Lintet `docs/openapi.yaml` via Redocly CLI in GitHub Actions.

## 2025-08-30

### Added

- Post-MVP features adopted (concept-aligned from PR #6):
  - RBAC on routes via `authorize` middleware.
  - Zod validation with `validate` middleware and schemas.
  - Winston logging + morgan stream.
- Smoke tests (controller/middleware):
  - healthCheck and getSystemStats controllers.
  - authenticate/authorize middleware.
  - Validation schema tests.

### Changed

- Server bootstrap split into `app.ts` (export app) and `server.ts` (startup + graceful shutdown).
- Project-wide formatting and linting:
  - Root `.editorconfig`, `.prettierrc.json`, `.prettierignore`.
  - ESLint v9 config hardened.
- docker-compose hardened:
  - Service names (`db`, `pgadmin`), healthchecks, env defaults, volumes, depends_on (service_healthy).
- NPM scripts unified (dev, build, start, test, test:watch, typecheck, lint, lint:fix, format, format:write).

### Merged (concept-aligned)

- PR #2: MVP backend (Express/TS/Prisma, JWT auth, Users/Shifts CRUD, health/stats).
- PR #6: Post-MVP hardening (RBAC, Zod validation, logging).

### Notes

- Dist/review artifacts excluded from VCS.
- LICENSE and .gitignore preserved.
## 2025-09-09

### Added
- feat(auth): Refresh-Token-Flow implementiert (`POST /api/auth/refresh`) inkl. Zod-Validation und Tests (200/422/401); README um Abschnitt „Authentication & Refresh“ ergänzt.
- feat(api): `GET /api/auth/me` hinzugefügt; alle Routen zusätzlich unter `/api/v1/...` gemountet; Tests für Me-Endpoint und v1-Alias.
- feat(notifications): Rate-Limit für Test-Endpoint `/api/notifications/test` (ENV: `NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN`, `NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS`), Tests und Doku.
- docs(stats): Observability erweitert – README Abschnitt „System-/Stats-Details“ ergänzt; OpenAPI `/stats` dokumentiert (Features/Notifications/Auth/System/Env Felder).

### Changed
- docs(openapi): `/me` zu `/auth/me` ausgerichtet; `operationId` für zentrale Endpunkte ergänzt; `/employees`-List-Response auf `data/pagination/sort/filters` umgestellt; Parameter für `/sites` und `/shifts` vereinheitlicht (`page/pageSize/sortBy/sortDir/filter[...]`); ungenutzte `EmployeesList`/`SitesList`-Schemas entfernt.
- ci: `typecheck`-Step ergänzt; Tests erzeugen Coverage und werden als Artefakt hochgeladen.
- env: `LOG_LEVEL` in `.env.example` ergänzt.
- rbac(users): Self-Access für `GET/PUT /api/users/:id` erlaubt; Self-Updates auf Basisfelder (email, firstName, lastName, phone) beschränkt.
- fix(validation): 422-Responses der `validate`-Middleware enthalten jetzt `code: "VALIDATION_ERROR"`.
- docs(readme): Listen-Parameter und Beispiele vereinheitlicht auf `page/pageSize/sortBy/sortDir/filter[...]`.

### Fixed
- fix(exports): XLSX-Exporte stabilisiert (korrekte Binary-Ausgabe mit `Content-Length` und `res.end`) für Users/Sites/Shifts/Events.

### Added (Events & Push)
- feat(events): CRUD + CSV/XLSX Exporte, PDF-Bericht via `Accept: application/pdf`, OpenAPI-Schemas/Paths
- feat(push): Geräte-Token-API (registrieren/listen/ändern/löschen), optional FCM-Support, Event-Push (Feature-Flag), Admin-Opt-In/Out je Benutzer, `User.pushOptIn`
- perf(db): Indizes für Users/Sites/Shifts/Assignments/TimeEntries + neue Tabellen `events` und `device_tokens`
- docs: README (Exports, Push, Events, PDF), OpenAPI Accept-Hinweise, FEATURE_EVENTS.md, TODO/ROADMAP aktualisiert
 - docs(openapi): Push-API in Spezifikation ergänzt (`/push/tokens`, `/push/tokens/{token}`, `/push/users/{userId}/opt`) und zusätzlicher Server `http://localhost:3001/api/v1`.

### Added (Planning Phases 1–5)
- feat(openapi): Fehler-Response-Shape harmonisiert (`success:false`, `code`, `message`, `errors?`) und Beispiele in `#/components/responses/*` aktualisiert.
- feat(auth): Rate-Limit für `POST /auth/login` und `POST /auth/refresh` (ENV `AUTH_RATE_LIMIT_*`), Header `Retry-After` und `RateLimit-*` gesetzt.
- feat(observability): Request-ID Middleware (`X-Request-ID`) + Logs; leichte Request-Zähler (`requestsTotal`, `responses4xx`, `responses5xx`) in `/stats`.
- feat(incidents): E2E-Implementierung (CRUD, List/Filter, CSV/XLSX Exporte, RBAC ADMIN/MANAGER schreiben, AUTH lesen) inkl. Tests und OpenAPI-Erweiterungen.
- feat(email): Einfacher Retry (1x) bei transienten SMTP-Fehlern (`SMTP_RETRY_MAX`, `SMTP_RETRY_DELAY_MS`), Tests.
- docs(runbook): Operations-/Runbook-Abschnitt in README (Health/Stats, Logs/Request-ID, Rate-Limits, SMTP/Retry, ENV-Matrix).

### Changed
- refactor(prisma): Zentrale Prisma-Client-Singleton (`backend/src/utils/prisma.ts`); Controller/Middleware/Services umgestellt.
- docs(openapi): Incidents-List-Antwort vereinheitlicht (data/pagination/sort/filters) und CSV/XLSX Accept dokumentiert; 405 `MethodNotAllowed`-Komponente ergänzt.
- tests: RBAC-Tests für Incidents (anonymous/employee negative), TimeTracking-Warnungen (Restzeit <11h, Dauer >10h/>12h) ergänzt.
- auth/jwt: Optional `JWT_ISSUER`/`JWT_AUDIENCE` in Signatur/Verifikation berücksichtigt (konfigurierbar via ENV).
## v1.1.0 – Contracts & Streaming

### Added
- Contract-Tests: Prism-Mock + Dredd (nightly & manual) via GitHub Actions (bundle, mock, run, Artefakte).
- /api/stats: neue Felder `specVersion` (aus OpenAPI `info.version` bzw. `SPEC_VERSION`) und `buildSha` (über `BUILD_SHA`).

### Changed
- CSV-/XLSX-Exporte auf Streaming umgestellt (100k+ Zeilen ohne Heap-Peak; korrekte Headers/Accept/Disposition).
- OpenAPI: konsistente 405-Responses an allen nicht erlaubten Methoden (Events, Events/{id}, Notifications/Test, Stats); Redocly-Lint grün.

### Docs
- README: RBAC-Matrix inkl. 403-Negativbeispielen; `/api/stats` Felder dokumentiert.

### Ops
- CI nutzt gebündelte OpenAPI und `dredd@14` mit robusten Flags; Node-Heap limitiert (`NODE_OPTIONS=--max-old-space-size=512`).
## v1.1.1 – Health/Readiness

### Added
- Endpunkte: `/healthz` (Liveness), `/readyz` (Readiness mit `deps.db`, `deps.smtp`).
- CI: Health‑Smoke‑Job (baut, startet App, prüft `/healthz`/`/readyz`, lädt Artefakte hoch).
- Doku: README Abschnitt „System-Health“, detaillierte Ops‑Doku unter `docs/ops/system-health.md`.
- Release‑Notes: `docs/releases/v1.1.1.md` (Details & Migration).

### Changed
- Security: `helmet()` aktiv, CORS strikt via Allowlist (`CORS_ORIGINS`, Fallbacks).
- OpenAPI: interne Endpunkte dokumentiert (Tag `internal`, `x-internal: true`), `operationId` konsolidiert, Beispiele bereinigt.

### Fixed
- Minor: OpenAPI‑Warnungen bereinigt (nullable Felder in `TimeEntry`, ungültige Beispiele, ungenutzte Parameter entfernt).

Siehe auch: [Release v1.1.1](docs/releases/v1.1.1.md)
