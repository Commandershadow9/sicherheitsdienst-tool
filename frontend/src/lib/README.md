# Zentrale Bibliothek (`/lib`)

Diese Bibliothek enthält alle geteilten Utilities, Konstanten und Business-Logik, die über Web- und Mobile-Apps hinweg konsistent verwendet werden.

## 📁 Struktur

```
lib/
├── constants/          # Zentrale Konstanten
│   ├── calculations.ts     # Kalkulationsstatus
│   ├── controlRounds.ts    # Kontrollgangstatus
│   ├── documents.ts        # Dokumentenkategorien
│   ├── images.ts           # Bildkategorien
│   ├── qualifications.ts   # Qualifikationen
│   ├── wages.ts            # Lohngruppen & Zuschläge
│   └── index.ts            # Barrel export
│
├── formatters/         # Formatierungs-Utilities
│   ├── currency.ts         # Währungsformatierung
│   ├── date.ts             # Datums-/Zeitformatierung
│   └── index.ts            # Barrel export
│
├── validators/         # Validierungs-Utilities
│   ├── common.ts           # Email, Phone, IBAN, etc.
│   └── index.ts            # Barrel export
│
├── business/           # Business-Logik
│   ├── wages.ts            # Lohnberechnungen
│   └── index.ts            # Barrel export
│
└── index.ts            # Master export (alles in einem!)
```

## 🚀 Verwendung

### Einfache Imports

```typescript
// ✅ EMPFOHLEN: Alles aus einem Import
import {
  formatEuro,
  formatDate,
  CALCULATION_STATUS,
  calculateWage,
  isValidEmail
} from '@/lib'

// ❌ NICHT EMPFOHLEN: Mehrere separate Imports
import { formatEuro } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
```

### Beispiele

#### 1. Währungsformatierung

```typescript
import { formatEuro, formatCompactEuro, parseEuro } from '@/lib'

formatEuro(1234.56)              // "1.234,56 €"
formatEuro(1234.56, { decimals: 0 })  // "1.235 €"
formatCompactEuro(1500000)       // "1.5M €"
parseEuro("1.234,56 €")          // 1234.56
```

#### 2. Datumsformatierung

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib'

const date = new Date()
formatDate(date, 'short')        // "08.11.2024"
formatDate(date, 'long')         // "08. November 2024"
formatDateTime(date)             // "08.11.2024, 14:30"
formatRelativeTime(date)         // "vor 2 Stunden"
```

#### 3. Status & Labels

```typescript
import {
  getCalculationStatusLabel,
  getCalculationStatusColor,
  CALCULATION_STATUS
} from '@/lib'

const status = CALCULATION_STATUS.SENT

getCalculationStatusLabel(status)  // "Versendet"
getCalculationStatusColor(status)  // "bg-blue-100 text-blue-800"

// In JSX:
<span className={getCalculationStatusColor(status)}>
  {getCalculationStatusLabel(status)}
</span>
```

#### 4. Lohnberechnung

```typescript
import { calculateWage, WAGE_GROUPS, getBaseHourlyWage } from '@/lib'

const result = calculateWage({
  wageGroup: WAGE_GROUPS.GRUPPE_2,  // §34a Fachkraft
  hoursWorked: 8,
  date: new Date(),
  surcharges: ['NIGHT', 'SUNDAY']
})

console.log(result.baseWage)          // 120 EUR
console.log(result.totalSurcharges)   // 90 EUR
console.log(result.grossWage)         // 210 EUR
console.log(result.netWageEstimate)   // ~165 EUR
```

#### 5. Validierung

```typescript
import { isValidEmail, isValidPhoneNumber, isValidIBAN } from '@/lib'

isValidEmail("test@example.com")     // true
isValidPhoneNumber("+49 170 1234567") // true
isValidIBAN("DE89 3704 0044 0532 0130 00") // true
```

## 🎯 Wichtige Konstanten

### Lohngruppen & Zuschläge

```typescript
import {
  WAGE_GROUPS,           // Lohngruppen
  BASE_HOURLY_WAGES,     // Stundenlöhne
  SURCHARGE_TYPES,       // Zuschlagsarten
  SURCHARGE_RATES,       // Zuschlagssätze
} from '@/lib'

