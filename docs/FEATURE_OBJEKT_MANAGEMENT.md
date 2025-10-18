# Objekt-Management Suite – Vollständiges Konzept

**Status**: Phase 1-2 ✅ Abgeschlossen, Phase 3 ⚡ 70% fertig
**Priorität**: HOCH (blockiert mehrere Features)
**Geschätzter Gesamtaufwand**: 15-25 Tage (aufgeteilt in 7 Phasen)
**Version**: v1.11.0 – v1.17.0 (aktuell: v1.13.1)
**Erstellt**: 2025-10-17
**Zuletzt aktualisiert**: 2025-10-18

---

## 🎯 Vision & Ziele

### Hauptziel
Ein **vollständiges Objekt-Management-System**, das den gesamten Lebenszyklus eines Sicherheitsobjekts abdeckt:
- Von der **Kundenanfrage** bis zur **laufenden Betreuung**
- Von der **Kalkulation** bis zur **Abrechnung**
- Von der **MA-Einarbeitung** bis zur **täglichen Schichtarbeit**

### Kernprinzipien
✅ **Einfach & Verständlich** - Intuitive Bedienung für alle Rollen
✅ **Praktisch** - Direkt aus der Praxis, für die Praxis
✅ **Professionell** - Kunden-präsentable Dokumente & Reports
✅ **Interaktiv** - Echtzeitübersicht, schnelle Aktionen
✅ **RBAC-konform** - Jede Rolle sieht nur was sie braucht

---

## 👥 User Stories (Rollen)

### 1. Chef (ADMIN)
> "Ich möchte den **Gesamtüberblick** über alle Objekte, deren Rentabilität und Auslastung. Ich genehmige neue Objekte und überwache die Qualität."

**Typische Aufgaben:**
- Neue Objekte genehmigen
- Kalkulationen prüfen
- Objekt-Performance analysieren
- Kritische Vorfälle einsehen

---

### 2. Einsatzleiter (MANAGER)
> "Ich bin der **erste Ansprechpartner** für Kundenanfragen. Ich erstelle Angebote, plane Schichten, weise MA ein und überwache die Objektbetreuung."

**Typischer Workflow:**
1. Kundenanfrage erfassen → Anforderungen dokumentieren
2. Kalkulation erstellen → Angebot versenden
3. Auftrag erhalten → Objekt anlegen
4. MA einarbeiten → Clearances vergeben
5. Schichten planen → MA zuweisen
6. Laufende Betreuung → Vorfälle überwachen, Rechnungen erstellen

---

### 3. Objektleiter (neue Rolle?)
> "Ich bin **verantwortlich** für ein oder mehrere Objekte. Ich sehe alle Details, kann Schichten planen (mit Freigabe) und Dienstanweisungen pflegen."

**Berechtigungen:**
- Objektdetails einsehen & bearbeiten (mit Freigabe von Einsatzleiter)
- Schichten vorschlagen (Einsatzleiter genehmigt)
- Wachbuch einsehen & Vorfälle bearbeiten
- Kontrollgänge auswerten

---

### 4. Schichtleiter (DISPATCHER?)
> "Ich bin **vor Ort** und leite die Schicht. Ich sehe die Dienstanweisungen, prüfe Kontrollgänge und trage Vorfälle ein."

**Berechtigungen:**
- Dienstanweisungen lesen
- Wachbuch-Einträge erstellen
- Kontrollgänge überwachen
- PSA-Übergaben dokumentieren

---

### 5. Mitarbeiter (EMPLOYEE)
> "Ich möchte **schnell sehen** was ich für meinen Dienst wissen muss: Dienstanweisungen, Notfallkontakte, Kontrollpunkte. Ich trage Vorfälle ins Wachbuch ein."

**Typische Fragen:**
- Was sind meine Aufgaben heute?
- Wo sind die Notfallkontakte?
- Welche Kontrollgänge muss ich machen?
- Wie trage ich einen Vorfall ein?

---

## 📦 Phasen-Übersicht (MVP-first Ansatz)

### Phase 1: Objekt-Grundlagen (v1.11.0 - v1.11.1) ✅ **ABGESCHLOSSEN**
**Ziel:** Objekte anlegen, Stammdaten verwalten, MA-Clearances
**Aufwand:** 3-5 Tage
**Status:** 100% fertig (Backend ✅ Frontend ✅ UX ✅)
**Features:**
- Objekt CRUD (Create, Read, Update, Delete)
- Stammdaten (Adresse, Kontakte, Notfallkontakte)
- Bilder hochladen (Objektfotos, Gebäudeansichten)
- Qualifikations-Anforderungen definieren
- MA-Clearances (Einarbeitungs-Status: Training → Approved → Active)
- Objekt-Übersicht (Liste, Filter, Export)
- Manager-Dashboard Integration

