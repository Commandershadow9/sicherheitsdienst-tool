# Architektur (Kurz)

Module
- Auth: Login/Refresh, JWT, Interceptors, RBAC‑Guards
- Users, Sites, Shifts, Incidents: REST‑Routen mit Filter/Sort/Pagination
- Export: CSV/XLSX Streaming per Accept (100k+ Rows)
- Monitoring: `/api/stats`, optional Prometheus/Grafana
- Absences: REST-Modul für Urlaubs-/Krankmeldungen inkl. RBAC (Self-Service, Manager-Entscheidungen), Konfliktprüfung mit Schichtzuweisungen und Audit-Events.
- Employee Profile: Aggregiert Stammdaten, Arbeitszeiten (7/30 Tage, YTD), Qualifikationen, Dokumente und zeigt genehmigte Abwesenheiten an.
- System Dashboard: React-Seite `/system`, die `/api/stats` konsumiert und Notification-/Audit-Queues, Eventloop, SLO-Kennzahlen und Feature-Flags visualisiert.

RBAC
- Rollen: ADMIN, MANAGER, DISPATCHER, EMPLOYEE
- Route‑Guard (Frontend): `RequireRole`
- API‑RBAC: Middleware (authorize), 403 ohne Refresh; Absences-Endpoints erlauben Self-Service für Mitarbeitende und Manager/Admin-Aktionen (`approve/reject`).
- Profildialog: Self-Updates auf Kontaktfeldern, Manager/Admin verwalten Beschäftigungsdaten, Qualifikationen und Dokumente.

Axios‑Interceptor (FE)
- Request: setzt `Authorization: Bearer <token>`; Fallback aus `localStorage` (Tokens werden dort persistiert)
- Response: 401 → einmalig Refresh + Retry (Queue für parallele Requests); 403 → Toast/403‑UI; 401 nach Refresh → Logout + `/login`
- Refresh: Proaktiver Timer 30 s vor JWT-Ablauf, Wiederholungsschutz bei gleichzeitigen Refresh-Läufen, Errors führen zu sauberem Logout statt Hard-Reload.

RateLimit (Dev‑Skip)
- Auth‑Rate‑Limit konfigurierbar; Dev: `RATE_LIMIT_SKIP_PATHS` für Health/Stats/Login/Refresh
