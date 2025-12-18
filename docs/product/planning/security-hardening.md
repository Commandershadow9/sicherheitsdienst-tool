# Security Hardening Blueprint

_Status: 2025-09-19_

## Scope & Objectives
- Reduce abuse potential on high-impact write endpoints (shift assignment, clock events, notifications test) with targeted limits that complement the global write limiter.
- Establish an audit trail concept that satisfies compliance requests (Who did what/when/from where) with tamper-evident storage and ergonomic query capabilities for admins.
- Prepare documentation and environment knobs so operations can tune safeguards without code changes.

## Selective Rate-Limit Coverage

| Endpoint / Action | Abuse Scenario | Limit Strategy (defaults) | Environment Controls | Notes |
| --- | --- | --- | --- | --- |
| `POST /api/shifts/:id/assign` | Mass self-assignment or rapid re-assignment to hijack rosters. | Per user/IP bucket: default **12/min** per 60s window. Shared across admin + dispatcher roles. | `SHIFT_ASSIGN_RATE_LIMIT_ENABLED`, `SHIFT_ASSIGN_RATE_LIMIT_PER_MIN`, `SHIFT_ASSIGN_RATE_LIMIT_WINDOW_MS` | Implemented via dedicated limiter + RBAC (`ADMIN`,`DISPATCHER`). |
| `POST /api/shifts/:id/clock-in` & `POST /api/shifts/:id/clock-out` | Automated punching to flood time tracking / brute-force race conditions. | Per user/IP bucket: default **20/min** per 60s window allowing retries but stopping spam. | `SHIFT_CLOCK_RATE_LIMIT_ENABLED`, `SHIFT_CLOCK_RATE_LIMIT_PER_MIN`, `SHIFT_CLOCK_RATE_LIMIT_WINDOW_MS` | Limiter shared between clock-in/out to cover both flows. |
| `POST /api/notifications/test` | Repeated notification spam. | Already in place (per user/IP) via `NOTIFICATIONS_TEST_RATE_LIMIT_*`. |  | Maintain observability counters. |
| Future: Incident mutation endpoints | Replaying updates/deletes. | To be covered by global write limiter + upcoming audit events. |  | Add per-resource controls if abuse observed. |

### Operations Playbook
- Limits are additive: global write limiter (`WRITE_RATE_LIMIT_*`) remains active for POST/PUT/DELETE. Selective limiters provide tighter buckets where needed.
- Recommended production baseline:
  - Assignments: 6/min for dispatch users, 60s window.
  - Clock events: 4/min for employees; widen to 10/min temporarily if badge reader issues occur.
- Monitor `429` rates via `/api/stats` (RateLimit counters) and adjust env variables without redeploy.

## Audit Trail Concept

### Target Events (initial backlog)
1. **Authentication**: Login success/failure, refresh usage (userId/email, IP, user-agent, result).
2. **Shift Lifecycle**: Create/update/delete, assignment changes, clock-in/out, warnings issued.
3. **User Administration**: Create/update/disable, role changes, password reset triggers.
4. **Notifications**: Template changes, opt-in/out, delivery attempts (link with telemetry).
5. **Incidents/Events**: CRUD actions, status transitions, escalation toggles.

### Data Model Proposal
```prisma
model AuditLog {
  id           String   @id @default(cuid())
  occurredAt   DateTime @default(now())
  actorId      String?  // user id if authenticated
  actorRole    String?
  actorIp      String?
  action       String   // e.g. SHIFT.ASSIGN, AUTH.LOGIN.FAIL
  resourceType String   // SHIFT, USER, INCIDENT, etc.
  resourceId   String?
  data         Json?
  requestId    String?
  userAgent    String?
  outcome      String   // SUCCESS, DENIED, ERROR

  @@index([occurredAt])
  @@index([resourceType, resourceId])
  @@index([actorId, occurredAt])
}
```
- Storage: PostgreSQL (same DB) with migration-managed schema. Consider partitioning (`occurredAt`) when daily volume > 100k.
- Integrity: append-only table, updates restricted (DB trigger preventing `UPDATE/DELETE` except soft retention job).

