# Roadmap (nächste 1–2 Sprints)

Ziel: Konkrete, messbare Aufgaben mit klaren Akzeptanzkriterien (Given/When/Then).

## Sprint 1

### 1) RBAC hart durchziehen (API + UI)
- Admin/Manager: Notifications testen, User verwalten
- Mitarbeiter: nur eigene Shifts + Clock-in/out
- UI blendet nicht erlaubte Aktionen/Navigation aus; API verweigert verbotene Aktionen (403)

Akzeptanz (Given/When/Then)
- Given ein EMPLOYEE‑Benutzer ist eingeloggt
  - When er `/users` oder „Benutzer“ aufruft
  - Then zeigt das UI eine 403‑Karte und die API antwortet mit 403 ohne Refresh‑Versuch
- Given ein EMPLOYEE‑Benutzer ist eingeloggt
  - When er `/shifts` öffnet
  - Then listet die API ausschließlich eigene Schichten (`filter[userId]=me`) und der Export berücksichtigt diesen Filter
- Given ein ADMIN/MANAGER ist eingeloggt
  - When „Test Notification“ ausgelöst wird
  - Then sendet API 200 und UI zeigt Erfolg‑Toast

### 2) Users CRUD + Suche/Pagination (10k+)
- Serverseitige Filter/Sort (Query‑Params), Pagination, Debounce (300ms)
- CRUD: Create/Update/Delete mit client‑/serverseitiger Validierung

Akzeptanz (Given/When/Then)
- Given 10k+ User (Seed/Fixture)
  - When Suchen nach `email`/`firstName` mit 300ms Debounce
  - Then bleibt die TTI < 300ms pro Page‑Wechsel und API‑Antwort < 800ms (95. Perzentil)
- Given ADMIN ist eingeloggt
  - When neuer User angelegt und anschließend gefiltert wird
  - Then erscheint der User in Seite 1 entsprechend Filter/Sort, CRUD‑Aktionen liefern 2xx/4xx konsistent

### 3) Sites & Shifts – E2E Use‑Case
- „Schicht anlegen → zuweisen → clock‑in/out → CSV Export“
- End‑to‑End klickbar (UI) und API‑Flows konsistent

Akzeptanz (Given/When/Then)
- Given ADMIN legt eine Schicht an und weist EMPLOYEE zu
  - When EMPLOYEE clock‑in/out ausführt
  - Then wird CSV‑Export generiert (Streaming), Datei enthält neue Buchung

## Sprint 2

### 4) Incident‑Notifications (Feature‑Flag)
- Flag: E‑Mail/Webhook; DEV: Fake Transport/Preview
- Button „Test Notification“ je Incident

Akzeptanz (Given/When/Then)
- Given Flag `EMAIL_NOTIFY_INCIDENTS=true` (oder Webhook)
  - When „Test Notification“ auf Incident klick
  - Then UI zeigt Erfolg, Logs enthalten Versand‑Eintrag; DEV zeigt Preview (ohne realen Versand)

### 5) Telemetry‑Härtung
- Grafana‑Dashboards versionieren (Repo) + SLO‑Panels (p95, 5xx‑Rate)
- PromQL‑Snippets dokumentieren

Akzeptanz (Given/When/Then)
- Given Monitoring‑Profil ist aktiv
  - When Dashboard „Latency & Errors“ geöffnet wird
  - Then p95‑Panel, 5xx‑Rate und Top‑Routes sichtbar; README/Monitoring verweist auf Panels und PromQL

### 6) E2E Smoke (Playwright)
- Szenarien: Login, Users‑Tabelle (Pagination/Sort/Filter), Incidents‑View
- Headless Run in CI

Akzeptanz (Given/When/Then)
- Given CI‑Run auf PR nach main
  - When E2E‑Workflow startet
  - Then alle Smoke‑Szenarien laufen grün (headless), Artefakte (Logs/Traces) werden hochgeladen

## Definition of Done (generisch)
- Tests: Unit/Integration (API), E2E (Playwright) grün; Lint/Contract‑Tests grün
- Docs aktualisiert (README/ARCHITECTURE/RBAC/GETTING_STARTED/TROUBLESHOOTING)
- RBAC/Fehlerfälle: 401 → einmaliger Refresh; 403 → kein Refresh, UI‑Hinweis
- Performance: Server‑Pagination, Debounce, Streaming‑Exporte, keine UI‑Freezes
