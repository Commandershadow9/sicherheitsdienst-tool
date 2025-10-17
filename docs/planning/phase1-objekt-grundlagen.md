# Phase 1: Objekt-Grundlagen (v1.11.0) – Implementierungsplan

**Status**: Backend-Grundlagen umgesetzt (Stand: 2025-10-17)
**Aufwand**: ca. 3-5 Tage (Frontend & Tests offen)
**Priorität**: HOCH
**Start**: Nach Freigabe

---

## 🎯 Ziele dieser Phase

✅ **MVP für Objekt-Management:**
- Objekte anlegen, bearbeiten, archivieren
- Stammdaten erweitern (Kunde, Notfallkontakte, Status)
- Bilder hochladen (Objektfotos, Gebäudepläne)
- MA-Clearances verwalten (Einarbeitungs-Status)
- Objekt-Zuweisungen (Objektleiter/Schichtleiter)
- Abdeckungsstatistik (wie gut ist das Objekt besetzt?)

---

## 📦 Deliverables – Fortschritt

### Backend (✅ erledigt, sofern nicht anders markiert)
- [x] Prisma-Migration `20251016224831_add_site_management_phase1`
  - [x] `Site`-Modell um Kundenfelder, Notfallkontakte, Status & Anforderungen erweitert
  - [x] `SiteImage`- und `SiteAssignment`-Modelle ergänzt
  - [x] `ObjectClearance` um Trainings-/Freigabe-Metadaten + Status `TRAINING` erweitert
- [x] Routen & Controller angepasst (`backend/src/controllers/siteController.ts`, `backend/src/routes/siteRoutes.ts`)
  - [x] CRUD mit neuen Feldern, Filter (Status, Kunde) & Export
  - [x] Bilder-Listing/Erstellung/Löschen (derzeit JSON-Metadaten-basierter Stub, Datei-Upload folgt im FE)
  - [x] Site-Assignments CRUD (ADMIN/MANAGER)
  - [x] Coverage-Stats Endpoint
- [x] Clearance-Controller + Routen (`/api/clearances`, `/api/v1/clearances`)
  - [x] Erstellung/Aktualisierung/Training abschließen/Widerrufen
- [x] Replacement-Scoring erweitert (`calculateObjectClearanceScore`, neue Gewichtung)
- [ ] RBAC-Härtung: Ownership-Checks & Rollenhierarchie für Objektleiter (Follow-up)
- [ ] Tests (Unit + Integration) für neue Services/Controller

### Frontend (🚧 ausstehend)
- [ ] Objekt-Liste inkl. Filter/Status-Badges
- [ ] Objekt-Detail (Tabs: Übersicht, Clearances, Schichten, Bilder)
- [ ] Objekt-Formulare (Create/Edit) mit neuen Feldern
- [ ] Bild-Upload (FormData → Multer-Backend)
- [ ] Clearances-Verwaltung im Replacement-Modal (Badge, „Einarbeitung starten“)

### QS & Docs
- [ ] Jest/Integrationstests für neue Endpoints & Scoring
- [ ] Playwright Smoke (optional) sobald UI steht
- [ ] README/API-Doku aktualisieren (inkl. OpenAPI)

---

## 🗄️ Datenmodell (Prisma Migration)

### Step 1: Site-Erweiterungen

```prisma
model Site {
  // Bestehende Felder (bereits vorhanden)
  id         String @id @default(cuid())
  name       String
  address    String
  city       String
  postalCode String

  // NEU: Kunden-Informationen
  customerName    String?
  customerCompany String?
  customerEmail   String?
  customerPhone   String?

  // NEU: Notfallkontakte (JSON-Array als freies JSON-Feld)
  emergencyContacts Json? // z.B. [{ "name": "...", "phone": "...", "role": "..." }]

  // NEU: Objekt-Status
  status SiteStatus @default(ACTIVE)

  // NEU: Anforderungen
  requiredStaff          Int      @default(1)
  requiredQualifications String[] @default([])

  // NEU: Beschreibung & Notizen
  description String? @db.Text
  notes       String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationen (bestehend + neu)
  shifts      Shift[]
  events      Event[]
  clearances  ObjectClearance[]
  images      SiteImage[]
  assignments SiteAssignment[]
}

enum SiteStatus {
  INQUIRY       // Kundenanfrage (wird in Phase 6 wichtig)
  IN_REVIEW     // In Prüfung
  CALCULATING   // Kalkulation läuft
  OFFER_SENT    // Angebot versendet
  ACTIVE        // Aktiv betreut
  INACTIVE      // Inaktiv (Vertrag beendet)
  LOST          // Verloren (Kunde abgesprungen)
}
```

