# Getting Started (Dev)

Schneller Einstieg für lokale/remote Entwicklung mit Docker Compose und Vite.

Siehe auch: `docs/API_CHEATSHEET.md` für eine kompakte Befehls‑Übersicht (Bash/cURL, HTTPie und PowerShell‑Hinweise).

## 1) Voraussetzungen
- Docker + Docker Compose
- Optional: Node.js 22+ (für reinen FE/BE‑Dev ohne Compose)

## 2) Dev‑Stack starten
```bash
# Lokal
docker compose -f docker-compose.dev.yml up

# Remote/Server (Clients greifen extern zu)
# entweder `.env` im Repo-Root mit `PUBLIC_HOST=<SERVER_IP>` anlegen (Compose lädt automatisch)
# oder beim Start setzen:
PUBLIC_HOST=<SERVER_IP> docker compose -f docker-compose.dev.yml up
```
- Hinweis: Eine Beispiel‑ENV liegt als `.env.example` im Repo‑Root (inkl. `PUBLIC_HOST` und Alertmanager‑Variablen für das Monitoring‑Compose). Für das reine Dev‑Compose reicht i. d. R. `PUBLIC_HOST`.
- Frontend: `http://<SERVER_IP>:5173`
- API: `http://<SERVER_IP>:3000`
- Der API-Container führt vor dem Start automatisch `npx prisma migrate deploy` aus. Bei Fehlern stoppt der Start.
- Seeds laufen im Dev-Stack automatisch, solange `SEED_ON_START=true` gesetzt ist (Default in `docker-compose.dev.yml`).

## 3) Seeds (Demo‑Daten)
- Automatisch (Default): Der Startbefehl führt nach erfolgreichen Migrationen `npm run seed` aus.
- Manuell (falls `SEED_ON_START=false` oder erneuter Seed benötigt wird)
```bash
docker compose -f docker-compose.dev.yml exec api sh -lc 'npm run -s seed'
```
Logins:
- admin@sicherheitsdienst.de / password123
- dispatcher@… / thomas.mueller@… / anna.schmidt@… / michael.wagner@… (alle password123)

## 4) ENV (kurz)
- Backend: `PORT`, `DATABASE_URL` (optional), `JWT_SECRET`, `REFRESH_SECRET`, `RATE_LIMIT_*`, `LOGIN_RATE_LIMIT_MAX/_WINDOW_MS`, `RATE_LIMIT_SKIP_PATHS` (`PUBLIC_HOST` setzt `CORS_ORIGIN` im Compose)
- Frontend: `VITE_API_BASE_URL`, `VITE_HMR_HOST_SERVER_IP`, `VITE_HMR_CLIENT_PORT=5173`
- Root/Monitoring: `.env` im Repo‑Root (optional) liefert `ALERTMANAGER_*` Variablen für das separate Monitoring‑Compose (`monitoring/docker-compose.monitoring.yml`).

## 5) Remote‑Vite & CORS
- SSH-Tunnel/Dev: `VITE_API_BASE_URL=http://localhost:3000`, CORS_ORIGIN enthält `http://localhost:5173`
- Server-IP: `VITE_API_BASE_URL=http://<SERVER_IP>:3000`, CORS_ORIGIN enthält `http://<SERVER_IP>:5173` (Compose übernimmt dies via `PUBLIC_HOST`)

## 6) Erste Schritte
- System: `/system` (Stats, Build SHA)
- Benutzer/Sites/Schichten/Vorfälle: Navigiere per Sidebar

## 7) Readiness/Health
- `GET /healthz` → ok
- `GET /readyz` → prüft DB/SMTP (Dev: DB optional)

## 8) Users API – Beispiele (cURL)
Hinweis: Ersetze `<TOKEN>` durch einen gültigen Bearer‑Token (z. B. via `POST /api/auth/login`).

Liste (Defaults: page=1, pageSize=25, sortBy=firstName, sortDir=asc)
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users' \
  -H 'Authorization: Bearer <TOKEN>'
```

Suche + Filter + Sort
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?query=anna&role=EMPLOYEE&isActive=true&sortBy=lastName&sortDir=asc&page=1&pageSize=25' \
  -H 'Authorization: Bearer <TOKEN>'
```