### Capture Strategy
- Extend async handlers/services to emit audit events after successful mutations and relevant denials (e.g., RBAC failures, rate-limit hits > threshold).
- Reuse `requestId` middleware for correlation; include `res.statusCode`.
- For clock-in/out: log shiftId, time, warnings, geo metadata (if present) in `data` JSON.
- Notifications: link to telemetry by storing `notificationId` or queue identifiers.

### Implemented (Phase C/D/E)
- Auth: Login & Refresh (success, denied, Konfig-Fehler) mit Audit-Events.
- Shifts: Create/Update/Delete, Assign, Clock-In/Clock-Out inkl. Fehlpfade (nicht zugewiesen, doppelter Clock-In, Schicht nicht gefunden).
- Notifications: Eigene Opt-In/Out-Änderungen werden protokolliert.
- Admin Read-API `GET /api/audit-logs` mit Filter-/Paging-Support und RBAC `ADMIN`.
- CSV-Export `GET /api/audit-logs/export?format=csv` für Compliance-Ausleitungen (gleiche Filter wie Listing).
- `/api/stats` zeigt Audit-Trail Kennzahlen (Total, letzte 24 h, Outcome-Verteilung, Queue-Konfiguration & Pending); Prometheus-Metriken `audit_log_events_total`, `audit_log_failures_total`, `audit_log_queue_size`, `audit_log_prune_operations_total` stehen zur Verfügung.
- CSV-Export `GET /api/audit-logs/export?format=csv` für Compliance-Ausleitungen (gleiche Filter wie Listing).
- Retention-Skript `npm run audit:prune` (ts-node) entfernt Einträge älter als `AUDIT_RETENTION_DAYS` (Default 400 Tage, Dry-Run via `--dry-run`).

### Access & Retention
- API surface (`GET /api/audit-logs`) restricted to `ADMIN` (read-only) with pagination, filters (`actorId`, `resourceType`, `date range`).
- Export capability (CSV) for compliance requests.
- Retention policy: 400 days default; configurable via ENV `AUDIT_RETENTION_DAYS`. Nightly job prunes older rows into cold storage (S3/Glacier) if necessary.

### Monitoring & Alerting
- Add Prometheus counters for audit write failures and unexpected gaps.
- Alert when:
  - Audit writer fails >5 times within 5 minutes.
  - Suspicious spike: >50 failed logins from same IP within 10 minutes (tie into rate-limit metrics).

## Implementation Roadmap
1. **Phase A (done)**: Document blueprint, introduce selective rate-limits for shift assignment & clock flows, update env examples + tests.
2. **Phase B (done 2025-09-18)**: Prisma-Modell + Migration, Logging-Service mit Retry-Queue (`logAuditEvent`, `flushAuditLogQueue`) samt Tests/Doku.
3. **Phase C (done 2025-09-19)**: Audit-Events für Auth/Users/Shifts/Incidents/Notifications integriert (inkl. Test-Sendungen & Fehlpfade), Admin-Read-API (`GET /api/audit-logs`) inkl. Filter/Paging und Tests bereitgestellt.
4. **Phase D (done 2025-09-19)**: CSV-Export bereitgestellt, `/api/stats` um Audit-Kennzahlen ergänzt, Queue-Konfiguration dokumentiert.
5. **Phase E (done 2025-09-19)**: Retention-Job (`npm run audit:prune`), Prometheus-Metriken und Export-Flow finalisiert; nächste Schritte: Dashboards & Alerts konfigurieren.

## Open Questions
- Do we need tamper-proofing beyond DB-level protections (e.g., WORM storage, hash chaining)?
- Required SLA for audit availability (RPO/RTO) to size retention and storage redundancy.
- Regional data residency constraints for audit data copies.