**Datenmodell (Prisma):**
```prisma
model Site {
  id                 String   @id @default(cuid())
  name               String
  address            String
  postalCode         String?
  city               String?
  // ... (bereits vorhanden)

  // NEU:
  customerName       String?
  customerContact    Json?    // { name, email, phone }
  emergencyContacts  Json[]   // [{ name, phone, role }]
  requiredStaff      Int      @default(1)
  status             SiteStatus @default(INQUIRY) // INQUIRY, OFFER_SENT, ACTIVE, INACTIVE
  images             SiteImage[]
  requiredQualifications String[] // z.B. ["§34a", "Brandschutz"]

  clearances         ObjectClearance[] // Bereits vorhanden
  shifts             Shift[]           // Bereits vorhanden
  documents          SiteDocument[]    // Phase 2
  incidents          SiteIncident[]    // Phase 3
  controlPoints      ControlPoint[]    // Phase 4

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum SiteStatus {
  INQUIRY       // Kundenanfrage
  OFFER_SENT    // Angebot versendet
  ACTIVE        // Aktiv betreut
  INACTIVE      // Inaktiv (Vertrag beendet)
  LOST          // Verloren (Kunde abgesprungen)
}

model SiteImage {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  filename    String
  filePath    String
  category    ImageCategory @default(EXTERIOR)
  description String?
  uploadedAt  DateTime @default(now())
  uploadedBy  String

  @@index([siteId])
}

enum ImageCategory {
  EXTERIOR      // Außenansicht
  INTERIOR      // Innenansicht
  FLOOR_PLAN    // Grundriss
  EQUIPMENT     // Ausrüstung
  OTHER
}

// ObjectClearance bereits vorhanden, ggf. erweitern:
// - trainingCompletedAt (Einarbeitung abgeschlossen)
// - approvedBy (wer hat freigegeben)
// - documents (Einarbeitungsnachweis)
```

**Backend-Endpoints (v1.11.0):**
```
POST   /api/sites                        # Neues Objekt anlegen
GET    /api/sites                        # Liste mit Filter/Sort
GET    /api/sites/:id                    # Details
PUT    /api/sites/:id                    # Objekt bearbeiten
DELETE /api/sites/:id                    # Objekt archivieren
POST   /api/sites/:id/images             # Bild hochladen
DELETE /api/sites/:id/images/:imageId    # Bild löschen
GET    /api/sites/:id/clearances         # MA-Clearances für Objekt
POST   /api/sites/:id/clearances         # MA einarbeiten
PUT    /api/sites/:id/clearances/:id     # Clearance-Status ändern
GET    /api/sites/:id/coverage-stats     # Abdeckungsstatistik
```

**Frontend (v1.11.0):**
- `/sites` - Objekt-Liste (Filter: Status, Stadt, Kunde)
- `/sites/new` - Neues Objekt anlegen
- `/sites/:id` - Objekt-Details (Tabs: Übersicht, Clearances, Schichten, Bilder)
- `/sites/:id/edit` - Objekt bearbeiten
- `/sites/:id/clearances` - MA-Einarbeitungsübersicht

**RBAC (v1.11.0):**
| Aktion | Chef | Einsatzleiter | Objektleiter | Schichtleiter | MA |
|--------|------|---------------|--------------|---------------|----|
| Objekt anlegen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Objekt bearbeiten | ✅ | ✅ | ✅ (mit Freigabe) | ❌ | ❌ |
| Objekt löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Objekt einsehen | ✅ | ✅ | ✅ (nur zugewiesene) | ✅ (nur zugewiesene) | ✅ (nur zugewiesene) |
| Bilder hochladen | ✅ | ✅ | ✅ | ❌ | ❌ |
| Clearances vergeben | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### Phase 2: Dokument-Management (v1.12.0 - v1.12.2) ✅ **ABGESCHLOSSEN**
**Ziel:** Strukturierte Ablage aller objektbezogenen Dokumente
**Aufwand:** 2-3 Tage
**Status:** 100% fertig (Backend ✅ Frontend ✅ Viewer ✅)
**Features:**
- ✅ Dokumenten-Upload (kategorisiert: 7 Kategorien)
- ✅ Versionierung (History mit previousVersion)
- ✅ Dienstanweisungen (DIENSTANWEISUNG)
- ✅ Notfallpläne (NOTFALLPLAN)
- ✅ Gebäudepläne (GRUNDRISS)
- ✅ Document Viewer (PDF, Markdown, Text)
- ✅ Multer File-Upload Integration
- ✅ Zugriffskontrolle (ADMIN, MANAGER können hochladen)

**Datenmodell (Prisma):**
```prisma
model SiteDocument {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  category    SiteDocumentCategory
  title       String
  filename    String
  filePath    String
  version     Int      @default(1)
  isLatest    Boolean  @default(true)
  uploadedAt  DateTime @default(now())
  uploadedBy  String
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  validFrom   DateTime?
  validUntil  DateTime?

  @@index([siteId, category, isLatest])
}

enum SiteDocumentCategory {
  EMERGENCY_PLAN          // Notfallplan
  FLOOR_PLAN              // Gebäudeplan
  SERVICE_INSTRUCTION     // Dienstanweisung (objektspezifisch)
  GENERAL_INSTRUCTION     // Allgemeine Dienstanweisung
  CONTRACT                // Vertrag mit Kunde
  OFFER                   // Angebot
  RISK_ASSESSMENT         // Gefährdungsbeurteilung
  OTHER
}
```

**Backend-Endpoints (v1.11.1):**
```
POST   /api/sites/:id/documents              # Dokument hochladen
GET    /api/sites/:id/documents              # Liste (filter: category)
GET    /api/sites/:id/documents/:docId       # Dokument herunterladen
PUT    /api/sites/:id/documents/:docId       # Neue Version hochladen
DELETE /api/sites/:id/documents/:docId       # Dokument löschen
GET    /api/sites/:id/documents/:docId/history # Versions-History
```

**Frontend (v1.11.1):**
- `/sites/:id/documents` - Dokumenten-Übersicht (kategorisiert)
- Upload-Dialog mit Kategorie-Auswahl
- Versions-History-Modal

---

