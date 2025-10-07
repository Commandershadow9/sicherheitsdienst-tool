# Test-Setup & Testdaten-Verwaltung

## Übersicht

Dieses Dokument beschreibt alle verfügbaren Test-Setups, Login-Daten und Seed-Skripte.

---

## Standard-Login-Daten

### Development/Testing
**Admin-Account:**
- **Email:** `admin@sicherheitsdienst.de`
- **Password:** `password123`
- **Rolle:** ADMIN
- **Name:** Max Administrator

**Manager-Account:**
- **Email:** `manager@sicherheitsdienst.de`
- **Password:** `password123`
- **Rolle:** MANAGER
- **Name:** Lisa Manager

**Employee-Accounts:**
- **thomas.mueller@sec.de** / password123 (Thomas Müller, EMP001)
- **anna.schmidt@sec.de** / password123 (Anna Schmidt, EMP002)
- **michael.wagner@sec.de** / password123 (Michael Wagner, EMP003)
- ... siehe `seedTestScenarios.ts` für vollständige Liste

---

## Seed-Skripte

### 1. Haupt-Seed (seedData.ts) - DEPRECATED?
```bash
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" npm run seed
```

**Status:** Scheint älter zu sein, verwendete alte Struktur
**TODO:** Prüfen ob noch verwendet, ggf. entfernen oder aktualisieren

### 2. Test-Szenarien v1.9.2 (seedTestScenarios.ts) - AKTUELL
```bash
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
npx ts-node src/utils/seedTestScenarios.ts
```

**Erstellt:**
- 12 Benutzer (1 Admin, 1 Manager, 10 Employees)
- 2 Sites (Bürogebäude Zentrum, Einkaufszentrum Nord)
- 4 Schichten (1 heute kritisch, 1 heute OK, 2 zukünftig)
- 4 Abwesenheiten:
  - 1 APPROVED (Michael Wagner, Krankmeldung heute → macht Schicht kritisch)
  - 3 REQUESTED:
    - Julia Becker: 5 Tage Urlaub ✅ (genug Urlaubstage)
    - Stefan Fischer: 10 Tage Urlaub ⚠️ (überschreitet Urlaubstage)
    - Petra Hoffmann: 3 Tage Urlaub 🔍 (betrifft Schicht)
- Employee Workloads für Scoring
- Object Clearances

**Test-Szenarien:**
1. **Kritische Schichten mit intelligentem Scoring:**
   - Dashboard → "Heute kritisch (1)" → "Ersatz suchen"
   - Erwarte: Kandidaten mit Scores (OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED)

2. **Urlaubstage-Saldo bei Genehmigungen:**
   - Dashboard → "Ausstehende Genehmigungen (3)" → Antrag auswählen
   - Erwarte: Urlaubstage-Saldo mit Warnung wenn überschritten

3. **Dashboard Auto-Refresh:**
   - Dashboard → Details öffnen → Ersatz zuweisen → Modal schließen
   - Erwarte: Dashboard aktualisiert automatisch

### 3. Intelligent Replacement Seed (intelligent-replacement-v1.8.0.ts)
```bash
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
npx ts-node prisma/seeds/intelligent-replacement-v1.8.0.ts
```

**Erstellt:**
- Testdaten für Intelligent Replacement Feature (v1.8.0)
- Employee Workloads
- Preferences
- Compliance-Violations

**Status:** Wird möglicherweise von `seedTestScenarios.ts` ersetzt
**TODO:** Konsolidieren oder klar abgrenzen

---

## Database-Setup

### Development Database
```bash
# Connection String
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public"

# Host: localhost
# Port: 5432
# User: admin
# Password: admin123
# Database: sicherheitsdienst_db
# Schema: public
```

### Reset & Seed Workflow
```bash
# 1. Reset Database (löscht ALLE Daten!)
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
npx prisma migrate reset --force

# 2. Apply Migrations
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
npx prisma migrate deploy

# 3. Seed Test Data
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" \
npx ts-node src/utils/seedTestScenarios.ts
```

---

## Test-Umgebungen

### TODO: Klarstellung benötigt!

Es scheint **mehrere** Test-Setups zu geben. Folgendes muss geklärt werden:

1. **Welche Datenbanken gibt es?**
   - Development-DB?
   - Test-DB?
   - Staging-DB?
   - Production-DB?

2. **Welche Login-Daten für welche Umgebung?**
   - Gleiche Credentials überall?
   - Verschiedene Accounts?

3. **Welche Seed-Skripte für welche Umgebung?**
   - Development: `seedTestScenarios.ts`?
   - Testing: Andere Daten?
   - Production: Keine Seeds?

