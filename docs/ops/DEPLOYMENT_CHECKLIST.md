# Deployment Checkliste - Sicherheitsdienst Tool

**Version:** 1.21.1
**Ziel:** Login/DB-Probleme bei Deployments vermeiden

---

## 📋 Pre-Deployment Checks

### 1. Datenbank-Konfiguration

**Problem:** Backend kann DB nicht erreichen → Login schlägt fehl

**Checkliste:**
- [ ] PostgreSQL Container läuft: `docker ps | grep db`
- [ ] Port 5432 auf Host exponiert in `docker-compose.dev.yml`:
  ```yaml
  db:
    ports:
      - '5432:5432'
  ```
- [ ] Port 5432 ist gebunden: `ss -tulpn | grep 5432`
- [ ] DB ist erreichbar:
  ```bash
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
  node -e "const { PrismaClient } = require('@prisma/client'); \
    const p = new PrismaClient(); \
    p.\$connect().then(() => console.log('✅ DB OK')).catch(e => console.error('❌', e.message));"
  ```

**Lösung bei Fehler:**
```bash
cd /home/cmdshadow/project
docker compose -f docker-compose.dev.yml up -d db
sleep 5
# Prüfe erneut
```

---

### 2. Port & Firewall-Konfiguration

**Problem:** Backend läuft, aber Login schlägt fehl mit `ERR_CONNECTION_TIMED_OUT`

**Checkliste:**
- [ ] Backend-Port ist durch Firewall erlaubt:
  ```bash
  sudo ufw status | grep 3001
  # Sollte zeigen: 3001/tcp ALLOW Anywhere
  ```
- [ ] Backend läuft auf Port 3001 (NICHT 3000):
  ```bash
  ss -tulpn | grep 3001
  ```
- [ ] Frontend .env ist korrekt konfiguriert:
  ```bash
  cat /home/cmdshadow/project/frontend/.env
  # VITE_API_BASE_URL=http://37.114.53.56:3001
  ```

**Lösung bei Fehler:**
```bash
# Firewall-Regel hinzufügen (falls fehlt)
sudo ufw allow 3001/tcp comment 'Backend API'
sudo ufw reload

# Frontend .env korrigieren
echo "VITE_API_BASE_URL=http://37.114.53.56:3001" > /home/cmdshadow/project/frontend/.env
echo "VITE_HMR_HOST_SERVER_IP=37.114.53.56" >> /home/cmdshadow/project/frontend/.env
echo "VITE_HMR_CLIENT_PORT=5173" >> /home/cmdshadow/project/frontend/.env
```

---

### 3. Admin-Login-Credentials

**Problem:** Login schlägt fehl mit "Ungültige Anmeldedaten"

**Checkliste:**
- [ ] Admin-User existiert in DB:
  ```bash
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
  node -e "const { PrismaClient } = require('@prisma/client'); \
    const p = new PrismaClient(); \
    p.user.findUnique({where: {email: 'admin@sicherheitsdienst.de'}}) \
      .then(u => console.log(u ? '✅ User existiert' : '❌ User fehlt'));"
  ```
- [ ] Bekannte Credentials werden verwendet:
  - **Email:** `admin@sicherheitsdienst.de`
  - **Passwort:** `password123`

**Lösung bei Fehler (Passwort zurücksetzen):**
```bash
cd /home/cmdshadow/project/backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'admin@sicherheitsdienst.de' },
    data: { password: hash }
  });
  console.log('✅ Passwort zurückgesetzt: admin@sicherheitsdienst.de / password123');
  process.exit(0);
}
resetPassword();
"
```

---

## 🚀 Deployment-Prozess

### Schritt 1: Datenbank starten
```bash
cd /home/cmdshadow/project
docker compose -f docker-compose.dev.yml up -d db
sleep 5  # Warte auf Healthcheck
docker ps | grep db  # Sollte "healthy" zeigen
```

### Schritt 2: Backend starten (mit Startup-Script)
```bash
cd /home/cmdshadow/project/backend

# Option A: Startup-Script (empfohlen)
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
PORT=3001 \
../scripts/start-backend.sh

# Option B: Manuell
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
PORT=3001 \
npm start
```

**Erwartete Ausgabe:**
```
🚀 Sicherheitsdienst Backend Startup
========================================
✅ Datenbank OK
✅ Port 3001 ist frei
🚀 Starte Backend auf Port 3001...
📡 Server running on port 3001 (listening on all interfaces)
```

