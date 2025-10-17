# 🧪 Phase 1 Testing Guide - Objekt-Management & Clearances (v1.11.0)

**Datum:** 2025-10-17
**Status:** Bereit für manuelles Testing

## 📋 Testing-Übersicht

Dieser Guide beschreibt das umfassende Testing aller Phase 1 Features des Objekt-Management-Systems.

### ✅ Abgeschlossene Implementierungen

**Backend:**
- ✅ Datenmodell-Erweiterung (sites, object_clearances, site_assignments, site_images)
- ✅ Prisma Migration erfolgreich
- ✅ API-Endpunkte für Sites, Clearances, Assignments, Images
- ✅ Object-Clearance-Score in Intelligent Replacement System integriert
- ✅ Validierungen und RBAC

**Frontend:**
- ✅ Objekt-Liste mit Status- und Kunden-Filtern
- ✅ Objekt-Detail-Seite mit 4 Tabs (Übersicht, Clearances, Schichten, Bilder)
- ✅ Clearances-Management (Training abschließen, widerrufen)
- ✅ Replacement-Modal mit Object-Clearance-Badge
- ✅ TypeScript-Typen für alle neuen Features

---

## 🔧 Test-Vorbereitung

### 1. System-Status prüfen

```bash
# Docker Container prüfen
docker ps | grep project

# Erwartete Container:
# - project-web-1 (Frontend - Port 5173)
# - project-api-1 (Backend - Port 3000)
# - project-db-1 (PostgreSQL - Port 5432)

# Logs prüfen
docker logs project-web-1 --tail 20  # Sollte "VITE ready" zeigen
docker logs project-api-1 --tail 20  # Sollte "Server läuft" zeigen
```

### 2. Test-Daten prüfen

```bash
# PostgreSQL-Check
docker exec project-db-1 psql -U admin -d sicherheitsdienst_db -c "
SELECT
  COUNT(*) as total_sites,
  COUNT(CASE WHEN status='ACTIVE' THEN 1 END) as active,
  COUNT(CASE WHEN \"customerName\" IS NOT NULL THEN 1 END) as with_customer
FROM sites;
"

# Erwartete Ausgabe:
# total_sites | active | with_customer
# -----------+--------+--------------
#           6 |      3 |            3
```

### 3. Browser öffnen

1. Öffne **http://localhost:5173** im Browser
2. **Login** mit Admin-Account:
   - Email: `admin@example.com` (oder dein Test-Admin)
   - Passwort: [dein Test-Passwort]
3. Öffne **Browser DevTools** (F12) → Console-Tab offen lassen

---

## 🧪 Test-Szenarien

### Test 1: Objekt-Liste & Filter

**Ziel:** Neue Filter und Spalten in der Objekt-Übersicht testen

#### Schritte:

1. **Navigation:** Klicke auf "Objekte" im Hauptmenü
2. **Visuelle Prüfung:**
   - ✅ Tabelle zeigt Spalten: Name, Adresse, **Status**, **Kunde**, PLZ, Stadt, Aktionen
   - ✅ Status-Badges sind farbcodiert (grün=ACTIVE, gelb=IN_REVIEW, blau=OFFER_SENT)
   - ✅ "Neues Objekt"-Button oben rechts sichtbar

3. **Status-Filter testen:**
   - Wähle "Aktiv" im Status-Dropdown → Nur ACTIVE-Sites anzeigen
   - Wähle "In Prüfung" → Nur IN_REVIEW-Sites anzeigen
   - Wähle "Alle" → Alle Sites anzeigen

4. **Kunden-Filter testen:**
   - Gib "Mustermann" ins Kunden-Feld ein → Nur "Mustermann GmbH" sichtbar
   - Leere das Feld → Alle Sites wieder sichtbar

5. **Kombinierte Filter:**
   - Status="Aktiv" + Kunde="Mustermann" → Nur Bürogebäude Zentrum
   - Reset beide Filter → Alle 6 Sites wieder da

#### Erwartetes Ergebnis:

- Filter funktionieren sofort (React Query)
- Keine Fehler in Console
- Status-Badges korrekt farbcodiert
- Kunde-Spalte zeigt "Mustermann GmbH", "Schmidt AG", "Weber Industrie GmbH"

---

### Test 2: Objekt-Detail-Seite (Overview Tab)

**Ziel:** Detail-Ansicht mit Tabs testen

#### Schritte:

1. **Navigation:** Klicke auf "Details" bei "Bürogebäude Zentrum"
2. **Tab-Navigation:**
   - ✅ 4 Tabs sichtbar: Übersicht, Clearances (24), Schichten, Bilder (0)
   - ✅ "Übersicht"-Tab ist initial aktiv
   - ✅ Zurück-Button oben links funktioniert

