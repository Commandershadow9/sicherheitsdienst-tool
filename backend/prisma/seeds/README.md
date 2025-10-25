# Gesamt-Seed (Test-Daten)

`npm run seed` erstellt einen vollständigen Demo-Datensatz für alle Kernfeatures:

```bash
npm run seed
# oder mit Docker
docker compose exec api npm run seed
```

## Enthaltene Szenarien

- **Accounts**
  - `admin@sicherheitsdienst.de` / `password123`
  - `manager@sicherheitsdienst.de` / `password123`
  - `dispatcher@sicherheitsdienst.de` / `password123`
  - 10 Mitarbeitende mit unterschiedlichen Rollen & Qualifikationen
  - 5 Replacement-Kandidaten (OPTIMAL/GOOD/ACCEPTABLE/OVERWORKED/ABSENT)
- **Einsatzorte**: Bürogebäude, Einkaufszentrum, Industriepark, Krankenhaus, Rathaus, Test-Objekt Replacement
- **Berechtigungen** (Object Clearances) für unterschiedliche Sites
- **Kontakte & Profile**: Alle Mitarbeitenden erhalten ein EmployeeProfile inkl. Zielstunden & Urlaubsanspruch
- **Kunden & Kontakte**: 5 Kunden mit Ansprechpartnern, Rechnungsadressen, Zahlungszielen
- **Sicherheitskonzept-Templates**: 6 vordefinierte Templates (24/7, Event, Retail, Bau, etc.)
- **Wizard-Daten**: Sicherheitskonzepte, Notfallkontakte, Wizard-Status je Site gesetzt
- **Dokumente & Kalkulationen**
  - Objekt-Dokumente (Dienstanweisung, Notfallplan, Brandschutzordnung) inkl. Download-Dateien
  - Preis-Modelle & Site-Kalkulationen (DRAFT, SENT, ACCEPTED)
- **Site-Zuweisungen**: Objektleiter, Schichtleiter & Mitarbeitende pro Site
- **Präferenzen & Workload**
  - Individuelle `employeePreferences`
  - Aktuelle `employeeWorkload`-Werte (unterschiedliche Auslastungen, Fairness-Scores)
- **Schichten**
  - Kritische Tagschicht heute (unterbesetzt durch 2 Abwesenheiten → „Fehlen: 1“)
  - Abend- und Nachtschichten (verfügbar)
  - Rathaus-/Townhall-Schicht für Veranstaltungsschutz
  - Replacement-Demo: Test-Schicht mit kompletten Scoring-Kandidaten
- **Abwesenheiten**
  - Genehmigte Krankmeldung (macht Tagschicht kritisch)
  - Genehmigter Kurzurlaub
  - Pending-Requests (Urlaub über Kontingent, konfliktbehafteter Antrag)
- **Zeit & Vorfälle**
  - Beispiel-Zeiterfassung
  - Incident „Unberechtigter Zutrittsversuch“
- **Events**
  - Konferenzsicherung im Rathaus
  - Spieltag im Einkaufszentrum

## Schnelltest

1. **Dashboard → Kritische Schichten**  
   „Tagschicht Bürogebäude“ zeigt 2 Abwesenheiten, „Fehlen: 1“.  
   → „Ersatz suchen“ öffnet Intelligent-Replacement-Modal (OPTIMAL/GOOD/…).

2. **Dashboard → Ausstehende Anträge**  
   - Stefan: Urlaub überschreitet Jahreskontingent  
   - Petra: Urlaub mit Schichtkonflikt  
   - Anna/Julia: bereits genehmigte Urlaube

3. **Events / Einsätze**  
   Rathaus & Einkaufszentrum anzeigen, Einsätze mit zugewiesenen Teams prüfen.

4. **Zeiterfassung & Vorfälle**  
   Beispielzeiteintrag & Incident über Thomas Müller.

5. **Objekt-Details**  
   Kundendetail öffnen (z. B. Globex) → Ansprechpartner, verknüpfte Objekte, Wizard-Status prüfen.

6. **Dokumente & Kalkulationen**  
   Objekt „Bürogebäude Zentrum“ → Tab „Dokumente“ (Download testen) & Tab „Kalkulation“ (Status ACCEPTED).

Der Seed kann beliebig oft neu ausgeführt werden; vorherige Daten werden gelöscht (`resetSeedData`). Viel Spaß beim Testen! 🚀
