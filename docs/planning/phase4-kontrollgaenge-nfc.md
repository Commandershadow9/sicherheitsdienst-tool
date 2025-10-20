# Phase 4: Kontrollgänge & NFC-Rundenwesen – Konzept

**Version**: v1.14.0
**Priorität**: Hoch
**Aufwand**: 4-5 Tage
**Status**: In Planung
**Erstellt**: 2025-10-20

---

## 🎯 Ziel

Ein **NFC-basiertes Rundenwesen-System** für Sicherheitsdienste, das:
- ✅ **NFC-Scanner** als primäre Technologie nutzt (sicherer, manipulationssicher)
- ✅ **QR-Code-Fallback** für Firmen ohne NFC-Hardware bietet
- ✅ **Mobile-First** konzipiert ist (Android + iOS, über Handy)
- ✅ **PWA-optimiert** läuft (kein App-Store, direkt im Browser)
- ✅ **Offline-fähig** ist (Service Worker, IndexedDB)
- ✅ **Echtzeit-Protokollierung** ermöglicht

---

## 👥 User Stories

### 1. Einsatzleiter (MANAGER)
> "Ich möchte **Kontrollpunkte definieren**, NFC-Tags zuweisen, Kontrollgänge planen und die Durchführung überwachen."

**Typischer Workflow:**
1. Kontrollpunkte für Objekt anlegen (z.B. "Haupteingang", "Tiefgarage Ebene 2")
2. NFC-Tag-ID eintragen (oder QR-Code generieren)
3. Kontrollgang definieren (z.B. "Nacht-Runde", alle 2 Stunden)
4. Reihenfolge festlegen (Punkt 1 → 2 → 3)
5. Auswertung ansehen (welche Punkte wurden gescannt, wann, von wem)

---

### 2. Mitarbeiter (EMPLOYEE) - Vor Ort
> "Ich möchte **während meiner Schicht** einfach und schnell Kontrollpunkte scannen, um nachzuweisen dass ich meine Runde gemacht habe."

**Typischer Workflow:**
1. Handy zücken, PWA öffnen (bereits eingeloggt)
2. "Kontrollgang starten" Button drücken
3. **NFC-Tag scannen** (Handy an Tag halten)
   - ✅ Erfolgreich → Grüner Haken, nächster Punkt
   - ❌ Fehler → Roter Hinweis, QR-Fallback anbieten
4. Alle Punkte abarbeiten
5. "Kontrollgang beenden" → Automatisches Protokoll

---

### 3. Objektleiter
> "Ich möchte **sehen ob alle Kontrollgänge** ordnungsgemäß durchgeführt wurden und bei Auffälligkeiten (fehlende Scans, verspätete Scans) benachrichtigt werden."

**Anforderungen:**
- Echtzeit-Dashboard: Welche Runden sind offen/abgeschlossen
- Fehlende Scans markieren (Punkt wurde übersprungen)
- Verspätete Scans (> 30 Min nach Soll-Zeit)
- Benachrichtigung bei kritischen Abweichungen

---

## 🏗️ Architektur-Übersicht

### Technologie-Stack

**NFC-Scanner:**
- **Android (Chrome/Edge)**: [Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API) ✅
  - `navigator.nfc.scan()` / `NDEFReader`
  - Funktioniert out-of-the-box im Browser
  - Keine App-Installation nötig

- **iOS (Safari)**: ❌ Keine Web NFC API
  - Core NFC nur in nativen Apps verfügbar
  - **Fallback**: QR-Code-Scanner (Kamera-API)
  - Alternative: Native App (React Native) - **später**

**QR-Code-Fallback:**
- Kamera-API + QR-Scanner Library (z.B. `html5-qrcode`)
- Funktioniert auf Android + iOS
- Weniger sicher (kann kopiert/fotografiert werden)
- Für Firmen ohne NFC-Hardware

**Mobile-First Design:**
- Große Buttons (min. 48x48px Touch-Targets)
- Einfache Navigation (Bottom-Navigation)
- Offline-Unterstützung (Service Worker)
- GPS-Position optional speichern (Standort-Verifikation)

---

## 📊 Datenmodell (Prisma Schema)

### 1. ControlPoint (Kontrollpunkt)
Ein physischer Punkt am Objekt, der gescannt werden muss.

