# Ops Go/No-Go Runbook (Cut)

## Pre-Deploy Checklist
- **ENV/Secrets gesetzt:** `JWT_SECRET`, `REFRESH_SECRET`, `DATABASE_URL`, `POSTGRES_*`, `ACME_EMAIL`, `DOMAIN`.
- **Trusted Proxies:** `TRUSTED_PROXIES` gesetzt (Traefik/Docker-Netz).
- **Ports:** 80/443 offen für Traefik, DB nicht öffentlich.
- **Compose-Stacks:** Prod `docker-compose.yml` ohne Mailhog; Dev optional mit Mailhog.
- **HTTPS:** Zertifikat gültig oder Open Point dokumentiert.
- **Smoke-Test:** `scripts/smoke.sh` (Health/Ready/Auth).
- **Migrationen:** Vor Deploy einmalig ausführen: `docker compose run --rm api npx prisma migrate deploy`.

## Backup/Restore Minimum
- Backup-Skript: `docs/ops/backup.sh` ausgeführt.
- Restore-Test (Stichprobe): Backup in Test-DB eingespielt, `/readyz` ok.
- Dokumentenspeicher geprüft (Mount, Berechtigungen, Checksums).

## Monitoring/Alerts Minimum
- `/system` und `/readyz` erreichbar.
- Prometheus/Grafana optional, aber mindestens Logs sichtbar.
- Alertmanager Receiver konfiguriert (oder Open Point dokumentiert).

## Verhalten bei DB-Ausfall
- Audit-Logging ist asynchron: Queue + Backoff/Drop, keine Crash-Spirale.
- API bleibt funktionsfähig für nicht-DB-abhängige Endpunkte (`/health`).
- Fehler werden gedrosselt geloggt (kein Spam).

## Rollback (Kurz)
1. `docker compose down`
2. Vorheriges Image/Tag zurücksetzen (z. B. `docker compose pull` auf altes Tag).
3. `docker compose up -d`
4. `/readyz` prüfen

## Open Points
- Monitoring-Receiver (Slack/Email) je Umgebung.
- Automatisierter Restore-Test für DB + Dokumentenspeicher.
