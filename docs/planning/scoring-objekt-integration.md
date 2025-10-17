claude# Intelligent Replacement Scoring - Objekt-Integration

**Erstellt**: 2025-10-17
**Priorität**: HOCH
**Abhängig von**: Phase 1 Objekt-Management (v1.11.0)
**Status**: Backend-Score erweitert (Stand 2025-10-17) – Folgearbeiten offen

---

## 🎯 Ziele & Fortschritt

- [x] Objekt-Clearances in das Scoring aufnehmen (bewertet Einarbeitungsstatus)
- [x] Gewichtungen anpassen, sodass Objekt-Clearances 20 % beitragen
- [ ] Objekt-Qualifikationen (Site `requiredQualifications`) in Compliance-Score prüfen
- [ ] Präferenzen pro Objekt (`preferredSiteIds`/`avoidedSiteIds`) stärken
- [ ] Vorschlags-Flow für neue Objektbesetzungen (beyond replacements) vorbereiten
- [ ] Tests, Telemetrie & Docs nachziehen

---

## 📊 Scoring-Setup (Stand v1.11.0)

| Komponente              | Gewicht | Quelle                                         | Status |
| ----------------------- | ------- | ---------------------------------------------- | ------ |
| Workload-Score          | 5 %     | `EmployeeWorkload`                             | unverändert |
| Compliance-Score        | 35 %    | ArbZG-Regeln (Restzeiten, Wochenstunden, etc.) | TODO: Objekt-Qualifikationen integrieren |
| Fairness-Score          | 15 %    | Team-Durchschnitt (Nacht / Ersatz-Einsätze)    | unverändert |
| Preference-Score        | 25 %    | `EmployeePreferences`                          | TODO: Objekt-Präferenzen stärken |
| Object-Clearance-Score  | 20 %    | `ObjectClearance` (neu)                        | ✅ implementiert |

> Implementierung in `backend/src/services/replacementScoreUtils.ts` und
> `backend/src/services/intelligentReplacementService.ts`.

---

## 🔄 Umsetzung – Object-Clearance-Score (✅)

### Datenfluss
1. `calculateCandidateScore` lädt (falls `shift.siteId` gesetzt) die Clearance des Mitarbeiters für das Objekt (`prisma.objectClearance.findFirst`).
2. `calculateObjectClearanceScore` bewertet Status & Metadaten.
3. `calculateTotalScore` berücksichtigt den Rückgabewert mit 20 % Gewicht.

### Kernfunktion

```typescript
export function calculateObjectClearanceScore(clearance: {
  status: 'ACTIVE' | 'TRAINING' | 'EXPIRED' | 'REVOKED';
  trainingCompletedAt: Date | null;
  trainedAt?: Date | null;
  validUntil?: Date | null;
} | null): number {
  if (!clearance) return 0;

  const statusScores = {
    ACTIVE: 100,
    TRAINING: 50,
    EXPIRED: 0,
    REVOKED: 0,
  } as const;

  let score = statusScores[clearance.status] ?? 0;

  if (clearance.trainingCompletedAt) {
    score += 10; // Bonus: Training abgeschlossen
  }

  if (clearance.trainedAt) {
    const daysSinceTraining =
      (Date.now() - new Date(clearance.trainedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceTraining < 30) {
      score += 5; // Frisch eingelernt
    }
  }

  if (clearance.validUntil) {
    const daysUntilExpiry =
      (new Date(clearance.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry < 14 && daysUntilExpiry >= 0) {
      score -= 20; // Läuft bald ab
    }
  }

  return Math.max(0, Math.min(100, score));
}
```

### Telemetrie
- `recordCandidateScore` erhält nun `objectClearanceScore` → in Metriken/Logs verfolgen.
- TODO: Dashboard/Alerting erweitern (z. B. Anteil Kandidaten ohne Clearance).

---

## 🧩 Offene Aufgaben

| Bereich | Aufgabe | Notizen |
| --- | --- | --- |
| Compliance | `requiredQualifications` gegen MA-Qualifikationen prüfen | Score-Abzug + Warning im Candidate-Response |
| Preferences | `preferredSiteIds` / `avoidedSiteIds` aus `EmployeePreferences` stärker gewichten | Erweiterung von `calculatePreferenceScore` |
| API | Endpoint `GET /api/sites/:id/suitable-employees` zur Proaktiven Besetzung | hängt an RBAC & Site-Daten |
| Frontend | Clearance-Badge + Warnungen im Replacement-Modal anzeigen | Nutzung von `objectClearanceScore` & Warnings |
| Tests | Unit-Tests für Score-Helper + Integrationstest für Candidate Score | Jest-Suite in `backend/src/services/__tests__` |
| Monitoring | Prometheus-Metriken (z. B. Histogramm Clearance-Score) | Metrik-Namen abstimmen mit Ops-Team |

---

## 🧪 Tests & Qualitätssicherung (TODO)
- [ ] Unit-Tests für `calculateObjectClearanceScore` (Status, Boni/Mali, Boundaries)
- [ ] Regressionstest für `calculateTotalScore` (alte Gewichtung vs. neue)
- [ ] Integrationstest `GET /api/shifts/:id/replacement-candidates-v2` mit Site-gebundener Schicht
- [ ] Contract-Test (`openapi.methodnotallowed.contract.test.ts`) erweitern falls neue Endpoints entstehen

---

## 🗂️ Roadmap-Links
- Phase 1 Deliverable: Objekt-Management Backend (siehe `docs/planning/phase1-objekt-grundlagen.md`)
- Phase 2+ (Dokument-/Wachbuch-Features) werden weitere Scoring-Daten (Vorfälle, Dokumente) liefern

