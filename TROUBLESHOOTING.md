# Troubleshooting (Dev)

Kurz und lösungsorientiert.

1) 429 beim Login
- Ursache: Rate‑Limiter. Dev‑Stack ist großzügig, aber kann greifen.
- Lösung: Fenster von `LOGIN_RATE_LIMIT_WINDOW_MS` (Default 15 Min) abwarten – der Limiter setzt sich automatisch zurück. Bei Bedarf ENV-Werte justieren oder `docker compose -f docker-compose.dev.yml restart api`. Das Frontend blockiert Wiederholungen bis `Retry-After`, zeigt Countdown & Hinweis – Wartezeit respektieren, kein Hard-Reload nötig.

2) 401 auf /api/users
- Ursache: FE verwendet nicht den zentralen Axios‑Client (kein Authorization Header).
- Lösung: Alle Aufrufe über `@/lib/api` (Axios). Keine `fetch`/eigene Axios‑Instanzen.

3) 403 (RBAC)
- Ursache: Rolle hat keine Berechtigung.
- Lösung: UI zeigt 403‑Karte. Kein Refresh, ggf. mit ADMIN/DISPATCHER testen.

4) CORS Fehler
- Ursache: falsche `VITE_API_BASE_URL`/Origin.
- Lösung: SSH-Tunnel → `http://localhost:3000` + `CORS_ORIGIN=http://localhost:5173`; Server-IP → `http://<SERVER_IP>:3000` + `CORS_ORIGIN=http://<SERVER_IP>:5173` (Compose: `PUBLIC_HOST=<SERVER_IP>`).

5) API startet neu oder bricht sofort ab
- Ursache: `npx prisma migrate deploy` oder der optionale Seed schlägt fehl; der Startbefehl bricht mit Fehlercode ab.
- Lösung: `docker compose logs -f api` prüfen, Migration/Seed korrigieren. Falls Seeds nicht benötigt werden: `SEED_ON_START=false` setzen und Stack neu starten. Hinweis: Wenn Compose beim Start "`SEED_ON_START` variable is not set" meldet, `SEED_ON_START=true` im Root-`.env` ergänzen.

6) Frontend lädt endlos / API nicht erreichbar
- Ursache: `VITE_API_BASE_URL` zeigt auf `localhost`, wenn Compose ohne `PUBLIC_HOST` gestartet wurde.
- Lösung: Stack mit `PUBLIC_HOST=<SERVER_IP> docker compose -f docker-compose.dev.yml up` starten oder `.env` ergänzen.

7) HMR (Vite) lädt neu / verliert State
- Ursache: falscher HMR Host/Client-Port.
- Lösung: `VITE_HMR_HOST_SERVER_IP=<SERVER_IP>`, `VITE_HMR_CLIENT_PORT=5173` setzen.

8) Port-Konflikte
- Lösung: Prüfe laufende Prozesse (3000/5173) und passe Ports in Compose/.env.

9) Prisma / DATABASE_URL fehlt
- Ursache: DB nicht gesetzt.
- Lösung: Dev-Stack läuft weitgehend ohne DB; für Seeds/Migrationen `DATABASE_URL` setzen (Compose DB vorhanden).

10) Refresh schlägt fehl / Logout
- Ursache: Refresh-Token ungültig oder Backend nicht erreichbar.
- Lösung: Erneut einloggen. Interceptor räumt Tokens, leitet nach `/login` und zeigt „Server nicht erreichbar“, falls der API-Host down ist.

11) Full-Reload bei Navigation
- Ursache: `<a href>` für interne Pfade.
- Lösung: `<Link>`/`navigate` aus `react-router-dom` nutzen.

12) Contract-Tests (Dredd/Prism)
- Info: Workflow manuell/cron in CI. Bei Abweichungen OpenAPI vs. Implementierung prüfen.
