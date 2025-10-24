# Phase 5: Objekt-Kalkulation & Angebotserstellung

**Status:** ✅ **100% ABGESCHLOSSEN** (v1.15.0a - v1.15.0d)
**Ziel:** Vollständiges Kalkulations-System für Sicherheitsdienst-Objekte

---

## 🎯 Geschäftsziele

1. **Schnelle Angebotserstellung:**
   - Von Anfrage bis Angebot in < 30 Minuten
   - Automatische Kostenberechnung
   - PDF-Export für Kunden

2. **Transparente Kalkulation:**
   - Alle Kostenarten erfassen
   - Gewinnmarge klar ausweisen
   - Rentabilität prüfen

3. **Flexible Preismodelle:**
   - Templates für verschiedene Objekttypen
   - Individuelle Anpassungen möglich
   - Saisonale Preisanpassungen

4. **Nachvollziehbarkeit:**
   - Kalkulations-Historie
   - Vergleich Angebot vs. Ist-Kosten
   - Audit-Trail

---

## 💰 Kostenarten im Sicherheitsdienst

### 1. Personalkosten (größter Block: 70-80%)

**Basis-Stundensätze:**
- Mitarbeiter (Basis): 12,50 € - 15,00 €
- Schichtleiter: 14,00 € - 17,00 €
- Objektleiter: 16,00 € - 20,00 €

**Zeitzuschläge:**
- Nachtarbeit (22-6 Uhr): +25%
- Samstag: +25%
- Sonntag: +50%
- Feiertag: +100%
- Heiligabend/Silvester: +150%

**Qualifikationszuschläge:**
- NSL-Zertifikat (34a): +1,00 € - 2,00 €
- Hundführer: +2,00 € - 3,00 €
- Erste-Hilfe-Ausbilder: +0,50 € - 1,00 €
- Brandschutzhelfer: +0,50 €
- Waffensachkunde: +1,50 € - 2,50 €

**Objektspezifische Zuschläge:**
- Risikozuschlag (z.B. Hochsicherheit): +5-15%
- Entfernungszuschlag (> 50km): +0,50 € - 1,50 €/h
- Rufbereitschaft: Pauschale pro Monat

### 2. Gemeinkosten (15-20%)

- Verwaltung & Backoffice: 8-12% der Personalkosten
- Fahrzeugkosten (wenn gestellt): 0,30 € - 0,50 €/km
- Büromaterial, Software-Lizenzen
- Versicherungen (Haftpflicht, Unfallversicherung)

### 3. Ausrüstung & Material (5-10%)

- Uniform (einmalig oder anteilig): 150 € - 300 € pro MA
- Funkgerät: 200 € - 500 € (Abschreibung)
- Dienstausweis, Taschenlampe, etc.
- Objektspezifisch: Schlüssel, Zugangskarten

### 4. Gewinnmarge (10-20%)

- Branchenüblich: 10-15%
- Hochsicherheit/Spezialobjekte: 15-20%
- Langfristverträge (> 2 Jahre): 8-12%

---

## 📊 Datenmodell

### 1. PriceModel (Preismodell-Templates)

Wiederverwendbare Vorlagen für verschiedene Objekttypen.

```typescript
type PriceModel = {
  id: string
  name: string                    // z.B. "Standard Objektschutz 2025"
  description?: string
  isActive: boolean

  // Basis-Stundensätze (brutto pro Stunde)
  hourlyRateEmployee: number      // z.B. 13.50
  hourlyRateShiftLeader: number   // z.B. 16.00
  hourlyRateSiteManager: number   // z.B. 18.50

  // Zeitzuschläge (Prozent)
  nightSurcharge: number          // z.B. 25 (= 25%)
  saturdaySurcharge: number       // z.B. 25
  sundaySurcharge: number         // z.B. 50
  holidaySurcharge: number        // z.B. 100

  // Qualifikationszuschläge (€/h)
  nslCertificateSurcharge: number // z.B. 1.50
  dogHandlerSurcharge: number     // z.B. 2.50
  weaponLicenseSurcharge: number  // z.B. 2.00

  // Gemeinkosten & Marge (Prozent)
  overheadPercentage: number      // z.B. 12 (= 12%)
  profitMarginPercentage: number  // z.B. 15 (= 15%)

  createdAt: Date
  updatedAt: Date
}
```

