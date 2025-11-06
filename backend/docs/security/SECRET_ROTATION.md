# Secret Rotation Guide

**Status:** v1.23.0+
**Letzte Aktualisierung:** 2025-11-05
**Security-Level:** CRITICAL 🔴

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Welche Secrets müssen rotiert werden?](#welche-secrets-müssen-rotiert-werden)
3. [Rotation Schedule](#rotation-schedule)
4. [JWT Secret Rotation](#jwt-secret-rotation)
5. [Database Password Rotation](#database-password-rotation)
6. [SMTP Password Rotation](#smtp-password-rotation)
7. [VAPID Keys Rotation](#vapid-keys-rotation)
8. [Emergency Rotation](#emergency-rotation)
9. [Audit & Compliance](#audit--compliance)

---

## Übersicht

**Secret Rotation** ist ein kritischer Security-Prozess, bei dem Passwörter, API-Keys und kryptographische Schlüssel regelmäßig erneuert werden, um das Risiko bei einer Kompromittierung zu minimieren.

### Warum Secret Rotation?

✅ **Minimiert Blast Radius:** Bei Leak sind alte Secrets wertlos
✅ **Compliance:** DSGVO/ISO 27001 erfordern regelmäßige Rotation
✅ **Defense in Depth:** Zusätzliche Sicherheitsebene
✅ **Audit Trail:** Nachvollziehbarkeit von Zugriff & Änderungen

### Rotation-Strategie

Diese Anwendung nutzt **Zero-Downtime Rotation** mit folgenden Prinzipien:

1. **Dual-Secret Phase:** Alte und neue Secrets parallel akzeptieren
2. **Graceful Transition:** User werden nicht ausgeloggt
3. **Rollback-fähig:** Bei Problemen schnell zurückkehren
4. **Automatisiert:** Scripts für wiederholbare Prozesse

---

## Welche Secrets müssen rotiert werden?

| Secret | Typ | Kritikalität | Rotation-Intervall | Zero-Downtime? |
|--------|-----|--------------|-------------------|----------------|
| **JWT_SECRET** | Kryptografisch | 🔴 CRITICAL | 90 Tage | ✅ Ja |
| **REFRESH_SECRET** | Kryptografisch | 🔴 CRITICAL | 90 Tage | ✅ Ja |
| **DATABASE_URL** (Password) | Credential | 🔴 CRITICAL | 180 Tage | ✅ Ja |
| **SMTP_PASS** | Credential | 🟡 MEDIUM | 180 Tage | ✅ Ja |
| **VAPID_PRIVATE_KEY** | Kryptografisch | 🟡 MEDIUM | 365 Tage | ⚠️ Nein* |

*VAPID Key Rotation erfordert Browser-Neuregistrierung (alle Push-Subscriptions ungültig)

---

## Rotation Schedule

### Automatischer Reminder

Füge zu deinem **Crontab** hinzu:

```bash
# Secret Rotation Reminder (jeden 1. des Monats)
0 9 1 * * /opt/sicherheitsdienst/scripts/check-secret-age.sh
```

**Script:** `scripts/check-secret-age.sh`

```bash
#!/bin/bash

SECRETS_FILE="/opt/sicherheitsdienst/backend/.env"
ROTATION_LOG="/var/log/sicherheitsdienst/secret-rotation.log"

# Letztes Änderungsdatum der .env Datei
LAST_MODIFIED=$(stat -c %Y "$SECRETS_FILE")
NOW=$(date +%s)
AGE_DAYS=$(( (NOW - LAST_MODIFIED) / 86400 ))

if [ $AGE_DAYS -gt 80 ]; then
    echo "⚠️  WARNUNG: Secrets sind $AGE_DAYS Tage alt!" | tee -a "$ROTATION_LOG"
    echo "Bitte JWT/REFRESH Secrets rotieren!" | tee -a "$ROTATION_LOG"

    # Optional: E-Mail senden
    echo "Subject: Secret Rotation fällig" | sendmail admin@secureops.de
fi
```

### Manuelle Checkliste

**Quarterly (alle 3 Monate):**
- [ ] JWT_SECRET rotieren
- [ ] REFRESH_SECRET rotieren

**Semi-Annual (alle 6 Monate):**
- [ ] DATABASE_URL Password rotieren
- [ ] SMTP_PASS rotieren

**Annual (jährlich):**
- [ ] VAPID Keys rotieren (wenn Push Notifications genutzt)
- [ ] Security Audit durchführen

---

## JWT Secret Rotation

### Warum JWT Rotation?

JWT Secrets signieren Access Tokens (Gültigkeit: 15min) und Refresh Tokens (30 Tage). Eine Rotation invalidiert **alle** alten Tokens, aber durch Dual-Secret-Phase können User nahtlos weitermachen.

### Rotation-Prozess (Zero-Downtime)

#### Phase 1: Neue Secrets generieren

```bash
# Neue Secrets generieren
NEW_JWT_SECRET=$(openssl rand -base64 48)
NEW_REFRESH_SECRET=$(openssl rand -base64 48)

echo "JWT_SECRET_NEW=$NEW_JWT_SECRET"
echo "REFRESH_SECRET_NEW=$NEW_REFRESH_SECRET"
```

#### Phase 2: Dual-Secret Modus aktivieren

Editiere `/opt/sicherheitsdienst/backend/.env`:

```bash
# Phase 2: Alte Secrets (noch aktiv)
JWT_SECRET="OLD_SECRET_HERE"
REFRESH_SECRET="OLD_REFRESH_SECRET_HERE"

# Phase 2: Neue Secrets (ab jetzt auch akzeptiert)
JWT_SECRET_NEW="NEW_SECRET_HERE"
REFRESH_SECRET_NEW="NEW_REFRESH_SECRET_HERE"
```

**Backend-Code** (in `backend/src/middleware/auth.ts`):

```typescript
// Dual-Secret Verification
function verifyToken(token: string, type: 'access' | 'refresh'): JwtPayload {
  const secrets = type === 'access'
    ? [process.env.JWT_SECRET, process.env.JWT_SECRET_NEW].filter(Boolean)
    : [process.env.REFRESH_SECRET, process.env.REFRESH_SECRET_NEW].filter(Boolean);

  for (const secret of secrets) {
    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      return payload;
    } catch (err) {
      // Versuche nächstes Secret
      continue;
    }
  }

  throw new UnauthorizedError('Invalid token');
}
```

**⚠️ WICHTIG:** Dieser Code ist bereits implementiert in `backend/src/middleware/auth.ts` (ab v1.23.0)

#### Phase 3: Backend neu starten (Dual-Secret aktiv)

```bash
cd /opt/sicherheitsdienst/backend
pm2 restart sicherheitsdienst-backend

# Logs prüfen
pm2 logs --lines 50 | grep -i "secret\|token"
```

**Erwartetes Log:**
```
[INFO] JWT Dual-Secret Mode: OLD + NEW Secrets aktiv
[INFO] Refresh Dual-Secret Mode: OLD + NEW Secrets aktiv
```

#### Phase 4: Wartezeit (Transition Period)

**Warte mindestens 30 Tage** (Refresh Token TTL), damit alle alten Tokens ablaufen.

Während dieser Zeit:
- ✅ Neue Tokens werden mit **NEW_SECRET** signiert
- ✅ Alte Tokens werden mit **OLD_SECRET** validiert (bis Ablauf)
- ✅ User merken nichts (automatischer Token-Refresh)

**Monitoring:**

```bash
# Prüfe Token-Validierung in Logs
pm2 logs | grep "Token verified with.*OLD"  # Sollte nach 30 Tagen bei 0 sein
```

#### Phase 5: Alte Secrets entfernen

Nach **30+ Tagen**:

```bash
# .env editieren
nano /opt/sicherheitsdienst/backend/.env
```

**Entferne** die alten Secrets:

```bash
# Phase 5: Nur neue Secrets (alte entfernt)
JWT_SECRET="NEW_SECRET_HERE"
REFRESH_SECRET="NEW_REFRESH_SECRET_HERE"

# JWT_SECRET_NEW und REFRESH_SECRET_NEW entfernen
```

```bash
# Backend neu starten
pm2 restart sicherheitsdienst-backend

# Logs prüfen
pm2 logs --lines 20
```

**Erwartetes Log:**
```
[INFO] JWT Single-Secret Mode aktiv
[INFO] Refresh Single-Secret Mode aktiv
```

#### Phase 6: Alte Secrets sicher löschen

```bash
# Alte Secrets aus History entfernen
shred -vfz -n 10 /opt/sicherheitsdienst/backend/.env.old

# Git History (falls versehentlich committed)
# ⚠️ NIEMALS Secrets committen! Falls doch:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

#### Validation

```bash
# Test: Login sollte funktionieren
curl -X POST https://secureops.de/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@secureops.de","password":"test123"}'

# Response sollte Access + Refresh Token enthalten
```

---

## Database Password Rotation

### Voraussetzungen

- PostgreSQL 15+
- Dual-Connection-Pool Support (bereits in Prisma implementiert)

### Rotation-Prozess

#### Schritt 1: Neues Passwort generieren

```bash
NEW_DB_PASSWORD=$(openssl rand -base64 32)
echo "Neues DB Passwort: $NEW_DB_PASSWORD"
```

#### Schritt 2: Passwort in PostgreSQL ändern

```bash
sudo -u postgres psql

ALTER USER dbuser WITH PASSWORD 'NEW_DB_PASSWORD_HERE';
\q
```

#### Schritt 3: .env aktualisieren (Dual-Connection)

```bash
nano /opt/sicherheitsdienst/backend/.env
```

```bash
# Primary Connection (alt, noch aktiv)
DATABASE_URL="postgresql://dbuser:OLD_PASSWORD@localhost:5432/sicherheitsdienst?schema=public"

# Secondary Connection (neu, Fallback)
DATABASE_URL_NEW="postgresql://dbuser:NEW_PASSWORD@localhost:5432/sicherheitsdienst?schema=public"
```

**Backend-Code** (Prisma Client Retry Logic):

```typescript
// backend/src/utils/prisma.ts (bereits implementiert)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Retry-Handler für Connection Errors
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    if (error.code === 'P1001' && process.env.DATABASE_URL_NEW) {
      // Reconnect mit neuem Passwort
      logger.warn('Database reconnecting with new credentials...');
      await prisma.$disconnect();
      process.env.DATABASE_URL = process.env.DATABASE_URL_NEW;
      return await next(params);
    }
    throw error;
  }
});
```

#### Schritt 4: Backend neu starten

```bash
pm2 restart sicherheitsdienst-backend

# Logs prüfen (sollte keine Connection-Errors geben)
pm2 logs --lines 50 | grep -i "database\|prisma"
```

#### Schritt 5: Altes Passwort entfernen

Nach **24 Stunden** (Sicherheit):

```bash
# DATABASE_URL auf NEW setzen
nano /opt/sicherheitsdienst/backend/.env

DATABASE_URL="postgresql://dbuser:NEW_PASSWORD@localhost:5432/sicherheitsdienst?schema=public"
# DATABASE_URL_NEW entfernen

pm2 restart sicherheitsdienst-backend
```

---

## SMTP Password Rotation

### Rotation-Prozess (simpel)

#### Schritt 1: Neues SMTP-Passwort generieren

Im SMTP-Provider (z.B. Mailgun, SendGrid, Gmail):
1. Gehe zu **API Keys / App Passwords**
2. Generiere neues Passwort
3. Kopiere Passwort

#### Schritt 2: .env aktualisieren

```bash
nano /opt/sicherheitsdienst/backend/.env

SMTP_PASS="NEW_SMTP_PASSWORD_HERE"
```

#### Schritt 3: Backend neu starten

```bash
pm2 restart sicherheitsdienst-backend
```

#### Schritt 4: Test-E-Mail senden

```bash
# Backend API testen
curl -X POST https://secureops.de/api/test/send-email \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"admin@secureops.de","subject":"SMTP Test"}'
```

#### Schritt 5: Altes SMTP-Passwort widerrufen

Im SMTP-Provider:
1. Gehe zu **API Keys**
2. Widerrufe altes Passwort/Key

---

## VAPID Keys Rotation

### ⚠️ ACHTUNG: Disruptive Rotation

VAPID Key Rotation invalidiert **alle** bestehenden Push-Subscriptions. User müssen sich neu registrieren für Push Notifications.

**Nur rotieren bei:**
- Sicherheitsvorfall (Key Leak)
- Jährlichem Maintenance-Fenster
- Migration auf neuen Server

### Rotation-Prozess

#### Schritt 1: Neue VAPID Keys generieren

```bash
cd /opt/sicherheitsdienst/backend
npx web-push generate-vapid-keys

# Output:
# Public Key: BN5x...
# Private Key: lP3k...
```

#### Schritt 2: .env aktualisieren

```bash
nano /opt/sicherheitsdienst/backend/.env

VAPID_PUBLIC_KEY="NEW_PUBLIC_KEY_HERE"
VAPID_PRIVATE_KEY="NEW_PRIVATE_KEY_HERE"
VAPID_SUBJECT="mailto:admin@secureops.de"
```

#### Schritt 3: Frontend .env aktualisieren

```bash
nano /opt/sicherheitsdienst/frontend/.env

VITE_VAPID_PUBLIC_KEY="NEW_PUBLIC_KEY_HERE"
```

#### Schritt 4: Frontend neu bauen

```bash
cd /opt/sicherheitsdienst/frontend
npm run build
sudo cp -r dist/* /var/www/sicherheitsdienst/
```

#### Schritt 5: Backend neu starten + Push-Subscriptions löschen

```bash
cd /opt/sicherheitsdienst/backend

# Alte Subscriptions löschen (ungültig nach Key-Rotation)
npx prisma db execute --sql "DELETE FROM push_tokens;"

pm2 restart sicherheitsdienst-backend
```

#### Schritt 6: User benachrichtigen

**In-App Notification:**
```
🔔 Push Notifications wurden aktualisiert.
Bitte erlaube Benachrichtigungen erneut in den Einstellungen.
```

**E-Mail (optional):**
```
Betreff: Push-Benachrichtigungen neu aktivieren

Liebe/r User,

aus Sicherheitsgründen haben wir unsere Push-Benachrichtigungen aktualisiert.
Bitte öffne die App und aktiviere Benachrichtigungen erneut in den Einstellungen.

Vielen Dank für dein Verständnis!
```

---

## Emergency Rotation

**Wenn ein Secret kompromittiert wurde (Leak, Hack, etc.):**

### Sofort-Maßnahmen (innerhalb 1 Stunde)

1. **Alle Secrets rotieren** (JWT, Refresh, DB, SMTP)
2. **Alle User-Sessions invalidieren**
3. **Audit Logs prüfen** (wer hatte Zugriff?)
4. **Incident Response Team benachrichtigen**

### Emergency JWT Rotation (Fast Track)

```bash
# 1. Neue Secrets generieren
NEW_JWT=$(openssl rand -base64 48)
NEW_REFRESH=$(openssl rand -base64 48)

# 2. .env SOFORT überschreiben (keine Dual-Phase!)
cd /opt/sicherheitsdienst/backend
sed -i "s/JWT_SECRET=.*/JWT_SECRET=\"$NEW_JWT\"/" .env
sed -i "s/REFRESH_SECRET=.*/REFRESH_SECRET=\"$NEW_REFRESH\"/" .env

# 3. Backend neu starten
pm2 restart sicherheitsdienst-backend

# 4. Alle Refresh Tokens in DB invalidieren
npx prisma db execute --sql "DELETE FROM refresh_tokens;"

# 5. User müssen sich neu einloggen (E-Mail senden)
echo "Subject: Sicherheitsupdate - Bitte neu anmelden" | \
  sendmail all-users@secureops.de
```

### Post-Incident Analyse

```bash
# Audit Logs exportieren (letzte 7 Tage)
npx prisma db execute --sql "
  SELECT * FROM audit_logs
  WHERE occurred_at > NOW() - INTERVAL '7 days'
  ORDER BY occurred_at DESC;
" > incident_audit_$(date +%Y%m%d).csv

# Verdächtige Logins identifizieren
grep -E "AUTH.LOGIN|TOKEN.REFRESH" incident_audit_*.csv | \
  grep -v "SUCCESS" > suspicious_logins.txt
```

---

## Audit & Compliance

### Secret Rotation Logging

Alle Rotation-Events werden im **Audit Log** gespeichert:

```typescript
// backend/src/utils/audit.ts
await logAuditEvent({
  action: 'SECURITY.SECRET_ROTATION',
  resourceType: 'SECRET',
  resourceId: 'JWT_SECRET',
  actorId: 'system',
  outcome: 'SUCCESS',
  metadata: {
    secretType: 'JWT_SECRET',
    rotationReason: 'SCHEDULED',
    rotationDate: new Date().toISOString(),
  },
});
```

### DSGVO Compliance

**Art. 32 DSGVO:** "Geeignete technische und organisatorische Maßnahmen"

✅ Secret Rotation erfüllt:
- Regelmäßige Überprüfung (Rotation Schedule)
- Verschlüsselung (JWT, Database Passwords)
- Zugangskontrolle (Nur Admins haben Zugriff auf `.env`)

### ISO 27001 Compliance

**A.9.4.3:** Zugangsschlüssel-Management

✅ Secret Rotation erfüllt:
- Dokumentierter Prozess (dieses Dokument)
- Regelmäßige Rotation (90/180/365 Tage)
- Audit Trail (Audit Logs)

### Compliance Checkliste

**Quarterly Review:**
- [ ] Wurden Secrets fristgerecht rotiert?
- [ ] Sind Audit Logs vollständig?
- [ ] Keine Secrets in Git History?
- [ ] Zugriff auf `.env` nur für Admins?

**Annual Audit:**
- [ ] Penetration Test durchgeführt?
- [ ] Secrets nie geleaked (GitHub Scan)?
- [ ] Backup-Verschlüsselung aktiv?
- [ ] Disaster Recovery Plan getestet?

---

## Best Practices

### Secrets Management

✅ **DO:**
- Nutze `openssl rand -base64 48` für starke Secrets
- Speichere Secrets in `.env` (niemals in Code!)
- Setze Permissions: `chmod 600 .env`
- Nutze Secret Management Tools (z.B. Vault, AWS Secrets Manager)
- Logge Secret-Rotation im Audit Log

❌ **DON'T:**
- Niemals Secrets in Git committen
- Keine schwachen Passwörter (z.B. "secret123")
- Nicht per E-Mail/Slack teilen
- Nicht in Frontend-Code verwenden
- Nicht in Logs ausgeben

### Secret Storage Hierarchy

**Production:**
```
1. HashiCorp Vault (optimal)
2. AWS Secrets Manager / Azure Key Vault
3. .env Datei mit chmod 600 (minimal)
```

**Backup:**
```
Verschlüsselte .env Backups:
gpg --symmetric --cipher-algo AES256 .env
# Erstellt: .env.gpg (sicher archivieren)
```

---

## Scripts & Automation

### Secret Rotation Automation (Cron)

**`/opt/sicherheitsdienst/scripts/rotate-jwt.sh`:**

```bash
#!/bin/bash
set -e

BACKEND_DIR="/opt/sicherheitsdienst/backend"
ENV_FILE="$BACKEND_DIR/.env"
BACKUP_DIR="/var/backups/sicherheitsdienst"

# Backup erstellen
mkdir -p "$BACKUP_DIR"
cp "$ENV_FILE" "$BACKUP_DIR/.env.$(date +%Y%m%d_%H%M%S)"

# Neue Secrets generieren
NEW_JWT=$(openssl rand -base64 48)
NEW_REFRESH=$(openssl rand -base64 48)

# Dual-Secret Phase: Füge NEW hinzu
if ! grep -q "JWT_SECRET_NEW" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Dual-Secret Phase (Rotation $(date +%Y-%m-%d))" >> "$ENV_FILE"
    echo "JWT_SECRET_NEW=\"$NEW_JWT\"" >> "$ENV_FILE"
    echo "REFRESH_SECRET_NEW=\"$NEW_REFRESH\"" >> "$ENV_FILE"

    # Backend neu starten
    cd "$BACKEND_DIR"
    pm2 restart sicherheitsdienst-backend

    echo "✅ Dual-Secret Phase aktiviert. Warte 30 Tage, dann alte Secrets entfernen."

    # Reminder setzen (30 Tage später)
    echo "/opt/sicherheitsdienst/scripts/finalize-jwt-rotation.sh" | at now + 30 days
else
    echo "⚠️  Dual-Secret Phase bereits aktiv. Warte auf Finalisierung."
fi
```

**`/opt/sicherheitsdienst/scripts/finalize-jwt-rotation.sh`:**

```bash
#!/bin/bash
set -e

ENV_FILE="/opt/sicherheitsdienst/backend/.env"

# Ersetze alte Secrets mit neuen
sed -i 's/^JWT_SECRET=.*/JWT_SECRET="'$(grep JWT_SECRET_NEW "$ENV_FILE" | cut -d'"' -f2)'"/' "$ENV_FILE"
sed -i 's/^REFRESH_SECRET=.*/REFRESH_SECRET="'$(grep REFRESH_SECRET_NEW "$ENV_FILE" | cut -d'"' -f2)'"/' "$ENV_FILE"

# Entferne _NEW Secrets
sed -i '/JWT_SECRET_NEW/d' "$ENV_FILE"
sed -i '/REFRESH_SECRET_NEW/d' "$ENV_FILE"

# Backend neu starten
cd /opt/sicherheitsdienst/backend
pm2 restart sicherheitsdienst-backend

echo "✅ JWT Rotation abgeschlossen!"
```

**Crontab:**

```bash
# Automatische JWT Rotation alle 90 Tage
0 3 1 */3 * /opt/sicherheitsdienst/scripts/rotate-jwt.sh >> /var/log/sicherheitsdienst/rotation.log 2>&1
```

---

## Cheat Sheet

### Quick Commands

```bash
# Neues JWT Secret generieren
openssl rand -base64 48

# Neues DB Passwort generieren
openssl rand -base64 32

# Neues VAPID Key Pair generieren
cd backend && npx web-push generate-vapid-keys

# .env Backup erstellen (verschlüsselt)
gpg --symmetric --cipher-algo AES256 backend/.env

# Backup wiederherstellen
gpg --decrypt backend/.env.gpg > backend/.env

# Audit Logs exportieren (letzte 30 Tage)
npx prisma db execute --sql "SELECT * FROM audit_logs WHERE occurred_at > NOW() - INTERVAL '30 days';" > audit.csv
```

### Emergency Contacts

**Bei Sicherheitsvorfall:**
1. Incident Response Team benachrichtigen
2. Alle Secrets sofort rotieren (siehe Emergency Rotation)
3. Audit Logs sichern
4. Post-Mortem erstellen

---

## Weitere Ressourcen

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [Multi-Tenancy Security](./MULTI_TENANCY.md)
- [Production Deployment](../deployment/PRODUCTION_DEPLOYMENT.md)

---

**Version:** 1.0.0
**Letzte Änderung:** 2025-11-05
**Nächste Review:** 2026-02-05 (in 90 Tagen)
