# TODO – Nächste Schritte (Kurzplanung)

Stand: 2025-09-09

## Kurzfristig (P1, 1–2 Tage)
- [ ] Users: RBAC‑Negativtests ergänzen (403/401) – analog zu Sites/Shifts
  - Akzeptanz: Tests schlagen korrekt bei EMPLOYEE/anonymous an; CI grün.
- [ ] OpenAPI Feinschliff – operationId/Beispiele für Randendpunkte prüfen/ergänzen
  - Akzeptanz: Redocly lint ohne neue Errors; konsistente Beispieldaten.
- [ ] README Quickstart (Docker Compose) – kurzer Abschnitt mit `.env.example`, `docker-compose up`, Healthcheck‑Hinweis
  - Akzeptanz: Schritte reproduzierbar; Hinweis auf `prisma migrate deploy`.
- [ ] Error‑Responses Smoke‑Tests – 401/422 prüfen (Shape: code/message/details/errors)
  - Akzeptanz: 2–3 schlanke Tests, keine Ports/DB nötig.

## Mittelfristig (P2)
- [ ] Reporting/Exports: CSV/Excel für Listen (Employees/Sites/Shifts)
  - Akzeptanz: Endpoint(s) mit Filter/Sort‑Berücksichtigung; Beispiel in README/OpenAPI.
- [ ] Performance: DB‑Index‑Vorschläge (Users.email, Sites (name,address), Shifts (startTime,status))
  - Akzeptanz: Liste empfohlener Indexe + (optional) Migrationen vorgeschlagen.
- [ ] Notifications: Rate‑Limit produktionsreif (z. B. Token‑Bucket/express-rate-limit) + Env‑Profile
  - Akzeptanz: konfigurierbare Limits; Tests für Grenzen/Eckenfälle.

## Langfristig / Post‑MVP (P3)
- [ ] Erweiterte Benachrichtigungen (Real‑Events, Templates, Opt‑In)
- [ ] Observability: erweiterte /stats (Laufzeit, Queue, Mail‑Erfolg), Log‑Konfiguration in README
- [ ] Sicherheits‑Hardening: Rate‑Limit selektiv auf weitere Endpunkte; Audit‑Trail

## Arbeitsweise / Hinweise
- Branch‑Strategie: `feature/<kurzer-name>` je Task; kleine, überprüfbare Commits.
- Vor jedem Merge: Lint/Typecheck/Tests grün; OpenAPI Lint warn‑only toleriert.
- Doku immer mitführen: README + CHANGELOG + ggf. OpenAPI.
- `.env.example` aktualisieren, wenn neue ENV hinzukommen.