3. **Übersicht-Tab Inhalt prüfen:**
   - **Basis-Informationen:**
     - ✅ Site-Name als Titel
     - ✅ Status-Badge (grün für ACTIVE)
     - ✅ Adresse, Stadt, PLZ korrekt
   - **Kunden-Informationen:**
     - ✅ "Kunde: Max Mustermann"
     - ✅ "Firma: Mustermann GmbH"
     - ✅ Falls vorhanden: Email, Telefon
   - **Anforderungen:**
     - ✅ Benötigte Mitarbeiter: 1 (oder konfigurierter Wert)
     - ✅ Qualifikationen: Falls gesetzt (z.B. "NSL", "BRANDSCHUTZ")
   - **Notfallkontakte:**
     - ✅ Falls vorhanden: Name, Telefon, Rolle

4. **Responsive Design:**
   - Browser-Breite verkleinern → Layout passt sich an

#### Erwartetes Ergebnis:

- Alle Daten korrekt angezeigt
- Keine Fehler in Console
- Tabs zeigen korrekte Counts (z.B. "Clearances (24)")

---

### Test 3: Clearances-Management

**Ziel:** Clearances-Tab und Management-Aktionen testen

#### Schritte:

1. **Navigation:** Wechsle zum **"Clearances"-Tab**
2. **Clearances-Liste prüfen:**
   - ✅ Tabelle zeigt: Mitarbeiter, Status, Einarbeitung, Trainer, Aktionen
   - ✅ Status-Badges:
     - Grün = ACTIVE
     - Gelb = TRAINING
     - Grau = EXPIRED
     - Rot = REVOKED

3. **Training abschließen:**
   - Finde einen Mitarbeiter mit Status **TRAINING**
   - Klicke "Training abschließen"
   - Modal öffnet sich → Gib Trainings-Stunden ein (z.B. 8)
   - Klicke "Speichern"
   - ✅ Success-Toast: "Training erfolgreich abgeschlossen"
   - ✅ Status wechselt zu ACTIVE (grün)
   - ✅ "Training abgeschlossen"-Datum wird angezeigt

4. **Clearance widerrufen:**
   - Finde einen Mitarbeiter mit Status **ACTIVE**
   - Klicke "Widerrufen"
   - Modal öffnet sich → Gib einen Grund ein (z.B. "Test-Widerruf")
   - Klicke "Widerrufen"
   - ✅ Success-Toast: "Clearance erfolgreich widerrufen"
   - ✅ Status wechselt zu REVOKED (rot)
   - ✅ Notizen werden angezeigt

5. **Fehlerfall testen:**
   - Öffne Modal "Training abschließen"
   - Klicke "Abbrechen" → Modal schließt ohne Änderung
   - Öffne erneut → Lass Stunden leer → Fehler-Toast erwartet

#### Erwartetes Ergebnis:

- React Query Mutations funktionieren
- Optimistic Updates (sofortige UI-Änderung)
- Toast-Notifications korrekt
- Keine Fehler in Console

---

### Test 4: Replacement-Modal mit Clearance-Badge

**Ziel:** Object-Clearance-Score im Intelligent Replacement Modal testen

#### Vorbereitung:

1. **Abwesenheit erstellen:**
   - Gehe zu "Abwesenheiten" → "Neue Abwesenheit"
   - Wähle einen Mitarbeiter der einer Schicht mit Site zugewiesen ist
   - Datum: Heute oder morgen
   - Typ: Krankheit
   - Speichern

2. **Ersatz suchen:**
   - Gehe zu "Abwesenheiten" → Finde die erstellte Abwesenheit
   - Klicke "Ersatz suchen" bei einer betroffenen Schicht

#### Schritte:

1. **Replacement-Modal öffnet sich:**
   - ✅ Titel: "🤖 Intelligente Ersatz-Suche: [Schicht-Name]"
   - ✅ Kandidaten-Liste sortiert nach Score (beste zuerst)

2. **Clearance-Badge prüfen:**
   - ✅ **Neues Badge sichtbar:** "Objekt-Clearance"
   - ✅ Badge-Status:
     - Grün + CheckCircle = "Eingearbeitet ✓" (Score 100+)
     - Gelb + AlertCircle = "In Einarbeitung" (Score 50-99)
     - Rot + XCircle = "Keine Einarbeitung" (Score 0)

3. **Warnung bei fehlender Clearance:**
   - Finde einen Kandidaten mit Score = 0
   - ✅ Rote Warnung unter Metrics: "⚠️ Keine Objekt-Einarbeitung vorhanden - Training erforderlich!"

4. **Detail-Scores erweitern:**
   - Klicke "Detail-Scores anzeigen"
   - ✅ 5 Scores sichtbar (statt 4):
     - Clearance: XX Punkte (20%)
     - Workload: XX Punkte (5%)
     - Compliance: XX Punkte (35%)
     - Fairness: XX Punkte (15%)
     - Präferenz: XX Punkte (25%)
   - ✅ Prozentangaben summieren sich zu 100%

