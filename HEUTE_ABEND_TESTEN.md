# 🧪 Heute Abend Testen - v1.8.0

**Datum**: 2025-10-05
**Release**: v1.8.0 - Intelligente Ersatz-Mitarbeiter-Suche
**Status**: ✅ Released, ⚠️ Testdaten fehlen

---

## 🎯 Ziel

Das neue **Intelligente Replacement System** testen:
- Score-basierte Mitarbeiter-Empfehlungen (0-100 Punkte)
- Farb-Kodierung (Grün/Gelb/Orange/Rot)
- Compliance-Checks (ArbZG §3 & §5)
- Metriken-Anzeige (Auslastung, Ruhezeit, Nachtschichten)

---

## ⚠️ WICHTIG: Testdaten wiederherstellen

Nach der Docker-Migration sind die Testdaten weg! **Zuerst Seeds ausführen**:

### Schritt 1: Testdaten laden

```bash
# Im Projekt-Root-Verzeichnis

# Test-Abwesenheiten (Dashboard-Daten)
docker compose exec api npm run seed:test-absences

# Intelligent Replacement Test-Kandidaten (4 Profile)
docker compose exec api npm run seed:intelligent-replacement
```

**Erwartete Ausgabe**:
```
✅ Created shift: Test-Schicht für Intelligent Replacement
✅ Created user: Optimal Candidate (OPTIMAL)
✅ Created user: Good Candidate (GOOD)
✅ Created user: Acceptable Candidate (ACCEPTABLE)
✅ Created user: Not Recommended Candidate (NOT_RECOMMENDED)
✅ Created absence: Absent Employee krank
✅ Seed completed successfully!
```

---

## 🧪 Test-Szenarien

### Test 1: Login ✅ (sollte bereits funktionieren)

1. Browser öffnen: `http://37.114.53.56:5173`
2. Login mit:
   - **Email**: `admin@sicherheitsdienst.de`
   - **Passwort**: `password123`

**Erwartung**: Erfolgreich eingeloggt, Dashboard sichtbar

---

### Test 2: Dashboard - Testdaten sichtbar

1. Nach Login solltest du sehen:
   - **Critical Shifts**: Mindestens 1 kritische Schicht (unterbesetzt)
   - **Pending Approvals**: Ausstehende Genehmigungen
   - **Warnings**: Kapazitätswarnungen für nächste 7 Tage
   - **Stats**: Übersichts-Statistiken

**Erwartung**:
- Dashboard zeigt Daten (nicht leer)
- Alle Karten laden ohne Fehler

**Falls leer**:
- Seeds erneut ausführen (siehe oben)
- Browser-Cache löschen (Strg+F5)

---

### Test 3: Ersatz-Mitarbeiter-Suche (HAUPTTEST!)

1. **Navigation**:
   - Dashboard → "Pending Approvals" Card
   - Oder: Menü → "Abwesenheiten"

2. **Abwesenheit öffnen**:
   - Klick auf eine Abwesenheit (z.B. "Absent Employee - Krankheit")
   - Detailansicht öffnet sich

3. **Betroffene Schichten**:
   - Scroll zu "Betroffene Schichten"
   - Sollte "Test-Schicht für Intelligent Replacement" zeigen
   - Status: ⚠️ Unterbesetzt (1/2 MA)

4. **Ersatz finden**:
   - Klick auf Button **"Ersatz finden"**
   - Modal öffnet sich: "Ersatz-Mitarbeiter für Test-Schicht"

5. **Scoring-Anzeige prüfen**:

   **OPTIMAL Candidate** (Grün):
   - Score-Ring: 🟢 85-100 Punkte
   - Recommendation: "OPTIMAL"
   - Auslastung: ~75% (ideal)
   - Ruhezeit: >11h
   - Nachtschichten: Durchschnitt
   - Keine Warnungen

   **GOOD Candidate** (Gelb):
   - Score-Ring: 🟡 70-84 Punkte
   - Recommendation: "GOOD"
   - Auslastung: ~60%
   - Nachtschichten: Über Durchschnitt
   - Kleine Warnung: "Nachtschicht-Anzahl über Team-Durchschnitt"

   **ACCEPTABLE Candidate** (Orange):
   - Score-Ring: 🟠 50-69 Punkte
   - Recommendation: "ACCEPTABLE"
   - Auslastung: ~95% (hoch)
   - Ruhezeit: 10.5h (knapp unter 11h)
   - Warnung: "Objekt auf Vermeidungs-Liste"

   **NOT_RECOMMENDED Candidate** (Rot):
   - Score-Ring: 🔴 <50 Punkte
   - Recommendation: "NOT_RECOMMENDED"
   - Auslastung: 115% (überlastet)
   - Ruhezeit: 8.5h (⚠️ ArbZG-Verstoß!)
   - Wöchentliche Stunden: 52h (⚠️ >48h ArbZG §3)
   - Kritische Warnungen: "Ruhezeit <11h", "Wochenstunden >48h"

6. **Metriken-Grid prüfen**:
   - Jede Card zeigt 4 Metriken:
     - 📊 Auslastung (%)
     - 🕐 Ruhezeit (Stunden)
     - 🌙 Nachtschichten (Anzahl)
     - 🔄 Ersatz-Einsätze (Anzahl)

7. **Detail-Scores aufklappen**:
   - Klick auf "Details anzeigen"
   - Sollte zeigen:
     - Compliance-Score (0-100)
     - Präferenz-Score (0-100)
     - Fairness-Score (0-100)
     - Workload-Score (0-100)