### Step 2: SiteImage (Bilder-Verwaltung)

```prisma
model SiteImage {
  id     String @id @default(cuid())
  siteId String @map("site_id")
  site   Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)

  filename    String
  filePath    String        @map("file_path")
  category    ImageCategory @default(OTHER)
  description String?
  fileSize    Int           @map("file_size")
  mimeType    String        @map("mime_type")

  uploadedAt DateTime @default(now()) @map("uploaded_at")
  uploadedBy String   @map("uploaded_by")
  uploader   User     @relation("SiteImageUploader", fields: [uploadedBy], references: [id])

  @@index([siteId, category])
  @@map("site_images")
}
```

### Step 3: SiteAssignment (Objektleiter/Schichtleiter-Zuweisungen)

```prisma
model SiteAssignment {
  id     String @id @default(cuid())
  siteId String @map("site_id")
  site   Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  userId String @map("user_id")
  user   User   @relation("SiteAssignmentUser", fields: [userId], references: [id], onDelete: Cascade)

  role       SiteRole
  assignedAt DateTime @default(now()) @map("assigned_at")
  assignedBy String   @map("assigned_by")

  @@unique([siteId, userId], name: "site_assignments_site_user_key")
  @@index([userId])
  @@index([siteId, role])
  @@map("site_assignments")
}

enum SiteRole {
  OBJEKTLEITER      // Vollzugriff auf zugewiesenes Objekt
  SCHICHTLEITER     // Schicht-Verwaltung, Wachbuch
  MITARBEITER       // Lesen, Vorfälle melden (wird später in Phase 3 wichtig)
}
```

### Migration erstellen

```bash
npx prisma migrate dev --name add_site_management_phase1
```

---

## 🔧 Backend-Implementation

### 1. Site Controller erweitern

**Datei**: `backend/src/controllers/siteController.ts`

| Endpoint | Status | Notizen |
| --- | --- | --- |
| `GET /api/sites` | ✅ | Pagination, Filter (Name, Stadt, PLZ, Status, Kunde), CSV/XLSX Export |
| `GET /api/sites/:id` | ✅ | Optional `?include=relations` lädt Bilder (Top 10), Assignments, aktive Clearances |
| `POST /api/sites` | ✅ | Unterstützt neue Felder; Validierung via `siteValidation.ts` |
| `PUT /api/sites/:id` | ✅ | Teil-Updates aller neuen Felder |
| `DELETE /api/sites/:id` | ✅ | Unverändert |
| `GET /api/sites/:id/images` | ✅ | Liefert Bilder inkl. Uploader |
| `POST /api/sites/:id/images` | ✅ (Stub) | Erwartet aktuell JSON-Metadaten (`filename`, `filePath` …); echtes File-Upload-Handling folgt im Multer-Follow-up |
| `DELETE /api/sites/:siteId/images/:imageId` | ✅ | Entfernt DB-Eintrag, Filesystem-Löschung TODO |
| `GET /api/sites/:id/assignments` | ✅ | Optionaler `role`-Filter |
| `POST /api/sites/:id/assignments` | ✅ | RBAC: ADMIN/MANAGER; Ownership-Checks offen |
| `DELETE /api/sites/:siteId/assignments/:assignmentId` | ✅ | RBAC: ADMIN/MANAGER |
| `GET /api/sites/:id/coverage-stats` | ✅ | Gibt `requiredStaff`, `activeClearances`, `coveragePercent`, Assignments-Anzahl je Rolle zurück |

**Follow-up:** RBAC-Feinjustierung (z. B. Objektleiter nur auf eigene Objekte), Konsistenz-Prüfungen (z. B. Double-Assign verhindern) & File-Upload via Multer.

