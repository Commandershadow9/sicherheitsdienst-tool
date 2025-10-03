# DSGVO-Compliance Dokumentation

## 1. Auftragsverarbeitungsvertrag (AVV)

### Hosting-Provider
- **Name**: IP-Projects GmbH & Co. KG
- **Website**: hosterapi.de
- **IP**: 37.114.53.56
- **Standort**: Frankfurt am Main, Deutschland
- **AS**: AS48314

### Status AVV
⚠️ **ERFORDERLICH**: AVV mit IP-Projects GmbH & Co. KG abschließen

**Nächste Schritte:**
1. Kontaktiere hosterapi.de Support
2. Fordere AVV-Vertrag an (Muster gemäß Art. 28 DSGVO)
3. Prüfe Vertrag auf:
   - Auftragsgegenstand und Dauer
   - Art und Zweck der Verarbeitung
   - Art der personenbezogenen Daten
   - Kategorien betroffener Personen
   - Pflichten und Rechte des Verantwortlichen
   - Technische und organisatorische Maßnahmen (TOM)
   - Unterauftragnehmer
   - Unterstützung bei Betroffenenrechten
   - Löschpflichten nach Vertragsende
4. AVV unterschreiben und archivieren

---

## 2. Technische und Organisatorische Maßnahmen (TOM)

### 2.1 Zutrittskontrolle
- ✅ Rechenzentrum des Hosters mit physischer Zugangskontrolle
- ⚠️ Detaillierte TOM-Beschreibung vom Hoster anfordern

### 2.2 Zugangskontrolle
- ✅ Benutzerauthentifizierung mit JWT + Refresh Tokens
- ✅ Passwort-Hashing (bcrypt)
- ✅ Rollenbasierte Zugriffskontrolle (RBAC): ADMIN, MANAGER, DISPATCHER, EMPLOYEE
- ✅ SSH-Zugang mit Passwort (empfohlen: auf Key-basiert umstellen)
- ⚠️ **KRITISCH**: Kein HTTPS - Zugangsdaten werden unverschlüsselt übertragen!

### 2.3 Zugriffskontrolle
- ✅ Dokumentenzugriff nur für:
  - MANAGER: Upload, Download, Löschen
  - DISPATCHER: Download (Read-Only)
  - EMPLOYEE: Nur eigene Dokumente
- ✅ Audit-Logging aller Zugriffe im Backend implementiert
- ✅ Datenbank-Zugriff nur über Backend-API

### 2.4 Trennungskontrolle
- ✅ Mandantentrennung über User-IDs
- ✅ Container-Isolation (Docker)
- ✅ Dokumente je User in separaten Verzeichnissen

### 2.5 Pseudonymisierung
- ⚠️ Nicht implementiert
- Empfehlung: User-IDs sind bereits Pseudonyme (UUIDs)

### 2.6 Verschlüsselung

#### Verschlüsselung at rest (Ruhende Daten)
- ✅ **LUKS-Verschlüsselung** für /srv/documents
- ✅ **Borg-Backup** mit AES-256 Verschlüsselung
  - Passphrase: `documents-backup-2025-secure-key`
  - Repository: /backups/borg/documents
- ✅ Datenbank-Passwörter in .env (nicht versioniert)

#### Verschlüsselung in transit (Übertragung)
- ❌ **KRITISCH**: Kein HTTPS/TLS!
- ❌ Alle Daten (Login, Dokumente, Gesundheitsdaten) werden unverschlüsselt über HTTP übertragen
- 🚨 **SOFORTIGER HANDLUNGSBEDARF**: HTTPS einrichten

### 2.7 Verfügbarkeit und Belastbarkeit
- ✅ Tägliche Backups (03:00 Uhr)
- ✅ Backup-Retention: 7 täglich, 4 wöchentlich, 12 monatlich
- ✅ Backup-Restore getestet und funktionsfähig
- ✅ Docker Health Checks für Backend, DB, Redis
- ✅ Firewall (UFW) schützt vor unberechtigtem Zugriff
- ⚠️ Kein Hochverfügbarkeits-Setup (Single Point of Failure)