### 2. SiteCalculation (Objekt-Kalkulation)

Konkrete Kalkulation für ein Objekt (kann mehrere Versionen geben).

```typescript
type SiteCalculation = {
  id: string
  siteId: string
  priceModelId?: string           // Optional: basiert auf Template
  version: number                 // 1, 2, 3, ... (für Nachverfolgung)
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'

  // Objekt-Anforderungen
  requiredStaff: number           // Anzahl MA
  hoursPerWeek: number            // Std. pro Woche
  contractDurationMonths: number  // Vertragslaufzeit

  // Zeitverteilung (Std. pro Woche)
  hoursDay: number                // Tagschicht (6-22 Uhr)
  hoursNight: number              // Nachtschicht (22-6 Uhr)
  hoursSaturday: number
  hoursSunday: number
  hoursHoliday: number            // geschätzt (12 Feiertage/Jahr)

  // Personalstruktur
  employeeCount: number           // Anzahl Mitarbeiter
  shiftLeaderCount: number        // Anzahl Schichtleiter
  siteManagerCount: number        // Anzahl Objektleiter (meist 1)

  // Zuschläge & Sonderkonditionen
  riskSurchargePercentage: number // z.B. 10%
  distanceSurcharge: number       // €/h (wenn > 50km)

  // Berechnete Kosten (automatisch)
  totalPersonnelCostMonthly: number
  totalOverheadMonthly: number
  totalProfitMonthly: number
  totalPriceMonthly: number       // Gesamt-Angebotspreis

  // Einmalige Kosten
  setupCostUniform: number
  setupCostEquipment: number
  setupCostOther: number

  // Notizen & Anmerkungen
  notes?: string

  // Meta
  calculatedBy: string            // User-ID
  calculatedAt: Date
  sentAt?: Date
  acceptedAt?: Date
  rejectedAt?: Date

  createdAt: Date
  updatedAt: Date
}
```

### 3. CalculationItem (Detailpositionen)

Für detaillierte Aufschlüsselung der Kalkulation.

```typescript
type CalculationItem = {
  id: string
  calculationId: string

  category: 'PERSONNEL' | 'OVERHEAD' | 'EQUIPMENT' | 'OTHER'
  description: string             // z.B. "Mitarbeiter Nachtschicht"
  quantity: number                // z.B. 160 (Std./Monat)
  unitPrice: number               // €/Einheit
  totalPrice: number              // quantity * unitPrice

  // Für Transparenz
  notes?: string
  isOptional: boolean             // z.B. zusätzliche Ausrüstung

  createdAt: Date
}
```

---

## 🧮 Berechnungs-Logik

### Beispiel-Kalkulation (Standardfall)

**Objekt:** Industriegelände, 24/7 Bewachung

**Anforderungen:**
- 3 Mitarbeiter pro Schicht (24/7)
- 2 Schichten (Tag + Nacht)
- 168 Stunden/Woche (24 x 7)
- Davon:
  - 112h Tagschicht (Mo-Fr 6-22 Uhr)
  - 56h Nachtschicht (Mo-So 22-6 Uhr)
  - 32h Samstag (davon 16h Tag, 16h Nacht)
  - 32h Sonntag (davon 16h Tag, 16h Nacht)

**Stundensätze (aus PriceModel):**
- Mitarbeiter: 13,50 €
- Nacht: +25% = 16,88 €
- Samstag: +25% = 16,88 €
- Sonntag: +50% = 20,25 €

