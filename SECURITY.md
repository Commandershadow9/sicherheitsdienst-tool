# Security Policy

## Unterstützte Versionen

| Version | Unterstützt        |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Sicherheitslücke melden

Wenn Sie eine Sicherheitslücke entdecken, melden Sie diese bitte **nicht** öffentlich über GitHub Issues.

### Meldeprozess

1. **Email an:** security@zerodox.de (oder direkter Kontakt zum Maintainer)
2. **Beschreibung:** Detaillierte Beschreibung der Schwachstelle
3. **Reproduktion:** Schritte zur Reproduktion (falls möglich)
4. **Impact:** Einschätzung des Risikos

### Reaktionszeit

- Bestätigung: innerhalb von 48 Stunden
- Erste Einschätzung: innerhalb von 7 Tagen
- Behebung: abhängig von Schweregrad (kritisch: 7 Tage, hoch: 14 Tage)

## Sicherheitsfeatures

Dieses Projekt implementiert folgende Sicherheitsmaßnahmen:

### Authentifizierung
- JWT-basierte Authentifizierung mit Access/Refresh Tokens
- Rate Limiting für Login-Versuche (5 pro 15 Minuten)
- Sichere Cookie-Konfiguration (HttpOnly, Secure, SameSite)

### Autorisierung
- Role-Based Access Control (RBAC) mit 4 Rollen
- Endpoint-spezifische Berechtigungsprüfungen
- Audit Logging für sensitive Operationen

### Infrastruktur
- HTTPS via Let's Encrypt (Traefik)
- Non-root Docker Container
- Helmet.js Security Headers
- CORS-Konfiguration

### Datenschutz
- LUKS-Verschlüsselung für Dokumentenspeicher
- BorgBackup mit AES-256
- DSGVO-Compliance dokumentiert

## Bekannte Einschränkungen

- SMTP-Credentials sollten über Secrets Manager verwaltet werden (Produktionsempfehlung)
- Rate Limiting basiert auf IP-Adresse (Proxy-Konfiguration beachten)

## Security-bezogene Dokumentation

- [RBAC-Konzept](/docs/security/RBAC.md)
- [Multi-Tenancy](/docs/security/MULTI_TENANCY.md)
- [DSGVO-Compliance](/docs/ops/dsgvo-compliance.md)
