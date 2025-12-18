# Intelligenter Objekt-Anlage-Wizard – Konzept

**Status:** ✅ **IMPLEMENTIERT** (v1.16.0a-d - Oktober 2025)
**Priorität:** HOCH (ABGESCHLOSSEN)
**Ziel:** Interaktiver, intelligenter Wizard für die komplette Objekt-Anlage inkl. Sicherheitskonzept, MA-Planung & Kalkulation

---

## 🎉 IMPLEMENTATION STATUS - Phase 6 Complete!

**Release:** v1.16.0 (Backend + Frontend + Tests + Dokumentation)
**Fertigstellung:** Oktober 2025
**Aufwand:** 5-6 Tage
**Status:** ✅ Produktionsbereit - Alle Features implementiert!

### Implementierte Features:
- ✅ **8-Schritt-Wizard** vollständig implementiert
- ✅ **Kunden-Management** (Customer Model + CRUD)
- ✅ **Template-System** (SiteTemplate Model + CRUD)
- ✅ **Template-Anpassung** (Templates laden in manuellen Modus) ⭐ USER-REQUEST
- ✅ **API-Integration** (useCreateSite Hook, Payload Transformation)
- ✅ **Validierung** (Step-by-Step + Final Validation)
- ✅ **LocalStorage Auto-Save** (mit Visual Indicator)
- ✅ **Navigation** (Zu neuem Objekt nach Erstellung)
- ✅ **Tests** (50+ Frontend + Backend Tests)
- ✅ **TypeScript** (0 Errors, Strikte Typisierung)

### Implementierte Schritte:
1. ✅ Kunde & Ansprechpartner (mit Inline-Neuanlage)
2. ✅ Objekt-Grunddaten (Name, Adresse, Gebäudetyp, Größe)
3. ✅ Sicherheitskonzept (Template-Auswahl + Anpassung, 582 LOC)
4. ✅ Personal & Zuweisungen (MA-Auswahl, optional)
5. ✅ Kontrollgänge (NFC-Punkte, optional)
6. ✅ Kalkulation (Stundensatz & Preisberechnung)
7. ✅ Dokumente & Notfallkontakte (Emergency Contacts)
8. ✅ Zusammenfassung (Review & Erstellen, 400 LOC)

### Noch NICHT implementiert (aus ursprünglichem Konzept):
- ❌ Google Maps Integration (Adress-Suche erfolgt manuell)
- ❌ Drag & Drop MA-Zuweisung (Einfache Dropdown-Auswahl implementiert)
- ❌ Interaktiver Grundriss für Kontrollpunkte (Liste implementiert)
- ❌ KI-basierte Vorschläge (Manuelle Eingabe)
- ❌ Benchmark-Vergleich bei Kalkulation

**Hinweis:** Diese Features können in zukünftigen Versionen (v1.17+) nachgerüstet werden.

---

## 📚 Implementierungs-Details

**Backend-Dateien:**
- `backend/src/controllers/customerController.ts` (NEU)
- `backend/src/controllers/templateController.ts` (NEU)
- `backend/src/routes/customerRoutes.ts` (NEU)
- `backend/src/routes/templateRoutes.ts` (NEU)
- `backend/prisma/migrations/20251022145323_add_wizard_models_and_customer/` (NEU)

**Frontend-Dateien:**
- `frontend/src/types/wizard.ts` (NEU - WizardData Interface)
- `frontend/src/features/wizard/components/SiteWizard.tsx` (NEU - 250 LOC)
- `frontend/src/features/wizard/components/steps/` (NEU - 8 Step-Komponenten, ~3000 LOC)
- `frontend/src/features/wizard/hooks/useWizardValidation.ts` (NEU - 123 LOC)
- `frontend/src/features/sites/api.ts` (UPDATED - 207 LOC mit Clearance API)
- `frontend/src/features/customers/` (NEU - Customer-Management)
- `frontend/src/features/templates/` (NEU - Template-Management)

