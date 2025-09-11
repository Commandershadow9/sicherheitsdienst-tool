# Roadmap – Heute

> Quelle: docs/KONZEPT.pdf (Roadmap/DoD maßgeblich)

## Heutige Ziele (Bestätigung)
- Konzepttreu nach docs/KONZEPT.pdf arbeiten (Roadmap/DoD einhalten).
- In kleinen, überprüfbaren Schritten vorgehen (max. 3 Tasks).
- Nur UNIFIED DIFF zeigen und Freigabe abwarten.
- Fokus: OpenAPI v1, Auth/RBAC, Entity „Site“.
- Jede Aufgabe ≤ 90 Minuten mit klaren Akzeptanzkriterien.

## Ergebnisse heute (abgeschlossen)

- RBAC (Users): Detail- und Update-Routen abgesichert (ADMIN oder Self-Access); Self-Updates auf Basisfelder beschränkt.
- Validierung: 422-Fehler enthalten `code: VALIDATION_ERROR` (Middleware + Tests angepasst).
- OpenAPI: Push-API dokumentiert (`/push/tokens`, `/push/tokens/{token}`, `/push/users/{userId}/opt`) + zusätzlicher Server `http://localhost:3001/api/v1`.
- Doku: README Listen-Parameter vereinheitlicht (`page/pageSize/sortBy/sortDir/filter[...]`).
- Tests/Build lokal: Typecheck/Build grün; einige Jest-Suites benötigen Prisma-Generate/Mocks (CI deckt regulär ab).
- DX: Swagger UI (nur Dev) unter `/api-docs` verfügbar.
- Observability: `/api/stats` erweitert (Features/Notifications/Auth/System/Env) und dokumentiert (README + OpenAPI).