**Monatliche Personalkosten:**
```
Normalstunden (Mo-Fr Tag): 112h x 4,3 Wochen x 13,50 € = 6.500 €
Nachtstunden (Mo-So):      56h x 4,3 Wochen x 16,88 € = 4.062 €
Samstag (mit Zuschlag):    32h x 4,3 Wochen x 16,88 € = 2.320 €
Sonntag (mit Zuschlag):    32h x 4,3 Wochen x 20,25 € = 2.786 €

Summe Personalkosten:      15.668 € / Monat
```

**Gemeinkosten (12%):**
```
15.668 € x 12% = 1.880 € / Monat
```

**Gewinnmarge (15%):**
```
(15.668 € + 1.880 €) x 15% = 2.632 € / Monat
```

**Gesamt-Angebotspreis:**
```
15.668 € + 1.880 € + 2.632 € = 20.180 € / Monat (netto)
Mit 19% MwSt: 24.014 € / Monat (brutto)
```

**Jahresvertrag:**
```
20.180 € x 12 = 242.160 € / Jahr (netto)
```

---

## 🎨 Frontend-Konzept

### 1. Kalkulations-Liste (Tab in SiteDetail)

```
+----------------------------------+
|  Kalkulationen (3)               |
|  [+ Neue Kalkulation]            |
|                                  |
|  v3 (Aktuell) | SENT             |
|  15.250 €/Monat | 20.10.2025    |
|  [Ansehen] [PDF]                 |
|                                  |
|  v2 | REJECTED                   |
|  14.800 €/Monat | 10.10.2025    |
|  [Ansehen]                       |
|                                  |
|  v1 | ARCHIVED                   |
|  16.000 €/Monat | 01.09.2025    |
|  [Ansehen]                       |
+----------------------------------+
```

### 2. Kalkulations-Formular (/sites/:id/calculations/new)

**4 Schritte:**

**Schritt 1: Basis-Informationen**
```
+----------------------------------+
|  Neue Kalkulation                |
|                                  |
|  Preismodell (optional):         |
|  [Dropdown: Standard 2025]       |
|  → lädt Standardwerte            |
|                                  |
|  Anzahl Mitarbeiter:             |
|  [3]                             |
|                                  |
|  Stunden pro Woche:              |
|  [168] (24/7 = 168h)             |
|                                  |
|  Vertragslaufzeit (Monate):      |
|  [12]                            |
|                                  |
|  [Weiter →]                      |
+----------------------------------+
```

**Schritt 2: Zeitverteilung**
```
+----------------------------------+
|  Zeitverteilung (Std./Woche)    |
|                                  |
|  Tagschicht (6-22 Uhr):          |
|  [112] Std.                      |
|                                  |
|  Nachtschicht (22-6 Uhr):        |
|  [56] Std.                       |
|                                  |
|  Samstag:                        |
|  [32] Std.                       |
|                                  |
|  Sonntag:                        |
|  [32] Std.                       |
|                                  |
|  Feiertage (geschätzt):          |
|  [16] Std./Monat                 |
|                                  |
|  [← Zurück] [Weiter →]           |
+----------------------------------+
```

**Schritt 3: Stundensätze & Zuschläge**
```
+----------------------------------+
|  Stundensätze & Zuschläge       |
|                                  |
|  Mitarbeiter (Basis):            |
|  [13.50] €/h                     |
|                                  |
|  Schichtleiter:                  |
|  [16.00] €/h                     |
|                                  |
|  Objektleiter:                   |
|  [18.50] €/h                     |
|                                  |
|  --- Zuschläge (%) ---           |
|  Nacht:  [25] %                  |
|  Samstag: [25] %                 |
|  Sonntag: [50] %                 |
|  Feiertag: [100] %               |
|                                  |
|  Risikozuschlag: [10] %          |
|  Entfernungszuschlag: [0.50] €/h |
|                                  |
|  [← Zurück] [Weiter →]           |
+----------------------------------+
```