### Schritt 3: Frontend starten
```bash
cd /home/cmdshadow/project/frontend

# .env prüfen
cat .env
# Sollte zeigen: VITE_API_BASE_URL=http://37.114.53.56:3001

npm run dev
```

**Erwartete Ausgabe:**
```
VITE v5.4.20  ready in 150 ms
➜  Local:   http://localhost:5173/
➜  Network: http://37.114.53.56:5173/
```

### Schritt 4: Login testen
```bash
# API-Test
curl -X POST http://37.114.53.56:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}'

# Sollte zurückgeben: {"success":true, "token":"..."}
```

**Browser-Test:**
1. Öffne: http://37.114.53.56:5173/login
2. Login: `admin@sicherheitsdienst.de` / `password123`
3. Sollte Dashboard anzeigen

---

## 🐛 Troubleshooting

### Problem: "Server nicht erreichbar"

**Diagnose:**
```bash
# 1. Backend läuft?
ss -tulpn | grep 3001

# 2. Health-Check OK?
curl http://37.114.53.56:3001/health

# 3. Firewall erlaubt Port?
sudo ufw status | grep 3001

# 4. Frontend greift auf richtige URL zu?
cat /home/cmdshadow/project/frontend/.env | grep VITE_API_BASE_URL
```

**Lösung:**
- Wenn Backend nicht läuft → Siehe Schritt 2
- Wenn Health-Check fehlschlägt → DB-Problem (siehe Abschnitt 1)
- Wenn Firewall blockt → `sudo ufw allow 3001/tcp && sudo ufw reload`
- Wenn Frontend falsche URL hat → .env korrigieren, Frontend neu starten

---

### Problem: "Ungültige Anmeldedaten"

**Diagnose:**
```bash
# Prüfe Backend-Logs (wenn im Hintergrund)
ps aux | grep "node.*3001"
# Oder Docker-Logs wenn in Container

# Teste Login direkt
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' | jq
```

**Lösung:**
- Passwort zurücksetzen (siehe Abschnitt 3)
- Prüfe ob User existiert
- Prüfe DB-Verbindung

---

### Problem: "Can't reach database server"

**Diagnose:**
```bash
# 1. Container läuft?
docker ps | grep db

# 2. Port exponiert?
docker port project-db-1

# 3. Port gebunden auf Host?
ss -tulpn | grep 5432

# 4. docker-compose.dev.yml korrekt?
grep -A 5 "db:" docker-compose.dev.yml | grep ports
```

**Lösung:**
```bash
# docker-compose.dev.yml korrigieren
# Unter db: Service hinzufügen:
#   ports:
#     - '5432:5432'

# Container neu erstellen
docker compose -f docker-compose.dev.yml up -d --force-recreate db
```

---

## 📝 Wartungs-Tipps

### Backend im Hintergrund starten
```bash
cd /home/cmdshadow/project/backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
PORT=3001 \
nohup npm start > logs/backend.log 2>&1 &

# PID speichern
echo $! > /tmp/backend.pid

# Später stoppen:
kill $(cat /tmp/backend.pid)
```

### Alte Backend-Prozesse killen
```bash
# Alle Node-Prozesse auf Port 3001
pkill -9 -f "node.*3001"

# Oder spezifisch
ps aux | grep "node.*3001" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### Logs monitoren
```bash
# Backend-Logs (wenn mit nohup gestartet)
tail -f /home/cmdshadow/project/backend/logs/backend.log

# Frontend-Logs (Dev-Server)
# Im Terminal sichtbar, wo npm run dev läuft
```

---

## ✅ Post-Deployment Checks

Nach erfolgreichem Deployment:

- [ ] Login funktioniert: http://37.114.53.56:5173/login
- [ ] Dashboard lädt
- [ ] API-Endpoints erreichbar: http://37.114.53.56:3001/health
- [ ] DB-Verbindung stabil (keine Errors in Backend-Logs)
- [ ] Firewall-Regeln persistent (überleben reboot)

**Firewall-Regeln persistent machen:**
```bash
sudo ufw enable  # Falls noch nicht enabled
sudo ufw status numbered  # Regeln anzeigen
```

---

## 📚 Weiterführende Dokumentation

- **CHANGELOG.md:** Alle Versionsänderungen
- **TODO.md:** Aktuelle Arbeitsstände
- **docs/product/planning/sicherheitskonzept-modul-konzept.md:** Phase 1 & 2 Details
- **backend/README.md:** Backend-Architektur
- **frontend/README.md:** Frontend-Setup

---

**Letzte Aktualisierung:** 2025-10-26
**Maintainer:** Claude Code Session