### Empfehlung: Umgebungs-basierte Seeds

**Vorschlag:**
```bash
# Development (umfangreiche Testdaten)
npm run seed:dev

# Testing (minimale Testdaten)
npm run seed:test

# Staging (production-ähnliche Daten)
npm run seed:staging

# Production (KEINE Seeds!)
```

**package.json:**
```json
{
  "scripts": {
    "seed:dev": "ts-node src/utils/seeds/development.ts",
    "seed:test": "ts-node src/utils/seeds/testing.ts",
    "seed:staging": "ts-node src/utils/seeds/staging.ts"
  }
}
```

---

## Test-Daten Übersicht

### Aktueller Stand (seedTestScenarios.ts)

**Benutzer:**
| Name | Email | Rolle | Verwendung |
|------|-------|-------|------------|
| Max Administrator | admin@sicherheitsdienst.de | ADMIN | Haupt-Admin |
| Lisa Manager | manager@sicherheitsdienst.de | MANAGER | Manager-Tests |
| Thomas Müller | thomas.mueller@sec.de | EMPLOYEE | Verfügbar, wenig Workload |
| Anna Schmidt | anna.schmidt@sec.de | EMPLOYEE | Hohe Workload |
| Michael Wagner | michael.wagner@sec.de | EMPLOYEE | **HEUTE KRANK** (macht Schicht kritisch) |
| Julia Becker | julia.becker@sec.de | EMPLOYEE | Urlaubsantrag (genug Tage) |
| Stefan Fischer | stefan.fischer@sec.de | EMPLOYEE | Urlaubsantrag (**überschreitet**) |
| Petra Hoffmann | petra.hoffmann@sec.de | EMPLOYEE | Urlaubsantrag (betrifft Schicht) |
| + 4 weitere | ... | EMPLOYEE | Für Replacement-Pool |

**Sites:**
- Bürogebäude Zentrum (Hauptstraße 1, 10115 Berlin)
- Einkaufszentrum Nord (Nordstraße 50, 10115 Berlin)

**Schichten:**
- **Heute 08:00-16:00:** Tagschicht Bürogebäude (KRITISCH - 1 fehlt)
- **Heute 18:00-02:00:** Nachtschicht Einkaufszentrum (OK)
- **Morgen 08:00-16:00:** Tagschicht Bürogebäude
- **In 3 Tagen:** Tagschicht Einkaufszentrum (Petra beantragt Urlaub)

---

## Häufige Probleme

### Problem: "User not found" beim Login
**Ursache:** Database wurde resetted aber nicht neu geseeded
**Lösung:**
```bash
DATABASE_URL="..." npx ts-node src/utils/seedTestScenarios.ts
```

### Problem: "No critical shifts" im Dashboard
**Ursache:** Testdaten sind veraltet (Schichten sind in der Vergangenheit)
**Lösung:** Seed-Skript verwendet `new Date()` → immer aktuell. Database neu seeden.

### Problem: Verschiedene Login-Daten funktionieren nicht
**Ursache:** Falsches Seed-Skript oder DB nicht aktuell
**Lösung:** Siehe "Reset & Seed Workflow" oben

---

## Checkliste für neue Test-Szenarien

Wenn du neue Testdaten erstellen willst:

- [ ] Seed-Skript in `src/utils/seeds/` erstellen
- [ ] Login-Daten hier dokumentieren
- [ ] Test-Szenarien beschreiben
- [ ] npm Script in package.json hinzufügen
- [ ] README aktualisieren

---

## TODO: Klärungsbedarf

### Offene Fragen (vom User gemeldet)

1. **Mehrere Test-Ebenen?**
   - Welche Test-Setups gibt es aktuell?
   - Welche Login-Daten für welches Setup?
   - Konsolidierung notwendig?

2. **Seed-Skripte konsolidieren?**
   - `seedData.ts` vs `seedTestScenarios.ts` vs `intelligent-replacement-v1.8.0.ts`
   - Welches ist das aktuelle?
   - Welches für welchen Zweck?

3. **Environment-basierte Seeds?**
   - Separate Seeds für dev/test/staging?
   - Wie konfigurieren?

### Nächste Schritte
- [ ] Mit User Test-Setup-Struktur klären
- [ ] Seed-Skripte konsolidieren
- [ ] Umgebungs-basierte Seeds implementieren
- [ ] Standard-Login-Daten festlegen
- [ ] Diese Doku aktualisieren

---

**Letzte Aktualisierung:** 07.10.2025
**Version:** v1.9.2
**Status:** ⚠️ KLÄRUNGSBEDARF - Siehe TODO-Abschnitt
