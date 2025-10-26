# Sicherheitskonzept-Modul – Vollständiges Konzept

**Status:** 🚧 IN ENTWICKLUNG (Phase 1 & 2 ✅ COMPLETE)
**Priorität:** 🔥 KRITISCH (Kernfunktionalität fehlt!)
**Ziel:** Rechtssicheres, vollständiges Sicherheitskonzept-Management im System
**Erstellt:** 26. Oktober 2025
**Letzte Aktualisierung:** 26. Oktober 2025 (v1.21.0 deployed)

---

## ✅ Implementierungs-Status

| Phase | Status | Version | Features |
|-------|--------|---------|----------|
| **Phase 1: MVP** | ✅ COMPLETE | v1.21.0 | ShiftModelEditor, SecurityConceptTab, Backend CRUD |
| **Phase 2: Risiko** | ✅ COMPLETE | v1.21.0 | RiskAssessmentEditor, 5×5 Matrix, Maßnahmen |
| **Phase 3: Compliance** | ❌ PENDING | - | Rechtliche Anforderungen, Auditierung |
| **Phase 4: Personal** | ❌ PENDING | - | Qualifikationsmatrix, Aufgabenprofile |
| **Phase 5: Vollständig** | ❌ PENDING | - | PDF-Export, Freigabe-Workflow |

---

## 🎯 Vision

Ein **vollständiges Sicherheitskonzept-Modul**, das:
- ✅ Alle **rechtlichen Anforderungen** erfüllt (§34a, BewachV, DSGVO, ArbZG, etc.)
- ✅ **Einfach zu bedienen** ist trotz hoher Komplexität
- ✅ **Schrittweise aufgebaut** werden kann (MVP → Full Feature)
- ✅ **Intelligente Planung** ermöglicht (Schichten, MA-Zuweisung)
- ✅ **Vollständig dokumentiert** und auditierbar ist

---

## 🚨 Aktuelle Probleme

### Problem 1: Sicherheitskonzept ist UNSICHTBAR
```
Status Quo:
- Schichten werden "basierend auf Sicherheitskonzept" generiert
- ABER: Es gibt keine Ansicht/Bearbeitung des Konzepts!
- User weiß nicht: Welches Schichtmodell? Welche Aufgaben? Wie viele MA?

Folge:
→ Schichten werden generiert, aber niemand weiß warum/wie
→ Keine Möglichkeit das Konzept zu ändern
→ Nicht rechtssicher dokumentiert
```

### Problem 2: MA-Zuweisung fehlt komplett
```
Status Quo:
- Schichten werden generiert (z.B. 90 Schichten für 30 Tage)
- ABER: Keine MA zugewiesen!
- Im Objekt steht "3 MA fehlen"
- Keine Logik für Auto-Zuweisung

Folge:
→ Alle Schichten sind unbesetzt
→ Manuelle Zuweisung ist mühsam (90× klicken?)
→ Keine Auslastungs-Berechnung
→ Keine Fairness-Verteilung
```

### Problem 3: Rechtliche Anforderungen nicht abgebildet
```
Status Quo:
- Einfaches JSON-Feld "securityConcept" mit minimal-Daten
- Keine Risiko-Beurteilung
- Keine Rechtsgrundlagen dokumentiert
- Keine Notfallpläne
- Keine DSGVO-Dokumentation

Folge:
→ Nicht audit-sicher
→ Nicht rechtssicher
→ Bei Prüfung/Kontrolle: Probleme!
```

---

## 📋 Vollständiger Anforderungs-Katalog

### **PFLICHT-Komponenten** (Rechtlich erforderlich)

#### 1. **Auftragsrahmen/Scope**
```yaml
Felder:
  - objektTyp: (Objekt/Event)
  - zeitraum: (Von/Bis oder "Dauerhaft")
  - ziele: (Textfeld - Was soll erreicht werden?)
  - geltungsbereich: (Welche Bereiche? Welche Zeiten?)
  - hausrecht: (Wer hat Hausrecht? Kontakt?)

Beispiel:
  objektTyp: "Objekt"
  zeitraum: "Dauerhaft (unbefristet)"
  ziele: "Schutz von Personen und Eigentum, Zutrittskontrolle, Brandschutz"
  geltungsbereich: "Gesamtes Gebäude inkl. Tiefgarage, 24/7"
  hausrecht: "Max Mustermann (Geschäftsführer), +49 30 123456"
```

#### 2. **Rechtsgrundlagen**
```yaml
Checkboxen + Referenzen:
  ☑ §34a GewO / BewachV (Bewachungsverordnung)
  ☑ ArbSchG (Arbeitsschutzgesetz)
  ☑ ArbZG (Arbeitszeitgesetz)
  ☑ DSGVO / BDSG (Datenschutz)
  ☐ VStättVO (Versammlungsstättenverordnung) - nur bei Events
  ☑ DGUV Vorschrift 23 (Wach- und Sicherungsdienste)
  ☐ WaffG (Waffengesetz) - nur wenn bewaffnet

Hinweis-Text je Checkbox:
  "§34a GewO: Alle Mitarbeiter müssen Sachkundeprüfung haben"
```

#### 3. **Objekt-/Lagebild**
```yaml
Daten (erweitern bestehende Site-Felder):
  - adresse: ✅ vorhanden
  - lagePlaene: [Upload Grundrisse] NEU
  - fluchtPlaene: [Upload] NEU
  - eingaenge: ["Haupteingang Süd", "Notausgang Nord", "Tiefgarage"] NEU
  - ausgaenge: [Liste] NEU
  - engstellen: ["Treppenhaus A (max 2 Personen)", "Drehkreuz Eingang"] NEU
  - kritischeBereiche: ["Serverraum 3. OG", "Tresorraum UG"] NEU
  - umfeld: "Wohngebiet, ÖPNV: U-Bahn Potsdamer Platz 200m" NEU
  - beleuchtung: "Außenbereich: LED-Strahler, Innen: Dauerbeleuchtung" NEU

UI:
  Tab "Lagebild" mit Upload-Möglichkeit für Pläne
  Interaktive Karte mit markierten Bereichen (später: Drag & Drop)
```

