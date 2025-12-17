# Roadmap (nächste 1–2 Sprints)

Aktualisierung: Stand 2025‑10‑03
- Abwesenheiten‑Modul (Backend/Frontend) ausgeliefert: CRUD, RBAC, Konfliktwarnungen, Audit-Events, CSV/XLSX-Exports.
- Mitarbeiterprofil überarbeitet: Zeit-KPIs (7/30 Tage, YTD), Qualifikationen, Dokumente, Abwesenheiten, Self-Service-Telefon/Adresse.
- Auth-Flow stabilisiert: Refresh-Token beim Login, Interceptor mit Token-Persistenz & Countdown-basiertes Login-UI, Netzwerk-Fehler werden angezeigt.
- Systemdashboard `/system` zeigt `/api/stats` inklusive Notification-Queues, Audit-Trail, Eventloop-Delay und Feature-Flags.

## Roadmap – Heute (konsolidiert)

Hinweis: Dieser Abschnitt fasst die tagesaktuellen Ziele aus der ehemaligen Datei `docs/ROADMAP.md` zusammen. Quelle bleibt `docs/KONZEPT.pdf` (Roadmap/DoD maßgeblich).

### Aktuelle Schwerpunkte
- **Abwesenheiten Phase 2**  
  - Anhänge/Atteste & Kalender-Overlay finalisieren (`docs/planning/absences.md`).  
  - Benachrichtigungen für Genehmigung/Ablehnung (E-Mail/Push) vorbereiten.
- **Mitarbeiterprofil Phase 2**  
  - Dokument-Upload via S3/MinIO samt RBAC/Audit erweitern (`docs/planning/employee-profile.md`).  
  - Validierung, HR-Exports und ICS/Outlook-Anbindung abstimmen.
- **Release v1.3.0 Übergabe**  
  - CHANGELOG/Docs finalisieren, Tag und Docker-Images bereitstellen (`docs/releases/v1.3.0.md`).  
  - Patch v1.3.1 (Absence-Fix + Troubleshooting) veröffentlichen.
- **Monitoring & Alerts**  
  - Absence-/Login-Metriken in Grafana Panels heben, Thresholds für Refresh-Fehler & Queue-Dauer festziehen.
- **DX & Tests**  
  - Playwright-Szenarien (Absence-Flow/Profile) sowie vereinheitlichtes Auth-Refresh-Mocking ergänzen.

- Benutzerliste: Profil-Aufruf aus der Tabelle funktioniert wieder (Frontend `UsersList`) und zeigt Kontextkarten für Planung.
- Abwesenheiten: Backend-CRUD, RBAC (Self/Manager), Konfliktwarnungen, Audit-Events und Frontend-Liste inkl. Filter/Exports stehen.
- Profilansicht: Zeitkennzahlen (7/30 Tage, YTD), Qualifikationen & Dokumente sortiert, Abwesenheits-Preview und Self-Service für Kontaktfelder ausgeliefert.
- Auth-Flow: Login liefert Refresh-Token, Interceptor persistiert Tokens und behandelt Netzwerkausfälle sowie 401/429 ohne Hard-Reload.
- Systemdashboard: `/system` konsumiert `/api/stats` (Queues, Notifications, Audit, Eventloop) und ersetzt schnelle Grafana-Blicke.
- RBAC (Users): Detail- und Update-Routen abgesichert (ADMIN oder Self-Access); Self-Updates auf Basisfelder beschränkt.
- Validierung: 422-Fehler enthalten `code: VALIDATION_ERROR` (Middleware + Tests angepasst).
- OpenAPI: Push-API dokumentiert (`/push/tokens`, `/push/tokens/{token}`, `/push/users/{userId}/opt`) + zusätzlicher Server `http://localhost:3001/api/v1`.
- Auth: Login-Limiter nutzt Default 5/15min bei fehlender ENV; ENV-Overrides dokumentiert/Compose angepasst.
- Observability: Login-Limiter exportiert Prometheus-Counter (Hits/Blocked) & FE zeigt 429-Countdown.
- Doku: README Listen-Parameter vereinheitlicht (`page/pageSize/sortBy/sortDir/filter[...]`).
- Tests/Build lokal: Typecheck/Build grün; einige Jest-Suites benötigen Prisma-Generate/Mocks (CI deckt regulär ab).
- DX: Swagger UI (nur Dev) unter `/api-docs` verfügbar.
- Observability: `/api/stats` erweitert (Features/Notifications/Auth/System/Env) und dokumentiert (README + OpenAPI).
- Observability: `/api/stats` liefert Laufzeit/Event-Loop/Queue & Success-Rates; README Logging-Runbook ergänzt (2025-09-15).
- Observability: Alertmanager (Slack/Webhook) im Monitoring-Compose, Audit-Trail-Dashboard provisioniert & Runbooks in README/MONITORING aktualisiert (2025-09-20).
- Monitoring/Ops: README & MONITORING.md um Betriebs-Checkliste (Ports, Reload-Skripte, Alert-Routing) ergänzt; Audit-Alerts dokumentiert (2025-09-22).
- Monitoring/Ops: Audit-Warnungen werden in den dedizierten Ops-Slack-Kanal geroutet (AuditLogQueue/Direct/Flush/Prune); README & MONITORING.md dokumentieren Slack-Audit-Channel (`ALERTMANAGER_SLACK_AUDIT_CHANNEL`) und Routing (2025-09-22).
- Ops/Compose: Docker-Stacks nutzen `/readyz` für Healthchecks, führen `prisma migrate deploy` vor dem Start aus und triggern Dev-Seeds über `SEED_ON_START` (Default true, abschaltbar).

