# RBAC – Rollen & Berechtigungen

Rollen
- ADMIN, MANAGER, DISPATCHER, EMPLOYEE

UI‑Sichtbarkeit (Beispiele)
- Navigation
  - „Benutzer“: sichtbar für ADMIN/DISPATCHER; EMPLOYEE sieht ihn nicht.
  - „Sites“: ADMIN/DISPATCHER/MANAGER
  - „Schichten“: alle
  - „Vorfälle“: ADMIN/DISPATCHER/MANAGER
- Aktionen
  - Incidents anlegen/bearbeiten: ADMIN/MANAGER
  - Users lesen: ADMIN/DISPATCHER
  - Notifications Test: ADMIN/MANAGER

API – Auszug
- Users Read: ADMIN, DISPATCHER
- Sites/Schichten Read: AUTH (alle angemeldeten)
- Incidents Create/Edit/Delete: ADMIN, MANAGER
- Notifications Test (`POST /api/notifications/test`): ADMIN, MANAGER

403‑UX
- 403 löst keinen Token‑Refresh aus.
- UI blendet verbotene Bereiche aus (Navigation) und zeigt bei direktem Aufruf eine 403‑Hinweiskarte.

Users‑Route (API)
- `GET /api/users` nur für `ADMIN` und `DISPATCHER`.
- Serverseitige Paginierung/Sortierung/Filterung (inkl. `query`, `role`, `isActive`); Export verwendet die gleichen Filter.