#### 4. **Risikobeurteilung** ⭐ KRITISCH
```yaml
Szenarienliste (vordefiniert + custom):
  - Menschenansammlung/Crowd
  - Aggression/Gewalt
  - Diebstahl/Einbruch
  - Sabotage/Vandalismus
  - Brand
  - Medizinischer Notfall
  - Unwetter/Naturereignis
  - Alleinarbeit (nachts)
  - Waffengefahr
  - Terrorismus (bei KRITIS)
  - Custom (User kann hinzufügen)

Risiko-Matrix je Szenario:
  Eintrittswahrscheinlichkeit: 1 (sehr gering) - 5 (sehr hoch)
  Schadensausmaß: 1 (gering) - 5 (sehr hoch)
  → Risiko = Wahrscheinlichkeit × Ausmaß (1-25)
  → Farbcodierung: 1-6 grün, 7-15 gelb, 16-25 rot

Beispiel:
  Szenario: "Brand"
  Wahrscheinlichkeit: 2 (gering, modernes Gebäude)
  Ausmaß: 5 (sehr hoch, Personengefahr)
  Risiko: 10 (gelb - mittleres Risiko)
  Maßnahmen: "Brandschutzhelfer, Feuerlöscher, Rauchmelder, 2h-Rundgänge"
  Rest-Risiko: 4 (grün - akzeptabel nach Maßnahmen)

UI:
  Risiko-Matrix-Editor mit Drag & Drop
  Auto-Suggestions für Maßnahmen je Szenario
```

#### 5. **Schutz- & Maßnahmenplan**
```yaml
Kategorien:

A) Zugang & Zutrittskontrolle:
   - zugangssystem: "Drehkreuz mit Chipkarte"
   - akkreditierung: "Mitarbeiter-Ausweis, Besucher-Badge"
   - jugendschutz: true/false (bei Events)
   - besucherRegistrierung: true/false

B) Barrieren & Leitsystem:
   - absperrungen: ["Parkplatz: Schranke", "Eingang: Drehkreuz"]
   - leitsystem: "Beschilderung zu Notausgängen, Fluchtwege markiert"

C) Kontrollen (rechtssicher!):
   - taschenkontrollen: true/false
   - personenkontrollen: true/false
   - rechtsgrundlage: "Hausrecht § XYZ" (Pflichtfeld wenn true!)
   - durchfuehrung: "Freiwillig, bei Verweigerung: Kein Zutritt"

D) Rundgänge:
   - intervalle: ["Alle 2 Stunden", "Stündlich nachts"]
   - routen: [Link zu ControlRounds]
   - checkpunkte: [Link zu ControlPoints]

E) Brandschutz:
   - feuerlöscher: "12× Pulverlöscher, geprüft bis 12/2025"
   - rauchmelder: "Vernetzt, Alarmierung an Leitstelle"
   - brandschutzhelfer: "2 pro Schicht (Nachweis erforderlich)"
   - fluchtwegeBreite: "2,5m (DIN 14096 konform)"

F) Technik:
   - videoüberwachung: true/false
   - kameraAnzahl: 24 (wenn true)
   - aufzeichnung: true/false
   - speicherdauer: "72 Stunden (DSGVO-konform)"
   - alarmanlage: "Einbruchmeldeanlage mit Direktschaltung Polizei"
   - beleuchtung: "Bewegungsmelder Außen, Dauerbeleuchtung Innen"

G) Schlüssel-/Zutrittsmanagement:
   - schluesselAnzahl: 12
   - schluesselDepot: "Tresor im Schichtleiter-Büro"
   - übergabeProtokoll: true (Pflicht!)
   - zugangskarten: "RFID-Chipkarten, personalisiert"
```

#### 6. **Personal & Qualifikationen** ⭐ KRITISCH
```yaml
Schichtmodell:
  typ: "2-Schicht" | "3-Schicht" | "24/7" | "Custom"

  schichten: [
    {
      name: "Frühschicht",
      von: "06:00",
      bis: "14:00",
      dauer: 8,
      benoetigteMA: 2,
      wochentage: ["Mo", "Di", "Mi", "Do", "Fr"]
    },
    {
      name: "Spätschicht",
      von: "14:00",
      bis: "22:00",
      dauer: 8,
      benoetigteMA: 2,
      wochentage: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    },
    {
      name: "Nachtschicht",
      von: "22:00",
      bis: "06:00",
      dauer: 8,
      benoetigteMA: 1,
      wochentage: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    }
  ]

Qualifikationen (Pflicht):
  erforderlich: [
    { name: "§34a Sachkundeprüfung", typ: "PFLICHT", nachweis: "Zertifikat IHK" },
    { name: "Ersthelfer", typ: "PFLICHT", nachweis: "BG-Kurs, max 2 Jahre alt" },
    { name: "Brandschutzhelfer", typ: "EMPFOHLEN", nachweis: "Schulung" }
  ]

  optional: [
    { name: "Deeskalationstraining", nachweis: "Zertifikat" },
    { name: "Waffensachkunde (WaffG)", nachweis: "Behördlich", nurWenn: "bewaffnet" }
  ]

ArbZG-Check:
  maxStundenProTag: 10
  maxStundenProWoche: 48
  minRuhezeitStunden: 11
  maxNachtschichtenInFolge: 5
  pausenRegelung: "Nach 6h → 30min Pause (PFLICHT!)"

Berechnung MA-Bedarf:
  gesamtStundenProWoche: summe(schichten[].dauer × schichten[].wochentage.length)
  beispiel:
    Frühschicht: 8h × 5 Tage × 2 MA = 80 MA-Stunden
    Spätschicht: 8h × 7 Tage × 2 MA = 112 MA-Stunden
    Nachtschicht: 8h × 7 Tage × 1 MA = 56 MA-Stunden
    → Gesamt: 248 MA-Stunden/Woche

  benoetigteMAVollzeit: 248h / 40h = 6,2 → 7 MA (inkl. Urlaub/Krankheit: ×1.2 = 9 MA)

  ausgabe: "Empfohlen: 7-9 MA für Vollabdeckung"
```