### Neu seit v1.2.0 (Absences & Profil)
- Backend: `Absence`-Modell inkl. Indizes, RBAC-Gates, Konfliktprüfung gegen `shiftAssignment`, Audit-Events für Create/Approve/Reject/Cancel.
- API: `/api/absences` Liste/Detail/Approve/Reject/Cancel, Query-Filter (`status`, `type`, `from`, `to`, `userId`), CSV/XLSX-Exports.
- Frontend: Absence-Liste mit Filter/Sort, konfliktbezogene Warnungen, Antragsdialoge (Self & Manager), Profil-Karten mit Abwesenheiten & Zeitkennzahlen.
- Auth & DX: Login-Countdown bei 429, Netzwerk-Fehlermeldungen, Refresh-Automatik, Port-Autodetektion für 5173/4173.

### Neu seit v1.1.1 (Health/Readiness)
- Liveness/Readiness: `/healthz`, `/readyz` (mit `deps.db`, `deps.smtp`).
- Security: `helmet()` aktiv; CORS per Allowlist (`CORS_ORIGINS`).
- Auth Rate-Limits: IP‑basiert + pro User/Email; optional Redis‑Store (`REDIS_URL`).
- OpenAPI: interne Endpunkte als `x-internal: true`, operationId‑Konvention vereinheitlicht, Beispiele korrigiert.
- CI: Health‑Smoke‑Job (baut, startet, prüft `/healthz`/`/readyz`).

### Einsatzplanung & Staffing – Überblick

| Fokus | Ziel | Status | Nächster Schritt |
| --- | --- | --- | --- |
| Abwesenheiten Phase 2 | Dokument-/Attest-Uploads & Kalender-Overlay | Offen | Speicher (S3/MinIO) evaluieren, UI-Flows skizzieren |
| Benachrichtigungen | E-Mail/Push bei Entscheidungen | Offen | Templates + Tests ergänzen |
| Mitarbeiterprofil | Dokument-Upload & HR-Exports | Offen | RBAC/Audit anpassen, Exportformate abstimmen |
| Qualitätssicherung | Playwright + Vitest (Auth/Conflicts) | Geplant | Szenarien/Mocks konsolidieren |
| API-Tests | Abwesenheits-Konflikte & Audit | Geplant | Contract/Integration vorbereiten |
| Observability | Grafana-Panels & Alerts | Geplant | Schwellen definieren, Dashboards versionieren |

### Nächste Schritte (Kurz-Backlog)

#### 🚨 DSGVO-Kritisch (Hohe Priorität)
- [x] **HTTPS mit Let's Encrypt einrichten**
  - Status: Integriert via Traefik Reverse Proxy im Docker-Stack
  - Zertifikate: Automatisch verwaltet durch Traefik (ACME)
  - Anleitung: `/docs/ops/setup-https-letsencrypt.md`
  - Konfiguration: Über `.env` (DOMAIN, ACME_EMAIL)
- [ ] **AVV mit Hosting-Provider abschließen**
  - Provider: IP-Projects GmbH & Co. KG (hosterapi.de)
  - Kontakt aufnehmen und AVV-Vertrag anfordern
  - Siehe: `/docs/ops/dsgvo-compliance.md` Abschnitt 1
- [ ] **Löschkonzept implementieren**
  - Automatische Löschung inaktiver User nach 6 Monaten
  - Cronjob/Scheduled Task einrichten

#### Weitere Backlog-Items
- [ ] Abwesenheiten Phase 2: Dokument-/Attest-Uploads & Kalender-Overlay (Konfliktvisualisierung) umsetzen.
- [ ] Benachrichtigungen: E-Mail/Push für `approve/reject/cancel` triggern, Templates & Tests ergänzen.
- [ ] Profil-Uploads: Storage (S3/MinIO) für Dokumente anbinden, RBAC & Audit erweitern.
- [ ] Tests: Playwright-Szenarien für Absence-Flow & Profil-Bearbeitung, Vitest für Auth-Refresh & Konflikt-Helper.
- [ ] API-Tests: Integrationstests für Abwesenheitskonflikte, Statuswechsel & Audit-Events.
- [ ] Observability: Grafana-Panels für Absence-Queues/Login-Errors, Alerts auf Refresh-Failrate & Queue-Delay.

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
