# HTTPS mit Let's Encrypt (Traefik) einrichten

**Status**: Integriert in Docker Compose (Traefik v3)
**Voraussetzung**: Eine Domain (z.B. `sicherheitsdienst-tool.de`) und ein DNS A-Record, der auf die Server-IP zeigt.

## Funktionsweise

Das Projekt nutzt [Traefik](https://traefik.io/) als Reverse Proxy direkt im Docker-Stack.
- **Automatische SSL-Zertifikate**: Traefik holt und erneuert Zertifikate von Let's Encrypt automatisch (via HTTP-Challenge).
- **HTTPS-Redirect**: HTTP-Anfragen (Port 80) werden automatisch auf HTTPS (Port 443) umgeleitet.
- **Keine Host-Konfiguration**: Es ist keine Nginx-Installation auf dem Host notwendig.

---

## Einrichtung

### 1. DNS A-Record setzen

Stelle sicher, dass deine Domain auf die IP des Servers zeigt.
```bash
# DNS prüfen
dig +short deine-domain.de
# Sollte Server-IP zurückgeben
```

### 2. Environment-Variablen setzen

Bearbeite die `.env` Datei im Projekt-Root:

```bash
nano .env
```

Füge hinzu oder passe an:
```ini
# Traefik / HTTPS Konfiguration
DOMAIN=deine-domain.de
ACME_EMAIL=admin@deine-domain.de
```

### 3. Stack neu starten

Starte den Docker-Stack neu, um Traefik zu aktivieren:

```bash
docker compose up -d --remove-orphans
```

Traefik wird nun:
1. Starten und Port 80/443 binden.
2. Ein Zertifikat für `deine-domain.de` bei Let's Encrypt anfordern.
3. Die Datei `letsencrypt/acme.json` anlegen, um Zertifikate zu speichern.

### 4. Verifizierung

Prüfe die Logs von Traefik:
```bash
docker compose logs -f traefik
```
Achte auf Meldungen wie `Configuration loaded from flags` und keine Fehler bei der Zertifikats-Ausstellung.

Test via Curl:
```bash
curl -I https://deine-domain.de
```
Erwartet: `HTTP/2 200` (oder ähnlich) und valide SSL-Handshake.

Test im Browser:
- Öffne `http://deine-domain.de` -> Sollte auf `https://...` weiterleiten.
- Das Schloss-Symbol sollte aktiv sein.

---

## Troubleshooting

### Zertifikat wird nicht ausgestellt

1. **DNS-Check**: Zeigt die Domain wirklich auf die IP?
2. **Ports**: Sind Port 80 und 443 in der Firewall offen?
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
3. **Logs**: `docker compose logs traefik` zeigt oft detaillierte ACME-Fehler (z.B. Rate Limits, Connection Refused).
4. **Acme Storage**: Prüfe ob `letsencrypt/acme.json` existiert und nicht leer ist (nach erstem Erfolg).

### Rate Limits
Let's Encrypt hat Limits (z.B. 5 Zertifikate pro Woche für dieselbe Domain).
Zum Testen kann im `docker-compose.yml` der Staging-Server einkommentiert werden:
```yaml
# - "--certificatesresolvers.myresolver.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

---

## Sicherheitshinweise

- Die Zertifikate liegen in `./letsencrypt/acme.json`. Diese Datei enthält Private Keys!
- Der Ordner `letsencrypt/` ist in `.gitignore` eingetragen und darf **nicht** ins Git committed werden.
- Backups: Sichern Sie den Inhalt von `letsencrypt/` vor Server-Umzügen, um Rate-Limit-Probleme bei Neu-Ausstellung zu vermeiden.