#### 7. **Aufgaben-/Postenprofile**
```yaml
Posten je Schicht definieren:

posten: [
  {
    id: "P1",
    name: "Pforte/Empfang",
    schicht: "Frühschicht",
    anzahl: 1,
    aufgaben: [
      "Besucherempfang und Registrierung",
      "Ausgabe Besucherausweise",
      "Telefonzentrale",
      "Paketannahme"
    ],
    standort: "Haupteingang",
    ausruestung: ["Funkgerät", "Besucherbuch", "Telefon"],
    checklisten: [Link zu "Schichtbeginn-Checkliste", "Übergabe-Checkliste"]
  },
  {
    id: "P2",
    name: "Rundgang",
    schicht: "Nachtschicht",
    anzahl: 1,
    aufgaben: [
      "Kontrollrundgang alle 2h (siehe Rundgangroute 1)",
      "NFC-Checkpoints scannen",
      "Sichtkontrolle Brandschutzeinrichtungen",
      "Türen-/Fensterkontrolle"
    ],
    standort: "Mobil",
    ausruestung: ["Funkgerät", "Taschenlampe", "NFC-Scanner", "Rundgang-Checkliste"],
    checklisten: [Link zu "Rundgang-Checkliste"]
  }
]

rundgangrouten: [
  {
    id: "RR1",
    name: "Hauptrundgang Nacht",
    intervall: "Alle 2 Stunden",
    dauer: "45 Minuten",
    checkpoints: [Link zu ControlPoints],
    beschreibung: "Start Pforte → UG Tiefgarage → EG alle Türen → OG 1-8 Stichprobe → Dach → zurück Pforte"
  }
]

checklisten: [
  {
    id: "CL1",
    name: "Schichtbeginn-Checkliste",
    items: [
      "☐ Übergabe-Protokoll gelesen",
      "☐ Funkgerät funktionsfähig (Batteriecheck)",
      "☐ Schlüssel vollständig (Depot-Kontrolle)",
      "☐ Alarmanlage Status geprüft",
      "☐ Besondere Vorkommnisse Vortag gelesen"
    ]
  }
]
```

#### 8. **Kommunikation & Eskalation**
```yaml
funkSystem:
  kanaele: [
    { kanal: 1, name: "Hauptkanal Objektschutz", nutzer: "Alle MA" },
    { kanal: 2, name: "Schichtleiter", nutzer: "Nur Schichtleiter" },
    { kanal: 3, name: "Notfall/Alarmierung", nutzer: "Alle + Leitstelle" }
  ]
  fallback: "Mobiltelefon (Nummern siehe Kontaktliste)"

meldeWege:
  intern: [
    { stufe: 1, an: "Schichtleiter", bei: "Kleinere Vorfälle" },
    { stufe: 2, an: "Objektleiter", bei: "Mittlere Vorfälle" },
    { stufe: 3, an: "Einsatzleiter + Geschäftsführung", bei: "Schwere Vorfälle" }
  ]

  extern: [
    { behoerde: "Polizei", telefon: "110", bei: "Straftaten, Gefahr" },
    { behoerde: "Feuerwehr", telefon: "112", bei: "Brand, Rettung" },
    { behoerde: "Ordnungsamt", telefon: "+49 30 123456", bei: "Ruhestörung" }
  ]

protokollierung:
  pflicht: true
  medium: "Digitales Wachbuch (System: Incidents)"
  aufbewahrung: "24 Monate (gesetzliche Pflicht)"
  inhalte: [
    "Datum/Uhrzeit",
    "Schicht/MA",
    "Ereignis-Beschreibung",
    "Maßnahmen ergriffen",
    "Beteiligte Personen",
    "Zeugen (falls vorhanden)",
    "Nachverfolgung erforderlich?"
  ]
```

#### 9. **Notfall & Evakuierung** ⭐ KRITISCH
```yaml
auslöseBedingungen: [
  "Feueralarm (automatisch/manuell)",
  "Bombendrohung",
  "Amoklage",
  "Gasaustritt",
  "Unwetter mit Gebäudeschaden"
]

rollen:
  evakuierungshelfer: [
    { name: "Schichtleiter", aufgabe: "Koordination, Leitstelle informieren" },
    { name: "MA 1", aufgabe: "Evakuierung OG 1-4, Räumung prüfen" },
    { name: "MA 2", aufgabe: "Evakuierung OG 5-8, Räumung prüfen" }
  ]

sammelpunkte: [
  { id: "SP1", ort: "Parkplatz Nordseite", kapazität: 200, für: "Gebäudeteil A" },
  { id: "SP2", ort: "Grünfläche Südseite", kapazität: 150, für: "Gebäudeteil B" }
]

räumwege: [Link zu Fluchtplänen]

zielRäumzeit: "8 Minuten (berechnet für 350 Personen)"

ablauf: [
  "1. Alarm auslösen (manuell oder automatisch)",
  "2. Leitstelle/Feuerwehr alarmieren (Schichtleiter)",
  "3. Durchsage über Lautsprecher (Text: siehe Notfallkarte)",
  "4. Evakuierung starten (Evakuierungshelfer)",
  "5. Gebäude Stockwerk für Stockwerk räumen (von oben nach unten)",
  "6. Personenzählung an Sammelpunkten",
  "7. Rückmeldung an Einsatzleitung",
  "8. Gebäude NICHT wieder betreten bis Freigabe Feuerwehr"
]

afterAction:
  protokoll: true
  debriefing: "48h nach Ereignis mit allen Beteiligten"
  lessonsLearned: "Dokumentation, Konzept-Update falls nötig"
```

