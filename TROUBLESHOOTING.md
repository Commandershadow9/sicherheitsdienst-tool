# Troubleshooting (Dev)

Kurz und lösungsorientiert.

1) 429 beim Login
- Ursache: Rate‑Limiter. Dev‑Stack ist großzügig, aber kann greifen.
- Lösung: `docker compose -f docker-compose.dev.yml restart api` und Browser hart neu laden.

2) 401 auf /api/users
- Ursache: FE verwendet nicht den zentralen Axios‑Client (kein Authorization Header).
- Lösung: Alle Aufrufe über `@/lib/api` (Axios). Keine `fetch`/eigene Axios‑Instanzen.

3) 403 (RBAC)
- Ursache: Rolle hat keine Berechtigung.
- Lösung: UI zeigt 403‑Karte. Kein Refresh, ggf. mit ADMIN/DISPATCHER testen.

4) CORS Fehler
- Ursache: falsche `VITE_API_BASE_URL`/Origin.
- Lösung: SSH‑Tunnel → `http://localhost:3000` + `CORS_ORIGIN=http://localhost:5173`; Server‑IP → `http://<SERVER_IP>:3000` + `CORS_ORIGIN=http://<SERVER_IP>:5173`.

5) HMR (Vite) lädt neu / verliert State
- Ursache: falscher HMR Host/Client-Port.
- Lösung: `VITE_HMR_HOST_SERVER_IP=<SERVER_IP>`, `VITE_HMR_CLIENT_PORT=5173` setzen.

6) Port‑Konflikte
- Lösung: Prüfe laufende Prozesse (3000/5173) und passe Ports in Compose/.env.

7) Prisma / DATABASE_URL fehlt
- Ursache: DB nicht gesetzt.
- Lösung: Dev‑Stack läuft weitgehend ohne DB; für Seeds/Migrationen `DATABASE_URL` setzen (Compose DB vorhanden).

8) Refresh schlägt fehl / Logout
- Ursache: Refresh‑Token ungültig.
- Lösung: Erneut einloggen. Interceptor räumt Tokens und leitet nach `/login`.

9) Full‑Reload bei Navigation
- Ursache: `<a href>` für interne Pfade.
- Lösung: `<Link>`/`navigate` aus `react-router-dom` nutzen.

10) Contract‑Tests (Dredd/Prism)
- Info: Workflow manuell/cron in CI. Bei Abweichungen OpenAPI vs. Implementierung prüfen.

