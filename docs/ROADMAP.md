# Roadmap - Sicherheitsdienst-Tool

**Letztes Update**: 2025-10-05 (nach v1.8.0)
**Aktueller Stand**: v1.8.0 - Intelligente Ersatz-Mitarbeiter-Suche

---

## ✅ Abgeschlossen

### v1.0.0 - MVP (2025-08-xx)
- Basis-Authentifizierung (JWT, RBAC)
- User-Management (ADMIN, MANAGER, DISPATCHER, EMPLOYEE)
- Schicht-Verwaltung (CRUD, Zuweisung, Clock-in/out)
- Site-Management (Objekte, Standorte)
- Basis-Dashboard

### v1.4.0 - Security Milestone (2025-09-xx)
- DSGVO-Compliance für Dokumentenspeicher
- Rate-Limiting (Auth, Shifts, Writes)
- Audit-Logs (Queue, CSV-Export, Retention)
- Monitoring (Prometheus, Grafana, Alerts)
- Security-Hardening (Helmet, CORS, Input-Validation)

### v1.5.0 - Abwesenheiten Phase 1 (2025-09-xx)
- Abwesenheits-Management (Urlaub, Krankheit, Sonstiges)
- Genehmigungsworkflow (Pending → Approved/Rejected)
- Dokument-Uploads (Atteste, Bescheinigungen)
- Benachrichtigungen (Email, Push)
- Kalender-Ansicht

### v1.6.0 - Abwesenheiten Phase 2 (2025-10-04)
- Detailansicht mit vollständigen Informationen
- Urlaubstage-Saldo (Berechnung & Anzeige)
- Objekt-Zuordnung (ObjectClearances mit Status)
- Betroffene Schichten mit Kapazitätswarnungen
- Ersatz-Mitarbeiter-Suche (v1 - einfache Liste)
- Test-Daten Scripts

### v1.7.0 - Manager-Dashboard (2025-10-04)
- 4 Dashboard-Endpoints (Critical Shifts, Pending Approvals, Warnings, Stats)
- Quick-Approval-Modal mit Kapazitätsprüfung
- Dashboard-Hooks (State-Management vereinfacht)
- Playwright E2E-Tests
- Code-Refactoring (317 → 171 Zeilen)

### v1.8.0 - Intelligente Ersatz-Mitarbeiter-Suche 🤖 (2025-10-05) ✅
**GROSSER MEILENSTEIN!**

- **Intelligentes Scoring-System**:
  - 5 Algorithmen (Workload, Compliance, Fairness, Preference, Total)
  - 31 Unit-Tests (alle ✓)
  - Gewichtung: 40% Compliance, 30% Präferenz, 20% Fairness, 10% Workload
- **Neue Datenmodelle**:
  - EmployeePreferences (Schicht-/Objekt-/Arbeitsrhythmus-Präferenzen)
  - EmployeeWorkload (Auslastung, Nachtschichten, Compliance)
  - ComplianceViolation (ArbZG-Verstöße mit Severity)
- **Neue UI-Komponenten**:
  - ScoreRing (SVG-Kreis-Chart 0-100)
  - MetricBadge (Icon + Label + Wert)
  - WarningBadge (Compliance-Warnungen)
  - ReplacementCandidatesModalV2 (Scoring-Anzeige)
- **Visuelle Bewertung**:
  - 🟢 OPTIMAL (85-100), 🟡 GOOD (70-84)
  - 🟠 ACCEPTABLE (50-69), 🔴 NOT_RECOMMENDED (<50)
- **Docker-Migration & Login-Fix**:
  - Backend zu Docker (Port 3001)
  - CORS-Konfiguration für externe IP
  - Troubleshooting-Dokumentation

---

## 🚧 In Arbeit

### v1.9.0 - Testdaten & Verifikation (ETA: heute Abend)
**URGENT**: Nach Docker-Migration müssen Seeds neu ausgeführt werden

- [ ] Seeds in Docker-Umgebung ausführen
  - [ ] `docker compose exec api npm run seed:test-absences`
  - [ ] `docker compose exec api npm run seed:intelligent-replacement`