### Phase 3: Wachbuch & Vorfälle (v1.13.0 - v1.13.1) ⚡ **70% ABGESCHLOSSEN**
**Ziel:** Digitales Wachbuch für Ereignisse & Vorfälle
**Aufwand:** 3-4 Tage
**Status:** Backend ✅ Frontend MVP ✅ | Offen: CRUD-Dialog, Mutations, Email-Notifications
**Features:**
- ✅ Ereignis-Log (Timeline-View mit Severity/Status-Badges)
- ✅ Vorfälle anzeigen (11 Kategorien, 4 Severity-Levels)
- ✅ Backend CRUD-Endpoints (6 Endpoints)
- ⏳ Vorfälle eintragen (Dialog in v1.13.2)
- ⏳ Filter & Export (PDF-Report für Kunde)
- ⏳ Benachrichtigungen (kritische Vorfälle → Einsatzleiter)

**Datenmodell (Prisma):**
```prisma
model SiteIncident {
  id            String   @id @default(cuid())
  siteId        String
  site          Site     @relation(fields: [siteId], references: [id])
  shiftId       String?
  shift         Shift?   @relation(fields: [shiftId], references: [id])
  reportedBy    String
  reporter      User     @relation(fields: [reportedBy], references: [id])
  reportedAt    DateTime @default(now())

  category      IncidentCategory
  severity      IncidentSeverity
  title         String
  description   String   @db.Text
  location      String?  // z.B. "Eingang Süd, 2. OG"

  resolved      Boolean  @default(false)
  resolvedAt    DateTime?
  resolvedBy    String?
  resolutionNotes String? @db.Text

  attachments   Json[]   // [{ filename, filePath }]

  @@index([siteId, reportedAt])
  @@index([siteId, severity, resolved])
}

enum IncidentCategory {
  SECURITY_BREACH     // Sicherheitsvorfall (Einbruch, etc.)
  TECHNICAL_ISSUE     // Technisches Problem
  PERSONNEL_ISSUE     // Personal-Vorfall
  CUSTOMER_COMPLAINT  // Kundenbeschwerde
  MAINTENANCE         // Wartung erforderlich
  OTHER
}

enum IncidentSeverity {
  INFO      // Information (z.B. "Fenster war offen")
  WARNING   // Warnung (z.B. "Verdächtige Person gesichtet")
  CRITICAL  // Kritisch (z.B. "Einbruch, Polizei gerufen")
}
```

**Backend-Endpoints (v1.12.0):**
```
POST   /api/sites/:id/incidents              # Vorfall eintragen
GET    /api/sites/:id/incidents              # Liste (filter: severity, resolved)
GET    /api/sites/:id/incidents/:incidentId  # Details
PUT    /api/sites/:id/incidents/:incidentId  # Vorfall aktualisieren (z.B. gelöst)
DELETE /api/sites/:id/incidents/:incidentId  # Vorfall löschen (nur ADMIN)
GET    /api/sites/:id/incidents/export       # PDF-Report
```

**Frontend (v1.12.0):**
- `/sites/:id/incidents` - Wachbuch (Timeline)
- "Vorfall melden" Button (Modal)
- Filter: Schweregrad, Kategorie, Zeitraum
- Benachrichtigungs-Badge für kritische Vorfälle

---

### Phase 4: Kontrollgänge & Rundenwesen (v1.13.0)
**Ziel:** Digitale Kontrollgänge mit QR-Code-Scanning
**Aufwand:** 4-5 Tage
**Features:**
- Kontrollpunkte definieren (mit QR-Code-Generierung)
- Geplante & ungeplante Kontrollgänge
- Mobile Scanning-Interface (Handy-optimiert)
- Kontrollgang-Protokolle
- Auswertung (wer hat wann welche Punkte gescannt)

**Datenmodell (Prisma):**
```prisma
model ControlPoint {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  name        String   // z.B. "Haupteingang", "Tiefgarage Ebene 2"
  location    String   // Beschreibung
  qrCode      String   @unique // Generierter QR-Code (z.B. "CP-{siteId}-{pointId}")
  instructions String?  @db.Text // Was ist zu prüfen?
  order       Int      @default(0) // Reihenfolge im Kontrollgang

  scans       ControlPointScan[]

  @@index([siteId, order])
}

model ControlRound {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  shiftId     String?
  shift       Shift?   @relation(fields: [shiftId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  startedAt   DateTime @default(now())
  completedAt DateTime?
  status      ControlRoundStatus @default(IN_PROGRESS)

  scans       ControlPointScan[]
  notes       String?  @db.Text

  @@index([siteId, startedAt])
}

enum ControlRoundStatus {
  IN_PROGRESS
  COMPLETED
  INCOMPLETE  // Nicht alle Punkte gescannt
}

model ControlPointScan {
  id              String   @id @default(cuid())
  controlRoundId  String
  controlRound    ControlRound @relation(fields: [controlRoundId], references: [id])
  controlPointId  String
  controlPoint    ControlPoint @relation(fields: [controlPointId], references: [id])

  scannedAt       DateTime @default(now())
  scannedBy       String
  user            User     @relation(fields: [scannedBy], references: [id])

  notes           String?
  anomalyDetected Boolean  @default(false)
  anomalyDetails  String?

  @@index([controlRoundId])
  @@index([controlPointId, scannedAt])
}
```

