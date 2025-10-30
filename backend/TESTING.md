# Test-Daten und Test-Szenarien

## 🎯 v1.22.6 - Intelligente MA-Ersatzsuche

### Test-Daten laden

```bash
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" npx ts-node src/utils/seedReplacementTest.ts
```

### 📊 Übersicht der Test-Daten

- **18 Benutzer**: 16 Employees, 1 Admin, 1 Manager
- **11 MA mit Clearance** (sofort einsetzbar)
- **5 MA ohne Clearance** (benötigen Einweisung - mit ⚠️ Warning-Badge)
- **2 Sites**: Bürogebäude Zentrum, Einkaufszentrum Nord
- **3 aktuelle Schichten** (1 kritisch, 2 unterbesetzt)
- **4 historische Schichten** (für Fairness-Score-Berechnung)
- **Verschiedene Workload-Profile** (80h bis 155h)

### 🔐 Login-Daten

```
Email: admin@sicherheitsdienst.de
Password: password123
```

---

## 📋 Test-Szenarien

### 1️⃣ Kritische Schicht - Ersatz suchen

**Ziel**: Alle verfügbaren Mitarbeiter anzeigen (mit und ohne Clearance)

**Schritte**:
1. Login als Admin
2. Dashboard → Kritische Schichten
3. Schicht "Tagschicht Bürogebäude" (heute 08:00-16:00)
4. Klick auf "Ersatz suchen"

**Erwartete Ergebnisse**:
- ✅ **16 Kandidaten** werden angezeigt
- ✅ **10 Kandidaten mit Clearance** (ohne Warning)
- ✅ **6 Kandidaten ohne Clearance** mit Badge: `⚠️ Keine Objekt-Clearance - Einweisung erforderlich`
- ✅ Statistiken: `{ total: 16, optimal: X, good: Y, acceptable: Z }`

---

### 2️⃣ Clearance-Warning Badge testen

**Ziel**: Prüfen, dass Mitarbeiter ohne Clearance erkennbar sind

**Kandidaten ohne Clearance**:
- Sabine Wolf (EMP008) - 30h Workload
- Daniel Richter (EMP009) - 20h Workload
- Claudia Zimmermann (EMP010) - 50h Workload
- Sandra Lange (EMP014) - 15h Workload
- Patrick Koch (EMP015) - 40h Workload

**Erwartete Ergebnisse**:
- ✅ Alle 5 Kandidaten erscheinen in der Liste
- ✅ Alle zeigen Warning-Badge: `⚠️ Keine Objekt-Clearance - Einweisung erforderlich`
- ✅ Admin kann trotzdem zuweisen (bewusste Entscheidung)

---

### 3️⃣ Intelligentes Scoring testen

**Ziel**: Score-Berechnung basierend auf Workload und Fairness

**Test-Kandidaten**:

| Name | Workload | Erwarteter Score | Grund |
|------|----------|-----------------|-------|
| Thomas Müller (EMP001) | 80h | 🟢 OPTIMAL | Niedrige Auslastung (50%) |
| Daniel Richter (EMP009) | 20h | 🟡 GOOD | Sehr niedrig, aber keine Clearance |
| Michael Wagner (EMP003) | 120h | 🟡 GOOD | Mittlere Auslastung (75%) |
| Anna Schmidt (EMP002) | 145h | 🟠 ACCEPTABLE | Hohe Auslastung (90%) |
| Petra Hoffmann (EMP006) | 155h | 🔴 NOT_RECOMMENDED | Sehr hohe Auslastung (97%) |

**Erwartete Ergebnisse**:
- ✅ Kandidaten sind nach Score sortiert (beste zuerst)
- ✅ Score-Badge zeigt Farbe: grün (OPTIMAL), gelb (GOOD), orange (ACCEPTABLE), rot (NOT_RECOMMENDED)
- ✅ Tooltip/Details zeigen Breakdown: Workload, Compliance, Fairness, Preference

---

### 4️⃣ REQUESTED Absence Warning testen

**Ziel**: Mitarbeiter mit offenen Urlaubsanträgen erkennen

**Schritte**:
1. Suche Kandidaten für **Schicht 3** (morgen 08:00-16:00)
2. Finde "Nicole Bauer" (EMP016) in der Liste

**Erwartete Ergebnisse**:
- ✅ Nicole Bauer erscheint in der Kandidaten-Liste
- ✅ Warning-Badge: `⚠️ Urlaubsantrag offen: [Datum] – [Datum]`
- ✅ Admin kann informiert entscheiden (Antrag evtl. ablehnen wenn dringend)

---

### 5️⃣ API Response Statistiken prüfen

**Ziel**: Backend liefert aggregierte Statistiken

**API Endpoint**:
```
GET /api/shifts/:shiftId/replacement-candidates
```

