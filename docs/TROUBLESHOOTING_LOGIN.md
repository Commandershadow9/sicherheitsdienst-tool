# Login-Problem Troubleshooting (v1.8.0)

## Problem
Login funktioniert nicht nach Implementierung des Intelligenten Replacement-Systems (v1.8.0)

## Symptome
- Fehlermeldung: "Server nicht erreichbar. Bitte Netzwerk prüfen oder Backend starten"
- Keine Konsolenausgaben im Browser
- Zeitweise: "invalide e-mail adresse"

## Root Cause Analysis

### Ursprüngliches Problem
Vor der v1.8.0-Implementierung lief das Backend lokal auf Port 3000. Nach den Änderungen:
1. Backend wurde in Docker verschoben (Port 3001)
2. Frontend-Container konnte Backend nicht erreichen
3. CORS-Konfiguration musste angepasst werden

## Aktuelle Konfiguration (Stand: 2025-10-05)

### Backend (Docker)
- **Container**: `sicherheitsdienst-api`
- **Port**: 3001 (exposed: 0.0.0.0:3001)
- **Netzwerk**: `sicherheitsdienst-network`
- **DATABASE_URL**: `postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public`
- **CORS_ORIGIN**: `http://37.114.53.56:5173`
- **Status**: Healthy ✅

### Frontend (Docker)
- **Container**: `project-web-1`
- **Port**: 5173 (exposed: 0.0.0.0:5173)
- **Mount**: `/home/cmdshadow/project/frontend -> /web`
- **VITE_API_BASE_URL**: `http://37.114.53.56:3001`

### Wichtige Dateien

#### `/home/cmdshadow/project/.env` (Root)
```bash
PUBLIC_HOST=localhost
JWT_SECRET=prod-jwt-secret-change-me-2025
REFRESH_SECRET=prod-refresh-secret-change-me-2025
JWT_EXPIRES_IN=7d
REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://37.114.53.56:5173
DATABASE_URL=postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public
SEED_ON_START=true
```

#### `/home/cmdshadow/project/frontend/.env`
```bash
VITE_API_BASE_URL=http://37.114.53.56:3001
VITE_HMR_HOST_SERVER_IP=37.114.53.56
VITE_HMR_CLIENT_PORT=5173
```

#### `/home/cmdshadow/project/backend/.env`
```bash
# DATABASE_URL wird aus Root-.env geladen (für Docker)
# Für lokale Entwicklung: export DATABASE_URL=...
# DATABASE_URL=postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public

CORS_ORIGIN=http://37.114.53.56:5173
PORT=3000  # Wird von Docker überschrieben (3001)
```

## Durchgeführte Fixes

### 1. Backend-Server auf 0.0.0.0 gebunden
**Problem**: Backend hörte nur auf localhost, nicht von außen erreichbar
```typescript
// src/server.ts
const PORT = parseInt(process.env.PORT || '3001', 10);
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`📡 Server running on port ${PORT} (listening on all interfaces)`);
});
```

### 2. Backend in Docker verschoben
**Problem**: Lokales Backend konnte DB nicht erreichen
```bash
# Alte Shells gestoppt
docker compose build api
docker compose up -d api
```

### 3. CORS-Konfiguration aktualisiert
**Problem**: Externe IP wurde blockiert
- Root `.env`: `CORS_ORIGIN=http://37.114.53.56:5173`
- Backend `.env`: `CORS_ORIGIN=http://37.114.53.56:5173`

### 4. Frontend API-URL aktualisiert
**Problem**: Frontend zeigte auf Port 3000 statt 3001
```bash
# frontend/.env
VITE_API_BASE_URL=http://37.114.53.56:3001
```

### 5. Frontend-Container neu gestartet
```bash
docker restart project-web-1
```

## Diagnose-Kommandos

### Backend-Status prüfen
```bash
docker ps --filter "name=sicherheitsdienst-api" --format "table {{.Names}}\t{{.Status}}"
docker logs --tail 50 sicherheitsdienst-api
curl -s http://127.0.0.1:3001/health
```

### CORS-Header prüfen
```bash
curl -v http://127.0.0.1:3001/api/auth/login \
  -H "Origin: http://37.114.53.56:5173" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' \
  2>&1 | grep "Access-Control"
```