5. **Scoring-Hinweis Footer:**
   - ✅ Footer zeigt: "Scoring basiert auf: Compliance (40%), Präferenz (30%), Fairness (20%), Workload (10%)"
   - ⚠️ **BEKANNTES ISSUE:** Footer zeigt noch alte Gewichtung (wird in v1.11.1 korrigiert)

#### Erwartetes Ergebnis:

- Clearance-Badge nur bei Schichten mit Site sichtbar
- Status-Icons korrekt (CheckCircle, AlertCircle, XCircle)
- Warnung prominent bei Score = 0
- Detail-Scores zeigen neue Gewichtung

---

### Test 5: Edge Cases & Error Handling

**Ziel:** Fehlerbehandlung und Grenzfälle testen

#### Schritte:

1. **Netzwerk-Fehler simulieren:**
   - Browser DevTools → Network-Tab → "Offline" aktivieren
   - Versuche Clearances-Tab zu laden
   - ✅ Error-Toast: "Fehler beim Laden"
   - Netzwerk wieder online → Retry → Daten laden

2. **Autorisierung:**
   - **Nur als ADMIN/MANAGER testbar:**
     - Training abschließen → Funktioniert
     - Clearance widerrufen → Funktioniert
   - **Als EMPLOYEE einloggen:**
     - Clearances-Tab → Read-only (keine Aktions-Buttons)
     - Oder: 403 Forbidden Error

3. **Leere Zustände:**
   - Objekt ohne Clearances → Tab zeigt "Keine Clearances vorhanden"
   - Objekt ohne Bilder → Tab zeigt "Keine Bilder hochgeladen"

4. **Browser-Kompatibilität:**
   - Test in Chrome, Firefox, Safari (falls verfügbar)
   - Mobile Responsive → Tablet/Handy-Breite simulieren

#### Erwartetes Ergebnis:

- Fehler werden abgefangen und user-friendly angezeigt
- Offline-Modus zeigt Loading-States
- RBAC verhindert unbefugte Aktionen

---

## 📊 Test-Ergebnisse dokumentieren

### Checkliste zum Abhaken:

```
[ ] Test 1: Objekt-Liste & Filter funktionieren
[ ] Test 2: Objekt-Detail-Seite (Overview) korrekt
[ ] Test 3: Clearances-Management (Training, Widerruf) erfolgreich
[ ] Test 4: Replacement-Modal zeigt Clearance-Badge
[ ] Test 5: Edge Cases behandelt

[ ] Keine Fehler in Browser Console (außer erwartete)
[ ] Keine Fehler in Backend Logs
[ ] TypeScript kompiliert ohne Fehler
[ ] Mobile Responsive Design funktioniert
```

### Bekannte Issues:

1. **Footer im Replacement-Modal:** Zeigt noch alte Scoring-Gewichtung (wird in v1.11.1 korrigiert)
2. **customerName/customerCompany:** Nur 3 von 6 Sites haben Test-Daten (für Filter-Tests)

### Gefundene Bugs:

```
# Format:
- **[SEVERITY]** [Komponente] Beschreibung
  - Schritte zur Reproduktion:
  - Erwartetes Verhalten:
  - Tatsächliches Verhalten:
```

---

## 🚀 Nach erfolgreichem Testing

1. **Commit erstellen:**
   ```bash
   git add .
   git commit -m "feat: v1.11.0 - Objekt-Management Phase 1 (Frontend + Backend)

   Phase 1 Features:
   - Objekt-Liste mit Status- und Kunden-Filtern
   - Objekt-Detail-Seite mit 4 Tabs
   - Clearances-Management (Training, Widerruf)
   - Object-Clearance-Score in Intelligent Replacement
   - Neue API-Endpunkte: /clearances, /sites/:id

   Backend:
   - Prisma Schema erweitert (object_clearances, site_assignments, site_images)
   - Migration 20251016224831 erfolgreich
   - RBAC für alle neuen Endpunkte

   Frontend:
   - React Query Mutations für Clearances
   - TypeScript-Typen für alle neuen Features
   - Responsive Design

   Tests: Manuell getestet gemäß docs/PHASE1_TESTING_GUIDE.md

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

2. **CHANGELOG aktualisieren:** (falls noch nicht geschehen)
   ```bash
   # Eintrag für v1.11.0 hinzufügen
   ```

3. **TODO.md aktualisieren:**
   ```bash
   # Phase 1 als ✅ markieren
   # Phase 2 Planung starten
   ```

---

## 📚 Weitere Dokumentation

- **Backend API:** `/backend/src/controllers/clearanceController.ts`
- **Frontend Components:** `/frontend/src/features/sites/pages/SiteDetail.tsx`
- **Scoring-Algorithmus:** `/backend/src/services/intelligentReplacementService.ts:320-335`
- **Prisma Schema:** `/backend/prisma/schema.prisma` (object_clearances)

---

**Version:** 1.0.0
**Letzte Aktualisierung:** 2025-10-17
**Autor:** System + Claude Code