### 2.8 Verfahren zur Überprüfung
- ✅ Systemd-Timer für automatische Backups
- ✅ ClamAV scannt täglich (02:30 Uhr) auf Malware
- ⚠️ Monitoring/Alerting nicht eingerichtet
- ⚠️ Regelmäßige Restore-Tests manuell durchführen (empfohlen: quartalsweise)

---

## 3. Verarbeitungsverzeichnis (Art. 30 DSGVO)

### Verarbeitungstätigkeit: Sicherheitsdienst-Verwaltung

**Verantwortlicher:**
- Name: [DEIN UNTERNEHMEN]
- Adresse: [ADRESSE]
- Kontakt: [KONTAKTDATEN]

**Datenschutzbeauftragter:**
- ⚠️ Falls erforderlich: DSB benennen und hier eintragen

**Zweck der Verarbeitung:**
- Verwaltung von Sicherheitspersonal
- Schichtplanung und Zeiterfassung
- Dokumentenverwaltung (Qualifikationen, Krankschreibungen, Sicherheitskonzepte)
- Vorfallmeldungen

**Kategorien betroffener Personen:**
- Mitarbeiter des Sicherheitsdienstes
- Dispatcher
- Manager

**Kategorien personenbezogener Daten:**
- Stammdaten: Name, E-Mail, Telefon, Adresse, Geburtsdatum
- Beschäftigungsdaten: Einstellungsdatum, Beschäftigungsart, Arbeitsplan
- Qualifikationen und Zertifikate
- Gesundheitsdaten: Krankschreibungen (besondere Kategorien gem. Art. 9 DSGVO!)
- Schichtdaten: Arbeitszeiten, Standorte
- Vorfallberichte
- Hochgeladene Dokumente (z.B. Führungszeugnisse, Sicherheitskonzepte)

**Kategorien von Empfängern:**
- Interne Nutzer: ADMIN, MANAGER, DISPATCHER, EMPLOYEE (je nach Rolle)
- Hosting-Provider: IP-Projects GmbH & Co. KG (AVV erforderlich!)

**Übermittlung in Drittländer:**
- Keine

**Speicherdauer:**
- Mitarbeiterdaten: Bis 6 Monate nach Beschäftigungsende (gesetzliche Aufbewahrungspflichten beachten!)
- Backups: 12 Monate (monatliche Retention)
- ⚠️ **Löschkonzept erforderlich** (siehe unten)

**Technische und organisatorische Maßnahmen:**
- Siehe Abschnitt 2 (TOM)

---

## 4. Löschkonzept

### 4.1 Automatische Löschung
- ❌ Nicht implementiert

### 4.2 Manuelle Löschung
- ✅ Dokumente können von MANAGERn gelöscht werden
- ✅ Gelöschte Dokumente werden aus Filesystem entfernt
- ⚠️ Backups: Alte Archive werden nach Retention-Policy gelöscht

### 4.3 Empfohlenes Löschkonzept

**Mitarbeiterdaten:**
- Bei Ausscheiden: Markierung als inaktiv (`isActive: false`)
- Nach 6 Monaten: Vollständige Löschung (oder gemäß gesetzlicher Aufbewahrungspflichten)
- Backups: Nach 12 Monaten automatisch gelöscht

**Implementierung erforderlich:**
```typescript
// Cronjob für automatische Löschung inaktiver User nach 6 Monaten
// Scheduled Task: Monatlich prüfen und löschen
```

---

## 5. Incident Response Plan

### 5.1 Datenpanne-Meldepflicht
- **Frist**: 72 Stunden nach Bekanntwerden an Aufsichtsbehörde melden (Art. 33 DSGVO)
- **Betroffeneninformation**: Wenn hohes Risiko für Betroffene (Art. 34 DSGVO)

### 5.2 Erkennbare Szenarien

#### Szenario 1: Unbefugter Zugriff auf Dokumente
**Erkennung:**
- Ungewöhnliche Login-Aktivitäten
- Rate-Limit-Überschreitungen
- Audit-Log zeigt verdächtige Downloads

