Deployment (Produktion)

Überblick
- Reverse Proxy: Caddy (Ports 80/443), dient auch als Static File Server fürs Frontend.
- Services: Postgres (db), API (Node.js), Web-Build (Vite), Caddy.
- Compose-Datei: docker-compose.prod.yml

Voraussetzungen
- Docker und Docker Compose Plugin installiert.
- DNS auf Server (A/AAAA-Records für app.example.com und api.example.com).
- .env.production (oder Umgebungsvariablen) gepflegt.

Schnellstart
1) .env.production anlegen (siehe .env.production.example) und Werte anpassen.
2) Domains im caddy/Caddyfile eintragen (email optional setzen) und IP per DNS aufschalten.
3) Stack bauen/starten:
   docker compose -f docker-compose.prod.yml up -d --build
4) Health prüfen:
   docker compose -f docker-compose.prod.yml ps
   curl -fsS http://localhost:3000/api/health

Ports/Firewall
- Extern offen: 80, 443 (Caddy). Intern: API/DB nur im Compose-Netz erreichbar.
- UFW-Empfehlung: allow 22,80,443; deny/close 3000,5173.

Backups
- Datenbank-Volume: db_data. Regelmäßige Dumps per Cron/Script empfohlen (pg_dump).

Systemd (optional)
- Unit erstellen, die docker compose up -d beim Boot startet, oder restart: unless-stopped nutzen.

Hinweise
- Postgres- und JWT-Secrets unbedingt ändern.
- Für HTTPS müssen Hostnames gesetzt sein; bei reiner IP wird HTTP bedient.

