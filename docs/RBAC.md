# RBAC – Rollen & Berechtigungen

Rollen
- ADMIN, MANAGER, DISPATCHER, EMPLOYEE

Seiten (Frontend)
- Dashboard: alle
- Users: ADMIN, DISPATCHER
- Sites: ADMIN, DISPATCHER, MANAGER
- Shifts: alle (EMPLOYEE standardmäßig nur eigene)
- Incidents: ADMIN, DISPATCHER, MANAGER (Create/Edit nur ADMIN/MANAGER)

Aktionen (API – Auszug)
- Users Read: ADMIN, DISPATCHER
- Sites/Schichten Read: AUTH
- Incidents Create/Edit/Delete: ADMIN, MANAGER
- Notifications Test (`POST /api/notifications/test`): ADMIN, MANAGER

Hinweise
- 403 löst keinen Token‑Refresh aus; UI zeigt 403‑Karte.
- Exporte (CSV/XLSX) folgen den Read‑Rechten.

Users‑Route (API)
- `GET /api/users` darf nur von `ADMIN` und `DISPATCHER` aufgerufen werden.
- Serverseitige Paginierung/Sortierung/Filterung (inkl. `query`, `role`, `isActive`); Export verwendet die gleichen Filter.
