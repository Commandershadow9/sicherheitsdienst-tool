# Projektstatus – Stabiler Cut (Dez 2025)

## Reifegrad
- P0/P1-Sicherheits- und Stabilisierungsthemen erledigt (Mailhog nur Dev, Trusted Proxy/XFF, Magic-Bytes-Validierung für Uploads, Audit-Log asynchron mit Backoff).
- Test-Infra (Jest/ENV/Prisma-Mocks) bewusst offen → siehe `docs/product/TODO.md` (P1).
- Geeignet für: Self-Hosted / Pilotbetrieb mit kleiner Nutzerzahl, kein Massen-SaaS.

## Was stabil ist
- Docker Compose Trennung: Prod-Stack ohne Mailhog; Dev-Stack mit Mailhog optional.
- Reverse Proxy/Forwarded IPs: `TRUSTED_PROXIES` steuert, wann `X-Forwarded-For` vertraut wird.
- Uploads: Magic-Bytes-Validierung (Whitelist PDF/JPG/PNG); falscher Typ → 415.
- Audit-Logging: asynchrone Queue, Drop bei Volllast (1000), exponentieller Backoff (max 60 s), gedrosselte Fehlermeldungen.
- Health/Readiness: `/health`, `/readyz` mit optionalem SMTP-Check; Compose-Healthchecks aktiv.

## Bewusst offen / technische Schulden
- Test-Infra: fehlende ENV/Prisma-Mocks verursachen fehlschlagende Gesamtsuite; Tracking als P1 in `docs/product/TODO.md`.
- Prisma/Libssl Warnungen im Container-Log (OpenSSL-Erkennung) – funktional, aber unschön.
- Compose-Startkommando führt Prisma-Migration aus; bei abgeschaltetem DB-Service startet der API-Container neu.
- Monitoring/Alerting nur rudimentär (Prom/Grafana optional), keine produktiven Receiver konfiguriert.

## Release-Einfrierung
- Vorschlag Tag: `v1.0.0-cut` (Stabilitäts-Cut, kein Feature-Release).
- Notizen: Sicherheitsrelevante Fixes enthalten, Upload-Härtung, Audit-Log-Resilienz; bekannte Test-Infra-Lücke bleibt.

## Scope-Grenzen
- Kein Managed/SaaS-Betrieb vorgesehen (fehlende Mandantentrennung auf DB-Ebene, fehlende Skalierungs- und Operability-Garantien).
- Keine automatische Skalierung oder Hochverfügbarkeit; Einzel-Compose-Stack.