```prisma
model ControlPoint {
  id              String   @id @default(cuid())
  siteId          String
  site            Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  name            String   // z.B. "Haupteingang Nord"
  location        String   // Beschreibung, z.B. "Erdgeschoss, linker Eingang"
  instructions    String?  @db.Text // Was ist zu prüfen? (optional)

  // NFC oder QR
  nfcTagId        String?  @unique // NFC-Tag-UID (z.B. "04:5E:3A:2B:1C:80")
  qrCode          String?  @unique // QR-Code-Inhalt (z.B. "CP-site123-point456")

  // Position & Reihenfolge
  order           Int      @default(0) // Reihenfolge im Kontrollgang
  latitude        Float?   // GPS-Koordinaten (optional, für Verifikation)
  longitude       Float?

  // Status
  isActive        Boolean  @default(true)

  // Relationen
  scans           ControlScan[] // Alle Scans dieses Punktes

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([siteId, order])
  @@index([siteId, isActive])
}
```

### 2. ControlRound (Kontrollgang)
Eine Runde, die ein MA durchführt (z.B. "Nacht-Runde 22:00 Uhr").

```prisma
model ControlRound {
  id              String   @id @default(cuid())
  siteId          String
  site            Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  shiftId         String?
  shift           Shift?   @relation(fields: [shiftId], references: [id], onDelete: SetNull)

  performedBy     String   // User-ID des MA
  performer       User     @relation(fields: [performedBy], references: [id])

  // Zeitstempel
  startedAt       DateTime @default(now())
  completedAt     DateTime?

  // Status
  status          ControlRoundStatus @default(IN_PROGRESS)

  // Statistiken
  totalPoints     Int      // Anzahl zu scannender Punkte
  scannedPoints   Int      @default(0) // Anzahl gescannter Punkte
  missedPoints    Int      @default(0) // Anzahl übersprungener Punkte

  // Notizen
  notes           String?  @db.Text // Besondere Vorkommnisse

  // Relationen
  scans           ControlScan[] // Alle Scans in dieser Runde

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([siteId, startedAt])
  @@index([performedBy, status])
  @@index([shiftId])
}

enum ControlRoundStatus {
  IN_PROGRESS  // Läuft gerade
  COMPLETED    // Abgeschlossen
  INCOMPLETE   // Abgebrochen (nicht alle Punkte)
  CANCELLED    // Storniert
}
```

### 3. ControlScan (Scan-Event)
Ein einzelner Scan eines Kontrollpunktes.

```prisma
model ControlScan {
  id              String   @id @default(cuid())
  roundId         String
  round           ControlRound @relation(fields: [roundId], references: [id], onDelete: Cascade)
  pointId         String
  point           ControlPoint @relation(fields: [pointId], references: [id])

  scannedBy       String   // User-ID
  scanner         User     @relation(fields: [scannedBy], references: [id])

  scannedAt       DateTime @default(now())

  // Scan-Details
  scanMethod      ScanMethod // NFC oder QR
  tagIdentifier   String   // Die gescannte Tag-ID oder QR-Code

  // GPS-Position (optional, für Verifikation)
  latitude        Float?
  longitude       Float?
  accuracy        Float?   // GPS-Genauigkeit in Metern

  // Notizen
  notes           String?  @db.Text // z.B. "Fenster stand offen"
  hasIssue        Boolean  @default(false) // Auffälligkeit?

  // Verifikation
  isValid         Boolean  @default(true) // Scan gültig?
  validationError String?  // Fehlermeldung bei ungültigem Scan

  @@index([roundId, scannedAt])
  @@index([pointId, scannedAt])
  @@index([scannedBy])
}

enum ScanMethod {
  NFC      // NFC-Tag gescannt
  QR_CODE  // QR-Code gescannt
  MANUAL   // Manuell eingetragen (Notfall)
}
```

---

## 🔧 Backend-Endpoints (v1.14.0)

### Kontrollpunkte-Verwaltung
```
POST   /api/sites/:siteId/control-points          # Kontrollpunkt anlegen
GET    /api/sites/:siteId/control-points          # Liste aller Punkte
GET    /api/sites/:siteId/control-points/:id      # Details
PUT    /api/sites/:siteId/control-points/:id      # Punkt bearbeiten
DELETE /api/sites/:siteId/control-points/:id      # Punkt archivieren
POST   /api/sites/:siteId/control-points/:id/qr   # QR-Code generieren
```

