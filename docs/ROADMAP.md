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

## Nächste Schritte (Vorschlag)
- Echte E-Mail-Benachrichtigung bei Schichtänderung verknüpfen (PUT/DELETE Schicht), Feature-Flag `NOTIFY_SHIFT_CHANGES=true`.
- OpenAPI: Notifications (Test) um Fehlerbeispiele ergänzen; ggf. E-Mail-Schema/Response standardisieren.
- RBAC-Feinschliff: Notifications-Endpoint auf ADMIN/MANAGER einschränken.
- CI: Optional Coverage-Badge/Codecov integrieren.
- Performance: Indexe prüfen (Users.email, Sites.name+address), Query-Parameter serverseitig umsetzen (Sort/Filter/Pagination intern).

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