#### 10. **Datenschutz (DSGVO)** ⭐ Bei Videoüberwachung PFLICHT!
```yaml
aktiviert: true/false (wenn Kameras/Datenverarbeitung)

wenn true:
  zweck: "Einbruchschutz, Beweissicherung bei Straftaten"

  rechtsgrundlage:
    typ: "Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)"
    begründung: "Schutz von Eigentum und Personen, Verhinderung von Straftaten"

  hinweisschilder:
    vorhanden: true (PFLICHT!)
    standorte: ["Haupteingang", "Tiefgarage", "Alle Gebäudeeingänge"]
    text: "Videoüberwachung gem. Art. 6 Abs. 1 lit. f DSGVO, Verantwortlicher: [Firma], Kontakt: datenschutz@firma.de"

  speicherfristen:
    aufzeichnung: "72 Stunden (3 Tage)"
    automatischeLöschung: true
    ausnahme: "Bei Vorfall: max. 30 Tage (Beweissicherung)"

  zugriff:
    berechtigt: ["Schichtleiter", "Objektleiter", "Geschäftsführung"]
    protokollierung: true (Wer hat wann auf welche Aufnahme zugegriffen?)
    passwortSchutz: true

  technischeOrganisatorischeMaßnahmen (TOMs):
    verschlüsselung: true
    zugriffskontrolle: "Passwort + 2FA"
    räumlich: "Server in verschlossenem Raum"
    protokollierung: "Zugriffs-Logs"

  betroffenenRechte:
    auskunft: "Anfrage an datenschutz@firma.de"
    löschung: "Möglich nach Ablauf Speicherfrist"
    widerspruch: "Möglich, aber Hausverbot bei Verweigerung"

  dsfa (Datenschutz-Folgenabschätzung):
    erforderlich: true (bei umfangreicher Videoüberwachung!)
    durchgeführt: true/false
    ergebnis: [Upload PDF]
```

#### 11. **Arbeits-/Gesundheitsschutz (ArbSchG)**
```yaml
persönlicheSchutzausrüstung (PSA):
  erforderlich: [
    "Warnweste (bei Außeneinsatz)",
    "Sicherheitsschuhe S3",
    "Wetterschutzkleidung (Winter)"
  ]
  bereitstellung: "Arbeitgeber stellt PSA (§3 ArbSchG)"
  unterweisung: "Jährlich (Nachweis erforderlich!)"

alleinarbeit:
  vorhanden: true (Nachtschicht)
  maßnahmen: [
    "Totmann-System (Personen-Notsignal-Anlage)",
    "Regelmäßige Funk-Checks alle 30min",
    "Notfall-Handy mit Direktwahl Leitstelle"
  ]
  gefährdungsBeurteilung: [Upload PDF - PFLICHT bei Alleinarbeit!]

pausen:
  regelung: "Nach 6h Arbeit → 30min Pause (ArbZG §4)"
  pausenräume: "Pausenraum UG (Küche, Sitzgelegenheit)"
  nachtschicht: "Erweiterte Pausenregelung: 2× 20min"

witterungsschutz:
  sommer: "Sonnenschutz, Getränke bereitgestellt"
  winter: "Beheizter Pausenraum, warme Getränke"
  unwetter: "Außenposten bei Gewitter/Sturm nach innen verlegen"

gesundheit:
  ersthelfer: "2 pro Schicht (Pflicht!), Nachweis BG-Kurs"
  verbandkasten: "DIN 13157, Standort: Pforte + Pausenraum"
  defibrillator: "AED vorhanden: Eingangsbereich (Schulung empfohlen)"
  arbeitsmedizin: "Betriebsarzt-Kontakt: Dr. Müller, +49 30 987654"
```

#### 12. **KPIs & Qualität**
```yaml
kennzahlen: [
  {
    name: "Reaktionszeit Alarm",
    ziel: "< 2 Minuten",
    messung: "Automatisch via Alarmsystem",
    auswertung: "Monatlich"
  },
  {
    name: "Patrouillen-Quote",
    ziel: "100% aller geplanten Rundgänge",
    messung: "NFC-Checkpoints",
    auswertung: "Wöchentlich"
  },
  {
    name: "Besetzungsgrad Schichten",
    ziel: "> 95% (max 5% Ausfälle)",
    messung: "Schichtplanung",
    auswertung: "Monatlich"
  },
  {
    name: "Einlass-Durchsatz",
    ziel: "< 30 Sek/Person (Stoßzeiten)",
    messung: "Stichproben",
    auswertung: "Quartalsweise"
  },
  {
    name: "Falschalarme",
    ziel: "< 5 pro Monat",
    messung: "Incident-Reports",
    auswertung: "Monatlich"
  }
]

qualitätssicherung:
  audits: "Quartalsweise durch Objektleiter + Kunde"
  lessonsLearned: "Nach jedem Vorfall (Severity: HIGH/CRITICAL)"
  mitarbeiterFeedback: "Monatliches Teamgespräch"
  kundenFeedback: "Quartalsweise Review-Meeting"
```

#### 13. **Übergaben/Schichtwechsel**
```yaml
handoverCheckliste:
  items: [
    "☐ Übergabe-Protokoll ausgefüllt (digital/Wachbuch)",
    "☐ Besondere Vorkommnisse der Schicht mitgeteilt",
    "☐ Offene Aufgaben kommuniziert",
    "☐ Schlüssel übergeben und protokolliert (Schlüssel-Depot)",
    "☐ Funkgeräte übergeben (Batteriestand geprüft)",
    "☐ Technik-Status geprüft (Kameras, Alarme funktionsfähig?)",
    "☐ Nächste Schicht eingewiesen (neue MA? Besonderheiten?)"
  ]

protokoll:
  digital: true (über Wachbuch/Incidents)
  felder: [
    "Datum/Uhrzeit Übergabe",
    "Abgehende Schicht (MA-Namen)",
    "Kommende Schicht (MA-Namen)",
    "Besondere Vorkommnisse",
    "Offene Aufgaben",
    "Technik-Status (OK/Störung)",
    "Unterschriften (digital)"
  ]

dokumentation:
  aufbewahrung: "24 Monate"
  einsehbar: "Schichtleiter, Objektleiter, Geschäftsführung"
```

