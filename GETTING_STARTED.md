# Getting Started (Dev)

Schneller Einstieg für lokale/remote Entwicklung mit Docker Compose und Vite.

## 1) Voraussetzungen
- Docker + Docker Compose
- Optional: Node.js 22+ (für reinen FE/BE‑Dev ohne Compose)

## 2) Dev‑Stack starten
```bash
docker compose -f docker-compose.dev.yml up
```
- Frontend: `http://<SERVER_IP>:5173`
- API: `http://<SERVER_IP>:3000`

## 3) Seeds (Demo‑Daten)
```bash
docker compose -f docker-compose.dev.yml exec api sh -lc 'npm run -s seed'
```
Logins:
- admin@sicherheitsdienst.de / password123
- dispatcher@… / thomas.mueller@… / anna.schmidt@… / michael.wagner@… (alle password123)

## 4) ENV (kurz)
- Backend: `PORT`, `DATABASE_URL` (optional), `JWT_SECRET`, `REFRESH_SECRET`, `RATE_LIMIT_*`, `RATE_LIMIT_SKIP_PATHS`
- Frontend: `VITE_API_BASE_URL`, `VITE_HMR_HOST_SERVER_IP`, `VITE_HMR_CLIENT_PORT=5173`

## 5) Remote‑Vite & CORS
- SSH‑Tunnel/Dev: `VITE_API_BASE_URL=http://localhost:3000`, CORS_ORIGIN enthält `http://localhost:5173`
- Server‑IP: `VITE_API_BASE_URL=http://<SERVER_IP>:3000`, CORS_ORIGIN enthält `http://<SERVER_IP>:5173`

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
