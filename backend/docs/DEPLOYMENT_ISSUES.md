# Deployment Issues & Lessons Learned

## Issue #1: Docker Build Cache Problem (07.10.2025)

### Problem
Beim Deployment von v1.9.2 wurden TypeScript-Änderungen **nicht** in den Docker-Container übernommen, obwohl:
- Source-Dateien korrekt geändert waren
- `docker compose build api` ausgeführt wurde
- Build erfolgreich war

### Root Cause
Docker Build Cache hat alte kompilierte Dateien verwendet, obwohl die Source-Dateien geändert waren. Dies passierte speziell bei:
- `src/routes/shiftRoutes.ts` (neue v2 Route)
- `src/controllers/dashboardController.ts` (leaveDaysSaldo)
- `src/controllers/absenceController.ts` (exportierte Funktionen)

### Symptome
1. Änderungen in `.ts` Dateien waren vorhanden
2. `npm run build` auf Host kompilierte korrekt
3. Docker Build zeigte "CACHED" für Build-Steps
4. Container enthielt **alte** kompilierte `.js` Dateien
5. API-Requests schlugen fehl mit 404 (Route nicht gefunden)

### Lösung
```bash
# 1. Clean Build OHNE Cache
cd /home/cmdshadow/project
docker compose build --no-cache api

# 2. Alternative: Manuell kompilieren und kopieren
cd backend
rm -rf dist
npx tsc -p tsconfig.json
docker cp dist/. sicherheitsdienst-api:/app/dist/
docker restart sicherheitsdienst-api
```

### Prevention für Zukunft
**IMMER bei Code-Änderungen:**
```bash
# Option A: Clean Build (empfohlen für kritische Änderungen)
docker compose build --no-cache api
docker restart sicherheitsdienst-api

# Option B: Rebuild mit Force
docker compose up -d --build --force-recreate api

# Option C: Dist löschen vor Build
rm -rf backend/dist
docker compose build api
```

### Verification Checklist
Nach jedem Deployment prüfen:
```bash
# 1. Route existiert im Container?
docker exec sicherheitsdienst-api cat /app/dist/routes/shiftRoutes.js | grep "replacement-candidates/v2"

# 2. Controller-Änderungen deployed?
docker exec sicherheitsdienst-api cat /app/dist/controllers/dashboardController.js | grep "leaveDaysSaldo"

# 3. API funktioniert?
curl -s http://127.0.0.1:3001/health
```

---

## Issue #2: Rate Limiting blockiert Testing (07.10.2025)

### Problem
Nach mehreren Login-Versuchen (während Tests) wurde die IP blockiert:
```
Rate-Limit erreicht.
```

### Root Cause
Redis speichert Rate-Limit-Counter persistent. Viele fehlgeschlagene Login-Versuche während Testing führen zu Sperre.

### Lösung
```bash
# Redis komplett flushen
docker exec sicherheitsdienst-redis redis-cli FLUSHALL
```

### Prevention
**Für Testing:**
- Rate-Limits in `.env.test` deaktivieren oder erhöhen
- Separate Redis-Datenbank für Tests verwenden
- Rate-Limit vor jedem Test-Run zurücksetzen

**Bessere Lösung (TODO):**
```env
# .env.development
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100  # Höher für Development

# .env.production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10  # Strenger für Production
```

---

## Issue #3: Multiple Test-Ebenen & Login-Daten (TODO: Klären!)

### Problem
Es scheint **mehrere Test-Setups** zu geben mit verschiedenen Login-Daten:

1. **Alte Testdaten** (vor v1.9.2):
   - Unbekannte Struktur
   - Login-Daten?

2. **Neue Testdaten** (seedTestScenarios.ts):
   - Email: `admin@sicherheitsdienst.de`
   - Password: `password123`
   - 12 Benutzer, 2 Sites, 3 REQUESTED Absences

3. **Production-ähnliche Daten**:
   - Unbekannt

### TODO
- [ ] **Alle Test-Seeds auflisten und dokumentieren**
- [ ] **Standard-Login-Daten festlegen**
- [ ] **Test-Datenbank vs Production-Datenbank klarstellen**
- [ ] **Seed-Skripte konsolidieren**

### Empfehlung
**Einheitliches Test-Setup erstellen:**
```bash
# Development Reset
npm run db:reset
npm run seed:dev

# Test Reset
npm run db:reset:test
npm run seed:test
```

---

## Best Practices für Deployment

### 1. Pre-Deployment Checklist
- [ ] TypeScript kompiliert ohne Fehler: `npx tsc --noEmit`
- [ ] Tests laufen durch: `npm test`
- [ ] Migrations sind aktuell: `npx prisma migrate status`
- [ ] ENV-Variablen sind gesetzt

### 2. Deployment Process
```bash
# 1. Backend
cd backend
rm -rf dist  # Clean slate!
npx tsc -p tsconfig.json
docker compose build --no-cache api
docker restart sicherheitsdienst-api

# 2. Frontend
docker restart project-web-1

# 3. Verify
docker ps  # Alle Container running?
docker logs sicherheitsdienst-api --tail 50  # Errors?
curl http://127.0.0.1:3001/health  # API erreichbar?
```

### 3. Post-Deployment Verification
- [ ] Login funktioniert
- [ ] Neue Features sichtbar
- [ ] API-Endpoints erreichbar
- [ ] Keine Console-Errors im Browser

### 4. Rollback Plan
```bash
# Falls Deployment schief geht:
git reset --hard HEAD~1
docker compose build api
docker restart sicherheitsdienst-api
```

---

## Known Issues

### Prisma SSL Warning (Non-Critical)
```
prisma:warn Prisma failed to detect the libssl/openssl version
```
**Impact:** Warning only, funktioniert trotzdem
**Fix:** Ignorieren oder OpenSSL in Dockerfile updaten

### Docker Cache Persistence
Docker cached aggressiv. Bei kritischen Änderungen IMMER `--no-cache` verwenden.

---

## Debugging Commands

```bash
# Container Status
docker ps
docker logs sicherheitsdienst-api --tail 100
docker exec sicherheitsdienst-api ls -la /app/dist/

# Deployed Code prüfen
docker exec sicherheitsdienst-api cat /app/dist/routes/shiftRoutes.js | grep "v2"

# Redis Status
docker exec sicherheitsdienst-redis redis-cli INFO
docker exec sicherheitsdienst-redis redis-cli KEYS "*"

# Database Status
docker exec sicherheitsdienst-db psql -U admin -d sicherheitsdienst_db -c "\dt"
```

---

**Letzte Aktualisierung:** 07.10.2025
**Version:** v1.9.2
