# Next Steps nach dem Cut

## Empfohlene nächste Schritte
- Test-Infra stabilisieren: ENV/Migrations/Prisma im Test-Modus mocken, damit `npm test` ohne echte DB/Secrets läuft (siehe P1 in `docs/TODO.md`).
- Prisma/OpenSSL-Warnungen bereinigen (Image-Abhängigkeiten prüfen oder Prisma-Version aktualisieren).
- Compose-Startverhalten prüfen: API soll bei temporär nicht erreichbarer DB nicht neugestartet werden (Migration ggf. in eigenes Kommando auslagern).
- Monitoring/Alerting finalisieren: Receiver konfigurieren, Basis-Dashboards prüfen.

## Bitte nicht „mal eben“ anfassen
- Audit-Logging-Pipeline (Queue/Backoff/Drop-Strategie): Änderungen nur mit Test-Plan, sonst Risiko von Request-Blockaden.
- Auth-/Security-Konfiguration (Trusted Proxies, CORS, ENV-Validation): Stabil lassen, Änderungen abgestimmt planen.
- DB-Schema/Migrations: Keine ad-hoc-Anpassungen ohne vollständigen Lauf in Dev/Stage.