**Test-Dateien:**
- `frontend/src/features/wizard/hooks/__tests__/useWizardValidation.test.ts` (25 Tests)
- `frontend/src/features/sites/__tests__/api.test.ts` (15 Tests)
- `backend/src/__tests__/sites.routes.test.ts` (10 Wizard Integration Tests)

---

## ⚠️ Original-Konzept folgt unten (Referenz)

---

## 🎯 Vision

Ein **Schritt-für-Schritt-Assistent**, der den Einsatzleiter durch den gesamten Prozess führt:
- Von der **Kundenanfrage** bis zum **laufenden Objekt**
- **Intelligente Vorschläge** & Auto-Complete
- **Integrierte Planung**: Sicherheitskonzept → MA-Bedarf → Kalkulation → Kontrollgänge
- **Wiederverwendbare Templates** für Standard-Szenarien
- **Drag & Drop** für intuitive Bedienung

---

## 🚨 Aktuelle Probleme

1. **Zu stumpf:** Einfaches Formular, keine Führung
2. **Fehlende Integration:** Objekt, MA-Planung, Kalkulation sind getrennt
3. **Kein Kunden-Management:** Kunde muss jedes Mal neu eingetragen werden
4. **Keine Intelligenz:** Keine Vorschläge, keine Auto-Complete, keine Templates
5. **Umständlich:** Viele separate Schritte nötig

---

## 👤 User Journey (Einsatzleiter)

### Ausgangssituation
**Kunde ruft an:** "Wir brauchen Sicherheitsdienst für unser Bürogebäude, 24/7 Bewachung"

### Idealer Workflow
1. **Kunde erfassen/auswählen** → System schlägt bestehende Kunden vor
2. **Objekt-Grunddaten** → Google Maps Integration, Adresse auto-complete
3. **Anforderungen definieren** → Vorlagen (24/7, Tagschicht, Events), Drag & Drop
4. **Sicherheitskonzept erstellen** → System schlägt MA-Bedarf vor basierend auf Anforderungen
5. **MA-Planung** → Schichtmodell auswählen, MA zuweisen
6. **Kontrollgänge planen** → Template oder individuell
7. **Kalkulation erstellen** → Auto-Berechnung basierend auf Konzept
8. **Angebot versenden** → PDF + Email direkt aus Wizard
9. **Bei Annahme:** Objekt wird aktiv, Schichten geplant

---

## 🧩 Wizard-Architektur

### Zwei Modi

#### Modus 1: **Express-Modus** (Bestehendes Objekt übernehmen)
- Für Objekte, die bereits extern geplant sind
- Schnelles Eintragen aller Daten
- Validierung am Ende
- **Optional:** Nur wenn wirklich nötig (zu bewerten)

#### Modus 2: **Guided-Modus** ⭐ (Empfohlen)
- Interaktiver Schritt-für-Schritt-Wizard
- Intelligente Vorschläge bei jedem Schritt
- Integration aller Komponenten
- **Standard-Workflow**

---

## 📋 Wizard-Schritte (Guided-Modus)

### Schritt 1: **Kunde & Ansprechpartner**
**Ziel:** Kunde erfassen oder auswählen

**Features:**
- 🔍 **Kunden-Suche:** Typeahead mit Fuzzy-Search (Firma, Name, Email)
- ➕ **Neuer Kunde:** Inline-Formular öffnen
- 👥 **Ansprechpartner:** Mehrere Kontakte möglich
- 📝 **Kunde-spezifische Notizen:** "Besonderheiten, Verträge, Historie"
- 🔄 **Bestehendes Objekt kopieren:** Falls Kunde bereits andere Objekte hat