// Beispiel Zuschläge:
SURCHARGE_RATES.NIGHT    // 0.25 (25%)
SURCHARGE_RATES.SUNDAY   // 0.50 (50%)
SURCHARGE_RATES.HOLIDAY  // 1.00 (100%)
```

### Qualifikationen

```typescript
import {
  QUALIFICATIONS,
  QUALIFICATIONS_BY_CATEGORY,
  isRenewableQualification
} from '@/lib'

QUALIFICATIONS.PARAGRAPH_34A  // "§34a GewO"
QUALIFICATIONS.BRANDSCHUTZ    // "Brandschutzhelfer"

isRenewableQualification("Erste Hilfe")  // true (2 Jahre gültig)
```

### Dokumenten- & Bildkategorien

```typescript
import {
  DOCUMENT_CATEGORIES,
  IMAGE_CATEGORIES,
  getDocumentCategoryLabel
} from '@/lib'

DOCUMENT_CATEGORIES.DIENSTANWEISUNG  // "DIENSTANWEISUNG"
IMAGE_CATEGORIES.AUSSEN              // "AUSSEN"

getDocumentCategoryLabel("NOTFALLPLAN")  // "Notfallplan"
```

## 🔄 Migration Guide

### Vorher (Alt)

```typescript
// Alte Datei mit duplizierten Constants
const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  // ...
}

const STATUS_LABELS = {
  DRAFT: 'Entwurf',
  // ...
}

// Verwendung
<span className={STATUS_COLORS[status]}>
  {STATUS_LABELS[status]}
</span>
```

### Nachher (Neu)

```typescript
// Zentrale Utilities verwenden
import { getCalculationStatusLabel, getCalculationStatusColor } from '@/lib'

// Saubere Verwendung
<span className={getCalculationStatusColor(status)}>
  {getCalculationStatusLabel(status)}
</span>
```

## 🌍 Multi-Platform Support

Diese Bibliothek ist **plattformunabhängig** designed:

- ✅ Web-App (React)
- ✅ Mobile-App (React Native) - zukünftig
- ✅ Backend (Node.js) - für Validierung
- ✅ Shared Types für TypeScript

### Für React Native

```typescript
// In React Native funktionieren alle Utilities identisch!
import { formatEuro, calculateWage } from '@/lib'

// Gleicher Code, gleiche Ergebnisse
formatEuro(1234.56)  // "1.234,56 €"
```

## 📝 Wartung & Updates

### Lohnsätze aktualisieren

```typescript
// frontend/src/lib/constants/wages.ts
export const BASE_HOURLY_WAGES: Record<WageGroup, number> = {
  GRUPPE_1: 13.50,  // ⬅️ Hier anpassen
  GRUPPE_2: 15.00,
  // ...
}
```

### Neue Konstante hinzufügen

1. Datei in `/lib/constants/` erstellen
2. Konstanten definieren
3. In `/lib/constants/index.ts` exportieren
4. Automatisch über `/lib` verfügbar!

## ⚠️ Best Practices

### DO ✅

```typescript
// Zentrale Utilities verwenden
import { formatEuro, CALCULATION_STATUS } from '@/lib'

// Helper-Funktionen nutzen
getCalculationStatusLabel(status)

// TypeScript Types importieren
import type { WageGroup, SurchargeType } from '@/lib'
```

### DON'T ❌

```typescript
// NICHT: Lokale Duplikate erstellen
const STATUS_LABELS = { ... }  // ❌

// NICHT: Manuelle Formatierung
`${amount.toFixed(2)} €`  // ❌
// Stattdessen: formatEuro(amount)

// NICHT: Magic Numbers
hours * 0.25  // ❌
// Stattdessen: getSurchargeRate(SURCHARGE_TYPES.OVERTIME)
```

## 🧪 Testing

Alle Utilities sind getestet und können importiert werden:

```typescript
import { formatEuro, calculateWage } from '@/lib'

describe('formatEuro', () => {
  it('formats currency correctly', () => {
    expect(formatEuro(1234.56)).toBe('1.234,56 €')
  })
})
```

## 📚 Weitere Ressourcen

- **Tarifvertrag Sicherheitsdienst**: Aktuelle Lohnsätze
- **§34a GewO**: Sachkundeprüfung im Sicherheitsgewerbe
- **EStG §3b**: Steuerfreie Zuschläge

---

**Fragen?** Siehe Code-Kommentare in den einzelnen Dateien oder frage das Team!
