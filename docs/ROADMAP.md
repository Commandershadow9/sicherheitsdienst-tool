# Roadmap – Heute

> Quelle: docs/KONZEPT.pdf (Roadmap/DoD maßgeblich)

## Heutige Ziele (Bestätigung)
- Konzepttreu nach docs/KONZEPT.pdf arbeiten (Roadmap/DoD einhalten).
- In kleinen, überprüfbaren Schritten vorgehen (max. 3 Tasks).
- Nur UNIFIED DIFF zeigen und Freigabe abwarten.
- Fokus: OpenAPI v1, Auth/RBAC, Entity „Site“.
- Jede Aufgabe ≤ 90 Minuten mit klaren Akzeptanzkriterien.

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

## Nächste Schritte (Vorschlag)
- OpenAPI-Parität: Konsistente Paginierungs-/Sort-/Filter-Parameter und Fehler-Responses (400/401/403/404/409/422/429/500/503) über alle Listen-/Mutationsendpunkte; RBAC-Hinweise (`x-required-roles`) ergänzen.
- Docker/Compose: README-Quickstart schärfen, Healthchecks belassen, `prisma migrate deploy` beim Start (bereits umgesetzt) dokumentieren.
- Auth-Flow: Refresh-Token-Endpoint + Tests; OpenAPI ergänzen.
- CI: Optional Coverage-Upload (Codecov) + Badge; Beibehaltung Node 20/setup-node@v4.
- Performance: Indexe (Users.email, Sites.name+address, Shifts.startTime/status) prüfen und bei Bedarf Migrationen vorschlagen.
- Sicherheit: Rate-Limits für Test-/Sensitiv-Endpunkte (z. B. `/notifications/test`) optional feature-flag-gesteuert.

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