**Datenmodell:**
```prisma
model Customer {
  id              String   @id @default(cuid())
  companyName     String   @unique
  industry        String?  // z.B. "Einzelhandel", "Industrie", "Bürogebäude"
  taxId           String?  @unique

  // Haupt-Ansprechpartner
  primaryContact  Json     // { name, email, phone, position }

  // Weitere Ansprechpartner
  contacts        Json[]   // Array von Kontakten

  // Adresse (Firmensitz)
  address         String
  city            String
  postalCode      String
  country         String   @default("Deutschland")

  // Rechnungsadresse (falls abweichend)
  billingAddress  Json?

  // Vertragsdaten
  paymentTerms    String   @default("30 Tage netto")
  discount        Decimal? @db.Decimal(5,2) // z.B. 5% Stammkunden-Rabatt

  // Historie
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  sites           Site[]

  @@index([companyName])
}
```

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 1/8: Kunde & Ansprechpartner     │
├────────────────────────────────────────────┤
│                                            │
│  🔍 Kunde suchen oder neu anlegen          │
│  ┌──────────────────────────────────────┐ │
│  │ Firma, Name oder Email...        [🔍]│ │
│  └──────────────────────────────────────┘ │
│                                            │
│  💡 Vorschläge:                            │
│  ┌──────────────────────────────────────┐ │
│  │ ✓ Messe Berlin GmbH                  │ │
│  │   2 bestehende Objekte               │ │
│  ├──────────────────────────────────────┤ │
│  │ ✓ Berlin Event Services              │ │
│  │   1 bestehendes Objekt               │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [+ Neuer Kunde anlegen]                  │
│                                            │
│  Falls ausgewählt:                         │
│  ┌──────────────────────────────────────┐ │
│  │ 🏢 Messe Berlin GmbH                 │ │
│  │ 📍 Messedamm 22, 14055 Berlin        │ │
│  │ 👤 Max Mustermann (Leiter Sicherheit)│ │
│  │ 📧 max@messe-berlin.de               │ │
│  │ 📞 +49 30 1234567                    │ │
│  │                                       │ │
│  │ [Bearbeiten] [Anderen Kontakt wählen]│ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [Zurück]              [Weiter →]         │
└────────────────────────────────────────────┘
```

---

### Schritt 2: **Objekt-Grunddaten**
**Ziel:** Objekt-Informationen erfassen

**Features:**
- 🗺️ **Google Maps Integration:** Adresse suchen, Marker setzen
- 📍 **Geo-Koordinaten:** Automatisch aus Maps
- 🏢 **Gebäude-Typ:** Dropdown (Büro, Industrie, Einzelhandel, Event, Baustelle)
- 📏 **Objektgröße:** Quadratmeter, Stockwerke, Zugänge
- 🔄 **Template laden:** Falls Kunde bereits Objekt hat

**UI mit Google Maps:**
```
┌────────────────────────────────────────────┐
│  Schritt 2/8: Objekt-Grunddaten           │
├────────────────────────────────────────────┤
│                                            │
│  Objekt-Name:                              │
│  ┌──────────────────────────────────────┐ │
│  │ Bürogebäude Potsdamer Platz          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Adresse: 🗺️                               │
│  ┌──────────────────────────────────────┐ │
│  │ Potsdamer Straße 1...         [Suche]│ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [Google Maps Karte mit Marker]           │
│  ┌──────────────────────────────────────┐ │
│  │          🗺️ KARTE                    │ │
│  │     [Marker verschiebbar]            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Gebäude-Typ:                              │
│  ○ Bürogebäude  ○ Industrie  ○ Einzelhandel│
│  ○ Event-Location  ○ Baustelle  ○ Sonstiges│
│                                            │
│  Objektgröße:                              │
│  ┌─────┐ m²  ┌─────┐ Stockwerke           │
│  │5000 │     │  8  │                      │
│  └─────┘     └─────┘                      │
│                                            │
│  💡 Beschreibung (Optional):               │
│  ┌──────────────────────────────────────┐ │
│  │ Modernes Bürogebäude mit...          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [← Zurück]            [Weiter →]         │
└────────────────────────────────────────────┘
```

---

### Schritt 3: **Anforderungen & Sicherheitskonzept**
**Ziel:** Bewachungskonzept definieren

**Features:**
- 📋 **Vorlagen:** 24/7, Tagschicht, Nachtschicht, Veranstaltung, Baustelle
- 🕐 **Zeitmodell:** Drag & Drop Timeline für Schichtplanung
- 👮 **Benötigte Qualifikationen:** Multi-Select (34a, Hundführer, Brandschutz)
- 🎯 **Aufgaben:** Checkboxen (Zutrittskontrolle, Rundgänge, Empfang, etc.)
- 🤖 **Auto-Berechnung:** System schlägt MA-Anzahl vor

**UI mit Timeline:**
```
┌────────────────────────────────────────────┐
│  Schritt 3/8: Sicherheitskonzept          │
├────────────────────────────────────────────┤
│                                            │
│  📋 Vorlage auswählen (Optional):         │
│  ┌──────────────────────────────────────┐ │
│  │ [24/7 Objektschutz] [Tagschicht]     │ │
│  │ [Nachtschicht] [Event] [Baustelle]   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🕐 Zeitmodell (Wochenstunden):           │
│  ┌──────────────────────────────────────┐ │
│  │ Mo-Fr: [━━━━━━━━━━━━━━━━━━━━━━━━]    │ │
│  │        6 Uhr ────────── 22 Uhr       │ │
│  │        └─ Tagschicht (16h) ─┘        │ │
│  │                                       │ │
│  │ Mo-So: [━━━━━━━━━━━━━━━━━━━━━━━━]    │ │
│  │        22 Uhr ────────── 6 Uhr       │ │
│  │        └─ Nachtschicht (8h) ─┘       │ │
│  │                                       │ │
│  │ Gesamt: 168 Std./Woche (24/7)        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  👮 Qualifikationen:                       │
│  ☑ 34a (NSL) ☑ Erste Hilfe ☐ Brandschutz │
│  ☐ Hundführer ☐ Waffenschein              │
│                                            │
│  🎯 Aufgaben:                              │
│  ☑ Zutrittskontrolle ☑ Rundgänge          │
│  ☑ Empfang ☐ Parkhaus-Überwachung         │
│                                            │
│  🤖 Empfohlener MA-Bedarf:                 │
│  ┌──────────────────────────────────────┐ │
│  │ ✓ 3 Mitarbeiter pro Schicht          │ │
│  │ ✓ 1 Schichtleiter                    │ │
│  │ ✓ 1 Objektleiter (Koordination)      │ │
│  │                                       │ │
│  │ 💡 System-Vorschlag basierend auf:    │ │
│  │    • 5000m² Objektgröße              │ │
│  │    • 24/7 Bewachung                  │ │
│  │    • 8 Stockwerke                    │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [← Zurück]            [Weiter →]         │
└────────────────────────────────────────────┘
```

---

### Schritt 4: **MA-Planung & Schichtmodell**
**Ziel:** Konkrete MA-Planung

**Features:**
- 📅 **Schichtmodell:** 2-Schicht, 3-Schicht, Wechselschicht
- 👥 **MA zuweisen:** Drag & Drop verfügbarer MA
- ⚖️ **Auslastungs-Check:** System warnt bei Überbelastung
- 🔄 **Auto-Rotation:** System plant MA-Rotation
- 💡 **Vorschläge:** Beste MA für dieses Objekt (basierend auf Qualifikationen)

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 4/8: MA-Planung                  │
├────────────────────────────────────────────┤
│                                            │
│  📅 Schichtmodell:                         │
│  ● 2-Schicht (Tag/Nacht)                   │
│  ○ 3-Schicht (Früh/Spät/Nacht)             │
│  ○ Wechselschicht (Wöchentlich)            │
│                                            │
│  👥 MA-Pool (verfügbar):                   │
│  ┌────────────────────┬─────────────────┐ │
│  │ 📋 Verfügbar (12)  │ 🎯 Zugewiesen   │ │
│  ├────────────────────┼─────────────────┤ │
│  │ 👤 Thomas Müller   │ Tagschicht:     │ │
│  │    34a ✓ 95% frei  │ 👤 Max Schmidt  │ │
│  │ [Zuweisen →]       │ 👤 Anna Weber   │ │
│  │                    │ 👤 Peter Klein  │ │
│  │ 👤 Julia Schmidt   │                 │ │
│  │    34a ✓ 80% frei  │ Nachtschicht:   │ │
│  │ [Zuweisen →]       │ 👤 Lisa Braun   │ │
│  │                    │ 👤 Tom Wagner   │ │
│  │ Drag & Drop →      │ 👤 Jan Becker   │ │
│  └────────────────────┴─────────────────┘ │
│                                            │
│  💡 System-Empfehlungen:                   │
│  • Thomas Müller: Ideal (34a, 5J Erfahrung)│
│  • Julia Schmidt: Gut (34a, nähe Objekt)   │
│                                            │
│  ⚠️ Auslastungs-Check:                     │
│  ✓ Alle MA unter 85% Auslastung           │
│  ✓ Keine Überschneidungen                 │
│                                            │
│  [← Zurück]  [MA später]  [Weiter →]      │
└────────────────────────────────────────────┘
```

