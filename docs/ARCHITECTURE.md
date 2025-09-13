# Architektur (Kurz)

Module
- Auth: Login/Refresh, JWT, Interceptors, RBAC‑Guards
- Users, Sites, Shifts, Incidents: REST‑Routen mit Filter/Sort/Pagination
- Export: CSV/XLSX Streaming per Accept (100k+ Rows)
- Monitoring: `/api/stats`, optional Prometheus/Grafana

RBAC
- Rollen: ADMIN, MANAGER, DISPATCHER, EMPLOYEE
- Route‑Guard (Frontend): `RequireRole`
- API‑RBAC: Middleware (authorize), 403 ohne Refresh

Axios‑Interceptor (FE)
- Request: setzt `Authorization: Bearer <token>`; Fallback aus localStorage
- Response: 401 → einmalig Refresh + Retry; 403 → Toast/403‑UI; Fail → Logout + `/login`

RateLimit (Dev‑Skip)
- Auth‑Rate‑Limit konfigurierbar; Dev: `RATE_LIMIT_SKIP_PATHS` für Health/Stats/Login/Refresh