**Schritt 4: Gemeinkosten & Marge**
```
+----------------------------------+
|  Gemeinkosten & Gewinn           |
|                                  |
|  Gemeinkosten: [12] %            |
|  Gewinnmarge:  [15] %            |
|                                  |
|  --- Einmalige Kosten ---        |
|  Uniform:     [300] € (optional) |
|  Ausrüstung:  [150] € (optional) |
|  Sonstiges:   [0] €              |
|                                  |
|  [← Zurück] [Berechnen]          |
+----------------------------------+
```

**Schritt 5: Ergebnis & Zusammenfassung**
```
+----------------------------------+
|  Kalkulations-Ergebnis           |
|                                  |
|  📊 Monatliche Kosten:           |
|  Personal:    15.668 €           |
|  Gemeinkosten: 1.880 €           |
|  Gewinn:       2.632 €           |
|  ─────────────────────           |
|  Gesamt:      20.180 € (netto)   |
|  MwSt (19%):   3.834 €           |
|  ─────────────────────           |
|  Brutto:      24.014 €           |
|                                  |
|  📅 Jahresvertrag:               |
|  242.160 € (netto)               |
|  288.168 € (brutto)              |
|                                  |
|  💡 Empfehlung:                  |
|  Angebotspreis liegt im          |
|  Branchendurchschnitt.           |
|  Gewinnmarge: 15% ✓              |
|                                  |
|  Notizen:                        |
|  [Textfeld...]                   |
|                                  |
|  [💾 Speichern]                  |
|  [📄 PDF generieren]             |
|  [✉️ Per Email senden]           |
+----------------------------------+
```

### 3. PDF-Angebot (Template)

```
┌──────────────────────────────────┐
│ ANGEBOT                          │
│                                  │
│ Ihre Firma GmbH                  │
│ Musterstraße 1                   │
│ 12345 Musterstadt                │
│                                  │
│ Angebots-Nr.: 2025-001           │
│ Datum: 20.10.2025                │
│                                  │
│ ────────────────────────────────│
│                                  │
│ OBJEKT: Industriegelände Nord    │
│ Ansprechpartner: Max Kunde       │
│                                  │
│ LEISTUNGSUMFANG:                 │
│ - 24/7 Objektschutz              │
│ - 3 Mitarbeiter pro Schicht      │
│ - Rundgänge alle 2 Stunden       │
│ - NFC-basierte Kontrollgänge     │
│                                  │
│ PERSONALPLANUNG:                 │
│ - 3 Mitarbeiter (34a-Schein)     │
│ - 1 Objektleiter                 │
│ - 168 Stunden/Woche              │
│                                  │
│ MONATLICHER FESTPREIS:           │
│ Personalkosten       15.668 €    │
│ Gemeinkosten          1.880 €    │
│ ────────────────────────────────│
│ Netto               17.548 €     │
│ MwSt (19%)           3.334 €     │
│ ────────────────────────────────│
│ Brutto              20.882 €     │
│                                  │
│ JAHRESVERTRAG:                   │
│ 250.584 € (brutto)               │
│                                  │
│ Vertragslaufzeit: 12 Monate      │
│ Kündigungsfrist: 3 Monate        │
│                                  │
│ Angebot gültig bis: 30.11.2025   │
│                                  │
│ ────────────────────────────────│
│ Mit freundlichen Grüßen          │
│                                  │
│ [Unterschrift]                   │
└──────────────────────────────────┘
```

---

## 🔧 Backend-API (Endpoints)

### Price Models
```http
GET    /api/price-models                  # Liste aller Preismodelle
GET    /api/price-models/:id              # Details
POST   /api/price-models                  # Neues Preismodell
PUT    /api/price-models/:id              # Bearbeiten
DELETE /api/price-models/:id              # Löschen
```

