# Phase 4c: Mobile Scanner-App (iOS & Android)

**Status:** 📝 Konzept (noch nicht implementiert)
**Backend:** ✅ Komplett fertig (v1.14.0a)
**Desktop-Frontend:** ✅ Komplett fertig (v1.14.0b)

---

## 🎯 Ziel

Native Mobile-App (iOS + Android) für Sicherheitsmitarbeiter, um NFC/QR-basierte Kontrollgänge durchzuführen.

---

## 📱 Plattform-Anforderungen

### Android (NFC-Scanner)
- ✅ **Web NFC API** (Chrome/Edge Browser)
  - Funktioniert out-of-the-box im Browser
  - `navigator.nfc` / `NDEFReader`
  - Alternative: Native App mit Android NFC API

### iOS (NFC-Scanner) ⚠️
- ❌ **Safari hat KEINE Web NFC API**
- ✅ **Lösung: Native App erforderlich**
  - **Core NFC Framework** (iOS 11+)
  - iPhone 7 oder neuer
  - Swift, React Native oder Flutter
  - Benötigt spezielle Entitlements in Xcode

**Wichtig:** Für echtes NFC auf iOS brauchst du eine **native App**, nicht nur eine Web-App!

---

## 🛠️ Technologie-Stack (Empfehlung)

### Option 1: React Native (Empfohlen)
- **Vorteile:**
  - Eine Codebase für iOS + Android
  - JavaScript/TypeScript (wie Frontend)
  - Große Community
  - NFC-Bibliotheken verfügbar

- **NFC-Library:** `react-native-nfc-manager`
  - iOS: Core NFC
  - Android: NFC API
  - QR-Code-Scanner: `react-native-camera` oder `react-native-vision-camera`

### Option 2: Flutter
- **Vorteile:**
  - Sehr performant
  - Schöne UI out-of-the-box

- **NFC-Library:** `flutter_nfc_kit`

### Option 3: Native (Swift + Kotlin)
- **Vorteile:**
  - Maximale Performance
  - Volle Plattform-Integration

- **Nachteile:**
  - Doppelter Entwicklungsaufwand
  - Zwei Teams/Skills erforderlich

---

## 🔌 Backend-API (Bereits fertig!)

Die gesamte Backend-API ist bereits implementiert (v1.14.0a).

### Authentifizierung
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "mitarbeiter@firma.de",
  "password": "geheim"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "role": "EMPLOYEE", ... }
}
```

### Kontrollgang starten
```http
POST /api/sites/:siteId/control-rounds
Authorization: Bearer <token>
Content-Type: application/json

{
  "shiftId": "optional-shift-id",
  "notes": "Optionale Startnotiz"
}

Response:
{
  "data": {
    "id": "round-uuid",
    "siteId": "site-uuid",
    "status": "IN_PROGRESS",
    "totalPoints": 12,
    "scannedPoints": 0,
    "startedAt": "2025-10-20T21:00:00Z"
  }
}
```

### Kontrollpunkt scannen (NFC oder QR)
```http
POST /api/control-rounds/:roundId/scans
Authorization: Bearer <token>
Content-Type: application/json

{
  "tagIdentifier": "04:A1:B2:C3:D4:E5:F6",  // NFC-Tag-ID oder QR-Code
  "scanMethod": "NFC",                       // "NFC" | "QR_CODE" | "MANUAL"
  "latitude": 50.123456,                     // Optional
  "longitude": 8.654321,                     // Optional
  "accuracy": 10.5,                          // Optional (Meter)
  "notes": "Optionale Notiz",                // Optional
  "hasIssue": false                          // Optional (Problem melden)
}

Response (Success):
{
  "data": {
    "id": "scan-uuid",
    "roundId": "round-uuid",
    "pointId": "point-uuid",
    "scannedAt": "2025-10-20T21:05:00Z",
    "isValid": true,
    "point": {
      "name": "Haupteingang Nord",
      "location": "Erdgeschoss"
    }
  }
}

