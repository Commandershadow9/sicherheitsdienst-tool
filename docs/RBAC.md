# RBAC – Rollen & Berechtigungen

Rollen
- ADMIN, MANAGER, DISPATCHER, EMPLOYEE

UI‑Sichtbarkeit (Beispiele)
- Navigation
  - „Benutzer“: sichtbar für ADMIN/DISPATCHER; EMPLOYEE sieht ihn nicht.
  - „Sites“: ADMIN/DISPATCHER/MANAGER
  - „Schichten“: alle
  - „Vorfälle“: ADMIN/DISPATCHER/MANAGER
  - „Abwesenheiten“: alle Rollen; EMPLOYEE sieht nur eigene Datensätze, Manager/Admin alle.
  - „Profil“: alle Rollen über `/users/me/profile`; Manager/Admin springen auf beliebige Nutzereinträge.
- Aktionen
  - Incidents anlegen/bearbeiten: ADMIN/MANAGER
  - Users lesen: ADMIN/DISPATCHER
  - Notifications Test: ADMIN/MANAGER
  - Abwesenheiten erstellen: Mitarbeitende für sich selbst; Manager/Admin für alle Nutzer.
  - Abwesenheiten genehmigen/ablehnen: ADMIN/MANAGER
  - Abwesenheiten stornieren: Antragsteller oder Manager/Admin bei genehmigten Einträgen.
  - Profile bearbeiten: Self-Service für Adresse/Telefon, ADMIN/MANAGER pflegen Beschäftigungsdaten, Qualifikationen, Dokumente.

API – Auszug
- Users Read: ADMIN, DISPATCHER
- Sites/Schichten Read: AUTH (alle angemeldeten)
- Incidents Create/Edit/Delete: ADMIN, MANAGER
- Notifications Test (`POST /api/notifications/test`): ADMIN, MANAGER
- Absences:
  - `GET /api/absences`: EMPLOYEE (nur eigene), ADMIN/MANAGER/DISPATCHER (alle)
  - `POST /api/absences`: EMPLOYEE (Self), ADMIN/MANAGER/DISPATCHER (beliebige Nutzer)
  - `POST /api/absences/:id/approve|reject`: ADMIN, MANAGER
  - `POST /api/absences/:id/cancel`: Antragsteller oder ADMIN/MANAGER
- Profile & Compliance:
  - `GET /api/users/:id/profile`: Self, ADMIN/MANAGER/DISPATCHER (alle Nutzer)
  - `PUT /api/users/:id/profile`: Self (Kontaktfelder), ADMIN/MANAGER (alle Felder)
  - `POST /api/users/:id/profile/qualifications|documents`: ADMIN/MANAGER

403‑UX
- 403 löst keinen Token‑Refresh aus.
- UI blendet verbotene Bereiche aus (Navigation) und zeigt bei direktem Aufruf eine 403‑Hinweiskarte.

Users‑Route (API)
- `GET /api/users` nur für `ADMIN` und `DISPATCHER`.
- Serverseitige Paginierung/Sortierung/Filterung (inkl. `query`, `role`, `isActive`); Export verwendet die gleichen Filter.