### 2. Clearance-Controller

**Datei**: `backend/src/controllers/clearanceController.ts`

- `GET /api/clearances` – Filter nach `userId`, `siteId`, `status`
- `POST /api/clearances` – legt Clearance mit Default `TRAINING` an (409 bei Duplikat)
- `GET /api/clearances/:id` – Detail inkl. Trainer/Approver
- `PUT /api/clearances/:id` – Aktualisiert Status, Notizen, Trainingsdaten
- `DELETE /api/clearances/:id` – entfernt Clearance
- `POST /api/clearances/:id/complete-training` – setzt Status `ACTIVE`, trackt `trainingHours`, `approvedBy`
- `POST /api/clearances/:id/revoke` – setzt Status `REVOKED`, optionaler Kommentar

**TODO:** Zod-Validierungen für Request-Bodies ergänzen, Auditing/Events prüfen.

### 3. Replacement-Scoring

- Neue Helper-Funktion `calculateObjectClearanceScore` (0–100 Punkte)
- Gewichtsverteilung angepasst (`objectClearance` = 20 %, Workload auf 5 %)
- `calculateCandidateScore` lädt Clearances pro `siteId` und inkludiert Score

Offene Aufgabe: Unit-Tests für Scorefunktion & Regressions-Test für Gewichtungen.

---

### 4. RBAC-Middleware für Site-Zuweisungen

**Datei**: `backend/src/middleware/siteRBAC.ts`

**Logik:**

```typescript
export const canEditSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: siteId } = req.params;
    const user = req.user!;

    // ADMIN kann alles
    if (user.role === 'ADMIN') return next();

    // MANAGER kann alles bei zugewiesenen Objekten (als OBJEKTLEITER)
    if (user.role === 'MANAGER') {
      const assignment = await prisma.siteAssignment.findUnique({
        where: { siteId_userId: { siteId, userId: user.id } }
      });

      if (assignment && assignment.role === 'OBJEKTLEITER') {
        return next();
      }
    }

    return next(createError(403, 'Keine Berechtigung für dieses Objekt'));
  } catch (error) {
    next(error);
  }
};
```

---

## 🎨 Frontend-Implementation (Blueprint)

> Stand 2025-10-17: Frontend noch nicht implementiert. Nachfolgende Skizzen dienen als Leitplanke für die Umsetzung; API-Verträge siehe Abschnitt „Backend“.

### 1. Objekt-Liste

**Datei**: `frontend/src/pages/Sites.tsx`

**Features:**
- Filter: Status, Stadt, Kunde
- Sort: Name, Stadt, Status, Erstelldatum
- Status-Badges (farbcodiert)
- Abdeckungs-Indikator (z.B. "8/10 MA")

**Mock-Code:**

```tsx
export default function Sites() {
  const [filters, setFilters] = useState({
    status: 'all',
    city: '',
    customer: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sites', filters],
    queryFn: () => api.get('/sites', { params: filters })
  });

  return (
    <div>
      <h1>Objekt-Verwaltung</h1>

      {/* Filter */}
      <div className="filters">
        <Select value={filters.status} onChange={...}>
          <option value="all">Alle</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Inaktiv</option>
        </Select>
        {/* ... */}
      </div>

      {/* Liste */}
      <div className="grid">
        {data?.data.map(site => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </div>
  );
}
```

---

### 2. Objekt-Detail-Seite (Tabs)

**Datei**: `frontend/src/pages/SiteDetail.tsx`

**Tabs:**
1. **Übersicht** - Stammdaten, Notfallkontakte, Bilder
2. **Clearances** - MA-Einarbeitungen
3. **Schichten** - Schichtplan (bereits vorhanden, erweitert)
4. **Bilder** - Galerie

**Mock-Code:**