Response (Invalid Scan):
{
  "success": false,
  "message": "Kontrollpunkt nicht gefunden oder nicht aktiv",
  "data": {
    "isValid": false,
    "validationError": "Kontrollpunkt nicht gefunden"
  }
}
```

### GPS-Verifikation (Backend)
- Toleranz: 100 Meter (konfigurierbar)
- Wenn GPS-Koordinaten beim Scan mitgeschickt werden:
  - Backend berechnet Distanz zum Kontrollpunkt (Haversine-Formel)
  - `isValid = false` wenn > 100m entfernt
  - `validationError = "GPS-Position weicht zu stark ab"`
- GPS ist **optional** (kann auch ohne funktionieren)

### Kontrollgang beenden
```http
PUT /api/control-rounds/:roundId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Optionale Abschlussnotiz",
  "status": "COMPLETED"  // "COMPLETED" | "INCOMPLETE" | "CANCELLED"
}

Response:
{
  "data": {
    "id": "round-uuid",
    "status": "COMPLETED",
    "completedAt": "2025-10-20T21:30:00Z",
    "totalPoints": 12,
    "scannedPoints": 11,
    "missedPoints": 1
  }
}
```

### Kontrollpunkte abrufen (für Offline-Modus)
```http
GET /api/sites/:siteId/control-points?activeOnly=true
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "point-uuid",
      "name": "Haupteingang Nord",
      "location": "Erdgeschoss",
      "instructions": "Überprüfen Sie alle Türen...",
      "nfcTagId": "04:A1:B2:C3:D4:E5:F6",
      "qrCode": "CP-site-uuid-point-uuid-abcd1234",
      "order": 1,
      "latitude": 50.123456,
      "longitude": 8.654321,
      "isActive": true
    }
  ]
}
```

---

## 📐 UI/UX-Konzept (Mobile-App)

### 1. Login-Screen
```
+---------------------------+
|      🛡️ Logo              |
|                           |
|  [Email-Eingabefeld]      |
|  [Passwort-Eingabefeld]   |
|                           |
|  [Anmelden Button]        |
|                           |
|  Passwort vergessen?      |
+---------------------------+
```

### 2. Objekt-Auswahl
```
+---------------------------+
|  Objekte                  |
|  [Suche...]               |
|                           |
|  📍 Objekt A (12 Punkte)  |
|  📍 Objekt B (8 Punkte)   |
|  📍 Objekt C (15 Punkte)  |
|                           |
+---------------------------+
```
- Liste aller Objekte, für die der User Clearance hat
- Anzeige: Anzahl Kontrollpunkte
- Tap auf Objekt → Kontrollgang starten

### 3. Kontrollgang-Screen (Haupt-Screen)
```
+---------------------------+
|  Objekt A                 |
|  Kontrollgang #123        |
|                           |
|  ━━━━━━━━━━━━━━━━━ 75%   |
|  9 von 12 Punkten         |
|                           |
|  📍 Nächster Punkt:       |
|  Haupteingang Nord        |
|  Erdgeschoss              |
|                           |
|  [📱 NFC SCANNEN]         |
|  [📷 QR-Code]             |
|                           |
|  Gescannt:                |
|  ✅ 1. Parkplatz          |
|  ✅ 2. Nebeneingang       |
|  ✅ 3. Keller UG1         |
|  ...                      |
|                           |
|  [❌ Abbrechen]           |
|  [✅ Beenden]             |
+---------------------------+
```

### 4. NFC-Scanner (iOS Core NFC)
```
+---------------------------+
|                           |
|      📱 NFC-Scanner       |
|                           |
|  Halten Sie Ihr iPhone    |
|  an den NFC-Tag           |
|                           |
|       [NFC Icon]          |
|       [ Animation ]       |
|                           |
|  Haupteingang Nord        |
|  (Punkt 4 von 12)         |
|                           |
|  [Abbrechen]              |
+---------------------------+
```
- iOS: Automatischer Dialog (Core NFC)
- Android: Custom UI mit Vibration-Feedback

### 5. QR-Scanner
```
+---------------------------+
|                           |
|  ┌─────────────────────┐  |
|  │                     │  |
|  │   [Kamera-View]     │  |
|  │                     │  |
|  │   ┌───────────┐     │  |
|  │   │ QR-Target │     │  |
|  │   └───────────┘     │  |
|  └─────────────────────┘  |
|                           |
|  QR-Code scannen          |
|  oder manuell eingeben    |
|                           |
|  [Manuell eingeben]       |
+---------------------------+
```

### 6. Scan-Erfolg-Feedback
```
+---------------------------+
|                           |
|        ✅ GESCANNT        |
|                           |
|   Haupteingang Nord       |
|   Erdgeschoss             |
|                           |
|   ━━━━━━━━━━━━━━━━━ 83%  |
|   10 von 12 Punkten       |
|                           |
|   [Problem melden]        |
|   [Notiz hinzufügen]      |
|   [Weiter]                |
|                           |
+---------------------------+
```
- Vibration/Haptic Feedback
- Audio-Feedback (optional)
- Auto-Close nach 2 Sekunden

### 7. Problem melden
```
+---------------------------+
|  Problem an diesem Punkt  |
|                           |
|  [✓] Tür offen            |
|  [✓] Fenster beschädigt   |
|  [ ] Licht defekt         |
|  [ ] Alarm ausgelöst      |
|  [ ] Sonstiges            |
|                           |
|  [Notiz-Textfeld...]      |
|                           |
|  📷 [Foto hinzufügen]     |
|                           |
|  [Abbrechen] [Melden]     |
+---------------------------+
```
- Vordefinierte Problem-Kategorien
- Freitext-Notiz
- Optional: Foto hochladen

---

## 🔄 Offline-Modus (PWA/Native)

### Strategie
1. **Kontrollpunkte vorab herunterladen:**
   - Beim Starten des Kontrollgangs alle Punkte laden
   - Lokal speichern (AsyncStorage/SQLite)

2. **Scans lokal speichern:**
   - Wenn offline: Scans in lokaler Queue
   - Timestamp, Tag-ID, GPS-Koordinaten speichern

3. **Sync bei Internetverbindung:**
   - Automatisch alle Queue-Scans hochladen
   - Server validiert GPS nachträglich
   - UI zeigt Sync-Status

### Technologie
- **React Native:** AsyncStorage + NetInfo
- **Flutter:** SharedPreferences + Connectivity
- **PWA:** IndexedDB + Service Worker

---

## 📍 GPS-Tracking

### Optionen
1. **Nur bei Scan:**
   - GPS-Position nur beim Scannen erfassen
   - Geringer Akkuverbrauch

2. **Kontinuierlich (optional):**
   - GPS-Position alle 30 Sekunden während Kontrollgang
   - Pfad auf Karte zeigen (Desktop-Ansicht)
   - Höherer Akkuverbrauch

### Berechtigungen
- **iOS:** `NSLocationWhenInUseUsageDescription` (Info.plist)
- **Android:** `ACCESS_FINE_LOCATION` (Manifest)

---

## 🔐 Sicherheit

### NFC-Security
- NFC-Tag-IDs sind unique (unveränderlich)
- QR-Codes enthalten Crypto-Secret:
  - Format: `CP-{siteId}-{pointId}-{secret}`
  - Secret: 8-stelliger Hex-String (32-Bit Random)
  - Server validiert Format + Secret

### App-Security
- JWT-Token in SecureStore (iOS Keychain, Android Keystore)
- HTTPS-only API-Kommunikation
- Certificate Pinning (optional, hohe Sicherheit)

---

## 🚀 MVP-Features (Phase 4c.1)

**Must-Have:**
- ✅ Login/Logout
- ✅ Objekt-Auswahl
- ✅ Kontrollgang starten
- ✅ NFC-Scanner (iOS Core NFC, Android NFC API)
- ✅ QR-Scanner (Camera API)
- ✅ Scan-Feedback (Erfolg/Fehler)
- ✅ Fortschritts-Anzeige (X von Y Punkten)
- ✅ Kontrollgang beenden
- ✅ Offline-Modus (Basis)

**Nice-to-Have (Phase 4c.2):**
- ⏳ Problem melden + Foto
- ⏳ GPS-Pfad-Anzeige
- ⏳ Push-Notifications (bei neuen Kontrollgängen)
- ⏳ Dark Mode
- ⏳ Sprach-Unterstützung (DE/EN)

---

## 📦 iOS-Spezifische Anforderungen

### Core NFC Setup (Xcode)
1. **Capabilities:**
   - Near Field Communication Tag Reading

2. **Info.plist:**
   ```xml
   <key>NFCReaderUsageDescription</key>
   <string>Wir benötigen NFC, um Kontrollpunkte zu scannen</string>
   ```

3. **Entitlement:**
   - `com.apple.developer.nfc.readersession.formats`
   - Value: `["TAG"]`

4. **Code (Swift):**
   ```swift
   import CoreNFC

   class NFCReader: NSObject, NFCTagReaderSessionDelegate {
       var session: NFCTagReaderSession?

       func startScanning() {
           session = NFCTagReaderSession(pollingOption: .iso14443, delegate: self)
           session?.alertMessage = "Halten Sie Ihr iPhone an den NFC-Tag"
           session?.begin()
       }

       func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
           // Tag-ID auslesen und an Backend schicken
       }
   }
   ```

### React Native (react-native-nfc-manager)
```javascript
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