**Backend-Endpoints (v1.13.0):**
```
# Kontrollpunkte
POST   /api/sites/:id/control-points                      # Kontrollpunkt anlegen
GET    /api/sites/:id/control-points                      # Liste
PUT    /api/sites/:id/control-points/:pointId             # Bearbeiten
DELETE /api/sites/:id/control-points/:pointId             # Löschen
GET    /api/sites/:id/control-points/:pointId/qr-code     # QR-Code-PNG herunterladen

# Kontrollgänge
POST   /api/sites/:id/control-rounds                      # Kontrollgang starten
GET    /api/sites/:id/control-rounds                      # Liste (filter: status, userId)
GET    /api/sites/:id/control-rounds/:roundId             # Details
POST   /api/sites/:id/control-rounds/:roundId/scan        # Kontrollpunkt scannen
PUT    /api/sites/:id/control-rounds/:roundId/complete    # Kontrollgang abschließen
```

**Frontend (v1.13.0):**
- `/sites/:id/control-points` - Kontrollpunkte verwalten
- `/sites/:id/control-rounds` - Kontrollgänge (History)
- `/sites/:id/control-rounds/new` - Kontrollgang starten (Mobile-optimiert)
- QR-Scanner-Interface (Handy-Kamera)

---

### Phase 5: Übergabe-Protokolle (v1.14.0)
**Ziel:** PSA & Ausrüstungs-Tracking
**Aufwand:** 2-3 Tage
**Features:**
- PSA-Übergabe dokumentieren (Wer hat was erhalten?)
- Ausrüstungs-Tracking (Schlüssel, Funkgeräte, Taschenlampen)
- Schichtwechsel-Protokolle (Übergabe von Schicht zu Schicht)
- Rückgabe-Tracking

**Datenmodell (Prisma):**
```prisma
model Equipment {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  category    EquipmentCategory
  name        String
  identifier  String?  // z.B. Schlüsselnummer, Seriennummer
  status      EquipmentStatus @default(AVAILABLE)

  handovers   EquipmentHandover[]

  @@index([siteId, status])
}

enum EquipmentCategory {
  KEY           // Schlüssel
  RADIO         // Funkgerät
  FLASHLIGHT    // Taschenlampe
  SAFETY_VEST   // Warnweste
  FIRST_AID_KIT // Erste-Hilfe-Kasten
  OTHER
}

enum EquipmentStatus {
  AVAILABLE     // Verfügbar
  IN_USE        // Im Einsatz
  MAINTENANCE   // In Wartung
  LOST          // Verloren
}

model EquipmentHandover {
  id            String   @id @default(cuid())
  equipmentId   String
  equipment     Equipment @relation(fields: [equipmentId], references: [id])
  shiftId       String?
  shift         Shift?   @relation(fields: [shiftId], references: [id])

  handedOverTo  String
  user          User     @relation(fields: [handedOverTo], references: [id])
  handedOverAt  DateTime @default(now())
  handedOverBy  String

  returnedAt    DateTime?
  returnedTo    String?
  condition     String?  // Zustand bei Rückgabe
  notes         String?

  @@index([equipmentId, returnedAt])
  @@index([handedOverTo, returnedAt])
}
```

**Backend-Endpoints (v1.14.0):**
```
POST   /api/sites/:id/equipment                    # Ausrüstung anlegen
GET    /api/sites/:id/equipment                    # Liste (filter: category, status)
POST   /api/sites/:id/equipment/:eqId/handover     # Übergabe dokumentieren
POST   /api/sites/:id/equipment/:eqId/return       # Rückgabe dokumentieren
GET    /api/sites/:id/equipment/:eqId/history      # Übergabe-History
```

**Frontend (v1.14.0):**
- `/sites/:id/equipment` - Ausrüstungs-Übersicht
- Übergabe-Dialog (Schichtwechsel)
- Rückgabe-Dialog

---

### Phase 6: Kalkulation & Akquise (v1.15.0)
**Ziel:** Von der Kundenanfrage zum Angebot
**Aufwand:** 3-4 Tage
**Features:**
- Kundenanfragen erfassen (Anforderungen, Wünsche)
- Kalkulation (Kosten, Stunden, Personalstärke)
- Angebots-Generierung (PDF)
- Status-Tracking (Anfrage → Angebot → Auftrag → Verloren)

**Datenmodell (Prisma):**
```prisma
model SiteInquiry {
  id                String   @id @default(cuid())
  siteId            String?
  site              Site?    @relation(fields: [siteId], references: [id])

  customerName      String
  customerContact   Json     // { name, email, phone, company }
  status            InquiryStatus @default(RECEIVED)

  requirements      Json     // { staffCount, qualifications, hours, services }
  notes             String?  @db.Text

  calculation       SiteCalculation?
  offer             SiteOffer?

  receivedAt        DateTime @default(now())
  createdBy         String
  creator           User     @relation(fields: [createdBy], references: [id])

  @@index([status, receivedAt])
}

enum InquiryStatus {
  RECEIVED          // Anfrage erhalten
  IN_REVIEW         // In Prüfung
  CALCULATING       // Kalkulation läuft
  OFFER_SENT        // Angebot versendet
  ACCEPTED          // Auftrag erhalten
  DECLINED          // Abgelehnt vom Kunden
  LOST              // Verloren
}

model SiteCalculation {
  id              String   @id @default(cuid())
  inquiryId       String   @unique
  inquiry         SiteInquiry @relation(fields: [inquiryId], references: [id])

  staffCount      Int
  hourlyRate      Decimal  @db.Decimal(10, 2)
  hoursPerWeek    Decimal  @db.Decimal(10, 2)
  monthlyHours    Decimal  @db.Decimal(10, 2)
  monthlyCost     Decimal  @db.Decimal(10, 2)

  overheadPercent Decimal  @db.Decimal(5, 2) @default(20.0)
  profitMargin    Decimal  @db.Decimal(5, 2) @default(15.0)

  totalMonthly    Decimal  @db.Decimal(10, 2)
  totalYearly     Decimal  @db.Decimal(10, 2)

  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  createdBy       String

  @@index([inquiryId])
}

model SiteOffer {
  id            String   @id @default(cuid())
  inquiryId     String   @unique
  inquiry       SiteInquiry @relation(fields: [inquiryId], references: [id])

  offerNumber   String   @unique
  offerDate     DateTime @default(now())
  validUntil    DateTime

  totalPrice    Decimal  @db.Decimal(10, 2)
  paymentTerms  String   @default("30 Tage netto")

  pdfPath       String?  // Generiertes PDF
  sentAt        DateTime?
  sentBy        String?

  acceptedAt    DateTime?
  declinedAt    DateTime?

  @@index([inquiryId])
}
```

