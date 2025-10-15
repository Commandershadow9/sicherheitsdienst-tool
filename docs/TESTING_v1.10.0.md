# Test-Anleitung v1.10.0 - ICS-Export & Replacement Observability

> **Version:** 1.10.0
> **Datum:** 2025-10-15
> **Features:** ICS-Kalender-Export, Replacement-Metriken, UX-Verbesserungen

---

## 🎯 Vorbereitung

### 1. Seeds laden
```bash
cd ~/project/backend
npm run seed
```

**Was wird erstellt:**
- ✅ 10 Employees mit verschiedenen Profilen
- ✅ 5 Replacement-Kandidaten (OPTIMAL, GOOD, ACCEPTABLE, OVERWORKED, ABSENT)
- ✅ 6 Abwesenheiten (verschiedene Typen & Status)
- ✅ 1 Demo-Schicht für Replacement-Test

### 2. Docker-Stack starten
```bash
cd ~/project
docker compose -f docker-compose.dev.yml up -d
docker compose -f monitoring/docker-compose.monitoring.yml up -d
```

### 3. Login-Credentials
```
Admin:      admin@sicherheitsdienst.de / password123
Manager:    manager@sicherheitsdienst.de / password123
Dispatcher: dispatcher@sicherheitsdienst.de / password123
Employee:   thomas.mueller@sicherheitsdienst.de / password123
```

---

## 🧪 Feature 1: ICS-Kalender-Export

### Test 1.1: Export aller Abwesenheiten (Admin/Manager)
```bash
# Login als Manager
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@sicherheitsdienst.de","password":"password123"}' \
  | jq -r '.data.accessToken')

# ICS exportieren
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/absences/export.ics \
  -o abwesenheiten.ics

# ICS-Datei anzeigen
cat abwesenheiten.ics
```

**Erwartetes Ergebnis:**
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sicherheitsdienst-Tool//Absences//DE
...
BEGIN:VEVENT
UID:absence-xxx@sicherheitsdienst-tool.local
SUMMARY:Urlaub: Kurzurlaub
STATUS:CONFIRMED
CATEGORIES:Urlaub
...
END:VEVENT
...
END:VCALENDAR
```

**Validierung:**
- ✅ Alle 6 Abwesenheiten im Export
- ✅ Status-Mapping korrekt (APPROVED → CONFIRMED, REQUESTED → TENTATIVE)
- ✅ Kategorien (Urlaub, Krankheit)
- ✅ Ganztags-Events (VALUE=DATE)

### Test 1.2: Filter nach Status
```bash
# Nur APPROVED Abwesenheiten
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/absences/export.ics?status=APPROVED" \
  -o approved.ics

cat approved.ics | grep -c "BEGIN:VEVENT"
# Erwartung: 4 Events
```

### Test 1.3: Filter nach User (Employee)
```bash
# Login als Employee Thomas
TOKEN_THOMAS=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"thomas.mueller@sicherheitsdienst.de","password":"password123"}' \
  | jq -r '.data.accessToken')

# Employee sieht nur eigene
curl -H "Authorization: Bearer $TOKEN_THOMAS" \
  http://localhost:3001/api/absences/export.ics \
  -o meine_abwesenheiten.ics

cat meine_abwesenheiten.ics | grep -c "BEGIN:VEVENT"
# Erwartung: 0 Events (Thomas hat keine Abwesenheiten im Seed)
```

### Test 1.4: Filter nach Zeitraum
```bash
# Abwesenheiten der nächsten 7 Tage
FROM=$(date +%Y-%m-%d)
TO=$(date -d "+7 days" +%Y-%m-%d)

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/absences/export.ics?from=$FROM&to=$TO" \
  -o naechste_woche.ics
```

### Test 1.5: Import in Kalender-App testen
1. **Outlook:** Datei → Importieren → `abwesenheiten.ics`
2. **Google Calendar:** Einstellungen → Importieren & Exportieren → Datei auswählen
3. **Apple Calendar:** Datei → Importieren → `abwesenheiten.ics`

**Validierung:**
- ✅ Events erscheinen im Kalender
- ✅ Status korrekt (vorläufig/bestätigt)
- ✅ Ganztags-Events (nicht Uhrzeit-basiert)

---

## 🤖 Feature 2: Replacement Observability (Prometheus-Metriken)

### Test 2.1: Replacement-Kandidaten abrufen (produziert Metriken)
```bash
# Replacement-Schicht-ID aus Seed (Demo-Schicht)
SHIFT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/shifts?title=Intelligent" | jq -r '.data[0].id')

echo "Shift-ID: $SHIFT_ID"

