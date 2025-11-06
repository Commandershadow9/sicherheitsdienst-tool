# Tickets – Notifications v1 + Observability 2 (09/2025)

Format: Priorität – Kurzbeschreibung – Dateien/Module – DoD – Schätzung

1) P0 – FCM-Integration produktiv
- Dateien: `backend/src/services/pushService.ts`, `.env.example`, `README.md` (Setup), ggf. `docs/openapi.yaml` Beispiele.
- DoD: FCM init robust; send success/failure Pfade mit Token-Deaktivierung; /stats counters push.* steigen korrekt; README Setup; Tests (unit+route mit Mocks).
- Aufwand: M

2) P0 – Contract-Tests nightly aktivieren
- Dateien: `.github/workflows/contract-tests.yml` (bereits vorhanden), neue `contract-tests-nightly.yml` (schedule), Docs-Hinweis.
- DoD: Nightly Workflow läuft green gegen compose‑Stack; Logs/Teardown aktiv; README/ROADMAP Hinweis.
- Aufwand: S

3) P1 – E-Mail-Templates (Basis)
- Dateien: `backend/src/services/emailService.ts` (Template-Anwendung), `backend/templates/email/*` (Text/HTML), Tests.
- DoD: Subjekt/Text aus Template mit Variablen; sendShiftChangedEmail nutzt Template; Tests decken Pfade ab.
- Aufwand: S

4) P1 – README: FCM Setup / Best Practices
- Dateien: `README.md`
- DoD: Abschnitt mit ENV, Credential-Handling (private key), Troubleshooting; Link zu /stats counters.
- Aufwand: S

5) P2 – Rate-Limits erweitern (optional)
- Dateien: `backend/src/middleware/rateLimit.ts`, betroffene Routen (Users/Sites POST/PUT)
- DoD: Konfigurierbar via ENV; 429 inkl. Header; Tests.
- Aufwand: S