### Kontrollgänge (Mobile)
```
POST   /api/sites/:siteId/control-rounds          # Runde starten
GET    /api/control-rounds/:roundId               # Runden-Status
POST   /api/control-rounds/:roundId/scans         # Scan eintragen
PUT    /api/control-rounds/:roundId/complete      # Runde beenden
GET    /api/control-rounds/:roundId/report        # Protokoll (PDF)
```

### Auswertungen (Desktop)
```
GET    /api/sites/:siteId/control-rounds          # Alle Runden (Filter: Status, Datum)
GET    /api/sites/:siteId/control-stats           # Statistiken
GET    /api/control-points/:pointId/history       # Scan-Historie eines Punktes
```

---

## 📱 Frontend-Struktur

### Desktop (Admin/Manager)
**Objekt-Detail-Seite → Tab "Kontrollgänge"**

1. **Kontrollpunkte-Liste**:
   - Tabelle mit Name, Ort, NFC-Tag-ID, QR-Code, Status
   - "Neuer Punkt" Button
   - Drag & Drop für Reihenfolge
   - Actions: Bearbeiten, QR-Code anzeigen, Löschen

2. **Kontrollgang-Historie**:
   - Timeline mit abgeschlossenen Runden
   - Filter: Zeitraum, Status, MA
   - Details: Dauer, Anzahl Scans, Auffälligkeiten
   - PDF-Export

3. **Live-Status**:
   - Aktuell laufende Runden
   - Echtzeit-Updates (WebSocket/Polling)
   - Fortschritt: X/Y Punkte gescannt

### Mobile (MA vor Ort)
**Route: `/mobile/scanner` (PWA-optimiert)**

1. **Scanner-Interface**:
   ```
   +-----------------------------------+
   |  🏢 Test Objekt Zentrale          |
   |  Nacht-Runde (3/8 Punkte)         |
   +-----------------------------------+
   |                                   |
   |   [ Großer NFC-Scan-Button ]      |
   |   "Handy an Tag halten"           |
   |                                   |
   |   oder                            |
   |   [ QR-Code scannen (Kamera) ]    |
   |                                   |
   +-----------------------------------+
   |  ✅ Haupteingang Nord (22:15)     |
   |  ✅ Tiefgarage Ebene 1 (22:18)    |
   |  ✅ Dachterrasse (22:22)          |
   |  ⏳ Lobby Erdgeschoss (nächster)  |
   |  ⏹️  Technikraum UG               |
   |  ⏹️  Parkplatz Ost                |
   +-----------------------------------+
   ```

2. **NFC-Scan-Flow**:
   - Button drücken → NFC-Reader aktiviert
   - Tag an Handy halten
   - ✅ Erfolgreich → Vibration, grüner Haken, Auto-Scroll zu nächstem Punkt
   - ❌ Fehler → Roter Hinweis, "Nochmal versuchen" oder "QR-Fallback"

3. **QR-Scan-Fallback**:
   - Kamera öffnen
   - QR-Code erkennen
   - Punkt validieren
   - Eintragen

4. **Bottom-Navigation**:
   - Scanner | Historie | Hilfe

---

## 🛡️ Sicherheit & Validierung

### NFC-Tag-Sicherheit
- **Eindeutige Tag-IDs**: Jeder NFC-Tag hat eine unique UID
- **Server-Side-Validierung**: Tag-ID muss im System existieren
- **GPS-Verifikation** (optional): Scan-Position mit Soll-Position vergleichen (Toleranz: 50m)
- **Zeitstempel**: Scan-Zeit wird serverseitig gesetzt (nicht manipulierbar)

### QR-Code-Sicherheit (schwächer)
- **Unique IDs**: QR-Code enthält `CP-{siteId}-{pointId}-{secret}`
- **Secret**: 8-stelliger Hash, verhindert einfaches Kopieren
- **Ablaufdatum** (optional): QR-Code wird nach X Monaten ungültig
- **Warnung**: "QR-Codes sind weniger sicher als NFC"

### Offline-Scans
- Scans werden lokal gespeichert (IndexedDB)
- Sobald Online: Automatischer Upload
- Server validiert nachträglich
- Bei Abweichungen: Admin-Benachrichtigung

---

## 📊 Auswertungen & Reports

### Dashboard-Widget (Phase 4.5)
**"Kontrollgänge heute"** auf Dashboard:
- X Runden abgeschlossen
- Y Runden in Arbeit
- Z kritische Auffälligkeiten (fehlende Scans)
- Link zur Detail-Ansicht