- [ ] Dashboard testen (4 Test-Kandidaten sichtbar?)
- [ ] Scoring-Anzeige testen (Farben: grün/gelb/orange/rot)
- [ ] Metriken-Grid testen (Auslastung, Ruhezeit, Nachtschichten)
- [ ] E2E-Test: Kompletter Workflow

---

## 📅 Geplant

### v1.10.0 - Mitarbeiter-Präferenzen-Editor (ETA: 1-2 Wochen)
**Ziel**: Mitarbeiter können ihre Präferenzen selbst verwalten

- [ ] **Frontend**:
  - [ ] Route `/employees/:id/preferences`
  - [ ] Formular für alle Präferenz-Felder:
    - Schicht-Präferenzen (Tag/Nacht, Wochenende)
    - Stunden-Präferenzen (Ziel, Min, Max)
    - Site-Präferenzen (bevorzugt, vermeiden)
    - Arbeitsrhythmus (aufeinanderfolgende Tage, Ruhetage)
  - [ ] Validierung & Speicherung
  - [ ] RBAC: Mitarbeiter nur eigene, Manager alle
- [ ] **Backend**:
  - [ ] API: `GET/PUT /api/employees/:id/preferences`
  - [ ] Validation (Zod-Schema)
  - [ ] Tests (Unit + Integration)
- [ ] **Dokumentation**:
  - [ ] User-Guide: "Wie stelle ich meine Präferenzen ein?"
  - [ ] Manager-Guide: "Wie sehe ich Mitarbeiter-Präferenzen?"

### v1.11.0 - Workload-Dashboard (ETA: 2-3 Wochen)
**Ziel**: Mitarbeiter sehen ihre eigene Auslastung & Fairness-Score

- [ ] **Frontend**:
  - [ ] Route `/employees/:id/workload`
  - [ ] Visualisierung:
    - Auslastung (aktuell vs. Ziel)
    - Nachtschicht-Anzahl (aktuell vs. Team-Durchschnitt)
    - Freitage (aktuell vs. Mindest-Anforderung)
    - Compliance-Status (ArbZG §3 & §5)
    - Fairness-Score (0-100)
  - [ ] Verlauf (6 Monate)
  - [ ] Vergleich mit Team-Durchschnitt
- [ ] **Backend**:
  - [ ] API: `GET /api/employees/:id/workload`
  - [ ] Historical Data (letzte 6 Monate)
  - [ ] Team-Averages-Berechnung
- [ ] **Dokumentation**:
  - [ ] "Was bedeutet mein Fairness-Score?"
  - [ ] "Wie wird Auslastung berechnet?"

### v1.12.0 - Team-Fairness-Übersicht (ETA: 3-4 Wochen)
**Ziel**: Manager sehen Team-weite Fairness-Metriken

- [ ] **Frontend**:
  - [ ] Route `/team/fairness`
  - [ ] Tabelle: Alle Mitarbeiter vergleichen
  - [ ] Sortierung nach verschiedenen Metriken:
    - Auslastung (%), Nachtschichten, Ersatz-Einsätze
    - Fairness-Score, Compliance-Status
  - [ ] Filter (nach Site, nach Qualifikation)
  - [ ] Export (CSV, Excel)
- [ ] **Backend**:
  - [ ] API: `GET /api/team/fairness`
  - [ ] Aggregation über alle Mitarbeiter
  - [ ] Caching (60 Minuten)
- [ ] **Algorithmus-Verbesserungen**:
  - [ ] Fairness-Score: Berücksichtigung von Teilzeit-Verträgen
  - [ ] Normalisierung nach contractType (FULL_TIME, PART_TIME)

### v1.13.0 - Automatische Workload-Berechnung (ETA: 4-5 Wochen)
**Ziel**: Cron-Jobs berechnen Workload automatisch

- [ ] **Backend**:
  - [ ] Cron-Job: Tägliche Workload-Berechnung (01:00 Uhr)
  - [ ] Cron-Job: Compliance-Check nach Shift-Assignment (Hook)
  - [ ] Cron-Job: Wöchentliche Fairness-Score-Updates (Montag 02:00 Uhr)
  - [ ] ComplianceViolation-Logging bei Verstößen
