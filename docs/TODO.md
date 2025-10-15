# TODO / Roadmap (Stand: 2025-10-16)

> Abgeschlossene Aufgaben liegen jetzt in `docs/TODO_ARCHIVE.md`.

## Kurzfristig (P1, 1–2 Tage)
- [x] **v1.10.0** Abwesenheiten: ICS-/Kalender-Export (API `GET /api/absences/export.ics`, RFC 5545 konform) ✅
- [x] **v1.10.0** Replacement-Service Observability: Prometheus-Metriken für Score-/Laufzeitwerte und Zusammenfassung in `/api/stats` ✅
- [x] **v1.10.0** Replacement UX-Verbesserungen: Farbkodierung, Ruhezeit-Anzeige, Auslastungs-Vorschau, Tie-Breaker ✅
- [x] **v1.10.1** Fairness-Score: Präferenzen für Nachtschichten berücksichtigen (MA mit Nachtschicht-Wunsch nicht mehr bestrafen) ✅
- [x] **v1.10.1** UX: Inline-Bestätigung statt Pop-up, kontextuelle Badges (Nachtschicht nur bei Nachtschichten) ✅
- [ ] Dashboard UX: StatsCard klickbar machen und auf passende gefilterte Ansichten routen (`docs/FEATURE_DASHBOARD.md`).

## Mittelfristig (P2, 2–4 Wochen)

### 🏢 Objekt-Management Suite (v1.11.0) - **NÄCHSTES FEATURE**
**Priorität: HOCH** - Blockiert mehrere Features, Fundament für Schicht-Planung & Replacement
- [ ] **Konzept entwickeln**: Anforderungen sammeln, Datenmodell entwerfen, User-Stories definieren
- [ ] Objekte (Sites) CRUD: Anlegen, Bearbeiten, Archivieren (Backend + Frontend)
- [ ] Objekt-Details: Adresse, Ansprechpartner, Anforderungen, Notfall-Kontakte
- [ ] Qualifikations-Management: Objekt-spezifische Anforderungen definieren
- [ ] Einarbeitungs-Workflow: Training → Clearance → Approved (mit Dokumentation)
- [ ] Objekt-Dokumentation: Anfahrtsbeschreibung, Notfallpläne, Upload-Funktion
- [ ] Objekt-Templates: Schicht-Vorlagen pro Objekt
- [ ] Manager-Übersicht: Alle Objekte mit Status, Clearances, aktive Schichten

**Geschätzter Aufwand**: 3-5 Tage
**Abhängigkeiten**: Aktuell keine - kann sofort starten
**Blockt**: Schicht-Planung, besseres Replacement, Compliance-Tracking

---

### 👤 MA-Profile erweitern (v1.12.0) - **NACH OBJEKT-MANAGEMENT**
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

### 📊 Dashboards & Monitoring (v1.13.0)
- [ ] Intelligent Replacement: Cron-Jobs (Workload täglich, Compliance-Hook nach Shift-Zuweisung, Fairness-Update wöchentlich) produktiv schalten.
- [ ] Workload-/Fairness-Dashboards: Manager-Übersicht mit Team-Statistiken, Export-Funktion (CSV/PDF).
- [ ] Intelligent Replacement: Integrationstest für `GET /api/shifts/:id/replacement-candidates-v2` mit Real-Scoring ergänzen.

## Langfristig (P3+)
- [ ] Predictive Scheduling & Auto-Assignment (v2.x Roadmap).
- [ ] Storage/Infra: S3/MinIO-Umstieg inkl. Verschlüsselungs-/Migrationkonzept.
- [ ] KI-Integration: ML-Modell für Auto-Assignment, Optimierungs-Algorithmen.