**Erwartete Response-Struktur**:
```json
{
  "success": true,
  "data": {
    "shiftId": "...",
    "candidates": [...],
    "stats": {
      "total": 16,
      "optimal": 3,
      "good": 5,
      "acceptable": 6,
      "not_recommended": 2
    }
  }
}
```

**Verifikation**:
- ✅ `stats.total` = Anzahl aller Kandidaten
- ✅ Summe aller Kategorien = `stats.total`
- ✅ Kategorien-Counts stimmen mit angezeigten Badges überein

---

## 🔍 Erweiterte Test-Szenarien

### 6️⃣ Workload-basierte Sortierung

**Ziel**: Kandidaten mit niedriger Auslastung erscheinen zuerst

**Erwartete Reihenfolge** (Top 5):
1. Thomas Müller - 80h (50% Auslastung)
2. Maria Weber - 90h (56% Auslastung)
3. Julia Becker - 95h (59% Auslastung)
4. Nicole Bauer - 100h (63% Auslastung)
5. Robert Schuster - 105h (66% Auslastung)

---

### 7️⃣ Compliance-Prüfung (Ruhezeiten)

**Ziel**: System warnt bei unzureichenden Ruhezeiten

**Zu testen**:
- Kandidaten die gestern eine Nachtschicht (bis 02:00) hatten
- Erwartung: Warning wenn weniger als 11h Ruhezeit

---

### 8️⃣ Fairness-Verteilung

**Ziel**: Mitarbeiter mit weniger Ersätzen werden bevorzugt

**Historische Daten**:
- Thomas, Michael, Stefan haben bereits 4 historische Schichten
- Andere Mitarbeiter haben keine/weniger

**Erwartung**:
- ✅ Mitarbeiter ohne historische Schichten haben höheren Fairness-Score
- ✅ Dashboard zeigt "Ersatz-Count" pro Mitarbeiter

---

## 🐛 Bug-Testing

### Regression: "Keine verfügbaren Kandidaten"

**Problem (v1.22.5)**: Trotz 16 aktiver Mitarbeiter zeigte System "Keine verfügbaren Kandidaten"

**Root Cause**: V1 API filterte nur Mitarbeiter mit ACTIVE Clearance

**Fix (v1.22.6)**: V2 API zeigt ALLE Mitarbeiter, mit Warnings für fehlende Clearances

**Test**:
1. Lade alte Test-Daten (seedTestScenarios.ts - nur 10 MA, 5 ohne Clearance)
2. Suche Ersatz für Schicht → sollte "Keine verfügbaren Kandidaten" zeigen
3. Lade neue Test-Daten (seedReplacementTest.ts)
4. Suche Ersatz → sollte 16 Kandidaten zeigen

---

## 📈 Performance-Tests

### Großer Mitarbeiter-Pool

**Ziel**: System skaliert mit vielen Mitarbeitern

**Zu testen**:
- 50+ Mitarbeiter in DB
- Ersatz-Suche sollte < 2 Sekunden dauern
- Score-Berechnung parallelisiert

### Viele historische Schichten

**Ziel**: Fairness-Berechnung performant bei großer Historie

**Zu testen**:
- 100+ historische Schichten pro Mitarbeiter
- Aggregation sollte via EmployeeWorkload (cached) erfolgen
- Keine N+1 Queries

---

## 🔄 Wiederholbare Tests

### Reset Test-Daten

```bash
cd backend
DATABASE_URL="postgresql://admin:admin123@localhost:5432/sicherheitsdienst_db?schema=public" npx ts-node src/utils/seedReplacementTest.ts
```

Dies löscht ALLE alten Daten und erstellt frische Test-Daten.

### Preserve existing data

Wenn du existierende Daten behalten möchtest:
- Kommentiere `resetSeedData()` in `seedReplacementTest.ts` aus
- Oder benutze eine separate Test-Datenbank

---

## 📝 Changelog-Referenz

Siehe [CHANGELOG.md](../CHANGELOG.md) - Version 1.22.6

**Wichtige Änderungen**:
- V2 API aktiviert (intelligentes Scoring)
- Alle Mitarbeiter als Kandidaten (nicht nur mit Clearance)
- Warning-Badge-System für fehlende Clearances
- REQUESTED absence Warnings

---

## 🎓 Weitere Test-Ideen

- [ ] MA mit abgelaufener Clearance (validUntil in Vergangenheit)
- [ ] MA mit INACTIVE Status (sollten nicht erscheinen)
- [ ] Schichten an Wochenenden (Weekend-Workload)
- [ ] Nachtschicht-Limits (max X pro Monat)
- [ ] Multi-Site Clearances (MA mit mehreren Objekten)
- [ ] Sicherheitskonzept-basierte Qualifikationen
- [ ] Automatische Vorschläge basierend auf Präferenzen
