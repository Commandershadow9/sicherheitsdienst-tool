# TODO – Nächste Schritte (Kurzplanung)

Stand: 2025-09-09

- ## Kurzfristig (P1, 1–2 Tage)
- [x] Users: Positive Self‑Access‑Tests ergänzen (eigene ID lesen/ändern)
  - Akzeptanz: EMPLOYEE/MANAGER dürfen `GET/PUT /api/users/{ownId}` (200), nur Basisfelder updaten; fremde ID → 403; ADMIN unverändert.
- [x] OpenAPI Push‑API: Fehlerbeispiele (400/422) ergänzen und Referenzen prüfen
  - Akzeptanz: `docs/openapi.yaml` enthält Beispiel‑Responses für 400/422 bei Push‑Endpunkten; `redocly lint` ohne neue Errors (Warnmodus ok).
- [x] CI Stabilität: Prisma Client Generate/Mocks vor Tests
  - Akzeptanz: CI‑Workflow führt `npx prisma generate` vor Tests aus oder globale Prisma‑Mocks verhindern Initialisierung; Tests grün.
- [x] README RBAC: Self‑Access‑Hinweis ergänzen
  - Akzeptanz: Abschnitt „RBAC Übersicht“ erwähnt Self‑Access für Users‑Detail/Update + Feldbeschränkung.
- [x] DX: (Optional) Swagger UI nur in Dev unter `/api-docs`
  - Akzeptanz: Dev‑Server bietet Swagger UI; Prod unverändert.
  
Erledigt:
- [x] Swagger UI (Dev) unter `/api-docs` mit YAML‑Quelle (`/api-docs-spec/openapi.yaml`).
- [x] Users: RBAC‑Negativtests ergänzen (403/401) – analog zu Sites/Shifts
  - Akzeptanz: Tests schlagen korrekt bei EMPLOYEE/anonymous an; CI grün.
- [x] OpenAPI Feinschliff – operationId/Beispiele für Randendpunkte prüfen/ergänzen
  - Akzeptanz: Redocly lint ohne neue Errors; konsistente Beispieldaten.
- [x] README Quickstart (Docker Compose) – kurzer Abschnitt mit `.env.example`, `docker-compose up`, Healthcheck‑Hinweis
  - Akzeptanz: Schritte reproduzierbar; Hinweis auf `prisma migrate deploy`.
- [x] Error‑Responses Smoke‑Tests – 401/422 prüfen (Shape: code/message/details/errors)
  - Akzeptanz: 2–3 schlanke Tests, keine Ports/DB nötig.

## Mittelfristig (P2)
- [x] XLSX‑Exports lokal stabilisieren
  - Akzeptanz: Tests für XLSX‑Exports erkennen Buffer zuverlässig (lokal/CI); ggf. Content‑Type/Body‑Parser‑Setup prüfen.
- [x] Reporting/Exports: CSV/Excel für Listen (Employees/Sites/Shifts)
  - [x] Employees: CSV/XLSX via `Accept` (Filter/Sort unterstützt; README/OpenAPI ergänzt)
  - [x] Sites: CSV/XLSX
  - [x] Shifts: CSV/XLSX
  - Akzeptanz: Endpoint(s) mit Filter/Sort‑Berücksichtigung; Beispiel in README/OpenAPI.
- [x] Performance: DB‑Index‑Vorschläge (Users.email, Sites (name,address), Shifts (startTime,status))
  - Akzeptanz: Liste empfohlener Indexe + (optional) Migrationen vorgeschlagen. (Umgesetzt: `docs/DB_INDEXES.md` + Prisma-@@index in Schema.)
- [x] Notifications: Rate‑Limit produktionsreif (z. B. Token‑Bucket/express-rate-limit) + Env‑Profile
  - Akzeptanz: konfigurierbare Limits; Tests für Grenzen/Eckenfälle. (Umgesetzt: ENV‑Toggle, Standard‑Headers, 429 Retry‑After, Tests.)

## Langfristig / Post‑MVP (P3)
- [ ] Erweiterte Benachrichtigungen (Real‑Events, Templates, Opt‑In)
- [ ] Observability: erweiterte /stats (Laufzeit, Queue, Mail‑Erfolg), Log‑Konfiguration in README
- [ ] Sicherheits‑Hardening: Rate‑Limit selektiv auf weitere Endpunkte; Audit‑Trail

## Neues Feature: Einsätze/Events
- [x] Datenmodell (Prisma): `Event` mit Feldern `id, title, description, siteId?, startTime, endTime, serviceInstructions (Text/Markdown), assignedEmployeeIds[]` + Indizes
- [x] API/Controller/Routes: CRUD `/api/events` mit RBAC (ADMIN/DISPATCHER: schreiben; alle Auth: lesen)
- [x] Validation (Zod): Create/Update Schemas; Zeitlogik (start < end)
- [x] OpenAPI: Schemas/Paths inkl. Beispiele; List‑Parameter analog zu anderen Listen; operationId
- [x] Exporte: CSV/XLSX für Listen; PDF‑Bericht je Event
- [x] Tests: Unit + Route (RBAC, Validation, CRUD, Exporte, PDF)
- [x] Push: Geräte‑Tokens, optional FCM, Event‑Push (Flag), Admin‑Opt‑In/Out

## Arbeitsweise / Hinweise
- Branch‑Strategie: `feature/<kurzer-name>` je Task; kleine, überprüfbare Commits.
- Vor jedem Merge: Lint/Typecheck/Tests grün; OpenAPI Lint warn‑only toleriert.
- Doku immer mitführen: README + CHANGELOG + ggf. OpenAPI.
- `.env.example` aktualisieren, wenn neue ENV hinzukommen.
