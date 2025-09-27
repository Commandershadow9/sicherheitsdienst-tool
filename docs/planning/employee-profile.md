# Mitarbeiterprofil – Erweiterungen (Stand 2025-09-27)

## Zielsetzung
Das Mitarbeiterprofil soll alle relevanten Stammdaten, Qualifikationen und Dokumente bündeln, um operative Entscheidungen (Einsatzplanung, Compliance) zu unterstützen und gesetzliche Nachweispflichten zu erfüllen.

## Pflicht- und optionale Felder
| Kategorie | Felder | Hinweise |
| --- | --- | --- |
| Stammdaten | Vorname, Nachname, Geburtsdatum, Anschrift (Straße, PLZ, Ort, Land), Telefonnummer, E-Mail | Adresse wird für Einsatzort-Planung und Behördenmeldungen benötigt. |
| Beschäftigungsdaten | Eintrittsdatum, Vertragsart (Vollzeit/Teilzeit/Minijob), Arbeitszeitmodell, Personalnummer | Grundlage für Arbeitszeit- und Urlaubsberechnung. |
| Qualifikationen | Liste mit Typ, Beschreibung, Gültigkeitszeitraum (z. B. Sachkunde §34a, Erste Hilfe) | Sollte versioniert werden, um Verlängerungen zu verfolgen. |
| Nachweise/Dokumente | Hochladbare Dateien (PDF/JPG) wie Waffenschein, Führungszeugnis, Abmahnungen, Zertifikate | Dokumentmetadaten: Typ, Ausstellungsdatum, Ablaufdatum, wer hochgeladen hat. |
| Sicherheit | Waffensachkunde (ja/nein), Dienstwaffe (ja/nein), Führerschein-Klassen | Wird für Einsatzmatching benötigt. |
| Notizen | interne Hinweise (sichtbar für ADMIN/MANAGER) | DSGVO-konforme Aufbewahrungsfristen beachten. |

## Datenmodell (Skizze)
```prisma
model EmployeeProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  address        Json?    // { street, postalCode, city, country }
  birthDate      DateTime?
  phone          String?
  employmentType EmploymentType
  employmentStart DateTime?
  employmentEnd  DateTime?
  workSchedule   String? // Freitext oder Referenz auf Muster
  notes          String? @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id])
  qualifications EmployeeQualification[]
  documents      EmployeeDocument[]
}

model EmployeeQualification {
  id          String   @id @default(uuid())
  profileId   String
  title       String
  description String?
  validFrom   DateTime?
  validUntil  DateTime?

  profile     EmployeeProfile @relation(fields: [profileId], references: [id])
}

model EmployeeDocument {
  id          String   @id @default(uuid())
  profileId   String
  category    DocumentCategory
  filename    String
  mimeType    String
  size        Int
  storedAt    String   // z. B. S3-Key oder lokaler Pfad
  issuedAt    DateTime?
  expiresAt   DateTime?
  uploadedBy  String
  createdAt   DateTime @default(now())

  profile     EmployeeProfile @relation(fields: [profileId], references: [id])
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  MINI_JOB
  TEMPORARY
}

enum DocumentCategory {
  FIREARM_LICENSE
  WARNING_LETTER
  CONTRACT
  TRAINING_CERTIFICATE
  OTHER
}
```

## API-Erweiterungen
- `GET /api/users/:id/profile` – Detail inkl. Qualifikationen & Dokumente.
- `PUT /api/users/:id/profile` – Stammdaten aktualisieren (RBAC: ADMIN/MANAGER; Mitarbeitende können ausgewählte Felder wie Adresse/Telefon bearbeiten).
- `POST /api/users/:id/profile/qualifications` – Qualifikation hinzufügen.
- `POST /api/users/:id/profile/documents` – Dokument-Upload (Multipart, Metadaten).
- `DELETE ...` – Entfernen einzelner Qualifikationen/Dokumente (RBAC: ADMIN/MANAGER).

## Dateispeicher & Sicherheit
- Speicherung bevorzugt in S3-kompatiblem Storage (Versionierung optional).
- Zugriffskontrolle: Dokumente nur für autorisierte Rollen (ADMIN/MANAGER) und betroffene Mitarbeitende.
- Audit-Events: Upload, Download, Löschung (`EMPLOYEE.DOCUMENT.UPLOAD`, `EMPLOYEE.DOCUMENT.DELETE`).
- Verschlüsselung: Optional serverseitige Verschlüsselung, TLS für Transfers obligatorisch.

## UI/UX
- Profilseite mit Tabs: Stammdaten, Qualifikationen, Dokumente, Notizen.
- Upload-Dialog mit Kategorie-Auswahl und Ablaufdatum.
- Badge/Highlight für ablaufende Qualifikationen oder Dokumente.
- Export (PDF/ZIP) für Mitarbeiterakte (Optional Phase 2).

## Offene Fragen
- Aufbewahrungsfristen: automatische Löschung abgelaufener Dokumente?
- Integration mit HR-Systemen (Import/Export).
- Benachrichtigungen bei ablaufenden Qualifikationen/Dokumenten (E-Mail/Push).