---

### Schritt 5: **Kontrollgänge & NFC-Punkte**
**Ziel:** Rundenwesen planen

**Features:**
- 🗺️ **Interaktiver Grundriss:** Kontrollpunkte auf Karte platzieren
- 📋 **Vorlagen:** Standard-Rundgang, Feuer-Check, Nacht-Runde
- 🏷️ **NFC-Tags generieren:** Auto-Generate UUIDs
- ⏱️ **Intervalle:** Alle 2 Std., stündlich, nach Bedarf
- 🔄 **Reihenfolge:** Drag & Drop für optimale Route

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 5/8: Kontrollgänge               │
├────────────────────────────────────────────┤
│                                            │
│  📋 Brauchen Sie Kontrollgänge?            │
│  ● Ja, Rundenwesen einrichten              │
│  ○ Nein, nur stationäre Bewachung          │
│                                            │
│  🗺️ Kontrollpunkte platzieren:            │
│  ┌──────────────────────────────────────┐ │
│  │      [GRUNDRISS / KARTE]             │ │
│  │                                       │ │
│  │  📍 Punkt 1: Haupteingang            │ │
│  │  📍 Punkt 2: Tiefgarage (EG)         │ │
│  │  📍 Punkt 3: Dachterrasse            │ │
│  │                                       │ │
│  │  [+ Punkt hinzufügen]                │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🏷️ NFC-Tags:                              │
│  ☑ Auto-Generate (QR-Code Fallback)       │
│                                            │
│  ⏱️ Intervall:                             │
│  ○ Stündlich  ● Alle 2 Std.  ○ Alle 4 Std.│
│                                            │
│  🔄 Optimierte Route:                      │
│  Haupteingang → Tiefgarage → Dachterrasse  │
│  [Route bearbeiten]                        │
│                                            │
│  [← Zurück]  [Überspringen]  [Weiter →]   │
└────────────────────────────────────────────┘
```

---

### Schritt 6: **Kalkulation & Preismodell**
**Ziel:** Angebot erstellen

**Features:**
- 💰 **Auto-Kalkulation:** Basierend auf Schritten 3-5
- 📊 **Preismodell auswählen:** Standard, Premium, Custom
- 🔧 **Manuelle Anpassungen:** Override einzelner Werte
- 📈 **Vergleich:** Ähnliche Objekte als Benchmark
- 💡 **Gewinnmarge-Vorschlag:** System empfiehlt Marge

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 6/8: Kalkulation                 │
├────────────────────────────────────────────┤
│                                            │
│  💰 Auto-Kalkulation (empfohlen):         │
│  ┌──────────────────────────────────────┐ │
│  │ Basierend auf Ihren Angaben:         │ │
│  │                                       │ │
│  │ Personalkosten:    15.668 € / Monat  │ │
│  │ Gemeinkosten (12%): 1.880 € / Monat  │ │
│  │ Gewinnmarge (15%):  2.632 € / Monat  │ │
│  │ ─────────────────────────────────     │ │
│  │ Gesamt (netto):    20.180 € / Monat  │ │
│  │ MwSt (19%):         3.834 € / Monat  │ │
│  │ ─────────────────────────────────     │ │
│  │ Gesamt (brutto):   24.014 € / Monat  │ │
│  │                                       │ │
│  │ 📅 Jahresvertrag: 288.168 € (brutto) │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  📊 Vergleich mit ähnlichen Objekten:     │
│  ┌──────────────────────────────────────┐ │
│  │ • Bürogebäude XY: 22.500 € / Monat   │ │
│  │ • Industriepark Z: 18.900 € / Monat  │ │
│  │                                       │ │
│  │ 💡 Ihr Angebot liegt im Durchschnitt │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🔧 Anpassungen (Optional):               │
│  [Preismodell ändern] [Manuell bearbeiten]│
│                                            │
│  [← Zurück]            [Weiter →]         │
└────────────────────────────────────────────┘
```

