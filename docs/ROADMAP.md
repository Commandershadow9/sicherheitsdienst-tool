# Roadmap – Heute

> Quelle: docs/KONZEPT.pdf (Roadmap/DoD maßgeblich)

## Heutige Ziele (Bestätigung)
- Konzepttreu nach docs/KONZEPT.pdf arbeiten (Roadmap/DoD einhalten).
- In kleinen, überprüfbaren Schritten vorgehen (max. 3 Tasks).
- Nur UNIFIED DIFF zeigen und Freigabe abwarten.
- Fokus: OpenAPI v1, Auth/RBAC, Entity „Site“.
- Jede Aufgabe ≤ 90 Minuten mit klaren Akzeptanzkriterien.

## Heutige Tasks (Vorschlag)

1) Auth: Refresh-Token-Flow implementieren (Backend + Tests + Doku)
- Nutzen/Risiko/Aufwand: 5 / 3 / 3 (60–90 Min)
- Akzeptanzkriterien:
  - Endpoint `POST /api/auth/refresh` gibt neue Access/Refresh-Tokens zurück (ENV: `REFRESH_SECRET`, `REFRESH_EXPIRES_IN`).
  - Zod-Validierung (`refreshSchema`) aktiv; ungültige Eingaben → 422 mit Feldfehlern.
  - Tests: Happy Path, ungültiger/abgelaufener Refresh-Token → 401; strukturelle Fehler → 422.
  - README aktualisiert (Abschnitt Auth/Refresh), `.env.example` geprüft/ergänzt (falls nötig).

2) API-Parität: `GET /api/me` + `/api/v1`-Alias
- Nutzen/Risiko/Aufwand: 4 / 2 / 2 (45–60 Min)
- Akzeptanzkriterien:
  - `GET /api/me` liefert den authentifizierten Benutzer (401 ohne Token).
  - Alle bestehenden Router zusätzlich unter `/api/v1` gemountet (Alias), Smoke-Test prüft Erreichbarkeit beider Pfade.
  - OpenAPI `servers` bleibt kompatibel (`/api/v1`).

3) Auth-Validation härten (Login/Refresh via Zod) + Tests
- Nutzen/Risiko/Aufwand: 4 / 2 / 2 (30–60 Min)
- Akzeptanzkriterien:
  - `authValidation.ts` mit `loginSchema` (email,password) und `refreshSchema` (refreshToken).
  - `validate(...)` in `authRoutes` integriert; ungültige Payloads → 422.
  - Tests decken 422 bei invaliden Eingaben ab.

## Tasks für heute (umgesetzt)

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
