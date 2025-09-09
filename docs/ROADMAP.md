# Roadmap – Heute

> Quelle: docs/KONZEPT.pdf (Roadmap/DoD maßgeblich)

## Heutige Ziele (Bestätigung)
- Konzepttreu nach docs/KONZEPT.pdf arbeiten (Roadmap/DoD einhalten).
- In kleinen, überprüfbaren Schritten vorgehen (max. 3 Tasks).
- Nur UNIFIED DIFF zeigen und Freigabe abwarten.
- Fokus: OpenAPI v1, Auth/RBAC, Entity „Site“.
- Jede Aufgabe ≤ 90 Minuten mit klaren Akzeptanzkriterien.

## Ergebnisse heute (abgeschlossen)

- Auth: Refresh-Token-Flow (`POST /api/auth/refresh`), Zod-Validation für Login, `GET /api/auth/me`, `/api/v1`-Alias.
- Notifications: Rate-Limit für Test-Endpoint (ENV + Middleware + Tests + Doku).
- OpenAPI: Konsistente Listen-Parameter/Responses, `/auth/me`, `operationId`, ungenutzte Komponenten entfernt.
- Fehler-Responses: Einheitliche Struktur (`code`, `message`, `details`, `errors`).
- DX/CI: `LOG_LEVEL` in `.env.example`, CI Typecheck + Coverage-Artefakt, PR-Template.
- Doku: README (Error Responses, curl Quickstart), CHANGELOG aktualisiert.

Alle Änderungen sind auf `main` gemergt.

## Nächste Schritte (Backlog, kurz)

- Zusätzliche RBAC-Tests (Users-Endpunkte; negative Fälle) – abgesichert.
- OpenAPI Feinschliff (operationId für Randendpunkte prüfen, kleine Beispiele ergänzen) – optional.
- Reporting/Exports (CSV/Excel) für Listenendpunkte – Post‑MVP.
- Performance: sinnvolle Indexe (Users.email, Sites.name+address, Shifts.startTime/status) prüfen – optional.

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