---

### Schritt 7: **Dokumente & Notfallkontakte**
**Ziel:** Letzte Details

**Features:**
- 📄 **Dokumente hochladen:** Drag & Drop (Verträge, Pläne)
- 📞 **Notfallkontakte:** Mehrere Kontakte möglich
- 📝 **Interne Notizen:** Für Objektleiter
- 🔔 **Benachrichtigungen:** Email bei kritischen Events

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 7/8: Dokumente & Notfälle        │
├────────────────────────────────────────────┤
│                                            │
│  📄 Dokumente hochladen (Drag & Drop):    │
│  ┌──────────────────────────────────────┐ │
│  │  Dateien hier ablegen oder           │ │
│  │  [Dateien auswählen]                 │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Hochgeladen:                              │
│  ✓ Vertrag_Kunde.pdf (250 KB)             │
│  ✓ Grundriss_EG.pdf (1.2 MB)              │
│                                            │
│  📞 Notfallkontakte:                       │
│  ┌──────────────────────────────────────┐ │
│  │ Name: Hausmeister                    │ │
│  │ Telefon: +49 30 9876543              │ │
│  │ [Entfernen]                          │ │
│  ├──────────────────────────────────────┤ │
│  │ Name: Objektleiter Kunde             │ │
│  │ Telefon: +49 30 1234567              │ │
│  │ [Entfernen]                          │ │
│  └──────────────────────────────────────┘ │
│  [+ Kontakt hinzufügen]                   │
│                                            │
│  📝 Interne Notizen (Optional):           │
│  ┌──────────────────────────────────────┐ │
│  │ Besonderheiten, Hinweise...          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [← Zurück]            [Weiter →]         │
└────────────────────────────────────────────┘
```

---

### Schritt 8: **Zusammenfassung & Abschluss**
**Ziel:** Review & Versenden

**Features:**
- 📋 **Vollständige Übersicht:** Alle Schritte zusammengefasst
- ✅ **Validierung:** System prüft Vollständigkeit
- 📧 **Angebot versenden:** Direkt an Kunde
- 💾 **Als Entwurf speichern:** Später weiterbearbeiten
- 🚀 **Objekt aktivieren:** Bei Annahme direkt live

**UI:**
```
┌────────────────────────────────────────────┐
│  Schritt 8/8: Zusammenfassung             │
├────────────────────────────────────────────┤
│                                            │
│  ✅ Validierung: Alle Pflichtfelder OK    │
│                                            │
│  📋 Zusammenfassung:                       │
│  ┌──────────────────────────────────────┐ │
│  │ 🏢 Kunde: Messe Berlin GmbH          │ │
│  │ 📍 Objekt: Bürogebäude Potsdamer Pl. │ │
│  │ 🕐 24/7 Bewachung (168 Std./Woche)   │ │
│  │ 👥 6 MA (3 Tag, 3 Nacht)             │ │
│  │ 🏷️ 3 Kontrollpunkte (alle 2 Std.)    │ │
│  │ 💰 20.180 € / Monat (netto)          │ │
│  │ 📄 2 Dokumente hochgeladen            │ │
│  │ 📞 2 Notfallkontakte                  │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Was möchten Sie tun?                      │
│                                            │
│  [📧 Angebot per Email senden]             │
│  [📄 PDF herunterladen]                    │
│  [💾 Als Entwurf speichern]                │
│  [🚀 Objekt direkt aktivieren]             │
│                                            │
│  [← Zurück]      [Bearbeiten]  [Fertig]   │
└────────────────────────────────────────────┘
```

---

## 🤖 Intelligente Features

### 1. **Auto-Complete & Suggestions**
- **Adressen:** Google Places API
- **Kunden:** Fuzzy-Search in bestehenden Kunden
- **MA-Vorschläge:** Basierend auf Qualifikationen & Verfügbarkeit
- **Preisvorschläge:** Basierend auf ähnlichen Objekten

### 2. **Templates & Vorlagen**
**Vordefinierte Szenarien:**
- 24/7 Objektschutz (Standard)
- Tagschicht (Mo-Fr, 6-22 Uhr)
- Nachtschicht (Mo-So, 22-6 Uhr)
- Event-Security (flexibel)
- Baustellen-Bewachung (temporär)

**Jedes Template enthält:**
- Empfohlene Schichtmodelle
- Benötigte Qualifikationen
- Typische Aufgaben
- Kalkulationsbasis
- Kontrollgang-Vorlagen

### 3. **Drag & Drop Interfaces**
- **MA-Zuweisung:** Drag MA von Pool zu Schicht
- **Kontrollpunkte:** Drag Marker auf Grundriss
- **Dokumente:** Drag Files in Upload-Zone
- **Schicht-Planung:** Drag Timeline-Blöcke

### 4. **Validierung & Warnungen**
- ⚠️ Fehlende Pflichtfelder (rot markiert)
- 💡 Empfohlene Felder (gelb)
- ✅ Vollständigkeit-Check (grün)
- 🔍 Plausibilitäts-Check (z.B. zu wenig MA)

### 5. **Kontext-basierte Hilfe**
- 💬 Tooltips bei jedem Feld
- 📺 Video-Tutorials (optional)
- 📖 Hilfe-Sidebar mit Beispielen
- 🤖 Chatbot-Integration (später)

---

## 🗂️ Datenmodell-Erweiterungen

### Neues Model: **Customer** (Kunden-Verwaltung)
```prisma
model Customer {
  id              String   @id @default(cuid())
  companyName     String   @unique
  industry        String?
  taxId           String?  @unique
  primaryContact  Json
  contacts        Json[]
  address         String
  city            String
  postalCode      String
  country         String   @default("Deutschland")
  billingAddress  Json?
  paymentTerms    String   @default("30 Tage netto")
  discount        Decimal? @db.Decimal(5,2)
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  sites           Site[]

  @@index([companyName])
}
```

### Site-Model erweitern:
```prisma
model Site {
  // ... existing fields ...

  // Neue Felder für Wizard
  customerId      String?
  customer        Customer? @relation(fields: [customerId], references: [id])

  buildingType    String?   // "OFFICE", "INDUSTRIAL", "RETAIL", "EVENT", "CONSTRUCTION"
  floorCount      Int?
  squareMeters    Int?
  geoLat          Decimal?  @db.Decimal(10, 8)
  geoLng          Decimal?  @db.Decimal(11, 8)

  // Sicherheitskonzept
  securityConcept Json?     // { tasks: [], intervals: [], shiftModel: "" }

  // Wizard-Status
  wizardCompleted Boolean   @default(false)
  wizardStep      Int       @default(0)
}
```

### Neue Templates:
```prisma
model SiteTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  buildingType    String

  // Template-Daten
  hoursPerWeek    Int
  shiftModel      String   // "2-SHIFT", "3-SHIFT", "ROTATING"
  requiredStaff   Int
  qualifications  String[] // ["34a", "FIRST_AID"]
  tasks           String[] // ["ACCESS_CONTROL", "PATROLS"]

  // Kalkulations-Basis
  basePrice       Decimal  @db.Decimal(10, 2)

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