### Calculations
```http
GET    /api/sites/:siteId/calculations          # Liste aller Kalkulationen
GET    /api/sites/:siteId/calculations/:id      # Details
POST   /api/sites/:siteId/calculations          # Neue Kalkulation
PUT    /api/sites/:siteId/calculations/:id      # Bearbeiten
DELETE /api/sites/:siteId/calculations/:id      # Löschen

POST   /api/sites/:siteId/calculations/:id/calculate   # Berechnung durchführen
POST   /api/sites/:siteId/calculations/:id/send        # Status → SENT
POST   /api/sites/:siteId/calculations/:id/accept      # Status → ACCEPTED
POST   /api/sites/:siteId/calculations/:id/reject      # Status → REJECTED
GET    /api/sites/:siteId/calculations/:id/pdf         # PDF generieren
```

---

## 📋 Phase 5 Roadmap

### Phase 5a: Backend (Woche 1) ✅ **ABGESCHLOSSEN**
- ✅ Prisma Schema (PriceModel, SiteCalculation)
- ✅ Migration (20251020_add_price_models_site_calculations)
- ✅ Controller (priceModelController, calculationController)
- ✅ Routes & RBAC (ADMIN für Templates, MANAGER für Kalkulationen)
- ✅ Berechnungs-Logik (automatische Berechnung bei Create/Update)

**Commit**: v1.15.0a - Phase 5a Backend (Objekt-Kalkulation & Angebotserstellung)

### Phase 5b: Desktop-Frontend (Woche 2) ✅ **ABGESCHLOSSEN**
- ✅ Kalkulationen-Tab in SiteDetail
- ✅ Kalkulations-Liste mit Status-Badges
- ✅ Version-Management (Duplicate-Funktion)
- ✅ Status-Workflow UI (DRAFT → SENT → ACCEPTED/REJECTED)
- ✅ Reject-Modal mit Notizen

**Commit**: v1.15.0b - Phase 5b Desktop-Frontend (Kalkulationen-Tab)

### Phase 5c: PDF-Generator & Email (Woche 3) ✅ **ABGESCHLOSSEN**
- ✅ PDF-Template mit PDFKit (150 LOC, professionelles Layout)
- ✅ Email-Versand mit SMTP/Nodemailer
- ✅ HTML-Email-Template mit Preis-Box & CTA-Button
- ✅ Angebots-Historie (via Duplicate & Version-Tracking)
- ✅ GET /api/sites/:siteId/calculations/:id/pdf
- ✅ POST /api/sites/:siteId/calculations/:id/send-email

**Commit**: v1.15.0c - Phase 5c PDF-Generator & Email-Versand

### Phase 5d: Erweiterte Features ✅ **TEILWEISE ABGESCHLOSSEN**
- ✅ Archive-Funktion (Status → ARCHIVED)
- ✅ Email-Modal mit Empfänger-Auswahl
- ✅ PDF-Download-Button (Frontend)
- ✅ Email-Button (Frontend)
- ✅ Archive & Duplicate Buttons (Frontend)
- [ ] Vergleich Angebot vs. Ist-Kosten (Optional, für v1.15.1+)
- [ ] Rentabilitäts-Dashboard (Optional, für v1.15.1+)
- [ ] Automatische Preisanpassung/Inflation (Optional, für v1.15.1+)
- [ ] Multi-Site-Rabatte (Optional, für v1.15.1+)

**Commit**: v1.15.0d - Phase 5d Erweiterte Features (Archive, Email-Modal)

---

## 🎯 Erfolgs-Metriken

- ⏱️ Angebotszeit: < 30 Minuten (von Anfrage bis PDF)
- 📊 Genauigkeit: ± 5% Abweichung Angebot vs. Ist-Kosten
- 💰 Gewinnmarge: Durchschnittlich 12-15%
- 📄 Angebots-Erfolgsquote: > 60%

---

**Nächster Schritt:** Prisma Schema erweitern + Migration

---

**Erstellt:** 2025-10-20
**Status:** 🚧 In Entwicklung