**Backend-Endpoints (v1.15.0):**
```
POST   /api/inquiries                       # Anfrage erfassen
GET    /api/inquiries                       # Liste (filter: status)
GET    /api/inquiries/:id                   # Details
PUT    /api/inquiries/:id                   # Anfrage aktualisieren
POST   /api/inquiries/:id/calculation       # Kalkulation erstellen
PUT    /api/inquiries/:id/calculation       # Kalkulation aktualisieren
POST   /api/inquiries/:id/offer             # Angebot generieren
GET    /api/inquiries/:id/offer/pdf         # PDF herunterladen
POST   /api/inquiries/:id/accept            # Angebot angenommen → Objekt anlegen
POST   /api/inquiries/:id/decline           # Angebot abgelehnt
```

**Frontend (v1.15.0):**
- `/inquiries` - Anfragen-Übersicht (Kanban-Board: Received → Calculating → Offer Sent → Accepted/Lost)
- `/inquiries/new` - Anfrage erfassen
- `/inquiries/:id` - Anfrage-Details (mit Kalkulations-Tool)
- `/inquiries/:id/offer` - Angebots-Vorschau & PDF-Generierung

---

### Phase 7: Abrechnungssystem (v1.16.0)
**Ziel:** Stundenerfassung & Rechnungs-Generierung
**Aufwand:** 3-4 Tage
**Features:**
- Stundenerfassung pro Objekt (aus Schichten)
- Kostenübersicht (pro Monat, pro Objekt)
- Rechnungs-Generierung (PDF)
- Buchhaltungs-Export (CSV, DATEV)

**Datenmodell (Prisma):**
```prisma
model SiteBilling {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])

  month       Int      // 1-12
  year        Int

  totalHours  Decimal  @db.Decimal(10, 2)
  totalCost   Decimal  @db.Decimal(10, 2)

  invoiceNumber String?  @unique
  invoiceDate   DateTime?
  pdfPath       String?

  status      BillingStatus @default(DRAFT)

  items       BillingItem[]

  @@index([siteId, year, month])
  @@unique([siteId, year, month])
}

enum BillingStatus {
  DRAFT         // Entwurf
  FINALIZED     // Abgeschlossen
  SENT          // Versendet
  PAID          // Bezahlt
}

model BillingItem {
  id            String   @id @default(cuid())
  billingId     String
  billing       SiteBilling @relation(fields: [billingId], references: [id])

  shiftId       String
  shift         Shift    @relation(fields: [shiftId], references: [id])

  date          DateTime
  hours         Decimal  @db.Decimal(10, 2)
  rate          Decimal  @db.Decimal(10, 2)
  cost          Decimal  @db.Decimal(10, 2)

  @@index([billingId])
}
```

**Backend-Endpoints (v1.16.0):**
```
GET    /api/sites/:id/billing                    # Abrechnungs-Übersicht
POST   /api/sites/:id/billing                    # Abrechnung erstellen (für Monat/Jahr)
GET    /api/sites/:id/billing/:billingId         # Details
PUT    /api/sites/:id/billing/:billingId         # Abrechnung finalisieren
GET    /api/sites/:id/billing/:billingId/pdf     # Rechnung als PDF
GET    /api/sites/:id/billing/:billingId/export  # CSV/DATEV-Export
```

**Frontend (v1.16.0):**
- `/sites/:id/billing` - Abrechnungs-Übersicht
- Monatliche Übersicht (Kalender-View)
- Rechnungs-Generator

---

## 🔐 RBAC-Matrix (Gesamt-Übersicht)

| Feature | Chef (ADMIN) | Einsatzleiter (MANAGER) | Objektleiter | Schichtleiter (DISPATCHER) | MA (EMPLOYEE) |
|---------|--------------|-------------------------|--------------|---------------------------|---------------|
| **Objekte** |
| Objekt anlegen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Objekt bearbeiten | ✅ | ✅ | ✅ (mit Freigabe) | ❌ | ❌ |
| Objekt löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Objekt einsehen | ✅ | ✅ | ✅ (nur zugewiesene) | ✅ (nur zugewiesene) | ✅ (nur zugewiesene) |
| **Dokumente** |
| Dokumente hochladen | ✅ | ✅ | ✅ (mit Freigabe) | ❌ | ❌ |
| Dokumente löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dokumente einsehen | ✅ | ✅ | ✅ | ✅ | ✅ (nur relevante) |
| **Wachbuch** |
| Vorfall eintragen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vorfall bearbeiten | ✅ | ✅ | ✅ | ✅ (eigene) | ✅ (eigene) |
| Vorfall löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Vorfälle einsehen | ✅ | ✅ | ✅ | ✅ | ✅ (nur eigenes Objekt) |
| **Kontrollgänge** |
| Kontrollpunkte anlegen | ✅ | ✅ | ✅ (mit Freigabe) | ❌ | ❌ |
| Kontrollgang starten | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR-Code scannen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auswertung einsehen | ✅ | ✅ | ✅ | ✅ (begrenzt) | ❌ |
| **Ausrüstung** |
| Ausrüstung anlegen | ✅ | ✅ | ✅ (mit Freigabe) | ❌ | ❌ |
| Übergabe dokumentieren | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rückgabe dokumentieren | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kalkulation** |
| Anfrage erfassen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kalkulation erstellen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Angebot erstellen | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Abrechnung** |
| Abrechnung erstellen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rechnung generieren | ✅ | ✅ | ❌ | ❌ | ❌ |
| Buchhaltungs-Export | ✅ | ✅ (begrenzt) | ❌ | ❌ | ❌ |