### Neu seit v1.1.1 (Health/Readiness)
- Endpunkte: `/healthz` (Liveness) und `/readyz` (Readiness mit `deps.db`, `deps.smtp`).
- Security: `helmet()` aktiv; CORS strikt per Allowlist (`CORS_ORIGINS`, Fallbacks).
- Auth Rate-Limits: IP‑basiert (ENV: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`) + pro User/Email (Login) 5/15min; optional Redis‑Store (`REDIS_URL`).
- OpenAPI: interne Endpunkte dokumentiert (Tag `internal`, `x-internal: true`), operationId‑Konvention vereinheitlicht, ungenutzte Komponenten entfernt, Beispiele korrigiert.
- CI: Health‑Smoke‑Job (baut, startet, prüft `/healthz`/`/readyz`, Log‑Dump bei Fehler).

Alle Änderungen sind auf `main` gemergt.

## Milestone 2025‑09‑09 (Planning Phases 1–5) – abgeschlossen (Branch: planning/analysis-20250909)

- Phase 1 – Spec Alignment & Stability
  - OpenAPI Fehlerschema harmonisiert; Prisma‑Singleton; Auth Rate‑Limit (ENV); Request‑ID Logging.
- Phase 2 – Incidents E2E
  - CRUD/Listen/Filter/CSV/XLSX; RBAC (ADMIN/MANAGER schreiben, AUTH lesen); OpenAPI ergänzt; Tests.
- Phase 3 – Hardening & Coverage
  - RBAC Negative (anonymous/employee) für Incidents; TimeTracking‑Warnungen; OpenAPI 405/Incidents‑List‑Form.
- Phase 4 – Notifications Reliability
  - E‑Mail Retry (1x) + Tests; 5xx‑Beispiele für Push/Email in OpenAPI.
- Phase 5 – Operability & Docs
  - README Runbook; /stats zeigt Request‑Zähler; ENV‑Beispiele (SMTP Retry).

→ Zusammenfassung siehe `CHANGELOG.md` und PR `planning/analysis-20250909`.

## Nächste Schritte (Backlog, kurz)

- Readiness: Optionalen SMTP‑Verify implementieren, falls `READINESS_CHECK_SMTP=true` (Timeout konfigurierbar über `READINESS_SMTP_TIMEOUT_MS`).
- Rate‑Limits: Metriken/Monitoring (z. B. Exposition der Rate‑Limit‑Header in /stats oder Prometheus‑Endpoint evaluieren).
- CI: Prisma‑Setup und Caching weiter beschleunigen; Smoke um Basis‑Auth/CORS‑Checks ergänzen.
- OpenAPI: Kontinuierliche Pflege der Beispiele und operationIds bei neuen Endpunkten.

## Abgeschlossen (aktualisiert)

- Contract‑Tests gegen OpenAPI (Prism/Dredd) für Kernpfade.
- Export‑Streaming (CSV/XLSX) für große Resultsets; Headers/Accept/Disposition geprüft.
- 405‑Referenzen in Paths ergänzt (Events/Notifications/Stats) und Beispiele konsolidiert.
- RBAC‑Matrix in README konsolidiert (inkl. Negativbeispiele; Verweise auf Middleware/Tests).

## Historie (bereits umgesetzt)

1) OpenAPI v1 Grundgerüst aktualisieren (Auth + Site – minimal)
- Akzeptanzkriterien:
  - `docs/openapi.yaml` existiert (OpenAPI 3.1) mit `info`, `servers`, `components`.
  - Pfade enthalten: `POST /auth/login`, `POST /auth/refresh`, `GET /sites` (200-Response mit Schema).
  - Schemas vorhanden: `AuthLoginRequest`, `AuthTokens`, `SiteSummary`, `UserSummary`.

Erweiterung (konzepttreu, dokumentarisch):
- Einheitliche Fehler-Responses zentralisiert; `ValidationError`-Schema ergänzt.
- Pagination/Filter für `GET /sites` und `GET /employees` beschrieben; Beispiele je Endpoint hinzugefügt.
- POST-Statuscodes auf 201 vereinheitlicht (Create-Endpunkte).
- TimeTracking (Clock-in/out) mit Basis-AZG-Warnungen und Tests.
- E-Mail-Benachrichtigungen (SMTP aus ENV), Test-Endpoint `/api/notifications/test`, Tests.
- RBAC-Feinschliff umgesetzt: Notifications-Endpoint auf ADMIN/MANAGER eingeschränkt.
- Serverseitige Pagination/Sort/Filter für Sites/Shifts (und Users) mit Tests; OpenAPI-Parameter und Beispiele ergänzt.
- E-Mail-Benachrichtigungen bei Schicht-Änderungen hinter Feature-Flag `EMAIL_NOTIFY_SHIFTS=true`; Tests (Flag on/off) ergänzt.
- CI stabilisiert (tolerante Installation, OpenAPI‑Lint via npx, warn-only), Discord-Notifications grafisch verbessert.

## Nächste Schritte (Vorschlag)
- RBAC‑Feinschliff: weitere Endpunkte mit `x-required-roles` dokumentieren; negative Testfälle ergänzen.
- OpenAPI: Fehlerbeispiele vereinheitlichen; optionale operationId‑Felder vergeben; ungenutzte Komponenten abbauen.

## Nächste größere Features
- Einsätze/Events (Planungseinheiten für Aufträge):
  - Objekt mit Start/Ende, Site, Dienstanweisungen, zugewiesene Mitarbeiter, optional Anhänge.
  - RBAC: ADMIN/DISPATCHER verwalten; alle Auth‑Benutzer lesen, eigene Anweisungen sehen.
  - Export (CSV/XLSX, PDF Bericht) und OpenAPI‑Doku.
  - Push‑Benachrichtigungen: Geräte‑Token, optional FCM, Opt‑In/Out je Benutzer.
- Auth/Refresh: Refresh‑Token‑Endpoint inkl. Tests und Doku.
- Reporting/Exports (CSV/Excel) für Listenendpunkte; Filter‑Preset‑Doku.
- Performance: sinnvolle Indexe (Users.email, Sites.name+address, Shifts.startTime/status) prüfen; Migrationsvorschläge.
- Sicherheit: Optionales Rate‑Limit für `/notifications/test`; Env‑Flag für Aktivierung.
  (Status: umgesetzt; weitere Parametrisierung/Monitoring evaluieren.)

2) Zod-DTOs für Auth und Site ableiten
- Akzeptanzkriterien:
  - `backend/src/validations/authValidation.ts` enthält `loginSchema` (email+password) und `refreshSchema` (refreshToken).
  - Optional: `backend/src/validations/siteValidation.ts` mit `createSiteSchema` (Name, Adresse minimal) vorbereitet.
  - Bestehende Tests erweitert um mind. 2 Smoke-Tests für die neuen Schemas.

3) RBAC kurz prüfen und Testlücken schließen
- Akzeptanzkriterien:
  - Rollenmatrix (ADMIN/DISPATCHER/EMPLOYEE) kurz in README-Abschnitt „RBAC“ dokumentiert.
  - `authorize`-Middleware durch zusätzlichen Testfall abgedeckt (erlaubte Rolle passiert; verbotene Rolle geblockt).
  - Keinerlei API-Verhalten geändert; nur Tests/Docs ergänzt.