**Erwartung**:
- ✅ 4 Kandidaten sichtbar
- ✅ Farben korrekt (Grün → Gelb → Orange → Rot)
- ✅ Scores plausibel (OPTIMAL > GOOD > ACCEPTABLE > NOT_RECOMMENDED)
- ✅ Warnungen bei NOT_RECOMMENDED sichtbar

---

### Test 4: Mitarbeiter zuweisen

1. **Zuweisung**:
   - Im Modal: Klick auf "Zuweisen" bei **OPTIMAL Candidate**
   - Bestätigung: "Möchten Sie wirklich zuweisen?"

2. **Erfolg**:
   - Toast-Benachrichtigung: "Mitarbeiter erfolgreich zugewiesen"
   - Modal schließt automatisch
   - Dashboard aktualisiert sich (Auto-Refresh)

3. **Verifikation**:
   - Abwesenheit erneut öffnen
   - Betroffene Schicht zeigt jetzt: ✅ Voll besetzt (2/2 MA)
   - "Ersatz finden" Button ausgegraut (Schicht ist voll)

**Erwartung**:
- ✅ Zuweisung erfolgreich
- ✅ UI aktualisiert sich
- ✅ Schicht-Status ändert sich zu "Voll besetzt"

---

## 🐛 Bekannte Probleme & Lösungen

### Problem: Dashboard ist leer
**Lösung**: Seeds ausführen (siehe oben)

### Problem: "Server nicht erreichbar"
**Diagnose**:
```bash
# Backend-Status prüfen
docker ps --filter "name=sicherheitsdienst-api"

# Logs checken
docker logs --tail 50 sicherheitsdienst-api

# Health-Check
curl -s http://127.0.0.1:3001/health
```

**Lösung**: Backend neu starten
```bash
docker compose restart api
```

### Problem: Keine Kandidaten im Modal
**Mögliche Ursachen**:
1. Seeds nicht gelaufen → Seeds ausführen
2. Objekt-Clearances fehlen → Seed erstellt automatisch
3. API-Fehler → Backend-Logs prüfen

**Lösung**:
```bash
# Seeds erneut ausführen
docker compose exec api npm run seed:intelligent-replacement

# Logs live beobachten
docker logs -f sicherheitsdienst-api
```

### Problem: Browser-Cache
**Lösung**:
- Hard Refresh: `Strg + F5` (Windows/Linux) oder `Cmd + Shift + R` (Mac)
- Inkognito-Modus: `Strg + Shift + N`
- Browser-Cache komplett leeren

---

## 📋 Checkliste für heute Abend

- [ ] **Schritt 1**: Seeds ausführen (test-absences + intelligent-replacement)
- [ ] **Schritt 2**: Login testen (admin@sicherheitsdienst.de)
- [ ] **Schritt 3**: Dashboard öffnen (Daten sichtbar?)
- [ ] **Schritt 4**: Ersatz-Mitarbeiter-Modal öffnen
- [ ] **Schritt 5**: Scoring-Anzeige prüfen (4 Kandidaten, Farben korrekt?)
- [ ] **Schritt 6**: Metriken-Grid prüfen (4 Metriken pro Kandidat)
- [ ] **Schritt 7**: Detail-Scores aufklappen (Compliance/Präferenz/Fairness/Workload)
- [ ] **Schritt 8**: Mitarbeiter zuweisen (OPTIMAL Candidate)
- [ ] **Schritt 9**: Verifikation (Schicht-Status ändert sich?)
- [ ] **Schritt 10**: Feedback geben (Was gefällt? Was fehlt?)

---

## 💬 Feedback & Fragen

### Was funktioniert gut?
- [ ] Scoring-System plausibel?
- [ ] Farben hilfreich?
- [ ] Metriken verständlich?
- [ ] UI intuitiv?

### Was fehlt noch?
- [ ] Zusätzliche Metriken gewünscht?
- [ ] Andere Gewichtung? (aktuell: 40% Compliance, 30% Präferenz, 20% Fairness, 10% Workload)
- [ ] Mehr Erklärungen? (Tooltips, Hilfe-Texte)

### Bugs gefunden?
- Screenshots machen
- Browser-Konsole öffnen (F12 → Console)
- Fehlermeldungen notieren

---

## 🚀 Nächste Schritte (nach Test)

1. **Feedback auswerten**
2. **Bugs fixen** (falls welche gefunden)
3. **v1.9.0 planen**: Weitere Verbesserungen
4. **v1.10.0 planen**: Mitarbeiter-Präferenzen-Editor

---

## 📞 Hilfe

### Dokumentation
- **Feature-Spec**: `docs/FEATURE_INTELLIGENT_REPLACEMENT.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING_LOGIN.md`
- **Seed-Anleitung**: `backend/prisma/seeds/README.md`
- **Roadmap**: `docs/ROADMAP.md`

### Quick-Commands
```bash
# Backend-Logs live
docker logs -f sicherheitsdienst-api

# Frontend-Logs live
docker logs -f project-web-1

# Alle Container-Status
docker ps

# Seeds erneut ausführen
docker compose exec api npm run seed:test-absences
docker compose exec api npm run seed:intelligent-replacement

# Backend neu starten
docker compose restart api

# Frontend neu starten
docker restart project-web-1
```

---

**Viel Erfolg beim Testen! 🎉**

Bei Fragen oder Problemen: Einfach melden!