**Maßnahmen:**
1. Betroffenen Account sofort deaktivieren (`isActive: false`)
2. JWT-Tokens invalidieren (Neustart Backend oder Redis flush)
3. Alle MANAGER/ADMINs informieren
4. Audit-Logs sichern und analysieren
5. Umfang der Datenpanne ermitteln
6. Datenschutzbehörde kontaktieren (falls > 72h-Frist)
7. Betroffene Mitarbeiter informieren

#### Szenario 2: Ransomware / Malware
**Erkennung:**
- ClamAV schlägt Alarm (Quarantäne)
- Dateien verschlüsselt oder unlesbar

**Maßnahmen:**
1. Server sofort isolieren (Netzwerk trennen)
2. Backup-Restore durchführen
3. Malware-Analyse und Beseitigung
4. Passwörter ändern
5. Incident dokumentieren
6. Datenschutzbehörde informieren

#### Szenario 3: Datenverlust (Hardware-Ausfall)
**Erkennung:**
- LUKS-Volume nicht mehr mountbar
- Datenbank-Korruption

**Maßnahmen:**
1. Borg-Backup restore durchführen
2. Datenintegrität prüfen
3. Betroffene informieren über möglichen Datenverlust
4. Hardware ersetzen

### 5.3 Kontakte im Notfall
- **Datenschutzbehörde Hessen**: poststelle@datenschutz.hessen.de
- **Hosting-Support**: [hosterapi.de Support-Kontakt]
- **Interner Verantwortlicher**: [NAME, TELEFON]

---

## 6. Betroffenenrechte

### Implementierungsstatus

- ✅ **Auskunftsrecht (Art. 15)**: User können eigenes Profil einsehen
- ⚠️ **Datenportabilität (Art. 20)**: Export-Funktion fehlt
- ✅ **Löschrecht (Art. 17)**: MANAGER können Dokumente löschen
- ⚠️ **Widerspruchsrecht (Art. 21)**: Prozess nicht dokumentiert
- ⚠️ **Berichtigung (Art. 16)**: Teilweise (Profil editierbar, aber kein Workflow für Berichtigungsanfragen)

### Empfohlene Implementierung
1. Export-Funktion für User-Daten (JSON/PDF)
2. Selbstlöschung-Request-Funktion
3. Datenschutzerklärung und Einwilligungen dokumentieren

---

## 7. Zusammenfassung: Kritische Punkte

### 🚨 SOFORTIGER HANDLUNGSBEDARF

1. **HTTPS/TLS einrichten**
   - Gesundheitsdaten dürfen NICHT unverschlüsselt übertragen werden!
   - Let's Encrypt mit eigenem Domainnamen
   - Siehe: `/docs/ops/setup-https.md` (noch zu erstellen)

2. **AVV mit Hosting-Provider abschließen**
   - Kontakt: IP-Projects GmbH & Co. KG
   - Ohne AVV ist die Nutzung des Hosters DSGVO-widrig!

### ⚠️ MITTELFRISTIG (1-3 Monate)

3. **Datenschutzdokumentation vervollständigen**
   - Verarbeitungsverzeichnis final ausfüllen
   - Datenschutzerklärung erstellen
   - Einwilligungen dokumentieren

4. **Löschkonzept implementieren**
   - Automatische Löschung inaktiver User
   - Cronjob einrichten

5. **Monitoring & Alerting**
   - Bei verdächtigen Zugriffen benachrichtigen
   - Backup-Erfolg überwachen

### ✅ BEREITS UMGESETZT

- Verschlüsselung at rest (LUKS + Borg)
- Zugriffskontrolle (RBAC)
- Tägliche Backups mit Retention
- Virenschutz (ClamAV)
- Firewall (UFW)
- Container-Härtung (Non-Root)
- Audit-Logging

---

**Stand**: 2025-10-03
**Erstellt von**: Claude Code
**Nächste Überprüfung**: Quartalsweise oder bei Änderungen