### Protokoll-PDF
**Automatisch generiert nach Runden-Abschluss:**
```
KONTROLLGANG-PROTOKOLL

Objekt: Test Objekt Zentrale
Durchgeführt von: Max Mustermann
Datum: 20.10.2025, 22:00 - 22:45 Uhr
Status: VOLLSTÄNDIG ✅

┌─────────────────────────────────────────────┐
│ Nr. │ Kontrollpunkt      │ Zeit  │ Status  │
├─────────────────────────────────────────────┤
│  1  │ Haupteingang Nord  │ 22:15 │ ✅      │
│  2  │ Tiefgarage Ebene 1 │ 22:18 │ ✅      │
│  3  │ Dachterrasse       │ 22:22 │ ✅      │
│  4  │ Lobby Erdgeschoss  │ 22:25 │ ✅      │
│  5  │ Technikraum UG     │ 22:30 │ ✅      │
│  6  │ Parkplatz Ost      │ 22:35 │ ✅      │
│  7  │ Notausgang Süd     │ 22:40 │ ✅      │
│  8  │ Lager 1. OG        │ 22:45 │ ✅      │
└─────────────────────────────────────────────┘

Besondere Vorkommnisse: Keine

Unterschrift MA: _______________
```

---

## 🚀 Implementierungs-Phasen

### Phase 4a: Datenmodell & Backend (Tag 1-2)
- [x] Konzept fertigstellen
- [ ] Prisma Schema (3 Models)
- [ ] Migration erstellen
- [ ] Backend Controller (ControlPoint, ControlRound, ControlScan)
- [ ] Routes & RBAC

### Phase 4b: Desktop-Frontend (Tag 2-3)
- [ ] Kontrollpunkte-Verwaltung (CRUD)
- [ ] Kontrollgang-Historie
- [ ] Live-Status-Widget
- [ ] QR-Code-Generierung

### Phase 4c: Mobile Scanner (Tag 3-4)
- [ ] NFC-Service (Web NFC API für Android)
- [ ] QR-Scanner-Service (Kamera-API)
- [ ] Scanner-UI (Mobile-optimiert)
- [ ] Offline-Support (Service Worker)

### Phase 4d: Auswertungen & Reports (Tag 4-5)
- [ ] Statistiken-Endpoint
- [ ] PDF-Generator (Protokoll)
- [ ] Dashboard-Widget
- [ ] Email-Notifications (fehlende Scans)

---

## 🧪 Testing-Strategie

### NFC-Testing
- **Benötigt**: Echte NFC-Tags (NTAG213, NTAG215, NTAG216)
- **Geräte**: Android-Smartphone mit Chrome/Edge
- **Test-Szenarien**:
  - ✅ Tag scannen → Erfolgreich eintragen
  - ❌ Falscher Tag → Fehler anzeigen
  - 📡 Offline-Scan → Später synchronisieren

### QR-Code-Testing
- **Geräte**: Android + iOS (Safari)
- **Test-Szenarien**:
  - ✅ Korrekt gescannter QR-Code
  - ❌ Ungültiger QR-Code
  - 📷 Schlechte Lichtverhältnisse

---

## 📝 Offene Fragen / Entscheidungen

1. **NFC-Tag-Beschaffung**: Welche Tags kaufen? (Empfehlung: NTAG215, ~0,50€/Stk)
2. **GPS-Verifikation**: Aktivieren oder optional? (Empfehlung: Optional, da ungenau in Gebäuden)
3. **Offline-Dauer**: Wie lange dürfen Scans lokal bleiben? (Empfehlung: Max. 24h)
4. **Native App**: Später für iOS entwickeln? (Empfehlung: Ja, aber erst ab v1.15+)

---

## 🎯 MVP-Definition (Phase 4 abgeschlossen)

**Muss funktionieren:**
- ✅ Kontrollpunkte anlegen (mit NFC-Tag-ID oder QR-Code)
- ✅ NFC-Scanner auf Android (Web NFC API)
- ✅ QR-Scanner auf Android + iOS (Kamera-API)
- ✅ Kontrollgang starten → Punkte scannen → Beenden
- ✅ Protokoll-Übersicht im Desktop
- ✅ Einfache Statistiken

**Nice-to-have (Phase 4.5):**
- GPS-Verifikation
- Dashboard-Widget
- PDF-Export
- Email-Notifications
- Offline-Synchronisation

---

**Erstellt**: 2025-10-20
**Nächster Schritt**: Prisma Schema erstellen & Migration