Alias `pagesize` statt `pageSize`
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?pagesize=50' \
  -H 'Authorization: Bearer <TOKEN>'
```

Export (CSV) – nutzt dieselben Filter, ohne Pagination
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?role=DISPATCHER' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Accept: text/csv' \
  -o users.csv
```

Export (XLSX)
```bash
curl -sS 'http://<SERVER_IP>:3000/api/users?isActive=true' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' \
  -o users.xlsx
```

Access‑Token via Login holen
```bash
# Access‑Token aus Login‑Response extrahieren (jq empfohlen)
TOKEN=$(curl -sS 'http://<SERVER_IP>:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq -r '.accessToken')

echo "Token: ${TOKEN:0:12}..."
```

Refresh‑Token nutzen
```bash
# Optional: Refresh‑Token aus Login mit auslesen und neuen Access‑Token holen
REFRESH=$(curl -sS 'http://<SERVER_IP>:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq -r '.refreshToken')

NEW_ACCESS=$(curl -sS 'http://<SERVER_IP>:3000/api/auth/refresh' \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq -r '.accessToken')
echo "Neuer Access: ${NEW_ACCESS:0:12}..."
```

Mini‑Skript: Login → geschützte Route
```bash
# 1) Login und Token speichern
TOKEN=$(curl -sS 'http://<SERVER_IP>:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq -r '.accessToken')

# 2) Geschützte Route abrufen (z. B. Users‑Liste)
curl -sS 'http://<SERVER_IP>:3000/api/users?page=1&pageSize=5' \
  -H "Authorization: Bearer $TOKEN" | jq
```

Fehlerbeispiele (400/422)

400 Domain‑Fehler (unbekanntes sortBy)
```bash
curl -i 'http://<SERVER_IP>:3000/api/users?sortBy=doesNotExist' \
  -H "Authorization: Bearer $TOKEN"
# Erwartet: HTTP/1.1 400 Bad Request
# Body enthält Hinweis auf erlaubte sortBy‑Felder
```

422 Typfehler (ungültiges page)
```bash
curl -i 'http://<SERVER_IP>:3000/api/users?page=abc' \
  -H "Authorization: Bearer $TOKEN"
# Erwartet: HTTP/1.1 422 Unprocessable Entity
# Body: code: VALIDATION_ERROR (Zod)
```

## 9) Sites API – Beispiele (cURL)
Liste mit Sort/Filter
```bash
curl -sS 'http://<SERVER_IP>:3000/api/sites?page=1&pageSize=25&sortBy=name&sortDir=asc&filter[city]=Muster' \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination,.data[0]'
```

CSV/XLSX‑Export (gefiltert, ohne Pagination)
```bash
curl -sS 'http://<SERVER_IP>:3000/api/sites?filter[postalCode]=12345' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: text/csv' -o sites.csv

curl -sS 'http://<SERVER_IP>:3000/api/sites?filter[city]=Musterstadt' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -o sites.xlsx
```

Fehlerbeispiele
```bash
# 400: unbekanntes sortBy
curl -i 'http://<SERVER_IP>:3000/api/sites?sortBy=doesNotExist' -H "Authorization: Bearer $TOKEN"

# 422: ungültige page
curl -i 'http://<SERVER_IP>:3000/api/sites?page=abc' -H "Authorization: Bearer $TOKEN"
```

## 10) Site‑Schichten – Beispiele (cURL)
Liste Schichten einer Site
```bash
SITE_ID=<id>
curl -sS "http://<SERVER_IP>:3000/api/sites/$SITE_ID/shifts" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'
```

CSV/XLSX‑Export für Site‑Schichten
```bash
curl -sS "http://<SERVER_IP>:3000/api/sites/$SITE_ID/shifts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: text/csv' -o site_${SITE_ID}_shifts.csv

curl -sS "http://<SERVER_IP>:3000/api/sites/$SITE_ID/shifts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -o site_${SITE_ID}_shifts.xlsx
```

## 11) Shifts API – Beispiele (cURL)
Liste mit Filter/Sort
```bash
curl -sS 'http://<SERVER_IP>:3000/api/shifts?page=1&pageSize=25&sortBy=startTime&sortDir=desc&filter[title]=Nacht' \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination,.data[0]'
```

