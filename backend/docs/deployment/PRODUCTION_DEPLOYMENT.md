# Production Deployment Guide

**Status:** v1.23.0+
**Letzte Aktualisierung:** 2025-11-05
**Zielgruppe:** DevOps, System-Administratoren

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Systemvoraussetzungen](#systemvoraussetzungen)
3. [Pre-Deployment Checkliste](#pre-deployment-checkliste)
4. [Deployment-Prozess](#deployment-prozess)
5. [Post-Deployment Validierung](#post-deployment-validierung)
6. [Rollback-Strategie](#rollback-strategie)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Übersicht

Dieses Dokument beschreibt den sicheren Deployment-Prozess für die Sicherheitsdienst-Tool Anwendung auf einem KVM vServer (Ryzen).

### Deployment-Architektur

```
┌─────────────────────────────────────────────────┐
│  KVM vServer (Ryzen)                            │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  NGINX       │  │  Node.js (PM2)          │ │
│  │  (Reverse    │──│  - Backend (Port 5000)  │ │
│  │   Proxy)     │  │  - Frontend (Static)    │ │
│  │  Port 80/443 │  └─────────────────────────┘ │
│  └──────────────┘                               │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  PostgreSQL 15                              │ │
│  │  - Main Database                            │ │
│  │  - Row-Level Security (RLS) aktiviert       │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  Certbot (Let's Encrypt)                    │ │
│  │  - SSL/TLS Zertifikate                      │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Systemvoraussetzungen

### Hardware (KVM vServer)

- **CPU:** Ryzen Prozessor (empfohlen: 4+ Cores)
- **RAM:** Minimum 4 GB (empfohlen: 8 GB)
- **Storage:** Minimum 40 GB SSD
- **Netzwerk:** Statische IP-Adresse

### Software-Stack

| Komponente | Version | Erforderlich |
|------------|---------|--------------|
| **OS** | Ubuntu 22.04 LTS / Debian 11+ | ✅ |
| **Node.js** | 20.x LTS | ✅ |
| **npm** | 10.x | ✅ |
| **PostgreSQL** | 15.x | ✅ |
| **NGINX** | 1.18+ | ✅ |
| **PM2** | 5.x | ✅ |
| **Git** | 2.34+ | ✅ |
| **Certbot** | 2.x | ✅ (für SSL) |

### Domain & DNS

- **Domain:** Konfiguriert (z.B. `secureops.de` oder `shadowops.de`)
- **DNS A-Record:** Zeigt auf Server-IP
- **SSL/TLS:** Let's Encrypt Zertifikat

---

## Pre-Deployment Checkliste

### 1. Umgebungsvariablen

Erstelle `/opt/sicherheitsdienst/.env`:

```bash
# Database
DATABASE_URL="postgresql://dbuser:SECURE_PASSWORD@localhost:5432/sicherheitsdienst?schema=public"

# JWT Secrets (siehe SECRET_ROTATION.md)
JWT_SECRET="GENERATED_64_CHAR_SECRET"
REFRESH_SECRET="GENERATED_64_CHAR_SECRET"

# SMTP Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@secureops.de"
SMTP_PASS="SMTP_PASSWORD"
SMTP_FROM="Sicherheitsdienst Tool <noreply@secureops.de>"

# Application
NODE_ENV="production"
PORT="5000"
FRONTEND_URL="https://secureops.de"

# Security
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX="100"

# Optional: Push Notifications
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@secureops.de"
```

**⚠️ WICHTIG:**
- Verwende `openssl rand -base64 48` für JWT Secrets
- Niemals `.env` in Git committen
- Setze Datei-Permissions: `chmod 600 .env`

### 2. PostgreSQL Setup

```bash
# PostgreSQL installieren
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Datenbank erstellen
sudo -u postgres psql

CREATE DATABASE sicherheitsdienst;
CREATE USER dbuser WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE sicherheitsdienst TO dbuser;
\q
```

### 3. Node.js & PM2

```bash
# Node.js 20.x installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 global installieren
sudo npm install -g pm2

# PM2 Startup-Script
sudo pm2 startup systemd
```

### 4. NGINX Setup

```bash
# NGINX installieren
sudo apt install nginx

# Firewall konfigurieren
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Deployment-Prozess

### Schritt 1: Repository klonen

```bash
# Deployment-Verzeichnis erstellen
sudo mkdir -p /opt/sicherheitsdienst
sudo chown $USER:$USER /opt/sicherheitsdienst
cd /opt/sicherheitsdienst

# Repository klonen
git clone https://github.com/Commandershadow9/sicherheitsdienst-tool.git .

# Auf main branch wechseln
git checkout main
```

### Schritt 2: Backend deployen

```bash
cd /opt/sicherheitsdienst/backend

# Dependencies installieren
npm ci --production

# .env Datei erstellen (siehe Pre-Deployment Checkliste)
nano .env

# Prisma generieren
npx prisma generate

# Datenbank migrieren
npx prisma migrate deploy

# Optional: Seed-Daten (NUR beim ersten Deployment!)
npm run seed
```

### Schritt 3: Frontend bauen

```bash
cd /opt/sicherheitsdienst/frontend

# Dependencies installieren
npm ci

# .env für Frontend erstellen
cat > .env << EOF
VITE_API_URL=https://secureops.de/api
VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
EOF

# Production Build
npm run build

# Build nach NGINX-Verzeichnis kopieren
sudo mkdir -p /var/www/sicherheitsdienst
sudo cp -r dist/* /var/www/sicherheitsdienst/
sudo chown -R www-data:www-data /var/www/sicherheitsdienst
```

### Schritt 4: PM2 Prozess starten

```bash
cd /opt/sicherheitsdienst/backend

# PM2 Ecosystem-Datei erstellen
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sicherheitsdienst-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/sicherheitsdienst-error.log',
    out_file: '/var/log/pm2/sicherheitsdienst-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
EOF

# Backend bauen
npm run build

# PM2 starten
pm2 start ecosystem.config.js
pm2 save
```

### Schritt 5: NGINX konfigurieren

```bash
# NGINX Site-Config erstellen
sudo nano /etc/nginx/sites-available/sicherheitsdienst

# Konfiguration einfügen (siehe unten)
```

**NGINX Konfiguration:**

```nginx
# Rate Limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Upstream Backend
upstream backend {
    least_conn;
    server 127.0.0.1:5000;
}

server {
    listen 80;
    listen [::]:80;
    server_name secureops.de www.secureops.de;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name secureops.de www.secureops.de;

    # SSL Zertifikate (von Certbot verwaltet)
    ssl_certificate /etc/letsencrypt/live/secureops.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/secureops.de/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Frontend (React SPA)
    root /var/www/sicherheitsdienst;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Backend API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth Endpoints (strengeres Rate Limiting)
    location ~ ^/api/(auth|login|register) {
        limit_req zone=auth_limit burst=5 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Routes (SPA Fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Config aktivieren
sudo ln -s /etc/nginx/sites-available/sicherheitsdienst /etc/nginx/sites-enabled/

# Default Site deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# NGINX Config testen
sudo nginx -t

# NGINX starten
sudo systemctl restart nginx
```

### Schritt 6: SSL/TLS Zertifikat

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# Zertifikat beantragen
sudo certbot --nginx -d secureops.de -d www.secureops.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## Post-Deployment Validierung

### 1. Backend Health Check

```bash
# Backend-Status prüfen
pm2 status

# Backend-Logs prüfen
pm2 logs sicherheitsdienst-backend --lines 50

# API Health Check
curl http://localhost:5000/api/health
```

**Erwartete Antwort:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

### 2. Frontend Erreichbarkeit

```bash
# NGINX Status
sudo systemctl status nginx

# Frontend testen
curl -I https://secureops.de
```

**Erwartete Header:**
```
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
```

### 3. Datenbank-Verbindung

```bash
cd /opt/sicherheitsdienst/backend

# Prisma Studio (optional, nur für Debugging)
npx prisma studio --port 5555
# Achtung: Nur über SSH-Tunnel zugänglich machen!
```

### 4. Funktionale Tests

- ✅ Login funktioniert
- ✅ Dashboard lädt
- ✅ API-Requests erfolgreich
- ✅ SMTP E-Mail-Versand funktioniert (Test-E-Mail)
- ✅ Multi-Tenancy: User sehen nur ihre Customer-Daten

---

## Rollback-Strategie

### Schneller Rollback

```bash
# 1. Backend auf vorherige Version zurücksetzen
cd /opt/sicherheitsdienst
git log --oneline -10
git reset --hard <PREVIOUS_COMMIT_SHA>

# 2. Backend neu bauen & neu starten
cd backend
npm run build
pm2 restart sicherheitsdienst-backend

# 3. Frontend neu bauen (falls nötig)
cd ../frontend
npm run build
sudo cp -r dist/* /var/www/sicherheitsdienst/
```

### Datenbank Rollback

```bash
# ⚠️ NUR wenn neue Migration Probleme verursacht!
cd /opt/sicherheitsdienst/backend

# Letzte Migration rückgängig machen
npx prisma migrate resolve --rolled-back <MIGRATION_NAME>

# Vorherige Migration anwenden
npx prisma migrate deploy
```

**⚠️ WICHTIG:** Database-Rollbacks nur im Notfall! Immer Backup erstellen:

```bash
# Backup erstellen
pg_dump -U dbuser sicherheitsdienst > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
psql -U dbuser sicherheitsdienst < backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Real-time Monitoring
pm2 monit

# Logs anzeigen
pm2 logs sicherheitsdienst-backend

# Logs filtern (nur Errors)
pm2 logs sicherheitsdienst-backend --err

# Logs exportieren
pm2 flush  # Logs rotieren
```

### NGINX Logs

```bash
# Access Log
sudo tail -f /var/log/nginx/access.log

# Error Log
sudo tail -f /var/log/nginx/error.log

# Log-Rotation (automatisch via logrotate)
sudo nano /etc/logrotate.d/nginx
```

### PostgreSQL Logs

```bash
# Query-Logging aktivieren (nur für Debugging!)
sudo nano /etc/postgresql/15/main/postgresql.conf

# Aktiviere:
# log_statement = 'all'  # ACHTUNG: Performance-Impact!
# log_min_duration_statement = 1000  # Langsame Queries loggen (>1s)

sudo systemctl restart postgresql
```

### Application-Level Logging

Die Anwendung nutzt **Winston Logger**:

```bash
# Log-Dateien Struktur
/var/log/pm2/
├── sicherheitsdienst-error.log   # Errors & Warnings
└── sicherheitsdienst-out.log     # Info & Debug
```

**Log-Level in Production:** `INFO` (konfigurierbar via `.env`)

---

## Troubleshooting

### Problem: Backend startet nicht

**Symptome:**
```bash
pm2 status
# Status: errored | stopped
```

**Diagnose:**
```bash
pm2 logs sicherheitsdienst-backend --err --lines 100
```

**Häufige Ursachen:**
1. `.env` Datei fehlt oder falsch konfiguriert
   - **Fix:** Prüfe `/opt/sicherheitsdienst/backend/.env`
2. PostgreSQL nicht erreichbar
   - **Fix:** `sudo systemctl status postgresql`
3. Port 5000 bereits belegt
   - **Fix:** `lsof -i :5000` → Prozess beenden

### Problem: "Cannot connect to database"

**Diagnose:**
```bash
# PostgreSQL Status
sudo systemctl status postgresql

# Verbindung testen
psql -U dbuser -d sicherheitsdienst -h localhost
```

**Fix:**
```bash
# PostgreSQL neu starten
sudo systemctl restart postgresql

# pg_hba.conf prüfen (Authentifizierung)
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Zeile hinzufügen: local   all   all   md5

sudo systemctl reload postgresql
```

### Problem: 502 Bad Gateway (NGINX)

**Ursache:** Backend ist down oder nicht erreichbar

**Diagnose:**
```bash
# Backend Status
pm2 status

# Backend erreichbar?
curl http://localhost:5000/api/health
```

**Fix:**
```bash
pm2 restart sicherheitsdienst-backend
sudo systemctl restart nginx
```

### Problem: SSL/TLS Zertifikat abgelaufen

**Symptome:**
```
NET::ERR_CERT_DATE_INVALID
```

**Fix:**
```bash
# Zertifikat manuell erneuern
sudo certbot renew

# NGINX neu laden
sudo systemctl reload nginx

# Auto-Renewal prüfen
sudo systemctl status certbot.timer
```

### Problem: Hohe CPU/RAM Auslastung

**Diagnose:**
```bash
# PM2 Monitoring
pm2 monit

# Systemressourcen
htop
```

**Fixes:**
```bash
# Backend neu starten (Memory Leak?)
pm2 restart sicherheitsdienst-backend

# Logs analysieren
pm2 logs --lines 500 | grep -i "error\|warn"

# PM2 Instances reduzieren (bei wenig RAM)
pm2 scale sicherheitsdienst-backend 1
```

### Problem: Multi-Tenancy funktioniert nicht

**Symptome:** User sehen Daten anderer Customers

**Diagnose:**
```bash
cd /opt/sicherheitsdienst/backend

# Prisma Studio öffnen (via SSH Tunnel)
npx prisma studio

# Prüfe:
# 1. Haben alle User einen customerId?
# 2. Ist die Prisma Middleware aktiv? (siehe server.ts)
```

**Fix:**
```bash
# Multi-Tenancy Middleware registriert?
grep "registerMultiTenancyMiddleware" backend/src/server.ts

# Falls nicht:
npm run build
pm2 restart sicherheitsdienst-backend
```

---

## Wartung & Updates

### Regelmäßige Updates (1x Monat)

```bash
# 1. Backup erstellen
pg_dump -U dbuser sicherheitsdienst > backup_$(date +%Y%m%d).sql

# 2. Code aktualisieren
cd /opt/sicherheitsdienst
git pull origin main

# 3. Dependencies aktualisieren
cd backend && npm ci --production
cd ../frontend && npm ci

# 4. Migrationen ausführen
cd backend && npx prisma migrate deploy

# 5. Neu bauen & deployen
npm run build
cd ../frontend && npm run build
sudo cp -r dist/* /var/www/sicherheitsdienst/

# 6. Backend neu starten
pm2 restart sicherheitsdienst-backend
```

### Security Updates (sofort)

```bash
# System-Updates
sudo apt update && sudo apt upgrade -y

# Node.js Security Audit
cd /opt/sicherheitsdienst/backend
npm audit fix

# PostgreSQL Updates
sudo apt install --only-upgrade postgresql-15
```

---

## Kontakt & Support

**Bei Problemen:**
1. Logs prüfen (`pm2 logs`, NGINX logs, PostgreSQL logs)
2. GitHub Issues: https://github.com/Commandershadow9/sicherheitsdienst-tool/issues
3. Dokumentation: `backend/docs/`

**Weitere Dokumentation:**
- [Multi-Tenancy Security](../security/MULTI_TENANCY.md)
- [Secret Rotation](../security/SECRET_ROTATION.md)
- [API Documentation](../API.md)

---

**Version:** 1.0.0
**Letzte Änderung:** 2025-11-05
