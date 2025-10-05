# Test-Daten Seeds

Dieses Verzeichnis enthält Seed-Skripte zum Erstellen von Test-Daten für verschiedene Features.

## v1.8.0 Intelligent Replacement System Test-Daten 🤖

### Verwendung

```bash
npm run seed:intelligent-replacement
```

### Was wird erstellt?

#### Benutzer

**Admin & Manager:**
- `test-admin@sicherheitsdienst.de` (Passwort: `admin123`)
- `test-manager@sicherheitsdienst.de` (Passwort: `manager123`)

**Test-Kandidaten (alle Passwort: `employee123`):**
1. **Optimal Candidate** (`optimal.candidate@test.de`)
   - Score: 85-100 (OPTIMAL) 🟢
   - Auslastung: 75% (120/160h)
   - Ruhezeit: 26h seit letzter Schicht
   - Präferenz: Tagschichten bevorzugt ✅
   - Fairness: 85/100

2. **Good Candidate** (`good.candidate@test.de`)
   - Score: 70-84 (GOOD) 🟡
   - Auslastung: 60% (96/160h)
   - Nachtschichten: 8 (über Team-Durchschnitt)
   - Präferenz: Nachtschichten bevorzugt (aber flexibel)

3. **Acceptable Candidate** (`acceptable.candidate@test.de`)
   - Score: 50-69 (ACCEPTABLE) 🟠
   - Auslastung: 95% (152/160h)
   - Ruhezeit: 10.5h (knapp)
   - Site-Präferenz: Vermeidet Test-Objekt ⚠️
   - Consecutive Days: 7 (zu viele)

4. **Not Recommended** (`overworked.candidate@test.de`)
   - Score: <50 (NOT_RECOMMENDED) 🔴
   - Auslastung: 115% (184/160h) ❌
   - Wöchentliche Stunden: 52h (> ArbZG 48h) ❌
   - Ruhezeit: 8.5h (< 9h kritisch) ❌
   - Consecutive Days: 9 (viel zu viele) ❌

5. **Absent Employee** (`absent.employee@test.de`)
   - Status: SICKNESS (3 Tage ab morgen)
   - Schicht: Test-Tagschicht morgen 8-18 Uhr

#### Sites/Objekte
- Test-Objekt Replacement (Berlin)

#### Employee Preferences
Alle Kandidaten haben unterschiedliche Präferenzen:
- **Optimal**: Tagschichten bevorzugt, bevorzugt Test-Objekt
- **Good**: Nachtschichten bevorzugt, flexibel
- **Acceptable**: Keine Präferenzen, vermeidet Test-Objekt!
- **Not Recommended**: Tagschichten, aber schon überlastet

#### Employee Workload
Verschiedene Auslastungs-Szenarien (aktueller Monat):
- **Optimal**: 75% Auslastung (120/160h)
- **Good**: 60% Auslastung (96/160h), viele Nachtschichten
- **Acceptable**: 95% Auslastung (152/160h), kritische Ruhezeit
- **Not Recommended**: 115% Auslastung (184/160h), ArbZG-Verstöße

#### Test-Schicht
- **Morgen 8-18 Uhr**: Tagschicht mit 1 Mitarbeiter (Absent Employee)
- Status: PLANNED, benötigt Ersatz

### Test-Anleitung

Nach dem Seeding kannst du:

1. **Als Admin/Manager anmelden**:
   - `test-admin@sicherheitsdienst.de` / `admin123`
   - `test-manager@sicherheitsdienst.de` / `manager123`

2. **Zu Abwesenheiten navigieren**

3. **Abwesenheit "Absent Employee" öffnen**

4. **Bei betroffener Schicht "Ersatz finden" klicken**

5. **Intelligent Replacement Modal öffnet sich** mit:
   - 🎯 Score-Ring (0-100) mit Farbe
   - 📊 Metriken-Grid (Auslastung, Ruhezeit, Nachtschichten, Ersätze)
   - ⚠️ Warnungs-Badges bei Problemen
   - 📈 Detail-Scores aufklappbar (Compliance/Präferenz/Fairness/Workload)
   - 🎨 Farbcodierte Cards:
     - Grün = OPTIMAL
     - Gelb = GOOD
     - Orange = ACCEPTABLE
     - Rot = NOT_RECOMMENDED

6. **Verschiedene Kandidaten vergleichen** und besten auswählen

### Scoring-Algorithmus

Das System bewertet Kandidaten nach:
- **40% Compliance** (ArbZG §5 Ruhezeit, §3 Wochenstunden)
- **30% Präferenzen** (Schichttyp, Site, Stunden-Präferenzen)
- **20% Fairness** (Team-Durchschnitts-Vergleich)
- **10% Workload** (Auslastung 70-90% optimal)

---

## v1.6.0 Absence Management Test-Daten

### Verwendung

```bash
npm run seed:test-absences
```

### Was wird erstellt?

#### Benutzer

**Admin & Manager:**
- `test-admin@sicherheitsdienst.de` (Passwort: `admin123`)
- `test-manager@sicherheitsdienst.de` (Passwort: `manager123`)

**Mitarbeiter (alle Passwort: `employee123`):**
1. Max Mustermann (`max.mustermann@test.de`) - 30 Urlaubstage
2. Anna Schmidt (`anna.schmidt@test.de`) - 28 Urlaubstage
3. Tom Weber (`tom.weber@test.de`) - 30 Urlaubstage
4. Lisa Müller (`lisa.mueller@test.de`) - 25 Urlaubstage
5. Jan Fischer (`jan.fischer@test.de`) - 30 Urlaubstage
6. Sarah Becker (`sarah.becker@test.de`) - 30 Urlaubstage
7. Paul Koch (`paul.koch@test.de`) - 26 Urlaubstage
8. Maria Hoffmann (`maria.hoffmann@test.de`) - 30 Urlaubstage

