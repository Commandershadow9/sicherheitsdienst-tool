#!/bin/bash

# ================================================
# Login Health Check Script
# ================================================
# Prüft Backend, Frontend und CORS-Konfiguration
# Meldet Probleme und gibt Fix-Vorschläge
# ================================================

set -e

echo "🔍 Login Health Check läuft..."
echo ""

ERRORS=0

# ================================
# 1. Backend Health Check
# ================================
echo "1️⃣  Backend Health..."
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
  echo "   ✅ Backend erreichbar auf Port 3000"
else
  echo "   ❌ Backend NICHT erreichbar auf Port 3000"
  echo "      → Prüfe: docker ps | grep api"
  echo "      → Fix: docker compose -f docker-compose.dev.yml up -d api"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# 2. Frontend Health Check
# ================================
echo ""
echo "2️⃣  Frontend Health..."
if curl -sf http://localhost:5173 > /dev/null 2>&1; then
  echo "   ✅ Frontend erreichbar auf Port 5173"
else
  echo "   ❌ Frontend NICHT erreichbar auf Port 5173"
  echo "      → Fix: cd frontend && npm run dev"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# 3. Docker Container Status
# ================================
echo ""
echo "3️⃣  Docker Container..."
API_RUNNING=$(docker ps --filter "name=api" --format "{{.Names}}" | wc -l)
if [ "$API_RUNNING" -gt 0 ]; then
  echo "   ✅ API Container läuft"

  # Port-Check
  API_PORT=$(docker exec $(docker ps --filter "name=api" --format "{{.Names}}" | head -1) printenv PORT 2>/dev/null || echo "unknown")
  echo "      PORT=$API_PORT"

  if [ "$API_PORT" != "3000" ]; then
    echo "   ⚠️  WARNUNG: PORT ist nicht 3000!"
    echo "      → Fix: docker-compose.dev.yml prüfen"
    ERRORS=$((ERRORS + 1))
  fi

  # CORS-Check
  CORS_ORIGINS=$(docker exec $(docker ps --filter "name=api" --format "{{.Names}}" | head -1) printenv CORS_ORIGINS 2>/dev/null || echo "")
  if [ -z "$CORS_ORIGINS" ]; then
    echo "   ⚠️  WARNUNG: CORS_ORIGINS nicht gesetzt!"
    ERRORS=$((ERRORS + 1))
  else
    echo "      CORS_ORIGINS=$CORS_ORIGINS"

    # Prüfe ob localhost UND Server-IP enthalten sind
    if [[ "$CORS_ORIGINS" == *"localhost:5173"* ]]; then
      echo "      ✅ localhost:5173 in CORS enthalten"
    else
      echo "      ❌ localhost:5173 FEHLT in CORS!"
      ERRORS=$((ERRORS + 1))
    fi

    if [[ "$CORS_ORIGINS" == *"37.114.53.56:5173"* ]]; then
      echo "      ✅ 37.114.53.56:5173 in CORS enthalten"
    else
      echo "      ⚠️  Server-IP fehlt in CORS (nur wichtig bei Remote-Zugriff)"
    fi
  fi
else
  echo "   ❌ Kein API Container läuft"
  echo "      → Fix: docker compose -f docker-compose.dev.yml up -d"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# 4. Database Status
# ================================
echo ""
echo "4️⃣  Database..."
DB_RUNNING=$(docker ps --filter "name=db" --format "{{.Names}}" | wc -l)
if [ "$DB_RUNNING" -gt 0 ]; then
  echo "   ✅ Database Container läuft"
else
  echo "   ❌ Database Container läuft NICHT"
  echo "      → Fix: docker compose -f docker-compose.dev.yml up -d db"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# 5. Login API Test
# ================================
echo ""
echo "5️⃣  Login API Test..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sicherheitsdienst.de","password":"password123"}' 2>/dev/null || echo "error")

if [[ "$LOGIN_RESPONSE" == *"success\":true"* ]]; then
  echo "   ✅ Login API funktioniert (User erhalten, Tokens in Cookies)"
else
  echo "   ❌ Login API funktioniert NICHT"
  echo "      Response: $LOGIN_RESPONSE"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# 6. Frontend API Config
# ================================
echo ""
echo "6️⃣  Frontend API Config..."
VITE_API_URL=$(grep "VITE_API_BASE_URL" /home/cmdshadow/project/frontend/.env 2>/dev/null | cut -d'=' -f2)
echo "   VITE_API_BASE_URL=$VITE_API_URL"

if [ "$VITE_API_URL" == "http://localhost:3000" ]; then
  echo "   ✅ Frontend API-URL korrekt"
else
  echo "   ⚠️  Frontend API-URL sollte http://localhost:3000 sein"
  ERRORS=$((ERRORS + 1))
fi

# ================================
# Zusammenfassung
# ================================
echo ""
echo "================================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALLE CHECKS ERFOLGREICH - Login sollte funktionieren!"
else
  echo "❌ $ERRORS PROBLEME GEFUNDEN - Login kann fehlschlagen!"
  echo ""
  echo "🔧 Quick-Fix Schritte:"
  echo "   1. docker compose -f docker-compose.dev.yml up -d"
  echo "   2. cd frontend && npm run dev"
  echo "   3. Browser-Cache leeren (Strg+Shift+R)"
fi
echo "================================================"

exit $ERRORS