#### 14. **Version/Freigabe & Gültigkeit**
```yaml
versionierung:
  aktuelleVersion: "1.3"
  erstellt:
    datum: "01.10.2025"
    durch: "Max Mustermann (Objektleiter)"

  geprüft:
    datum: "05.10.2025"
    durch: "Anna Schmidt (Geschäftsführung)"

  freigegeben:
    datum: "08.10.2025"
    durch: "Dr. Klaus Meier (Geschäftsführung)"
    unterschrift: [Upload Scan/Digital]

  gültigAb: "15.10.2025"
  gültigBis: "14.10.2026" (jährliche Überprüfung PFLICHT!)

revisionshistorie: [
  {
    version: "1.3",
    datum: "01.10.2025",
    änderungen: "Schichtmodell angepasst (Nachtschicht: 2 → 1 MA)",
    grund: "Auslastung optimiert",
    geändertVon: "Max Mustermann"
  },
  {
    version: "1.2",
    datum: "01.07.2025",
    änderungen: "DSGVO-Abschnitt erweitert (neue Kameras)",
    grund: "Gesetzesänderung umgesetzt",
    geändertVon: "Anna Schmidt"
  }
]

änderungsProzess:
  antrag: "Schriftlich (Email) an Objektleiter"
  prüfung: "Innerhalb 7 Tage"
  freigabe: "Geschäftsführung (bei wesentlichen Änderungen)"
  inkrafttreten: "Nach Freigabe + Schulung aller MA"
```

#### 15. **Anhänge**
```yaml
pflichtAnhänge: [
  { name: "Lageplan Objekt", typ: "PDF/Bild", upload: true },
  { name: "Fluchtpläne (alle Stockwerke)", typ: "PDF", upload: true },
  { name: "Brandschutzordnung Teil A+B+C", typ: "PDF", upload: true },
  { name: "Behördenauflagen (falls vorhanden)", typ: "PDF", upload: false },
  { name: "Kontaktlisten (Notfall, Behörden, Kunde)", typ: "PDF/Excel", upload: true },
  { name: "Checklisten (Schichtbeginn, Rundgang, Übergabe)", typ: "PDF", upload: true }
]

optionaleAnhänge: [
  { name: "Gefährdungsbeurteilung (Alleinarbeit)", typ: "PDF" },
  { name: "DSFA (Datenschutz-Folgenabschätzung)", typ: "PDF" },
  { name: "Schulungsnachweise MA", typ: "PDF" },
  { name: "Versicherungspolicen", typ: "PDF" },
  { name: "Vertrag Kunde", typ: "PDF" }
]
```

---

### **OPTIONAL-Komponenten** (Je nach Einsatz)

#### 16. **Verkehrs-/Park-/Absperrkonzept** (nur bei Bedarf)
```yaml
aktiviert: false (default)

wenn true:
  parkplätze:
    anzahl: 50
    reserviert: "10 für Besucher, 5 für Geschäftsführung"
    kontrolle: "Parkscheibe, max 2h Besucherparkdauer"

  zufahrt:
    schranke: true
    kennzeichenErfassung: false (DSGVO-kritisch!)
    lkwAnlieferung: "Nur Mo-Fr 07:00-16:00"

  absperrungen:
    typ: "Poller, Schranke"
    standorte: ["Zufahrt Haupteingang", "Zufahrt Tiefgarage"]
```

#### 17. **VIP/Backstage-Zonen** (nur bei Events)
```yaml
aktiviert: false

wenn true:
  zonen: [
    {
      name: "VIP-Bereich",
      zugang: "Nur mit VIP-Badge",
      kontrolle: "Personenkontrolle, Ausweispflicht",
      kapazität: 50,
      ma: 2
    }
  ]
```

#### 18. **KRITIS/NIS2** (nur bei kritischer Infrastruktur)
```yaml
aktiviert: false (nur für KRITIS-Betreiber!)

wenn true:
  nis2Konform: true
  meldepflichtigeVorfälle: [
    "Cyberangriff auf Systeme",
    "Ausfall kritischer Infrastruktur > 4h",
    "Physischer Angriff auf kritische Bereiche"
  ]
  meldungAn: "BSI (Bundesamt für Sicherheit in der Informationstechnik)"
  meldefrist: "24 Stunden"
```

#### 19. **Barrierefreiheit**
```yaml
aktiviert: false

wenn true:
  rollstuhlgerecht: true
  fluchtwegeBarrierefrei: true
  assistenzBedarf: "Personal für Evakuierung mobilitätseingeschränkter Personen"
  refugien: ["OG 3, Raum 305", "OG 6, Raum 610"]
```

#### 20. **Jugendschutz** (nur bei Events/Veranstaltungen)
```yaml
aktiviert: false

wenn true:
  alterskontrolle: true
  methode: "Ausweiskontrolle am Einlass"
  fsk: "FSK 18" / "FSK 16" / "FSK 12"
  alkoholausschank:
    ab16: "Bier/Wein"
    ab18: "Spirituosen"
  kontrollen: "Stichproben durch Ordnungsamt möglich"
```

#### 21. **Wetter-/Unwetterplan** (bei Outdoor-Events)
```yaml
aktiviert: false

wenn true:
  wetterüberwachung: "DWD Warnungen via App"

  abbruchkriterien: [
    "Windgeschwindigkeit > 100 km/h",
    "Gewitter mit Blitzschlag < 10km Entfernung",
    "Starkregen > 40mm/h",
    "Hagel"
  ]

  maßnahmen: [
    "Veranstaltung unterbrechen",
    "Besucher in sichere Bereiche (Gebäude) leiten",
    "Ggf. Evakuierung/Abbruch"
  ]

  verantwortlich: "Veranstalter + Ordnungsdienst"
```

#### 22. **Dienstwaffenkonzept** (nur wenn bewaffnet!)
```yaml
aktiviert: false (nur mit behördlicher Erlaubnis!)

wenn true:
  erlaubnis:
    behörde: "Ordnungsamt Berlin"
    aktenzeichen: "OA-BW-2025-1234"
    gültigBis: "31.12.2026"

  waffenArt: ["Schreckschusswaffe", "Reizstoffsprühgerät"]

  berechtigt: [
    { ma: "Max Mustermann", waffenschein: "WS-2025-456", gültigBis: "31.12.2025" },
    { ma: "Anna Schmidt", waffenschein: "WS-2025-789", gültigBis: "30.06.2026" }
  ]

  aufbewahrung:
    ort: "Waffenschrank, Schichtleiter-Büro"
    zugang: "Nur berechtigte MA (Schlüssel + Code)"
    protokoll: true (PFLICHT!)

  übergabe:
    schichtwechsel: "Waffe entladen → Waffenschrank → Protokoll"
    protokollFelder: [
      "Datum/Uhrzeit",
      "MA Name",
      "Waffe Seriennummer",
      "Munition Anzahl",
      "Unterschrift"
    ]

  einsatzRegeln:
    nurBei: "Unmittelbare Gefahr für Leib/Leben"
    meldepflicht: "Sofort an Polizei + Geschäftsführung"
    nachbereitung: "Polizeiliche Ermittlung, interne Untersuchung"
```

