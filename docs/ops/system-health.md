# System Health Endpoints

## Liveness – `GET /healthz`

Response 200

```json
{ "status": "ok" }
```

## Readiness – `GET /readyz`

Erkenntnis:

- Pflichtabhängigkeit: Datenbank (Prisma `$queryRaw` Ping).
- Optionale Abhängigkeit: SMTP (nur Signal; kein aktiver Verify standardmäßig).

Responses

200 – bereit

```json
{ "status": "ready", "deps": { "db": "ok", "smtp": "skip" } }
```

503 – nicht bereit (DB)

```json
{ "status": "not-ready", "deps": { "db": "fail", "smtp": "skip" } }
```

## ENV-Flags

- `READINESS_CHECK_SMTP` (default `false`): aktiviert optionalen SMTP‑Verify (timeout‑sicher).
- `READINESS_SMTP_TIMEOUT_MS` (default `1500`): Timeout für den SMTP‑Verify.

## Probes

- Docker Compose HEALTHCHECK Beispiel siehe README.
- Kubernetes Probes (Liveness/Readiness) siehe README.