- [ ] **Benachrichtigungen**:
  - [ ] Email an Manager bei kritischen Compliance-Verstößen
  - [ ] Push-Notification an Mitarbeiter bei Fairness-Score < 30
- [ ] **Monitoring**:
  - [ ] Prometheus-Metriken für Cron-Jobs
  - [ ] Grafana-Dashboard: Workload-Trends, Compliance-Violations
  - [ ] Alerts bei fehlgeschlagenen Jobs

---

## 🔮 Zukunft (v2.0+)

### Phase 3: KI-Integration
**Vision**: Vollautomatisches, lernendes Schicht-Management-System

#### v2.0.0 - Predictive Scheduling (ML-Modell)
- [ ] Machine-Learning-Modell trainieren:
  - Input: Historische Daten (Schichten, Zuweisungen, Abwesenheiten, Präferenzen)
  - Output: Vorhersage optimaler Zuweisungen
- [ ] Features:
  - Saisonale Muster erkennen (Events, Urlaubs-Saison)
  - Mitarbeiter-Verfügbarkeit vorhersagen
  - Abwesenheits-Wahrscheinlichkeit (Krankheitsrate)
- [ ] API: `POST /api/shifts/:id/predict-assignment`
- [ ] UI: "Empfohlene Zuweisung" Badge

#### v2.1.0 - Automatische Zuweisung (mit Opt-In)
- [ ] Mitarbeiter können "Auto-Accept-Replacement" aktivieren
- [ ] System weist automatisch zu bei hohem Score (>85)
- [ ] Benachrichtigung nach Zuweisung (Email + Push)
- [ ] Opt-Out jederzeit möglich
- [ ] Audit-Log: Wer hat was wann zugewiesen?

#### v2.2.0 - Optimierungs-Algorithmus (Constraint Solver)
- [ ] Constraint Programming für komplexe Schichtpläne
- [ ] Constraints:
  - Harte Constraints: ArbZG §3 & §5, Qualifikationen, Verfügbarkeit
  - Weiche Constraints: Präferenzen, Fairness, Workload-Balance
- [ ] Optimierungsziel: Max. Mitarbeiterzufriedenheit + Min. Kosten
- [ ] UI: "Optimierten Schichtplan generieren" Button

#### v2.3.0 - Learning from Feedback
- [ ] Mitarbeiter können Zuweisungen bewerten (👍/👎)
- [ ] Feedback fließt in ML-Modell ein
- [ ] Kontinuierliche Verbesserung der Empfehlungen
- [ ] A/B-Testing: Alte vs. neue Algorithmen

### Objekt-Management (v1.8.0 oder später)
**Entscheidung**: Nachgeordnet zugunsten Intelligent Replacement

- [ ] **Objekt-Verwaltung UI**:
  - Basis-Informationen (Name, Standort, Adresse)
  - Verträge, Konzepte, Abrechnungsdaten hochladen
  - RBAC: Mitarbeiter sehen nur relevante Infos
- [ ] **Schicht-Planung**:
  - Standard-Schichten (täglich, wochentag-basiert)
  - Sonder-Schichten (Event-gesteuert, temporär)
  - Anzahl benötigter Mitarbeiter pro Schicht
- [ ] **Qualifikationen & Anforderungen**:
  - Welche Qualifikationen brauchen MA? (§34a, Brandschutz)
  - Automatische Prüfung bei Zuweisung
- [ ] **Einarbeitungs-Management**:
  - UI zum Erstellen/Bearbeiten von ObjectClearance
  - Ablaufdatum (validUntil) verwalten
  - Bulk-Einarbeitung (alle MA für Objekt)
  - Automatische Warnungen bei ablaufenden Einarbeitungen

### Events & Großveranstaltungen
- [ ] **Event-Planung mit Kapazitätsprüfung**:
  - UI für große Events (15+ Mitarbeiter)
  - Automatische Kapazitätsprüfung bei Event-Erstellung
  - Partner-Firmen-Integration (Konzept entwickeln)
  - Vorlaufzeit-Warnungen (Event in 2 Wochen, nur 50% Kapazität)
