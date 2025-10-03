# HTTPS mit Let's Encrypt einrichten

**Status**: Vorbereitet, wartet auf Domain-Namen
**Aktuell**: Temporär auf HTTP (Self-Signed Zertifikat blockiert von Browsern)

## Voraussetzungen

### 1. Domain-Namen registrieren

Du benötigst eine eigene Domain (z.B. `sicherheitsdienst-tool.de`).

**Empfohlene Registrare:**
- INWX.de (Deutschland, DSGVO-konform)
- Namecheap.com
- Cloudflare Registrar

**Kosten**: ca. 5-15€/Jahr

### 2. DNS A-Record einrichten

Nachdem du die Domain registriert hast, erstelle einen DNS A-Record:

```
A    @    37.114.53.56    (oder deine aktuelle IP)
```

Optional für www:
```
A    www  37.114.53.56
```

**Propagationszeit**: 5 Minuten bis 24 Stunden (meist < 1 Stunde)

**DNS prüfen:**
```bash
# Warte bis der A-Record aufgelöst wird
dig deine-domain.de +short
# Sollte zurückgeben: 37.114.53.56
```

---

## Installation und Konfiguration

### Schritt 1: Certbot installieren

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### Schritt 2: Nginx-Konfiguration anpassen

Die Nginx-Konfiguration ist bereits vorhanden unter `/etc/nginx/sites-available/sicherheitsdienst`.

Passe `server_name` an:

```bash
sudo nano /etc/nginx/sites-available/sicherheitsdienst
```

Ändere:
```nginx
server_name 37.114.53.56;
```

Zu:
```nginx
server_name deine-domain.de www.deine-domain.de;
```

**Wichtig**: Kommentiere erst die SSL-Zeilen aus (wird von Certbot automatisch hinzugefügt):

```nginx
# HTTP Server (Let's Encrypt Challenge)
server {
    listen 80;
    listen [::]:80;
    server_name deine-domain.de www.deine-domain.de;

    # Let's Encrypt Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Frontend (temporär für Let's Encrypt Setup)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 50M;
    }
}
```

Nginx neu laden:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Schritt 3: SSL-Zertifikat mit Certbot generieren

```bash
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

**Interaktive Fragen:**
1. E-Mail-Adresse eingeben (für Zertifikat-Ablauf-Warnungen)
2. Terms akzeptieren (Y)
3. Optional: E-Mail an EFF (N)
4. **Wichtig**: "Redirect HTTP to HTTPS?" → **2** (Yes)

Certbot wird automatisch:
- SSL-Zertifikate von Let's Encrypt abrufen
- Nginx-Konfiguration aktualisieren (SSL-Zeilen hinzufügen)
- HTTP → HTTPS Redirect einrichten
- Auto-Renewal Cronjob einrichten

### Schritt 4: Frontend und Backend für HTTPS konfigurieren

#### Frontend (.env)
```bash
nano /home/cmdshadow/project/frontend/.env
```

Ändere:
```
VITE_API_BASE_URL=https://deine-domain.de
```

#### Backend (.env)
```bash
nano /home/cmdshadow/project/backend/.env
```

Ändere:
```
CORS_ORIGIN=https://deine-domain.de
```

#### Projekt-Root (.env)
```bash
nano /home/cmdshadow/project/.env
```

Ändere:
```
CORS_ORIGIN=https://deine-domain.de
```

### Schritt 5: Services neu starten

```bash
cd /home/cmdshadow/project
docker compose up -d api
docker restart vite-frontend
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Schritt 6: Firewall prüfen

```bash
sudo ufw status
```

Stelle sicher dass Port 80 und 443 offen sind:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Testen

### 1. SSL-Zertifikat prüfen

```bash
curl -I https://deine-domain.de
```

Sollte zurückgeben:
```
HTTP/2 200
server: nginx/1.22.1
strict-transport-security: max-age=63072000
...
```

### 2. SSL Labs Test (empfohlen)

Gehe zu: https://www.ssllabs.com/ssltest/

Gib deine Domain ein und prüfe das Rating (sollte A oder A+ sein).

### 3. Browser-Test

Öffne: https://deine-domain.de

- ✅ Kein Zertifikatsfehler
- ✅ Grünes Schloss in der Adresszeile
- ✅ Login funktioniert
- ✅ Dokument-Upload funktioniert

---

## Auto-Renewal

Let's Encrypt Zertifikate sind 90 Tage gültig. Certbot richtet automatisch einen Cronjob ein:

```bash
# Prüfen ob Auto-Renewal funktioniert
sudo certbot renew --dry-run
```

Sollte ausgeben:
```
Congratulations, all simulated renewals succeeded
```

Der Cronjob läuft automatisch 2x täglich:
```bash
sudo systemctl status certbot.timer
```

---

## Troubleshooting

### Problem: "Unable to find a virtual host"

**Lösung**: Stelle sicher dass `server_name` in Nginx-Config mit deiner Domain übereinstimmt.

### Problem: "DNS resolution failed"

**Lösung**: Warte bis DNS propagiert ist (bis zu 24h, meist < 1h).

```bash
# DNS Propagation prüfen
dig deine-domain.de +short
# oder online:
# https://dnschecker.org
```

### Problem: "Connection refused" bei Certbot

**Lösung**: Nginx muss laufen und Port 80 muss erreichbar sein.

```bash
sudo systemctl status nginx
sudo ufw allow 80/tcp
curl http://deine-domain.de
```

### Problem: Rate Limit von Let's Encrypt

**Limits:**
- 5 fehlgeschlagene Validierungen pro Stunde
- 50 Zertifikate pro Domain pro Woche

**Lösung**: Warte 1 Stunde oder verwende Staging-Server für Tests:

```bash
sudo certbot --nginx --staging -d deine-domain.de
```

---

## Nach erfolgreicher Einrichtung

### 1. DSGVO-Compliance aktualisieren

```bash
nano /home/cmdshadow/project/docs/ops/dsgvo-compliance.md
```

Ändere in Abschnitt 2.6:
```markdown
#### Verschlüsselung in transit (Übertragung)
- ✅ **HTTPS/TLS mit Let's Encrypt**
- ✅ TLS 1.2 und TLS 1.3 aktiv
- ✅ HSTS aktiviert (max-age=63072000)
```

### 2. ROADMAP abhaken

```bash
nano /home/cmdshadow/project/ROADMAP.md
```

Ändere:
```markdown
- [x] **HTTPS mit Let's Encrypt einrichten** ✅ 2025-XX-XX
```

### 3. CHANGELOG aktualisieren

```bash
nano /home/cmdshadow/project/CHANGELOG.md
```

Füge hinzu:
```markdown
### Security
- ✅ HTTPS mit Let's Encrypt eingerichtet
- ✅ TLS 1.2/1.3 mit modernen Ciphers
- ✅ HSTS Header (max-age=2 Jahre)
- ✅ HTTP → HTTPS Redirect
- ✅ Alle Daten verschlüsselt in Transit
```

---

## Referenzen

- Let's Encrypt: https://letsencrypt.org/
- Certbot Dokumentation: https://certbot.eff.org/
- SSL Best Practices: https://ssl-config.mozilla.org/
- Nginx SSL Config Generator: https://mozilla.github.io/server-side-tls/ssl-config-generator/

---

**Stand**: 2025-10-03
**Erstellt von**: Claude Code
**Aktualisiert**: Bei Domain-Registrierung