# Replacement-Kandidaten abrufen (V2 API mit Scoring)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/shifts/$SHIFT_ID/replacement-candidates-v2" \
  | jq '.data[] | {name: (.firstName + " " + .lastName), score: .score.total, recommendation: .score.recommendation, utilization: .metrics.utilizationPercent, utilizationAfter: .metrics.utilizationAfterAssignment}'
```

**Erwartetes Ergebnis:**
```json
[
  {
    "name": "Optimal Kandidat",
    "score": 92,
    "recommendation": "OPTIMAL",
    "utilization": 70,
    "utilizationAfter": 76
  },
  {
    "name": "Good Kandidat",
    "score": 78,
    "recommendation": "GOOD",
    "utilization": 60,
    "utilizationAfter": 68
  },
  ...
]
```

**⚠️ Wichtig:** Dieser API-Call produziert Prometheus-Metriken!

### Test 2.2: Metriken in `/api/stats` prüfen
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/stats \
  | jq '.data.metrics.replacement'
```

**Erwartetes Ergebnis:**
```json
{
  "candidatesEvaluated": 5,
  "avgCalculationDurationMs": 2.5,
  "scoreDistribution": {
    "optimal": 1,
    "good": 1,
    "acceptable": 1,
    "notRecommended": 2
  },
  "avgScoreComponents": {
    "workload": 85,
    "compliance": 90,
    "fairness": 80,
    "preference": 75
  }
}
```

**Validierung:**
- ✅ `candidatesEvaluated` > 0
- ✅ `avgCalculationDurationMs` < 100ms (Performance)
- ✅ `scoreDistribution` mit allen 4 Kategorien
- ✅ `avgScoreComponents` zeigt Durchschnittswerte

### Test 2.3: Prometheus-Metriken direkt
```bash
# Prometheus Metrics Endpoint
curl -s http://localhost:3001/metrics | grep replacement_
```

**Erwartete Metriken:**
```
# HELP replacement_candidates_evaluated_total Total number of replacement candidates evaluated
# TYPE replacement_candidates_evaluated_total counter
replacement_candidates_evaluated_total{shift_id="..."} 5

# HELP replacement_calculation_duration_seconds Time spent calculating replacement scores
# TYPE replacement_calculation_duration_seconds histogram
replacement_calculation_duration_seconds_bucket{le="0.001"} 0
replacement_calculation_duration_seconds_bucket{le="0.005"} 3
replacement_calculation_duration_seconds_bucket{le="0.01"} 5
...

# HELP replacement_score_total Distribution of replacement candidate total scores
# TYPE replacement_score_total histogram
replacement_score_total{recommendation="OPTIMAL"} 1
replacement_score_total{recommendation="GOOD"} 1
replacement_score_total{recommendation="ACCEPTABLE"} 1
replacement_score_total{recommendation="NOT_RECOMMENDED"} 2

# HELP replacement_score_components_avg Average score per component
# TYPE replacement_score_components_avg gauge
replacement_score_components_avg{component="workload"} 85
replacement_score_components_avg{component="compliance"} 90
replacement_score_components_avg{component="fairness"} 80
replacement_score_components_avg{component="preference"} 75
```

### Test 2.4: Prometheus UI (optional)
```bash
# Prometheus UI öffnen
open http://localhost:9090

# PromQL-Queries testen:
# 1. Anzahl bewerteter Kandidaten (letzte 5 Min)
sum(increase(replacement_candidates_evaluated_total[5m]))

# 2. p95 Berechnungsdauer
histogram_quantile(0.95, sum(rate(replacement_calculation_duration_seconds_bucket[5m])) by (le))

# 3. Score-Verteilung
sum(increase(replacement_score_total[1h])) by (recommendation)

# 4. Durchschnittliche Komponenten-Scores
avg(replacement_score_components_avg) by (component)
```

---

## 🎨 Feature 3: Frontend UX-Verbesserungen

### Test 3.1: Farbkodierung (niedrig = grün)
1. Frontend öffnen: `http://localhost:5173`
2. Login als Manager
3. Zu Schichten navigieren → Demo-Schicht öffnen
4. "Ersatz suchen" klicken

**Validierung:**
| Kandidat | Auslastung | Erwartete Farbe |
|----------|------------|-----------------|
| Optimal  | 70% → 76%  | GRÜN ✅ (76% < 90%) |
| Good     | 60% → 68%  | GRÜN ✅ (68% < 70%) |
| Acceptable | 80% → 88% | GELB ⚠️ (88% < 90%) |
| Overworked | 95% → 101% | ROT ❌ (>100%) |

