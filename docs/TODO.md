# TODO / Roadmap (Stand: 2025-10-15)

> Abgeschlossene Aufgaben liegen jetzt in `docs/TODO_ARCHIVE.md`.

## Kurzfristig (P1, 1–2 Tage)
- [x] **v1.10.0** Abwesenheiten: ICS-/Kalender-Export (API `GET /api/absences/export.ics`, RFC 5545 konform) ✅
- [x] **v1.10.0** Replacement-Service Observability: Prometheus-Metriken für Score-/Laufzeitwerte und Zusammenfassung in `/api/stats` ✅
- [x] **v1.10.0** Replacement UX-Verbesserungen: Farbkodierung, Ruhezeit-Anzeige, Auslastungs-Vorschau, Tie-Breaker ✅
- [ ] Dashboard UX: StatsCard klickbar machen und auf passende gefilterte Ansichten routen (`docs/FEATURE_DASHBOARD.md`).

## Mittelfristig (P2, 2–4 Wochen)
- [ ] Intelligent Replacement: Cron-Jobs (Workload täglich, Compliance-Hook nach Shift-Zuweisung, Fairness-Update wöchentlich) produktiv schalten.
- [ ] Intelligent Replacement: Integrationstest für `GET /api/shifts/:id/replacement-candidates-v2` mit Real-Scoring ergänzen.
- [ ] Workload-/Fairness-Dashboards (v1.11–v1.12) vorbereiten – Manager-Übersicht + Export-Konzept.

## Langfristig (P3+)
- [ ] Predictive Scheduling & Auto-Assignment (v2.x Roadmap).
- [ ] Storage/Infra: S3/MinIO-Umstieg inkl. Verschlüsselungs-/Migrationkonzept.
- [ ] Objekt-Management Suite & Einarbeitungs-Workflow (siehe `docs/planning/employee-profile.md`).