---

## 🗂️ Datenmodell-Erweiterungen

### Neues Model: `SecurityConcept`

```prisma
model SecurityConcept {
  id                String   @id @default(cuid())
  siteId            String   @unique
  site              Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  // VERSION & FREIGABE
  version           String   @default("1.0")
  status            String   @default("DRAFT") // DRAFT, IN_REVIEW, APPROVED, ACTIVE
  createdBy         String
  createdAt         DateTime @default(now())
  reviewedBy        String?
  reviewedAt        DateTime?
  approvedBy        String?
  approvedAt        DateTime?
  validFrom         DateTime?
  validUntil        DateTime? // Jährliche Überprüfung PFLICHT!

  // 1. AUFTRAGSRAHMEN
  objectType        String   // "OBJEKT" | "EVENT"
  timeframe         Json     // { from, to, permanent: bool }
  goals             String   @db.Text
  scope             String   @db.Text
  houseRightsHolder Json     // { name, contact }

  // 2. RECHTSGRUNDLAGEN
  legalBases        Json     // [{ basis: "§34a", applies: true, notes: "" }]

  // 3. OBJEKT-/LAGEBILD
  sitePlans         Json     // [{ type: "Lageplan", fileId: "..." }]
  evacuationPlans   Json     // [{ floor: "EG", fileId: "..." }]
  entrances         String[] // ["Haupteingang Süd", ...]
  exits             String[]
  bottlenecks       String[]
  criticalAreas     String[]
  surroundings      String   @db.Text
  lighting          String   @db.Text

  // 4. RISIKOBEURTEILUNG ⭐
  riskScenarios     Json     // [{ name, probability: 1-5, impact: 1-5, risk: 1-25, measures: [], residualRisk }]

  // 5. SCHUTZ- & MASSNAHMENPLAN
  accessControl     Json     // { system, accreditation, ... }
  barriers          Json
  inspections       Json     // { bagCheck: bool, bodyCheck: bool, legalBasis: "" }
  patrols           Json     // { intervals, routes, checkpoints }
  fireSafety        Json
  technology        Json     // { cctv, alarm, lighting }
  keyManagement     Json

  // 6. PERSONAL & QUALIFIKATIONEN ⭐⭐⭐
  shiftModel        Json     // { type, shifts: [{ name, from, to, requiredStaff, weekdays }] }
  requiredQuals     Json     // [{ name, type: "PFLICHT"|"EMPFOHLEN", proof }]
  laborLawCheck     Json     // { maxHoursDay, minRestHours, ... }
  staffCalculation  Json     // { totalHoursWeek, requiredFulltime, recommended }

  // 7. AUFGABEN-/POSTENPROFILE
  positions         Json     // [{ id, name, shift, count, tasks, location, equipment, checklists }]
  patrolRoutes      Json
  checklists        Json

  // 8. KOMMUNIKATION & ESKALATION
  radioSystem       Json
  reportingChains   Json
  emergencyContacts Json
  logging           Json

  // 9. NOTFALL & EVAKUIERUNG ⭐
  evacuationPlan    Json     // { triggers, roles, assemblyPoints, evacuationRoutes, targetTime, afterAction }

  // 10. DATENSCHUTZ (DSGVO)
  dataProtection    Json?    // { active, purpose, legalBasis, signs, retention, access, toms, dpia }

  // 11. ARBEITS-/GESUNDHEITSSCHUTZ
  workSafety        Json     // { ppe, loneWork, breaks, weather, health }

  // 12. KPIs & QUALITÄT
  kpis              Json     // [{ name, target, measurement, evaluation }]
  qualityAssurance  Json

  // 13. ÜBERGABEN
  handoverChecklist Json

  // 14. ANHÄNGE
  attachments       Json     // [{ name, type, fileId, required: bool }]

  // OPTIONAL KOMPONENTEN (nur wenn aktiviert)
  trafficConcept    Json?
  vipZones          Json?
  kritis            Json?
  accessibility     Json?
  youthProtection   Json?
  weatherPlan       Json?
  weaponConcept     Json?

  // REVISION HISTORY
  revisionHistory   Json     // [{ version, date, changes, reason, changedBy }]

  // META
  updatedAt         DateTime @updatedAt

  @@index([siteId])
  @@index([status])
}
```

### Site-Model erweitern:

```prisma
model Site {
  // ... existing fields ...

  // NEU: Relation zu SecurityConcept
  securityConcept   SecurityConcept?

  // DEPRECATED (jetzt in SecurityConcept):
  // securityConcept   Json? // ← Wird ersetzt durch Relation!
}
```

---

## 🎨 UI/UX Konzept

### A) Neuer Tab im Objekt-Detail: "Sicherheitskonzept"

```
Objekt-Detail Navigation:
[Übersicht] [Clearances] [Schichten] [Bilder] [Dokumente] [Vorfälle]
[🛡️ Sicherheitskonzept] ← NEU!
```

### B) Sicherheitskonzept-Ansicht (3 Modi)

