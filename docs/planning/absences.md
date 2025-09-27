# Abwesenheits- & Urlaubsverwaltung – Entwurf (Stand 2025-09-27)

## Zielbild
Mitarbeitende sollen Abwesenheiten (Urlaub, Krankheit, Sonderurlaub) beantragen können. Disponenten/Manager genehmigen und behalten einen Überblick über Auslastung und Konflikte mit geplanten Schichten. Das Modul bildet die Grundlage für gesetzliche Vorgaben (Arbeitszeitgesetz, Dokumentationspflichten).

## Scope MVP
- Abwesenheitsarten: `VACATION`, `SICKNESS`, `SPECIAL_LEAVE`, `UNPAID` (erweiterbar).
- Status: `REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Zeitraum: ganztägig (Start-/Enddatum), optional Uhrzeiten für halbe Tage.
- Kommentar-Felder: Antragsteller (Begründung), Entscheidung (Hinweis).
- Konflikthinweis: Backend liefert bei Überschneidung mit bestehenden Schichten Warnungen zurück.

## Datenmodell (Skizze)
```prisma
model Absence {
  id            String   @id @default(uuid())
  userId        String
  type          AbsenceType
  status        AbsenceStatus @default(REQUESTED)
  startsAt      DateTime
  endsAt        DateTime
  reason        String?  @db.Text
  decisionNote  String?  @db.Text
  createdById   String
  decidedById   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  createdBy     User     @relation("AbsenceCreatedBy", fields: [createdById], references: [id])
  decidedBy     User?    @relation("AbsenceDecidedBy", fields: [decidedById], references: [id])
}

enum AbsenceType {
  VACATION
  SICKNESS
  SPECIAL_LEAVE
  UNPAID
}

enum AbsenceStatus {
  REQUESTED
  APPROVED
  REJECTED
  CANCELLED
}
```

### Mindestfelder je Abwesenheitsantrag
| Feld | Pflicht | Beschreibung |
| --- | --- | --- |
| `type` | ✔️ | Art der Abwesenheit |
| `startsAt` | ✔️ | Startdatum/-zeit |
| `endsAt` | ✔️ | Enddatum/-zeit |
| `reason` | optional | Freitext des Mitarbeiters |
| `decisionNote` | optional | Kommentar des Entscheiders |

## API-Entwurf
- `POST /api/absences` – Antrag erstellen (RBAC: Mitarbeitende dürfen nur für sich, Admin/Manager für alle).
- `GET /api/absences` – Liste mit Filtern (`userId`, `status`, `type`, `from`, `to`).
- `GET /api/absences/:id` – Detailansicht inkl. Audit-Historie.
- `PUT /api/absences/:id/approve` – Genehmigung (erfordert Rolle MANAGER/ADMIN).
- `PUT /api/absences/:id/reject` – Ablehnung (dito).
- `PUT /api/absences/:id/cancel` – Stornierung durch Antragsteller.
- Exporte (CSV/XLSX) analog zu Users/Sites/Shifts.

Antwortstruktur (Liste):
```json
{
  "data": [
    {
      "id": "...",
      "user": { "id": "...", "firstName": "...", "lastName": "..." },
      "type": "VACATION",
      "status": "REQUESTED",
      "startsAt": "2025-10-01T00:00:00Z",
      "endsAt": "2025-10-05T23:59:59Z",
      "reason": "Familienurlaub",
      "decisionNote": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "total": 12, "totalPages": 1 }
}
```

## UI-Skizze (Frontend)
- Navigationseintrag „Abwesenheiten“ (ADMIN/MANAGER sehen alle, EMPLOYEE nur eigene).
- Tabelle: Filter nach Nutzer, Zeitraum, Status, Typ.
- Button „Antrag stellen“ → Modal/Formular (Type, Zeitraum, Kommentar).
- Detail-Sidebar: Entscheidungshistorie, Buttons „Genehmigen/Ablehnen“ (RBAC).
- Kalender-Overlay (optional v2): Visualisiert Schicht-/Abwesenheitsüberschneidungen.

## RBAC
| Akteur | Aktionen |
| --- | --- |
| EMPLOYEE | eigene Abwesenheiten anlegen, einsehen, stornieren |
| MANAGER | alle Abwesenheiten einsehen, genehmigen, ablehnen |
| ADMIN | volle Rechte, inkl. systemweite Exporte |

## Observability & Audit
- Audit-Events: `ABSENCE.REQUEST.CREATE`, `ABSENCE.REQUEST.APPROVE`, `ABSENCE.REQUEST.REJECT`, `ABSENCE.REQUEST.CANCEL`.
- Prometheus-Counter: Anzahl Anträge pro Typ/Status.
- Warnung: Überschneidungen mit kritischen Schichten (z. B. Einsatzleiter) triggern Slack-Alert (optional Phase 2).

## Offene Punkte
- Dokumente/Atteste anhängen? (Verweis auf `docs/planning/employee-profile.md`).
- Benachrichtigungen (E-Mail/Push) bei Genehmigung/Ablehnung.
- Synchronisation mit externen Kalendern (ICS-Export) – optional.
- Auswertungen für Lohnbuchhaltung (Abwesenheitstage/Resturlaub) – später.