CSV/XLSX‑Export
```bash
curl -sS 'http://<SERVER_IP>:3000/api/shifts?page=1&pageSize=1' \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o shifts.csv

curl -sS 'http://<SERVER_IP>:3000/api/shifts?page=1&pageSize=1' \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -o shifts.xlsx
```

Clock‑In/Out (Zeitbuchung)
```bash
SHIFT_ID=<id>
curl -sS -X POST "http://<SERVER_IP>:3000/api/shifts/$SHIFT_ID/clock-in" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"at":"2025-09-01T08:00:00Z"}' | jq

curl -sS -X POST "http://<SERVER_IP>:3000/api/shifts/$SHIFT_ID/clock-out" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"at":"2025-09-01T16:00:00Z","breakTime":30}' | jq
```

Fehlerbeispiele
```bash
# 400: unbekanntes sortBy
curl -i 'http://<SERVER_IP>:3000/api/shifts?sortBy=invalid' -H "Authorization: Bearer $TOKEN"

# 422: Clock‑Out ohne required Feld
curl -i -X POST "http://<SERVER_IP>:3000/api/shifts/$SHIFT_ID/clock-out" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}' 
```

## 12) Incidents API – Beispiele (cURL)
Liste (alle Auth‑Benutzer)
```bash
curl -sS 'http://<SERVER_IP>:3000/api/incidents?page=1&pageSize=25' \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination,.data[0]'
```

Erstellen/Aktualisieren (ADMIN/MANAGER)
```bash
curl -sS -X POST 'http://<SERVER_IP>:3000/api/incidents' \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' \
  -d '{"title":"Test","description":"..."}' | jq '.id'

INC_ID=<id>
curl -sS -X PUT "http://<SERVER_IP>:3000/api/incidents/$INC_ID" \
  -H "Authorization: Bearer $TOKEN_MANAGER" -H 'Content-Type: application/json' \
  -d '{"title":"Update"}' | jq '.status'
```

RBAC Fehlerbeispiel (403)
```bash
curl -i -X POST 'http://<SERVER_IP>:3000/api/incidents' \
  -H "Authorization: Bearer $TOKEN_EMPLOYEE" -H 'Content-Type: application/json' -d '{"title":"X"}'
```

## 13) Events API – Beispiele (cURL)
Liste + Export
```bash
curl -sS 'http://<SERVER_IP>:3000/api/events?page=1&pageSize=25' \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination,.data[0]'

curl -sS 'http://<SERVER_IP>:3000/api/events?page=1&pageSize=1' \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: text/csv' -o events.csv
```

PDF für Event
```bash
EV_ID=<id>
curl -sS "http://<SERVER_IP>:3000/api/events/$EV_ID" \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: application/pdf' -o event_${EV_ID}.pdf
```

## 14) Notifications Test (RBAC)
```bash
# 401: anonym
curl -i -X POST 'http://<SERVER_IP>:3000/api/notifications/test'

# 403: EMPLOYEE
curl -i -X POST 'http://<SERVER_IP>:3000/api/notifications/test' -H "Authorization: Bearer $TOKEN_EMPLOYEE"

# 200: ADMIN/MANAGER
curl -i -X POST 'http://<SERVER_IP>:3000/api/notifications/test' -H "Authorization: Bearer $TOKEN_ADMIN"
```

## 15) Push Tokens
Meine Tokens
```bash
curl -sS 'http://<SERVER_IP>:3000/api/push/tokens' -H "Authorization: Bearer $TOKEN" | jq
```

Registrieren / Aktualisieren / Löschen
```bash
curl -sS -X POST 'http://<SERVER_IP>:3000/api/push/tokens' \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"token":"device-abc","platform":"web"}' | jq

curl -sS -X PUT 'http://<SERVER_IP>:3000/api/push/tokens/device-abc' \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"platform":"web"}' | jq

curl -i -X DELETE 'http://<SERVER_IP>:3000/api/push/tokens/device-abc' -H "Authorization: Bearer $TOKEN"
```

Admin: Push‑Opt‑In/Out
```bash
USER_ID=<id>
curl -sS -X PUT "http://<SERVER_IP>:3000/api/push/users/$USER_ID/opt" \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' \
  -d '{"pushOptIn":true}' | jq
```