**⚠️ WICHTIG:** Farbe basiert auf `utilizationAfterAssignment`, nicht `utilizationPercent`!

### Test 3.2: Ruhezeit-Anzeige
**Validierung:**
- < 24h: "18.5h" (Dezimal)
- ≥ 24h: "36h 30m" (Stunden + Minuten)

### Test 3.3: Auslastungs-Vorschau
**Badge-Text:**
```
Auslastung: 70% → 76%
```
- Linker Wert: Aktuelle Auslastung
- Rechter Wert: Nach Zuweisung

---

## 📊 Monitoring (optional)

### Grafana Dashboard
```bash
# Grafana öffnen
open http://localhost:3000
# Login: admin / admin

# Dashboard importieren
# Datei: monitoring/grafana/dashboards/replacement-metrics.json (falls vorhanden)
```

### Alertmanager
```bash
# Alertmanager UI
open http://localhost:9093

# Test-Alert senden
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {"alertname":"TestAlert","severity":"warning"},
    "annotations": {"summary":"Test-Alert für v1.10.0"}
  }]'
```

---

## ✅ Acceptance Criteria Checklist

### ICS-Export
- [ ] Alle Abwesenheiten exportierbar
- [ ] Filter funktionieren (status, userId, from/to)
- [ ] RBAC: EMPLOYEE sieht nur eigene
- [ ] Status-Mapping korrekt (REQUESTED→TENTATIVE, APPROVED→CONFIRMED)
- [ ] Kategorien korrekt (Urlaub, Krankheit, etc.)
- [ ] Import in Kalender-Apps funktioniert
- [ ] Audit-Log: ABSENCE_EXPORT_ICS wird geloggt

### Replacement Observability
- [ ] API-Call produziert Prometheus-Metriken
- [ ] `/api/stats` zeigt Replacement-Metriken
- [ ] Alle 4 Metriken vorhanden (Counter, Histograms, Gauge)
- [ ] Performance < 100ms pro Kandidat
- [ ] Score-Distribution mit allen 4 Kategorien
- [ ] PromQL-Queries funktionieren

### Frontend UX
- [ ] Farbkodierung umgekehrt (niedrig = grün)
- [ ] Farbe basiert auf `utilizationAfterAssignment`
- [ ] Ruhezeit exakt angezeigt (36h 30m)
- [ ] Auslastungs-Vorschau ("5% → 15%")
- [ ] Tie-Breaker bevorzugt MA mit mehr Ruhe (Backend)

---

## 🐛 Bekannte Issues

### Backend-Tests
- ⚠️ 7 Tests fehlgeschlagen (nicht durch v1.10.0):
  - DB-Integrationstests (benötigen laufende DB)
  - CORS-Header-Test (pre-existing)
  - Notification Rate-Limit Timeouts (pre-existing)

### Backend-Lint
- ⚠️ Warnings (akzeptabel):
  - Test-Dateien nicht in tsconfig.json
  - Unused variables in Seeds
  - eslint-disable directive in security.ts

---

## 📝 Test-Report Template

```markdown
## v1.10.0 Test-Report

**Tester:** [Name]
**Datum:** [Datum]
**Environment:** Dev/Prod

### ICS-Export
- [ ] Test 1.1: Export aller Abwesenheiten - ✅ / ❌
- [ ] Test 1.2: Filter nach Status - ✅ / ❌
- [ ] Test 1.3: Filter nach User - ✅ / ❌
- [ ] Test 1.4: Filter nach Zeitraum - ✅ / ❌
- [ ] Test 1.5: Import in Kalender - ✅ / ❌

### Replacement Observability
- [ ] Test 2.1: Kandidaten abrufen - ✅ / ❌
- [ ] Test 2.2: /api/stats Metriken - ✅ / ❌
- [ ] Test 2.3: Prometheus Metriken - ✅ / ❌
- [ ] Test 2.4: Prometheus UI - ✅ / ❌

### Frontend UX
- [ ] Test 3.1: Farbkodierung - ✅ / ❌
- [ ] Test 3.2: Ruhezeit-Anzeige - ✅ / ❌
- [ ] Test 3.3: Auslastungs-Vorschau - ✅ / ❌

**Bugs gefunden:**
[Liste]

**Bemerkungen:**
[Text]
```

---

## 🔗 Referenzen

- **Feature-Spec:** `docs/FEATURE_INTELLIGENT_REPLACEMENT.md`
- **Monitoring:** `MONITORING.md`
- **API-Docs:** `docs/openapi.yaml`
- **Planning:** `docs/planning/replacement-scoring-improvements.md`
- **CHANGELOG:** `CHANGELOG.md` (v1.10.0)