- [ ] **ICS & Kalender**:
  - ICS-Export für Abwesenheiten (Pro Nutzer/Team)
  - iCal-Feed für externe Kalender (Google, Outlook)

### Storage & Infrastructure
- [ ] **S3/MinIO für Dokument-Uploads**:
  - Migration von lokalem Storage zu S3
  - Verschlüsselungskonzept ausarbeiten
  - CDN-Integration für schnellere Downloads
- [ ] **Multi-Tenancy** (für SaaS):
  - Tenant-Isolation (DB-Schema-per-Tenant oder Shared-Schema)
  - Custom Domains (tenant1.example.com)
  - Billing & Subscription Management

---

## 📊 Meilensteine

| Version | Feature | Status | ETA |
|---------|---------|--------|-----|
| v1.0.0 | MVP | ✅ Abgeschlossen | 2025-08-xx |
| v1.4.0 | Security Milestone | ✅ Abgeschlossen | 2025-09-xx |
| v1.5.0 | Abwesenheiten Phase 1 | ✅ Abgeschlossen | 2025-09-xx |
| v1.6.0 | Abwesenheiten Phase 2 | ✅ Abgeschlossen | 2025-10-04 |
| v1.7.0 | Manager-Dashboard | ✅ Abgeschlossen | 2025-10-04 |
| v1.8.0 | Intelligente Ersatz-Suche | ✅ Abgeschlossen | 2025-10-05 |
| v1.9.0 | Testdaten & Verifikation | 🚧 In Arbeit | heute Abend |
| v1.10.0 | Präferenzen-Editor | 📅 Geplant | 1-2 Wochen |
| v1.11.0 | Workload-Dashboard | 📅 Geplant | 2-3 Wochen |
| v1.12.0 | Team-Fairness-Übersicht | 📅 Geplant | 3-4 Wochen |
| v1.13.0 | Automatische Workload | 📅 Geplant | 4-5 Wochen |
| v2.0.0 | Predictive Scheduling | 🔮 Zukunft | Q2 2025? |
| v2.1.0 | Automatische Zuweisung | 🔮 Zukunft | Q3 2025? |

---

## 🎯 Prioritäten

### Kurzfristig (1-2 Wochen)
1. **Testdaten wiederherstellen** (v1.9.0) - URGENT
2. **Präferenzen-Editor** (v1.10.0) - Mitarbeiter können Wünsche eintragen

### Mittelfristig (1-2 Monate)
3. **Workload-Dashboard** (v1.11.0) - Transparenz für Mitarbeiter
4. **Team-Fairness-Übersicht** (v1.12.0) - Manager-Tool
5. **Automatische Workload-Berechnung** (v1.13.0) - Cron-Jobs

### Langfristig (3-6 Monate)
6. **Objekt-Management** - Vollständige Verwaltung
7. **Event-Planung** - Großveranstaltungen
8. **KI-Integration** (v2.0+) - Machine Learning

---

## 📝 Notizen

### User-Feedback integrieren
- "Abwesenheiten interessieren mich nur wenn es Probleme gibt" → Dashboard-Konzept
- "Ich will den BESTEN Mitarbeiter, nicht nur den verfügbaren" → Intelligent Replacement

### Technische Schulden
- [ ] Integration-Tests für v2 API-Endpoint
- [ ] Performance-Test: Scoring < 500ms
- [ ] E2E-Tests für Intelligent Replacement UI
- [ ] Docker-Compose dokumentieren (klare .env-Hierarchie)

### Lessons Learned
- **Systematisches Vorgehen funktioniert**: Phasen 2a → 2b → 2c
- **Test-First ist Gold wert**: 31 Unit-Tests = stabiles System
- **Dokumentation spart Zeit**: Feature-Spec half enorm
- **Infrastruktur-Änderungen brauchen Backup**: Seeds verloren nach Docker-Migration

---

**Letztes Update**: 2025-10-05
**Nächster Review**: Nach v1.9.0 (Testdaten-Verifikation)