---

## 🎨 UI/UX Komponenten

### Wizard Container
```tsx
<WizardContainer
  steps={8}
  currentStep={currentStep}
  onNext={handleNext}
  onBack={handleBack}
  onSave={handleSaveDraft}
  canProceed={isStepValid}
>
  {renderStep()}
</WizardContainer>
```

### Step Indicator
```tsx
<StepIndicator steps={[
  { label: "Kunde", completed: true },
  { label: "Objekt", completed: true },
  { label: "Konzept", active: true },
  { label: "MA", completed: false },
  // ...
]} />
```

### Smart Suggestions
```tsx
<SmartSuggestions
  type="customer"
  onSelect={handleSelectCustomer}
  showCreateNew={true}
/>
```

---

## 📱 Responsiveness

- **Desktop:** Full Wizard mit allen Features
- **Tablet:** Vereinfachte Ansicht, wichtigste Felder
- **Mobile:** Express-Modus, später bearbeiten

---

## 🚀 Implementierungs-Phasen

### Phase 1: **Basis-Wizard** (Woche 1-2)
- [ ] Wizard-Container & Navigation
- [ ] Schritte 1-3 (Kunde, Objekt, Konzept)
- [ ] Basis-Validierung
- [ ] Speichern als Entwurf

### Phase 2: **MA & Planung** (Woche 3)
- [ ] Schritt 4 (MA-Planung)
- [ ] Drag & Drop MA-Zuweisung
- [ ] Auslastungs-Check
- [ ] Auto-Suggestions