---

## 🎨 UI-Wireframes (Text-basiert)

### Objekt-Detail-Seite (v1.11.0)
```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Zurück                    Shoppingcenter West            [Bearbeiten] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📷 [Objektfoto]  [Objektfoto]  [Objektfoto]              + Bild    │
│                                                                       │
│  Status: ● ACTIVE          Kunde: Müller GmbH                       │
│                                                                       │
├─ Tabs ──────────────────────────────────────────────────────────────┤
│  [Übersicht]  Clearances  Schichten  Dokumente  Wachbuch  ...      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📍 STAMMDATEN                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Adresse: Hauptstraße 123, 12345 Berlin                        │  │
│  │ Kunde: Müller GmbH (kontakt@mueller.de, 030-12345678)        │  │
│  │ Benötigte MA: 3 pro Schicht                                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  🚨 NOTFALLKONTAKTE                                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ • Hausmeister: Hans Schmidt (0171-1234567)                    │  │
│  │ • Polizei: 110                                                 │  │
│  │ • Feuerwehr: 112                                               │  │
│  │ • Objektleiter: Lisa Müller (0172-9876543)                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  🎓 GEFORDERTE QUALIFIKATIONEN                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ✅ §34a GewO (Pflicht)                                         │  │
│  │ ✅ Brandschutzhelfer (Pflicht)                                 │  │
│  │ ⚪ Erste Hilfe (Optional)                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  👥 ABDECKUNGSSTATISTIK                                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Eingearbeitete MA: 8                                          │  │
│  │ Davon aktiv: 6                                                 │  │
│  │ Qualifikationen erfüllt: 6/8 (75%)                            │  │
│  │ [Details ansehen]                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Wachbuch (v1.12.0)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Wachbuch: Shoppingcenter West                    [+ Vorfall melden] │
├─────────────────────────────────────────────────────────────────────┤
│  Filter: [Alle] [Kritisch] [Offen] [Gelöst]   Zeitraum: [Letzte 7 Tage] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔴 KRITISCH - Heute, 14:23 Uhr                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Einbruchsversuch am Seiteneingang                             │  │
│  │ Gemeldet von: Max Mustermann (Schichtleiter)                  │  │
│  │                                                                 │  │
│  │ Beschreibung: Unbekannte Person versuchte Tür aufzubrechen.   │  │
│  │ Polizei wurde gerufen (Einsatznummer: 12345).                 │  │
│  │ Videoaufzeichnung gesichert.                                   │  │
│  │                                                                 │  │
│  │ Status: ⏳ Offen                                                │  │
│  │ [Als gelöst markieren] [Details]                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  🟡 WARNUNG - Heute, 10:15 Uhr                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Verdächtige Person im Parkhaus                                │  │
│  │ Gemeldet von: Anna Schmidt (MA)                               │  │
│  │                                                                 │  │
│  │ Person angesprochen und des Geländes verwiesen.               │  │
│  │ Keine weiteren Maßnahmen erforderlich.                        │  │
│  │                                                                 │  │
│  │ Status: ✅ Gelöst (14:30 von Max Mustermann)                   │  │
│  │ [Details]                                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ℹ️ INFO - Gestern, 22:45 Uhr                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Fenster in Raum 204 stand offen                               │  │
│  │ Gemeldet von: Thomas Wagner (MA)                              │  │
│  │                                                                 │  │
│  │ Fenster wurde geschlossen. Hausmeister informiert.            │  │
│  │                                                                 │  │
│  │ Status: ✅ Gelöst (22:50 von Thomas Wagner)                    │  │
│  │ [Details]                                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Kontrollgang-Interface (Mobile, v1.13.0)
```
┌─────────────────────────────┐
│ Kontrollgang                 │
│ Shoppingcenter West          │
├─────────────────────────────┤
│                              │
│ Begonnen: 14:30 Uhr          │
│ Dauer: 12 Minuten            │
│                              │
│ ✅ 1. Haupteingang           │
│ ✅ 2. Notausgang West        │
│ ✅ 3. Tiefgarage Ebene 1     │
│ ▶️ 4. Tiefgarage Ebene 2     │  ← AKTUELL
│ ⚪ 5. Dach                    │
│ ⚪ 6. Technikraum             │
│                              │
│ ┌───────────────────────────┐│
│ │  📷 [QR-Code Scanner]     ││
│ │                           ││
│ │   Scannen Sie den         ││
│ │   QR-Code am              ││
│ │   Kontrollpunkt           ││
│ └───────────────────────────┘│
│                              │
│ [Manuell eintragen]          │
│ [Kontrollgang abbrechen]     │
│                              │
└─────────────────────────────┘
```

### Kalkulationstool (v1.15.0)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Kalkulation: Anfrage #KA-2025-042                   [Angebot erstellen] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  KUNDE                                                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Müller GmbH                                                    │  │
│  │ Ansprechpartner: Herr Schmidt (schmidt@mueller.de)            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ANFORDERUNGEN                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Benötigte MA: [3]  pro Schicht                                │  │
│  │ Qualifikationen: §34a, Brandschutz                            │  │
│  │ Schichten: 3 (Früh/Spät/Nacht)                               │  │
│  │ Wochentage: Mo-So (7 Tage)                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  KALKULATION                                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Stundensatz (netto):       [18.50] €                          │  │
│  │ Stunden pro Woche:         [504] h (3 MA × 8h × 21 Schichten)│  │
│  │ Stunden pro Monat:         [~2.190] h                         │  │
│  │                                                                 │  │
│  │ ────────────────────────────────────────────                  │  │
│  │ Personalkosten/Monat:      40.515,00 €                        │  │
│  │ Gemeinkosten (20%):        8.103,00 €                         │  │
│  │ Gewinnmarge (15%):         7.292,70 €                         │  │
│  │ ────────────────────────────────────────────                  │  │
│  │ GESAMT/Monat (netto):      55.910,70 €                        │  │
│  │ MwSt. (19%):               10.622,03 €                        │  │
│  │ ────────────────────────────────────────────                  │  │
│  │ GESAMT/Monat (brutto):     66.532,73 €                        │  │
│  │ GESAMT/Jahr (brutto):      798.392,76 €                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  NOTIZEN                                                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [Kunde wünscht regelmäßige Kontrollgänge alle 2h...]          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  [Kalkulation speichern]  [Angebot generieren (PDF)]                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technische Architektur

### Backend
```
backend/src/
├── controllers/
│   ├── siteController.ts              # v1.11.0 (erweitert)
│   ├── siteDocumentsController.ts     # v1.11.1
│   ├── siteIncidentsController.ts     # v1.12.0
│   ├── controlPointsController.ts     # v1.13.0
│   ├── controlRoundsController.ts     # v1.13.0
│   ├── equipmentController.ts         # v1.14.0
│   ├── inquiriesController.ts         # v1.15.0
│   └── billingController.ts           # v1.16.0
├── services/
│   ├── siteService.ts
│   ├── calculationService.ts          # v1.15.0
│   ├── offerGeneratorService.ts       # v1.15.0 (PDF)
│   ├── invoiceGeneratorService.ts     # v1.16.0 (PDF)
│   └── qrCodeService.ts               # v1.13.0
├── routes/
│   ├── siteRoutes.ts
│   ├── inquiryRoutes.ts
│   └── billingRoutes.ts
└── utils/
    ├── pdfGenerator.ts                # v1.15.0+
    └── qrCodeGenerator.ts             # v1.13.0
