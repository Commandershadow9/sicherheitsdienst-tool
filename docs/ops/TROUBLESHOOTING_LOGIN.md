# 🔧 Login-Probleme Troubleshooting Guide

> **Letzte Aktualisierung:** 2025-10-25  
> **Häufigkeit:** Dieses Problem trat wiederholt auf und ist nun dauerhaft behoben.

---

## ⚠️ Symptom: "Server nicht erreichbar"

Dieser Fehler tritt beim Login auf, wenn Frontend und Backend nicht kommunizieren können.

---

## 🔍 Schnell-Diagnose

**Führe aus:**
```bash
./check-login-health.sh
```

---

## 🐛 Häufige Ursachen & Lösungen

### 1. Backend läuft auf falschem Port 🔴

**Problem:** Backend auf Port 3001 statt 3000

**Fix:**
```bash
docker compose -f docker-compose.dev.yml up -d api
```

**Dauerhafte Lösung:** ✅ server.ts Default-Port = 3000

---

### 2. CORS blockiert Requests 🔴

**Problem:** Browser-Console zeigt CORS-Fehler

**Fix:**
```bash
# docker-compose.dev.yml prüfen:
CORS_ORIGINS: http://localhost:5173,http://127.0.0.1:5173,http://37.114.53.56:5173
```

**Dauerhafte Lösung:** ✅ CORS_ORIGINS mit allen 3 Origins konfiguriert

---

### 3. Frontend API-URL falsch 🟡

**Problem:** Frontend ruft Port 3001 auf

**Fix:** ✅ api.ts Port-Mapping entfernt

---

### 4. Database nicht erreichbar 🟡

**Fix:**
```bash
docker compose -f docker-compose.dev.yml up -d db
```

---

### 5. Frontend läuft nicht 🟡

**Fix:**
```bash
cd frontend && npm run dev
```

---

## 🛠️ Generischer Fix-Workflow

```bash
# 1. Health Check
./check-login-health.sh

# 2. Services neu starten
docker compose -f docker-compose.dev.yml up -d
cd frontend && npm run dev

# 3. Build aktualisieren
cd backend && npm run build
docker compose -f docker-compose.dev.yml restart api

# 4. Browser-Cache: Strg+Shift+R
```

---

## 🚨 Notfall-Reset

```bash
docker compose -f docker-compose.dev.yml down -v
cd backend && npm run build
docker compose -f docker-compose.dev.yml up -d
cd ../frontend && npm run dev
docker exec project-api-1 npm run db:seed
./check-login-health.sh
```

---

## 🏆 Best Practices

### DO ✅
- Health-Check vor jedem Test
- CORS_ORIGINS (plural) verwenden
- Port 3000 konsistent nutzen
- Browser-Cache nach Änderungen leeren

### DON'T ❌
- Port 3001 verwenden (veraltet!)
- Lokale .env in Docker erwarten
- Backend ohne DATABASE_URL starten

---

**Version:** 1.0.0  
**Getestet:** 2025-10-25