### Phase 3: **Kontrollgänge** (Woche 4)
- [ ] Schritt 5 (Kontrollgänge)
- [ ] Grundriss-Upload
- [ ] NFC-Tag-Generierung
- [ ] Route-Optimierung

### Phase 4: **Kalkulation** (Woche 5)
- [ ] Schritt 6 (Auto-Kalkulation)
- [ ] Integration mit PriceModel
- [ ] Benchmark-Vergleich
- [ ] Manuelle Overrides

### Phase 5: **Finalisierung** (Woche 6)
- [ ] Schritte 7-8 (Dokumente, Zusammenfassung)
- [ ] Email-Versand
- [ ] PDF-Generierung
- [ ] Aktivierungs-Workflow

### Phase 6: **Templates** (Woche 7)
- [ ] Template-System
- [ ] Vordefinierte Szenarien
- [ ] Template-Verwaltung (Admin)
- [ ] Import/Export

### Phase 7: **Intelligenz** (Woche 8+)
- [ ] Google Maps Integration
- [ ] KI-basierte Vorschläge
- [ ] ML-Preisoptimierung
- [ ] Chatbot-Assistent

---

## ⚡ Quick Wins (Sofort umsetzbar)

1. **Customer-Model** erstellen → Kundenverwaltung
2. **Basis-Wizard** mit 3 Schritten → Flow testen
3. **Templates** für Standard-Szenarien → Zeitersparnis
4. **Auto-Kalkulation** → Weniger manuell

---

## 🎯 Erfolgs-Metriken

- ⏱️ **Zeit bis Angebot:** Von 2 Stunden auf 30 Minuten
- ✅ **Vollständigkeit:** 95%+ aller Felder ausgefüllt
- 💰 **Kalkulations-Genauigkeit:** ± 5% Abweichung
- 😊 **User-Zufriedenheit:** > 4.5/5 Sterne
- 🚀 **Adoption-Rate:** 80%+ nutzen Wizard

---

**Erstellt:** 2025-10-22
**Status:** 📋 In Planung (Feedback erwünscht!)
