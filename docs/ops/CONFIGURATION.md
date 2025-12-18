# Konfiguration & Umgebungsvariablen

Diese Anwendung benötigt zwingend das Setzen von Umgebungsvariablen für sicherheitskritische Werte. Es gibt keine unsicheren Fallback-Werte im Produktionsmodus.

## Erforderliche Variablen (Produktion)

Folgende Variablen MÜSSEN in der `.env` Datei oder in der Deployment-Umgebung gesetzt sein:

### Sicherheit & Authentifizierung
- `JWT_SECRET`: Secret für Access-Tokens (min. 32 Zeichen)
- `REFRESH_SECRET`: Secret für Refresh-Tokens (min. 32 Zeichen)
- `JWT_EXPIRES_IN`: Gültigkeitsdauer Access-Token (z.B. `7d`)
- `REFRESH_EXPIRES_IN`: Gültigkeitsdauer Refresh-Token (z.B. `30d`)

### Datenbank
- `DATABASE_URL`: Vollständiger Connection-String (z.B. `postgresql://user:pass@db:5432/db?schema=public`)
- `POSTGRES_USER`: DB-Benutzer
- `POSTGRES_PASSWORD`: DB-Passwort
- `POSTGRES_DB`: DB-Name

### Infrastruktur & HTTPS
- `DOMAIN`: Domain-Name für Traefik Routing (z.B. `example.com`)
- `ACME_EMAIL`: E-Mail für Let's Encrypt Zertifikate

### Monitoring & Verwaltung
- `PGADMIN_DEFAULT_EMAIL`: Login für pgAdmin
- `PGADMIN_DEFAULT_PASSWORD`: Passwort für pgAdmin

## Entwicklung

Für die lokale Entwicklung (`docker-compose.dev.yml`) sind Standardwerte vorkonfiguriert, die jedoch **NICHT** für den produktiven Einsatz verwendet werden dürfen.

## Start-Verhalten

Die Anwendung prüft beim Start (`backend/src/config/env.ts`), ob alle Variablen korrekt gesetzt sind.
- **Fehlende Variablen:** Der Start wird abgebrochen (Exit Code 1).
- **Zu kurze Secrets:** Der Start wird abgebrochen, wenn Secrets < 32 Zeichen sind oder Standardwerte wie `changeme` enthalten.