#### Sites/Objekte
- Shoppingcenter West (Berlin)
- Bürokomplex Nord (Berlin)
- Industriepark Süd (Berlin)
- Krankenhaus Mitte (Berlin)

#### Object Clearances
Verschiedene Mitarbeiter haben unterschiedliche Einweisungen:
- **Max**: Alle Sites (ACTIVE)
- **Anna**: Shopping & Büro ACTIVE, Industrie EXPIRED
- **Tom**: Shopping & Industrie (ACTIVE)
- **Lisa**: Nur Krankenhaus (ACTIVE)
- **Jan**: Shopping & Büro (ACTIVE)
- **Sarah**: Alle außer Krankenhaus (ACTIVE)
- **Paul**: Nur Shopping (ACTIVE)
- **Maria**: Shopping & Industrie (ACTIVE)

#### Schichten (nächste 2 Wochen)
- **Shopping West**: 14 Tagschichten (8-18 Uhr, 2 Mitarbeiter erforderlich)
  - Besetzt: Max + Anna
- **Büro Nord**: 10 Wochentags-Schichten (8-17 Uhr, 1 Mitarbeiter erforderlich)
  - Besetzt: Jan
- **Industrie Süd**: 7 Nachtschichten (22-6 Uhr, 2 Mitarbeiter erforderlich)
  - Besetzt: Tom + Sarah
- **Krankenhaus Mitte**: 7 Tagschichten (6-18 Uhr, 3 Mitarbeiter erforderlich)
  - Besetzt: Lisa (nur 1 von 3 → **kritische Unterbesetzung**)

#### Abwesenheiten (8 Test-Szenarien)

1. **Max - Urlaub REQUESTED**
   - In 1 Woche, 5 Tage
   - Shopping betroffen → Kapazitätswarnung
   - Ersatz verfügbar: Tom, Jan, Sarah, Paul, Maria

2. **Anna - Urlaub APPROVED**
   - Bereits 3 Tage letzten Monat genommen
   - Zeigt vergangene genehmigte Abwesenheit

3. **Tom - Krankmeldung HEUTE**
   - Auto-approved, 3 Tage
   - Industrie betroffen → Kapazitätswarnung
   - Ersatz verfügbar: Max, Maria

4. **Lisa - Sonderurlaub REQUESTED**
   - In 3 Tagen, 2 Tage
   - Krankenhaus betroffen → **kritische Unterbesetzung**
   - Keine Ersatzkandidaten verfügbar!

5. **Jan - Viel Urlaub bereits genommen**
   - 3x genehmigter Urlaub in letzten Monaten (je 7 Tage = 21 Tage)
   - Nur noch 9 Tage verfügbar
   - Zeigt Urlaubstageverbrauch

6. **Sarah - Urlaub REQUESTED über Limit**
   - 35 Tage beantragt
   - **Überschreitet Jahresanspruch** (30 Tage)
   - Warnung im Saldo: -5 Tage verbleibend nach Genehmigung

7. **Paul - Abgelehnte Abwesenheit**
   - Urlaub REJECTED
   - Mit Ablehnungsgrund vom Manager

8. **Maria - Geplanter Krankentermin**
   - Krankmeldung in Zukunft (in 5 Tagen)
   - Von Manager für MA eingetragen

### Test-Features

Das Seed-Script ermöglicht das Testen folgender v1.6.0 Features:

✅ **Detailansicht Modal**
- Klick auf Mitarbeiternamen öffnet vollständige Details
- Zeigt alle relevanten Informationen für Entscheidung

✅ **Urlaubstage-Saldo**
- Berechnung verfügbarer Urlaubstage
- Warnung bei Überschreitung
- Anzeige nach Genehmigung verbleibender Tage

✅ **Objekt-Zuordnungen**
- Anzeige aller ObjectClearances
- Status-Icons (ACTIVE/EXPIRED/REVOKED)
- Gültigkeitszeiträume

✅ **Betroffene Schichten**
- Automatische Erkennung betroffener Schichten
- Kapazitätsberechnung
- Farbliche Warnungen bei Unterbesetzung

✅ **Ersatz-Mitarbeiter-Suche**
- Button "Ersatz finden" bei Kapazitätswarnungen
- Filterung nach ObjectClearance
- Filterung nach Verfügbarkeit (keine Abwesenheiten)

✅ **Krankmeldung Manager-Benachrichtigung**
- Auto-Approval bei SICKNESS
- Email + Push an alle ADMIN/MANAGER
- Manager können Ersatz organisieren

### Nach dem Seeding

Nach dem Ausführen des Scripts kannst du:

1. **Als Admin anmelden**: `test-admin@sicherheitsdienst.de` / `admin123`
2. **Abwesenheiten anzeigen**: Navigiere zur Abwesenheitsverwaltung
3. **Detailansicht testen**: Klicke auf Mitarbeiternamen
4. **Ersatzsuche testen**: Klicke "Ersatz finden" bei Kapazitätswarnungen
5. **Verschiedene Szenarien durchspielen**:
   - Genehmigte/Abgelehnte/Pending Abwesenheiten
   - Urlaubsaldo-Berechnungen
   - Kapazitätswarnungen
   - Objekt-Clearances

### Hinweise

- Das Script verwendet `upsert` für User, sodass es mehrfach ausgeführt werden kann
- Bestehende Daten werden nicht gelöscht, aber Admin/Manager/Mitarbeiter werden aktualisiert
- Sites, Shifts und Absences werden neu erstellt bei jeder Ausführung
- Für vollständigen Reset: `npm run db:reset` (⚠️ löscht ALLE Daten!)