```tsx
export default function SiteDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: site } = useQuery({
    queryKey: ['site', id],
    queryFn: () => api.get(`/sites/${id}`)
  });

  return (
    <div>
      <header>
        <h1>{site?.name}</h1>
        <StatusBadge status={site?.status} />
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('overview')}>Übersicht</button>
        <button onClick={() => setActiveTab('clearances')}>Clearances</button>
        <button onClick={() => setActiveTab('shifts')}>Schichten</button>
        <button onClick={() => setActiveTab('images')}>Bilder</button>
      </div>

      {/* Tab-Content */}
      {activeTab === 'overview' && <OverviewTab site={site} />}
      {activeTab === 'clearances' && <ClearancesTab siteId={id} />}
      {activeTab === 'shifts' && <ShiftsTab siteId={id} />}
      {activeTab === 'images' && <ImagesTab siteId={id} />}
    </div>
  );
}
```

---

### 3. Bild-Upload-Dialog

**Datei**: `frontend/src/features/sites/ImageUploadDialog.tsx`

**Features:**
- Drag & Drop
- Vorschau
- Kategorie-Auswahl
- Beschreibung

**Mock-Code:**

```tsx
export function ImageUploadDialog({ siteId, onClose, onSuccess }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('EXTERIOR');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('category', category);
      formData.append('description', description);

      return api.post(`/sites/${siteId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      toast.success('Bild hochgeladen');
      onSuccess();
      onClose();
    }
  });

  return (
    <Modal open onClose={onClose}>
      <h2>Bild hochladen</h2>

      {/* Drag & Drop */}
      <div
        className="dropzone"
        onDrop={(e) => {
          e.preventDefault();
          setFile(e.dataTransfer.files[0]);
        }}
      >
        {file ? <img src={URL.createObjectURL(file)} /> : 'Datei hier ablegen'}
      </div>

      {/* Kategorie */}
      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="EXTERIOR">Außenansicht</option>
        <option value="INTERIOR">Innenansicht</option>
        <option value="FLOOR_PLAN">Grundriss</option>
        {/* ... */}
      </Select>

      {/* Beschreibung */}
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <Button onClick={() => mutation.mutate()} disabled={!file}>
        Hochladen
      </Button>
    </Modal>
  );
}
```

---

## ✅ Acceptance Criteria (Definition of Done) – Status 2025-10-17

### Backend
- [x] Prisma-Migration läuft ohne Fehler
- [x] Alle neuen Felder sind in der DB (inkl. Defaults & Indizes)
- [x] CRUD-Endpoints für Sites inkl. Filter/Exports funktionieren
- [ ] Image-Upload verarbeitet FormData inkl. Dateispeicherung (derzeit nur JSON-Stubs)
- [x] Coverage-Stats-Endpoint liefert korrekte Basisdaten
- [ ] RBAC-Middleware schützt sensible Endpoints (Feinabstimmung Objektleiter/Self-Service fehlt)
- [ ] Unit-Tests für Services geschrieben (mind. 70 % Coverage)
- [ ] Integration-Tests für API-Endpoints

### Frontend
- [ ] Objekt-Liste zeigt alle Objekte mit Filter/Sort
- [ ] Status-Badges sind farbcodiert
- [ ] Objekt-Detail-Seite zeigt alle Tabs
- [ ] Bilder-Upload funktioniert (Drag & Drop → Backend FormData)
- [ ] Clearances-Verwaltung funktioniert (inkl. Training abschließen)
- [ ] Responsive (Desktop + Tablet, Mobile später)
- [ ] Alle Forms haben Validierung (Zod)
- [ ] Toast-Benachrichtigungen bei Erfolg/Fehler

### Allgemein
- [ ] Keine TypeScript-Errors (gesamtes Repo gebaut)
- [ ] Keine ESLint-Warnungen (Lint-Lauf)
- [ ] Code ist dokumentiert (JSDoc / Kommentare)
- [ ] README aktualisiert
- [x] CHANGELOG aktualisiert (v1.11.0 Eintrag vorhanden)
- [ ] Manuell getestet (Happy Path + Edge Cases dokumentiert)

---

## 🚀 Nächste Schritte (nach Phase 1)

1. **Phase 2 starten** (Dokument-Management)
2. **User-Feedback einholen**
3. **Bugfixes & Performance-Optimierungen**

---

**Erstellt**: 2025-10-17  
**Zuletzt aktualisiert**: 2025-10-17 (Backend MVP fertiggestellt)  
**Für**: Objekt-Management Phase 1 (v1.11.0)
