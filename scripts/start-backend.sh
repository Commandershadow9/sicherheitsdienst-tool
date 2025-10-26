#!/bin/bash
# Backend Startup Script mit DB & Port Checking
# Verhindert Login/DB-Probleme bei Deployments

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Sicherheitsdienst Backend Startup${NC}"
echo "========================================"

# 1. Prüfe ob DATABASE_URL gesetzt ist
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL nicht gesetzt, verwende Default...${NC}"
  export DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public"
  echo "   DATABASE_URL=$DATABASE_URL"
fi

# 2. Prüfe Datenbankverbindung
echo ""
echo "📡 Prüfe Datenbankverbindung..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { console.log('✅ Datenbank erreichbar'); process.exit(0); })
  .catch((err) => { console.error('❌ DB-Fehler:', err.message); process.exit(1); });
" 2>/dev/null; then
  echo -e "${GREEN}✅ Datenbank OK${NC}"
else
  echo -e "${RED}❌ Datenbank nicht erreichbar!${NC}"
  echo ""
  echo "Mögliche Ursachen:"
  echo "  1. PostgreSQL Container nicht gestartet: docker compose -f docker-compose.dev.yml up -d db"
  echo "  2. Port 5432 nicht exponiert: Prüfe docker-compose.dev.yml ports-Mapping"
  echo "  3. Falsche Credentials: Prüfe DATABASE_URL"
  echo ""
  exit 1
fi

# 3. Prüfe/Setze PORT
if [ -z "$PORT" ]; then
  export PORT=3001
  echo -e "${YELLOW}⚠️  PORT nicht gesetzt, verwende 3001 (Firewall-approved)${NC}"
fi

# 4. Prüfe ob Port bereits belegt
echo ""
echo "🔍 Prüfe Port $PORT..."
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tulpn | grep ":$PORT " >/dev/null 2>&1; then
  echo -e "${RED}❌ Port $PORT ist bereits belegt!${NC}"
  echo ""
  echo "Lösung:"
  echo "  pkill -9 -f 'node.*$PORT'   # Stoppe alten Prozess"
  echo "  oder"
  echo "  PORT=3002 npm run start:prod  # Verwende anderen Port"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ Port $PORT ist frei${NC}"
fi

# 5. Prüfe Firewall (nur bei Production)
if [ "$NODE_ENV" = "production" ]; then
  echo ""
  echo "🔥 Prüfe Firewall-Konfiguration..."
  if command -v ufw >/dev/null 2>&1; then
    if sudo ufw status | grep -q "$PORT/tcp.*ALLOW" 2>/dev/null; then
      echo -e "${GREEN}✅ Firewall erlaubt Port $PORT${NC}"
    else
      echo -e "${YELLOW}⚠️  Firewall erlaubt Port $PORT NICHT${NC}"
      echo ""
      echo "Firewall-Regel hinzufügen:"
      echo "  sudo ufw allow $PORT/tcp comment 'Backend API'"
      echo "  sudo ufw reload"
      echo ""
    fi
  fi
fi

# 6. Starte Backend
echo ""
echo "========================================"
echo -e "${GREEN}🚀 Starte Backend auf Port $PORT...${NC}"
echo "========================================"
echo ""

# Production oder Development?
if [ "$NODE_ENV" = "production" ]; then
  exec npm start
else
  exec npm run dev
fi
