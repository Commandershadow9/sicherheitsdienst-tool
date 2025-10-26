# TODO für nächste Session

**Letzte Aktualisierung:** 2025-10-26
**Aktueller Stand:** v1.21.1 deployed, System läuft stabil

---

## 🐛 Bugfixes (Priorität: HOCH)

### 1. Discord Webhook - Teil 2 schlägt fehl (HTTP 400)
**Problem:** Wenn viele Commits gepusht werden, schlägt der zweite Discord-Post fehl.

**Fehler:**
```
Discord HTTP (Teil 2): 400 (try 1-5)
Antwort: {"embeds": ["0"]}
```

**Ursache:**
- Commit-Messages sind zu lang für Discord Embed (1024 Zeichen Limit)
- Escaping funktioniert nicht korrekt für sehr lange Texte

**Lösung:**
- Discord Workflow `.github/workflows/discord-all.yml` fixen:
  - Zeile 83-98: Commit-Truncating verbessern
  - Jede Commit-Message auf max. 150 Zeichen kürzen (statt 200)
  - Besseres Escaping für Sonderzeichen

**Dateien:**
- `.github/workflows/discord-all.yml`

---

## ✨ UI-Verfeinerungen (Priorität: MITTEL)

### 1. Sicherheitskonzept-Modul - Phase 1 & 2 UI verbessern
**Aktueller Stand:** ✅ Funktioniert, aber noch verbesserungswürdig

**Was der User will:**
> "da müssen wir noch sachen anpassen" (Zitat vom User)

**Verbesserungen:**
- [ ] ShiftModelEditor: Bessere Validierung (Start < End, keine Überschneidungen)
- [ ] RiskAssessmentEditor: Drag & Drop für Maßnahmen-Reihenfolge
- [ ] 5×5 Matrix: Hover zeigt Details zu Szenarien
- [ ] Export-Button: PDF-Export für Sicherheitskonzept
- [ ] Status-Workflow: DRAFT → IN_REVIEW → APPROVED → ACTIVE
- [ ] Versions-Historie: Änderungen nachvollziehen

**Dateien:**
- `frontend/src/features/sites/components/ShiftModelEditor.tsx`
- `frontend/src/features/sites/components/RiskAssessmentEditor.tsx`
- `frontend/src/features/sites/components/tabs/SecurityConceptTab.tsx`

### 2. Allgemeine UX-Verbesserungen
- [ ] Loading States konsistent (alle Buttons mit Spinner)
- [ ] Error-Handling: Benutzerfreundliche Fehlermeldungen
- [ ] Keyboard-Shortcuts (z.B. Ctrl+S zum Speichern)
- [ ] Responsive Design: Mobile-Optimierung

---

## 🚀 Neue Features (Priorität: NIEDRIG)

### 1. Sicherheitskonzept - Phase 3: Compliance & Auditierung
**Status:** ❌ PENDING

**Features:**
- Rechtliche Anforderungen (§34a GewO, ArbSchG, DSGVO)
- Audit-Log für Änderungen
- Freigabe-Workflow (4-Augen-Prinzip)
- Unterschriften-Funktion
- Compliance-Checkliste

**Siehe:** `docs/planning/sicherheitskonzept-modul-konzept.md`

### 2. Sicherheitskonzept - Phase 4: Personal & Qualifikationen
**Status:** ❌ PENDING

**Features:**
- Qualifikationsmatrix
- Aufgabenprofile
- Schulungsnachweis
- Zertifikate

---

## 🔧 Infrastruktur (Priorität: NIEDRIG)

### 1. Deployment-Automatisierung
- [ ] Script: `scripts/deploy.sh` (automatischer Deployment-Prozess)
- [ ] Healthcheck nach Deployment
- [ ] Rollback-Mechanismus

### 2. Monitoring verbessern
- [ ] Prometheus: Mehr Custom-Metriken
- [ ] Grafana: Neue Dashboards (Login-Erfolge, DB-Performance)
- [ ] Alerting: Discord-Benachrichtigungen bei Problemen

---

## 📝 Dokumentation (Priorität: NIEDRIG)

### 1. API-Dokumentation aktualisieren
- [ ] OpenAPI-Spec aktualisieren (neue Endpoints)
- [ ] Postman-Collection erstellen
- [ ] API-Beispiele in README

### 2. User-Guide erstellen
- [ ] Screenshots für alle Features
- [ ] Video-Tutorial (z.B. Loom)
- [ ] FAQ-Sektion

---

## ✅ Abgeschlossene Aufgaben (v1.21.1)

- [x] DB-Port 5432 exponieren (docker-compose.dev.yml)
- [x] Backend Port 3000 → 3001 migrieren (Firewall-Fix)
- [x] Admin-Passwort zurücksetzen (admin@sicherheitsdienst.de / password123)
- [x] Backend Startup-Script erstellen (scripts/start-backend.sh)
- [x] Deployment-Checkliste erstellen (docs/DEPLOYMENT_CHECKLIST.md)
- [x] CHANGELOG aktualisieren (v1.21.1)
- [x] Planning-Datei aktualisieren (Phase 1 & 2 Status)
- [x] Git Commit & Push
- [x] Discord Webhook läuft (Teil 1 funktioniert ✅)

---

## 🎯 Empfohlene Prioritäten für nächste Session:

1. **Discord Webhook fixen** (15 min)
2. **UI-Verfeinerungen am Sicherheitskonzept** (2-3 Stunden)
3. **Phase 3 planen** (1 Stunde)

---

**Letzter Commit:** `01d5306` - fix: v1.21.1 - Deployment & Infrastructure Fixes
**Branch:** main
**System-Status:** ✅ Frontend + Backend laufen stabil