```

### Frontend
```
frontend/src/
├── features/
│   ├── sites/
│   │   ├── SiteList.tsx               # v1.11.0
│   │   ├── SiteDetail.tsx             # v1.11.0
│   │   ├── SiteClearances.tsx         # v1.11.0
│   │   ├── SiteDocuments.tsx          # v1.11.1
│   │   ├── SiteIncidents.tsx          # v1.12.0 (Wachbuch)
│   │   ├── ControlPoints.tsx          # v1.13.0
│   │   ├── ControlRounds.tsx          # v1.13.0
│   │   ├── Equipment.tsx              # v1.14.0
│   │   └── SiteBilling.tsx            # v1.16.0
│   ├── inquiries/
│   │   ├── InquiryList.tsx            # v1.15.0 (Kanban)
│   │   ├── InquiryDetail.tsx          # v1.15.0
│   │   ├── CalculationTool.tsx        # v1.15.0
│   │   └── OfferGenerator.tsx         # v1.15.0
│   └── mobile/
│       └── QRScanner.tsx              # v1.13.0
└── pages/
    ├── Sites.tsx
    ├── Inquiries.tsx
    └── Billing.tsx
```

---

## ✅ Entscheidungen (2025-10-17)

### 1. Objektleiter & Schichtleiter - Zuweisungen ✅
**ENTSCHIEDEN:** Option B - Zuweisungen pro Objekt

**RBAC-Logik:**
- **Chef (ADMIN):** Alles, überall
- **Einsatzleiter (MANAGER):**
  - Kann vieles überall (z.B. MA-Pläne anpassen, Notfall-Zuweisungen)
  - Kann grundlegende Änderungen NUR bei **zugewiesenen** Objekten (als Objektleiter)
  - KEINE grundlegenden Änderungen an Sicherheitskonzepten ohne entsprechende Berechtigung
- **Mitarbeiter:** Nur zugewiesene Objekte

**Datenmodell:**
```prisma
model SiteAssignment {
  id        String   @id @default(cuid())
  siteId    String
  site      Site     @relation(fields: [siteId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      SiteRole // OBJEKTLEITER, SCHICHTLEITER, MITARBEITER

  @@unique([siteId, userId])
  @@index([userId])
}

enum SiteRole {
  OBJEKTLEITER      // Vollzugriff auf zugewiesenes Objekt
  SCHICHTLEITER     // Schicht-Verwaltung, Wachbuch
  MITARBEITER       // Lesen, Vorfälle melden
}
```

---

### 2. Kalkulation - Automatisch mit KI-Unterstützung ✅
**ENTSCHIEDEN:** Automatisch (langfristig)

**Ziel:** Vollständige Automatisierung
- System berechnet Stundensätze automatisch (aus MA-Profilen, Qualifikationen)
- Gemeinkosten & Gewinnmargen werden automatisch angewendet
- **Langfristig:** KI-gestützte Kalkulation (Preisprognosen, Marktvergleiche)
- **Phase 1 (v1.15.0):** Hybrid (System schlägt vor, manuell überschreibbar)
- **Phase 2 (v1.17.0+):** Voll automatisch mit KI-Optimierung

---

### 3. Kontrollgänge - NFC-Tags ✅
**ENTSCHIEDEN:** NFC-Tags (Sicherheit first!)

**Begründung:**
- ✅ **Sicherheit:** Schwerer zu fälschen (kritisch bei Sicherheitsdiensten)
- ✅ **Schneller:** Nur dranhalten (effizienter für MA)
- ✅ **Professionell:** Hochwertiger Eindruck beim Kunden
- ⚠️ **Fallback:** QR-Codes als Backup (falls NFC nicht funktioniert)

**Technische Umsetzung:**
- NFC-Tags mit eindeutiger UID
- Web NFC API für Browser-Integration
- QR-Code-Fallback für Geräte ohne NFC

---

### 4. Wachbuch-Kategorien ✅
**ENTSCHIEDEN:** Aktuelle Kategorien passen

**Kategorien (v1.12.0):**
- ✅ Sicherheitsvorfall (Einbruch, Vandalismus)
- ✅ Technisches Problem
- ✅ Personal-Vorfall
- ✅ Kundenbeschwerde
- ✅ Wartung erforderlich
- ✅ Sonstiges

**Erweiterbar:** Weitere Kategorien können später hinzugefügt werden

---

### 5. Buchhaltung - Vollständig integriert ✅
**ENTSCHIEDEN:** Keine externe Software - alles im Tool

**Vision:** Vollständige Lösung für Sicherheitsfirmen
- ✅ Stundenerfassung integriert
- ✅ Rechnungsgenerierung integriert
- ✅ Kostenübersicht integriert
- ✅ Export-Funktion (CSV) für optionale externe Tools

**Langfristig (v2.0+):** Schnittstellen zu DATEV/Lexware falls gewünscht

---

### 6. Benachrichtigungen - HOCH Priorität ✅
**ENTSCHIEDEN:** Sehr wichtig, gerade für spätere App

**Kritische Vorfälle → Sofort-Benachrichtigung:**
- ✅ Push-Benachrichtigungen (App)
- ✅ Email-Benachrichtigungen
- ✅ SMS (optional, für kritische Fälle)

**WICHTIG - Finetuning-Doku erforderlich:**
- 📋 Was ist "kritisch"? (Definition pro Kategorie)
- 📋 Welche Instanzen werden benachrichtigt? (Eskalationsstufen)
- 📋 Wann wird eskaliert? (Zeitfenster)

**Beispiel-Eskalation:**
1. MA meldet "Einbruchsversuch" (KRITISCH)
2. Sofort: Schichtleiter + Objektleiter (Push)
3. Nach 5 Min: Einsatzleiter (Push + SMS)
4. Nach 15 Min: Chef (Anruf)

**Implementierung:**
- v1.12.0: Email-Benachrichtigungen
- v1.17.0+: Push + SMS + Eskalationslogik

---

### 7. Objekt-Status - Verständliche Namen ✅
**ENTSCHIEDEN:** Deutsche, verständliche Namen im UI

**Status-Mapping (Backend → Frontend):**
- `INQUIRY` → "Kundenanfrage"
- `IN_REVIEW` → "In Prüfung"
- `CALCULATING` → "Kalkulation läuft"
- `OFFER_SENT` → "Angebot versendet"
- `ACTIVE` → "Aktiv"
- `INACTIVE` → "Inaktiv"
- `LOST` → "Verloren"

**Farb-Kodierung:**
- 🟡 Anfrage/Prüfung/Kalkulation (Gelb)
- 🔵 Angebot versendet (Blau)
- 🟢 Aktiv (Grün)
- ⚫ Inaktiv (Grau)
- 🔴 Verloren (Rot)

---

### 8. Mobile-Optimierung - Für spätere App vorbereiten ✅
**ENTSCHIEDEN:** Phase 1 bereits für spätere App-Entwicklung vorbereiten

**Zwingend mobile-optimiert (für spätere App):**
- ✅ **Kontrollgänge** (NFC-Scanning vor Ort)
- ✅ **Wachbuch** (Vorfälle vor Ort melden)
- ✅ **Notfallkontakte** (schneller Zugriff)
- ✅ **Notfallpläne/Dienstanweisungen** (vor Ort lesen)
- ✅ **Übergabe-Protokolle** (Schichtwechsel)
- ✅ **Schicht-Übersicht** (MA sieht eigene Schichten)

**Desktop-optimiert:**
- ❌ Kalkulation (komplexe Eingaben)
- ❌ Abrechnung (Reports, Übersichten)
- ❌ Objekt-Verwaltung (komplexe Workflows)

**Technische Vorbereitung:**
- Responsive Design (Mobile-First für MA-Features)
- API ready für spätere native App
- Progressive Web App (PWA) als Zwischenschritt

---

## 📝 Nächste Schritte

### Sofort:
1. **Rückfragen klären** (siehe oben)
2. **Phase 1 (v1.11.0) Plan finalisieren**
3. **Datenmodell erstellen** (Prisma Migrations)
4. **TODO.md aktualisieren** mit allen Phasen

### Nach Freigabe:
1. **Phase 1 implementieren** (3-5 Tage)
2. **Testen & User-Feedback**
3. **Phase 2 starten**

---

**Erstellt von:** Claude (Sonnet 4.5)
**Datum:** 2025-10-17
**Für:** Objekt-Management Suite (v1.11.0 – v1.17.0)