---

## 🔧 Implementierungs-Reihenfolge

### Phase 1 (v1.11.0) - Grundlagen ✅
- [x] Datenmodell (ObjectClearance, SiteAssignment) ← **DIESE PHASE**
- [x] Object-Clearance-Score implementieren
- [x] Replacement-Endpoint erweitert (liefert `objectClearanceScore`)
- [ ] Frontend: Clearance-Badge im Replacement-Modal

### Phase 2 (v1.11.1) - Präferenzen
- [ ] EmployeePreferences um `preferredSites` erweitern
- [ ] Preference-Score-Erweiterung

### Phase 3 (v1.11.2) - MA-Matching
- [ ] Neuer Endpoint: `GET /api/sites/:id/suitable-employees`
- [ ] Site-Matching-Service implementieren
- [ ] Frontend: "MA finden" Button im Objekt-Detail

### Phase 4 (v1.12.0+) - Geo-Matching
- [ ] Adressen geocoden (lat/lng speichern)
- [ ] Distanz-Berechnung (Haversine-Formel)
- [ ] Travel-Time-Score (Google Maps API oder OSRM)

---

## 📊 Datenmodell-Erweiterungen

### EmployeePreferences erweitern (🚧 geplant)

```prisma
model EmployeePreferences {
  // ... bestehende Felder

  // NEU: Objekt-Präferenzen
  preferredSites       String[] @default([])
  avoidSites           String[] @default([])
  maxTravelTimeMinutes Int?
  willingToTravel      Boolean  @default(true)

  @@map("employee_preferences")
}
```

### ObjectClearance erweitern (✅ erledigt)

```prisma
model ObjectClearance {
  id                  String   @id @default(cuid())
  userId              String
  siteId              String
  status              ClearanceStatus @default(ACTIVE)
  trainingCompletedAt DateTime?       @map("training_completed_at")
  trainingHours       Int?            @default(0) @map("training_hours")
  approvedBy          String?         @map("approved_by")
  approver            User?           @relation("ClearanceApprover", fields: [approvedBy], references: [id])
  validUntil          DateTime?       @map("valid_until")
  // ...
}
```

---

## 🎯 Frontend-Integration

> UI-Umsetzung steht noch aus; folgende Skizzen dienen als Vorlage für Phase-1-Frontend & Folgephasen.

### Replacement-Modal (erweitert)

**Neue Badges:**
```tsx
<div className="badges">
  {/* Bestehende Badges */}
  <Badge variant="success">Score: 85</Badge>
  <Badge variant="warning">Auslastung: 45%</Badge>

  {/* NEU: Clearance-Badge */}
  {candidate.objectClearance === 0 ? (
    <Badge variant="error">
      ❌ Keine Einarbeitung
      <Button size="sm" onClick={() => startTraining(candidate.userId)}>
        Einarbeitung starten
      </Button>
    </Badge>
  ) : (
    <Badge variant="success">✅ Eingearbeitet</Badge>
  )}
</div>
```

### Objekt-Detail: "MA finden" Feature

**Neuer Tab: "MA vorschlagen"**

```tsx
function SuitableEmployeesTab({ siteId }) {
  const { data: suggestions } = useQuery({
    queryKey: ['site-suitable-employees', siteId],
    queryFn: () => api.get(`/sites/${siteId}/suitable-employees`)
  });

  return (
    <div>
      <h2>Geeignete Mitarbeiter für dieses Objekt</h2>
      <p>Vorschläge basierend auf Qualifikationen, Verfügbarkeit und Präferenzen</p>

      {suggestions?.data.map(emp => (
        <EmployeeCard key={emp.userId} employee={emp}>
          <ScoreRing score={emp.score} />
          <div className="strengths">
            {emp.strengths.map(s => <li>✅ {s}</li>)}
          </div>
          <Button onClick={() => startTraining(emp.userId, siteId)}>
            Einarbeitung starten
          </Button>
        </EmployeeCard>
      ))}
    </div>
  );
}
```

---

## 📋 TODO - Integration in Phasen

### Phase 1 (v1.11.0) - Jetzt
- [x] Object-Clearance-Score implementieren
- [x] Replacement-Endpoint erweitern (Clearance berücksichtigen)
- [ ] Frontend: Clearance-Badge im Replacement-Modal

### Nach Phase 1
- [ ] EmployeePreferences erweitern (preferredSites)
- [ ] Neuer Endpoint: suitable-employees
- [ ] Frontend: "MA finden" Tab im Objekt-Detail

### Langfristig (v1.17.0+)
- [ ] Geo-Matching (Distanz-basiertes Scoring)
- [ ] ML-Modell für Objekt-MA-Matching
- [ ] Automatische Vorschläge ("System schlägt vor: Diese 3 MA sollten für Objekt X eingelernt werden")

---

## 🚨 Wichtige Hinweise

1. **Rückwärtskompatibilität:**
   - Bestehender Replacement-Endpoint muss weiterhin funktionieren
   - Neue Scoring-Komponente ist **optional** (nur wenn Site-Info vorhanden)

2. **Performance:**
   - Scoring-Berechnung kann teuer werden bei vielen MA
   - Caching für ObjectClearances erwägen
   - Indizes auf `siteId` und `userId` in `object_clearances`

3. **Testing:**
   - Unit-Tests für neue Scoring-Funktionen
   - Integration-Tests für erweiterte Endpoints
   - Edge Cases: MA ohne Clearance, abgelaufene Clearances, etc.

---

**Erstellt**: 2025-10-17
**Für**: Objekt-Management & Intelligent Replacement Integration