### Frontend-Konfiguration prüfen
```bash
docker exec project-web-1 cat /web/.env
docker exec project-web-1 grep -r "VITE_API_BASE_URL" /web/src/lib/api.ts
```

### Login-Test vom Server
```bash
curl -i http://37.114.53.56:3001/api/auth/login \
  -H "Origin: http://37.114.53.56:5173" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}'
```

## Erwartete Antwort (Login funktioniert)
```json
{
  "success": true,
  "message": "Login erfolgreich",
  "token": "eyJhbG...",
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "cmgcs91vl0000m0wqpusr1hx6",
    "email": "admin@sicherheitsdienst.de",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "ADMIN"
  }
}
```

## Aktuelles Problem (ungelöst)

### Symptome
- Login funktioniert vom Server (curl) ✅
- Login funktioniert NICHT im Browser ❌
- Keine JavaScript-Konsolenausgaben
- Fehlermeldung: "Server nicht erreichbar"

### Mögliche Ursachen

#### 1. Vite .env wird nicht geladen
**Problem**: Vite bettet Umgebungsvariablen beim Build ein, nicht zur Laufzeit.

**Test**:
```bash
# Frontend neu bauen
docker exec project-web-1 sh -c 'rm -rf node_modules/.vite && npm run dev'
```

**Oder**: Frontend-Container komplett neu bauen
```bash
docker compose build web --no-cache
docker compose up -d web
```

#### 2. Browser-Cache
**Lösung**:
- Chrome/Edge: F12 → Network-Tab → "Disable cache" aktivieren
- Inkognito-Modus: Strg+Shift+N
- Cache leeren: Strg+Shift+Entf

#### 3. API-URL wird falsch geladen
**Test**: Browser-Konsole öffnen und prüfen:
```javascript
// In Browser-Konsole eingeben:
localStorage
sessionStorage
// Prüfen, ob alte API-URLs gespeichert sind
```

#### 4. Frontend-Code verwendet falsche API-URL
**Prüfen**:
```bash
docker exec project-web-1 cat /web/src/lib/api.ts | grep -A 5 "API_BASE_URL"
```

## Nächste Schritte

### Schritt 1: Frontend komplett neu starten
```bash
# Frontend-Container stoppen
docker stop project-web-1

# Vite-Cache löschen
rm -rf /home/cmdshadow/project/frontend/node_modules/.vite
rm -rf /home/cmdshadow/project/frontend/dist

# Container neu starten
docker start project-web-1

# Logs prüfen
docker logs -f project-web-1
```

### Schritt 2: Browser-Diagnose
1. Browser-Konsole öffnen (F12)
2. Network-Tab öffnen
3. Login versuchen
4. Prüfen:
   - Welche URL wird aufgerufen? (sollte `http://37.114.53.56:3001/api/auth/login` sein)
   - Status-Code?
   - Request Headers (besonders Origin)?
   - Response Headers (besonders Access-Control-Allow-Origin)?

### Schritt 3: API-URL im Frontend überprüfen
```bash
# JavaScript-Bundle prüfen, ob richtige API-URL verwendet wird
docker exec project-web-1 sh -c 'grep -r "3001" /web/dist 2>/dev/null || echo "Kein dist-Verzeichnis"'
```

## Test-Credentials
- **Email**: admin@sicherheitsdienst.de
- **Passwort**: password123

## Services neu starten (kompletter Reset)

```bash
# Alle Container stoppen
docker compose down

# Caches löschen
rm -rf /home/cmdshadow/project/frontend/node_modules/.vite
rm -rf /home/cmdshadow/project/frontend/dist

# Services neu starten
docker compose up -d

# Status prüfen
docker ps
docker logs sicherheitsdienst-api --tail 20
docker logs project-web-1 --tail 20

# Login testen
curl -s http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq
```

## Erfolgreiche Konfiguration (Referenz)

Wenn alles funktioniert:

1. **Backend-Container**: Healthy, antwortet auf Port 3001
2. **Frontend-Container**: Läuft, Vite auf Port 5173
3. **CORS-Header**: `Access-Control-Allow-Origin: http://37.114.53.56:5173`
4. **Login-Request**: POST http://37.114.53.56:3001/api/auth/login
5. **Response**: 200 OK mit Token

## Kontakt & Support
- Logs: `docker logs sicherheitsdienst-api -f`
- Health-Check: http://37.114.53.56:3001/health
- Frontend: http://37.114.53.56:5173