#### Modus 1: **Übersicht** (Default)
```
┌────────────────────────────────────────────────┐
│ 🛡️ Sicherheitskonzept v1.3                    │
│ Status: ✅ AKTIV (gültig bis 14.10.2026)      │
├────────────────────────────────────────────────┤
│                                                 │
│ 📋 Schnellübersicht:                           │
│ ┌─────────────────────────────────────────────┐│
│ │ Schichtmodell: 3-Schicht-System (24/7)     ││
│ │ MA-Bedarf: 7-9 Vollzeit-MA                 ││
│ │ Aktuell besetzt: 6 MA ⚠️ (3 fehlen)        ││
│ │                                             ││
│ │ Risiko-Level: 🟡 MITTEL (Score: 12/25)     ││
│ │ Kritischste Risiken:                        ││
│ │ • Brand (Risiko: 10) → Maßnahmen aktiv     ││
│ │ • Einbruch (Risiko: 8) → Maßnahmen aktiv   ││
│ │                                             ││
│ │ Compliance:                                 ││
│ │ ✅ §34a GewO                               ││
│ │ ✅ ArbSchG/ArbZG                           ││
│ │ ✅ DSGVO (Videoüberwachung)                ││
│ │ ⚠️ Jährliche Überprüfung fällig in 3 Monaten││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ 🔧 Aktionen:                                   │
│ [Konzept vollständig anzeigen]                 │
│ [Konzept bearbeiten] (nur ADMIN/MANAGER)       │
│ [PDF exportieren]                              │
│ [Revision erstellen] (neue Version)            │
│                                                 │
│ 📊 Schnellzugriff:                             │
│ [Schichtmodell anzeigen]                       │
│ [Risiko-Matrix ansehen]                        │
│ [Notfallplan ansehen]                          │
│ [Checklisten herunterladen]                    │
└────────────────────────────────────────────────┘
```

#### Modus 2: **Vollansicht** (Lesemodus)
```
Akkordeon-Struktur mit 14 Haupt-Sektionen:

▼ 1. Auftragsrahmen/Scope
  Objekt: Objekt | Zeitraum: Dauerhaft
  Ziele: Schutz von Personen und Eigentum...
  [Anzeigen/Ausblenden]

▼ 2. Rechtsgrundlagen
  ✅ §34a GewO / BewachV
  ✅ ArbSchG, ArbZG
  ✅ DSGVO / BDSG
  [Anzeigen/Ausblenden]

▶ 3. Objekt-/Lagebild [Klicken zum Aufklappen]
▶ 4. Risikobeurteilung [10 Szenarien definiert]
▶ 5. Schutz- & Maßnahmenplan
▼ 6. Personal & Qualifikationen ⭐
  Schichtmodell: 3-Schicht-System
  ├─ Frühschicht: 06:00-14:00 (2 MA)
  ├─ Spätschicht: 14:00-22:00 (2 MA)
  └─ Nachtschicht: 22:00-06:00 (1 MA)

  Benötigte MA: 7-9 Vollzeit
  Aktuell: 6 MA ⚠️

  [Schichtmodell bearbeiten]
  [Anzeigen/Ausblenden]

▶ 7. Aufgaben-/Postenprofile
▶ 8. Kommunikation & Eskalation
▶ 9. Notfall & Evakuierung
▶ 10. Datenschutz (DSGVO)
▶ 11. Arbeits-/Gesundheitsschutz
▶ 12. KPIs & Qualität
▶ 13. Übergaben/Schichtwechsel
▶ 14. Version/Freigabe & Gültigkeit
▶ 15. Anhänge [6 Dateien]
```

#### Modus 3: **Bearbeitungs-Modus** (Wizard-Style)
```
┌────────────────────────────────────────────────┐
│ 🛡️ Sicherheitskonzept bearbeiten              │
│ Version 1.3 → 1.4 (Entwurf)                    │
├────────────────────────────────────────────────┤
│                                                 │
│ Fortschritt: ███████░░░░ 70% vollständig       │
│                                                 │
│ Navigation:                                     │
│ ✅ 1. Auftragsrahmen                           │
│ ✅ 2. Rechtsgrundlagen                         │
│ ✅ 3. Objekt-/Lagebild                         │
│ ⚠️ 4. Risikobeurteilung (unvollständig)        │
│ ✅ 5. Schutz- & Maßnahmenplan                  │
│ ✅ 6. Personal & Qualifikationen               │
│ ❌ 7. Aufgaben-/Postenprofile (fehlt!)         │
│ ... (weitere Sektionen)                         │
│                                                 │
│ Aktuell: 6. Personal & Qualifikationen         │
│ ┌─────────────────────────────────────────────┐│
│ │ Schichtmodell: [Dropdown: 3-Schicht ▼]     ││
│ │                                             ││
│ │ Schichten definieren:                       ││
│ │ ┌───────────────────────────────────────┐  ││
│ │ │ Frühschicht                           │  ││
│ │ │ Von: [06:00] Bis: [14:00]             │  ││
│ │ │ Benötigte MA: [2]                     │  ││
│ │ │ Wochentage: ☑Mo ☑Di ☑Mi ☑Do ☑Fr      │  ││
│ │ │              ☐Sa ☐So                  │  ││
│ │ │ [Entfernen]                           │  ││
│ │ └───────────────────────────────────────┘  ││
│ │ [+ Schicht hinzufügen]                    ││
│ │                                             ││
│ │ 💡 Berechnung:                              ││
│ │ Gesamt-Stunden/Woche: 248h                 ││
│ │ Benötigte MA (Vollzeit): 7-9               ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [← Zurück: Maßnahmen] [Weiter: Posten →]      │
│ [Als Entwurf speichern]                        │
└────────────────────────────────────────────────┘
```

---

## 🚀 Implementierungs-Phasen

### **Phase 1: MVP - Basis-Funktionalität** ✅ COMPLETE (v1.21.0)

**Ziel:** Minimalversion produktionsbereit

**Features:**
- [x] SecurityConcept Datenmodell (Prisma Migration) ✅
- [x] Basis CRUD-API (Backend) ✅ 7 Endpoints
- [x] Tab "Sicherheitskonzept" im Objekt-Detail ✅ SecurityConceptTab.tsx
- [x] Übersichts-Ansicht (Modus 1) ✅ View-Mode
- [x] Kern-Komponenten:
  - [x] **Personal & Qualifikationen ⭐** (Schichtmodell!) ✅ ShiftModelEditor.tsx (450 LOC)
  - [x] Auftragsrahmen (Basic - in ShiftModel integriert)
  - [x] Rechtsgrundlagen (Placeholder)
  - [x] Notfallplan (Placeholder)