async function scanNFC() {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const tagId = tag.id; // "04:A1:B2:C3:D4:E5:F6"

    // An Backend schicken
    await createScan(roundId, {
      tagIdentifier: tagId,
      scanMethod: 'NFC',
      // ...
    });
  } catch (ex) {
    console.warn('NFC scan failed', ex);
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}
```

---

## 🧪 Testing-Plan

### Testgeräte
- **iOS:** iPhone 7 oder neuer (Core NFC)
- **Android:** Gerät mit NFC-Chip

### Test-Szenarien
1. **NFC-Scan:**
   - ✅ Gültiger Tag → Erfolg
   - ❌ Ungültiger Tag → Fehlermeldung
   - ❌ Falsches Objekt → Fehlermeldung

2. **QR-Scan:**
   - ✅ Gültiger QR → Erfolg
   - ❌ Ungültiger QR → Fehlermeldung

3. **GPS-Verifikation:**
   - ✅ GPS innerhalb 100m → Erfolg
   - ⚠️ GPS > 100m → Warnung (aber Scan wird gespeichert)

4. **Offline-Modus:**
   - ✅ Kontrollgang starten (offline)
   - ✅ Scans speichern (lokal)
   - ✅ Sync bei Wiederverbindung

5. **Edge Cases:**
   - ❌ Kontrollgang beenden ohne alle Punkte gescannt
   - ❌ App-Absturz während Kontrollgang
   - ❌ Token-Ablauf während Kontrollgang

---

## 📊 Performance-Anforderungen

- **NFC-Scan:** < 2 Sekunden (Detection + Backend-Call)
- **QR-Scan:** < 1 Sekunde (Camera + Decode)
- **Offline-Sync:** Max. 10 Sekunden für 50 Scans
- **GPS-Genauigkeit:** ± 10-20 Meter (typisch)
- **Akkuverbrauch:** Max. 5% pro Stunde (bei Standardnutzung)

---

## 🛣️ Roadmap

### Phase 4c.1 (MVP) - 4-6 Wochen
- React Native App Setup
- Login/Auth
- NFC-Scanner (iOS + Android)
- QR-Scanner
- Basis-Kontrollgang-Flow
- Offline-Modus (Basis)

### Phase 4c.2 (Enhanced) - 2-3 Wochen
- Problem melden + Foto
- GPS-Pfad-Tracking
- Push-Notifications
- Dark Mode

### Phase 4c.3 (Polish) - 1-2 Wochen
- Performance-Optimierung
- Offline-Sync robuster machen
- Umfangreiches Testing
- App Store Deployment

---

## 📝 Notizen für Entwicklung

### Wichtige Libraries (React Native)
```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "react-native-nfc-manager": "^3.14.0",
    "react-native-vision-camera": "^3.6.0",
    "react-navigation": "^6.1.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/netinfo": "^11.2.0",
    "react-native-geolocation-service": "^5.3.1",
    "axios": "^1.6.0"
  }
}
```

### API-Base-URL
```javascript
const API_BASE_URL = process.env.API_URL || 'https://api.deine-firma.de';
```

### Token-Storage
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token speichern
await AsyncStorage.setItem('auth_token', token);

// Token abrufen
const token = await AsyncStorage.getItem('auth_token');

// Token löschen (Logout)
await AsyncStorage.removeItem('auth_token');
```

---

## ✅ Checkliste vor Start

- [ ] React Native Environment Setup (iOS + Android)
- [ ] Backend-API zugänglich (HTTPS, CORS)
- [ ] Test-NFC-Tags bestellt (NTAG213/215)
- [ ] Test-Objekt mit Kontrollpunkten angelegt
- [ ] Test-User mit EMPLOYEE-Rolle
- [ ] iOS Developer Account (für App Store)
- [ ] Android Developer Account (für Play Store)
- [ ] Design-Assets (Logo, Icons, Splash Screen)

---

**Nächster Schritt:** React Native Projekt initialisieren + NFC-Library integrieren

---

**Erstellt:** 2025-10-20
**Status:** Konzept (wartet auf Implementierung)