**Implementiert in:**
- Backend: `backend/src/controllers/securityConceptController.ts` (360 LOC)
- Frontend: `frontend/src/features/sites/components/ShiftModelEditor.tsx` (450 LOC)
- Frontend: `frontend/src/features/sites/components/tabs/SecurityConceptTab.tsx` (280 LOC)

**Priorität:** 🔥 KRITISCH
**Nutzen:** ✅ Schichtmodell ist sichtbar/editierbar → Basis für Schicht-Generierung funktioniert!

---

### **Phase 2: Risiko & Compliance** ✅ COMPLETE (v1.21.0)

**Features:**
- [x] Risikobeurteilung (5×5 Matrix-Editor) ✅ RiskAssessmentEditor.tsx (650 LOC)
- [x] Risikoanalyse (Probability × Impact = Score) ✅
- [x] Maßnahmen-Management (Add/Remove pro Szenario) ✅
- [x] Farb-Codierung (Grün/Gelb/Rot) ✅
- [x] CRUD-Operationen (Add/Edit/Delete) ✅
- [ ] Schutz- & Maßnahmenplan (erweitert) ⏳
- [ ] Datenschutz (DSGVO) ⏳
- [ ] Arbeitsschutz ⏳
- [ ] Vollansicht (Modus 2) ⏳

**Implementiert in:**
- Frontend: `frontend/src/features/sites/components/RiskAssessmentEditor.tsx` (650 LOC)
- Backend: Clearance-Integration in Schicht-Generierung

**Priorität:** 🟡 HOCH
**Nutzen:** ✅ 5×5 Matrix funktioniert! Rechtssicherheit teilweise gegeben.

**Noch offen (Phase 2.5):**
- Erweiterte Compliance-Checkliste
- PDF-Export der Risikoanalyse
- Audit-Log für Änderungen

---

### **Phase 3: Detaillierung** (Woche 4-5)

**Features:**
- [ ] Objekt-/Lagebild (Upload Pläne)
- [ ] Aufgaben-/Postenprofile
- [ ] Kommunikation & Eskalation
- [ ] KPIs & Qualität
- [ ] Übergaben/Schichtwechsel
- [ ] Anhänge-Management

**Priorität:** 🟢 MITTEL
**Nutzen:** Vollständiges Konzept

---

### **Phase 4: Bearbeitung & Workflows** (Woche 6)

**Features:**
- [ ] Bearbeitungs-Modus (Modus 3, Wizard-Style)
- [ ] Version-Management (Draft → Review → Approved)
- [ ] Revisions-Historie
- [ ] PDF-Export (vollständiges Konzept)
- [ ] Freigabe-Workflow (Erstellt → Geprüft → Freigegeben)

**Priorität:** 🟢 MITTEL
**Nutzen:** Professioneller Workflow

---

### **Phase 5: Integration & Intelligenz** (Woche 7+)

**Features:**
- [ ] Integration mit Schicht-Generierung (basierend auf Schichtmodell)
- [ ] **Intelligente MA-Zuweisung** (basierend auf Qualifikationen, Auslastung)
- [ ] Compliance-Checks (ArbZG-Validierung automatisch)
- [ ] KPI-Dashboard (Tracking der definierten KPIs)
- [ ] Templates für Standard-Konzepte (24/7, Tagschicht, Event)

**Priorität:** 🔵 NICE-TO-HAVE
**Nutzen:** Automatisierung, Zeitersparnis

---

## 📦 MVP - Detaillierte Spezifikation

### **Was MUSS ins MVP?**

```yaml
MVP_UMFANG:
  backend:
    - SecurityConcept Model (Prisma)
    - CRUD-API (GET, POST, PUT, DELETE)
    - Basic Validierung

  frontend:
    - Tab "Sicherheitskonzept" im Objekt-Detail
    - Übersichts-Ansicht (Read-Only)
    - Schichtmodell-Editor (!!!)
    - Basis-Formular für Kern-Daten

  pflichtFelder_MVP:
    1_auftragsrahmen:
      - objektTyp
      - zeitraum
      - ziele (Textarea)

    2_rechtsgrundlagen:
      - Checkboxen: §34a, ArbSchG, ArbZG (minimum)

    6_personal: ⭐⭐⭐ WICHTIGSTE SEKTION!
      - schiftModel:
          typ: "2-Schicht" | "3-Schicht" | "24/7" | "Custom"
          schichten: [
            { name, von, bis, benoetigteMA, wochentage[] }
          ]
      - staffCalculation:
          totalHoursWeek: (berechnet)
          requiredFulltime: (berechnet)
          recommended: "7-9 MA"

    9_notfall:
      - auslöseBedingungen: [Textfeld]
      - sammelpunkte: [Liste]
      - zielRäumzeit: String

  optional_MVP:
    - Risikobeurteilung: vereinfacht (nur 3 Top-Risiken)
    - Datenschutz: nur wenn CCTV aktiv
    - Anhänge: Upload später
```

---

## 🎯 Erfolgskriterien

**MVP ist erfolgreich wenn:**
1. ✅ Schichtmodell ist sichtbar im Objekt-Detail
2. ✅ Schichtmodell kann bearbeitet werden
3. ✅ MA-Bedarf wird automatisch berechnet
4. ✅ Schicht-Generierung nutzt Daten aus SecurityConcept
5. ✅ Export als PDF möglich (Basic)

---

## 📝 Nächste Schritte

**Vorschlag:**
1. **Feedback zu diesem Konzept einholen** ← DU BIST HIER!
2. MVP-Spezifikation finalisieren
3. Prisma Migration erstellen (SecurityConcept Model)
4. Backend CRUD-API implementieren
5. Frontend Tab + Schichtmodell-Editor bauen
6. Integration: Schicht-Generierung anpassen

**Frage an dich:**
- Ist dieser Umfang OK?
- Soll ich direkt mit Phase 1 (MVP) starten?
- Oder noch etwas am Konzept ändern?

---

**Erstellt:** 26. Oktober 2025
**Status:** 📋 Wartet auf Feedback
