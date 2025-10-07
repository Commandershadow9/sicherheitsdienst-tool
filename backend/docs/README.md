# Dokumentation - Sicherheitsdienst Management System

Willkommen zur Projekt-Dokumentation! Hier findest du alle wichtigen Informationen über Features, Bugs, Roadmap und Entwicklungsplanung.

---

## 📚 Dokumentations-Übersicht

### 🎯 Projekt-Management

| Dokument | Beschreibung | Aktualisierung |
|----------|--------------|----------------|
| [CHANGELOG.md](./CHANGELOG.md) | Vollständige Versions-Historie mit allen Änderungen | Bei jedem Release |
| [ROADMAP.md](./ROADMAP.md) | Langfristige Planung und zukünftige Features | Quartalsweise |
| [TODO_v1.9.2.md](./TODO_v1.9.2.md) | Aktuelle Sprint-Planung und Tasks | Wöchentlich |

### 🐛 Bug Tracking

| Dokument | Beschreibung | Status |
|----------|--------------|--------|
| [BUGS_v1.9.1.md](./BUGS_v1.9.1.md) | Bugs aus v1.9.1 Testing | ✅ Alle behoben in v1.9.2 |

**Format**: `BUGS_vX.X.X.md` - Ein Dokument pro Minor-Version mit allen gefundenen Bugs.

### ✨ Feature-Dokumentation

| Dokument | Version | Feature |
|----------|---------|---------|
| [FEATURE_INTELLIGENT_REPLACEMENT.md](./FEATURE_INTELLIGENT_REPLACEMENT.md) | v1.8.0 | Intelligente Ersatz-Mitarbeiter-Suche mit Scoring |
| [FEATURE_DASHBOARD.md](./FEATURE_DASHBOARD.md) | v1.9.0+ | Dashboard Features & Vision |
| [FEATURE_ABSENCES.md](./FEATURE_ABSENCES.md) | v1.6.0 | Abwesenheiten-Management |

---

## 🚀 Quick Links

### Für Entwickler:
- **Was wurde geändert**: [CHANGELOG.md](./CHANGELOG.md)
- **Nächster Sprint**: [TODO_v1.10.0.md](./TODO_v1.10.0.md) (geplant)
- **Release Summary**: [v1.9.2_RELEASE_SUMMARY.md](./v1.9.2_RELEASE_SUMMARY.md)

### Für Product Owner:
- **Zukünftige Features**: [ROADMAP.md](./ROADMAP.md)
- **Feature-Details**: [FEATURE_*.md](./FEATURE_INTELLIGENT_REPLACEMENT.md)

### Für Tester:
- **Test-Szenarien**: Siehe jeweilige `BUGS_*.md` und `FEATURE_*.md`
- **Test-Setup & Login-Daten**: [TEST_SETUP.md](./TEST_SETUP.md)
- **Deployment Issues**: [DEPLOYMENT_ISSUES.md](./DEPLOYMENT_ISSUES.md)

---

## 📖 Dokumentations-Standards

### Bug Reports (BUGS_vX.X.X.md)

**Format**:
```markdown
## 🐛 BUG-XXX: Kurzer Titel [PRIORITY]

### Problem
Was geht schief?

### Erwartetes Verhalten
Was sollte passieren?

### Betroffene Dateien
- backend/src/...
- frontend/src/...

### Lösungsansatz
Wie kann es gefixt werden?

### Priorität
🔴 CRITICAL | 🟡 MEDIUM | 🟢 LOW
```

**Prioritäten**:
- 🔴 **CRITICAL**: System-Breaking, Datenverlust, Security-Issues
- 🔴 **HIGH**: Kernfunktionalität betroffen, keine Workaround
- 🟡 **MEDIUM**: Feature eingeschränkt, Workaround existiert
- 🟢 **LOW**: UI/UX-Probleme, Nice-to-Have

### Feature-Dokumentation (FEATURE_*.md)

**Struktur**:
1. **Übersicht** - Was ist das Feature?
2. **Motivation** - Warum brauchen wir es?
3. **Technische Details** - Wie funktioniert es?
4. **API/Endpoints** - Backend-Schnittstellen
5. **UI/UX** - Frontend-Komponenten
6. **Datenbank** - Schema-Änderungen
7. **Testing** - Test-Szenarien
8. **Roadmap** - Zukünftige Erweiterungen

### CHANGELOG Format

Folgt [Keep a Changelog](https://keepachangelog.com/de/1.0.0/):

```markdown
## [X.X.X] - YYYY-MM-DD

### 🎉 Added
Neue Features

### 🐛 Fixed
Bug-Fixes

### 🔄 Changed
Änderungen an existierenden Features

### 🗑️ Deprecated
Bald zu entfernende Features
```

---

## 🔍 Wie finde ich...?

### "Welche Bugs gibt es aktuell?"
→ Keine offenen Bugs! Alle v1.9.1 Bugs wurden in v1.9.2 behoben
→ Archiv: [BUGS_v1.9.1.md](./BUGS_v1.9.1.md)

### "Was wurde in Version X.X.X geändert?"
→ [CHANGELOG.md](./CHANGELOG.md) → Suche nach `[X.X.X]`

### "Wie funktioniert Feature Y?"
→ [FEATURE_*.md](./FEATURE_INTELLIGENT_REPLACEMENT.md) → Siehe Liste oben

### "Was kommt als nächstes?"
→ [TODO_v1.9.2.md](./TODO_v1.9.2.md) für nächsten Sprint
→ [ROADMAP.md](./ROADMAP.md) für langfristige Planung

### "Wie teste ich Feature Z?"
→ `FEATURE_Z.md` → Abschnitt "Testing"
→ `BUGS_vX.X.X.md` → Abschnitt "Test-Szenarien"

---

## 🛠️ Dokumentations-Workflow

### Bei neuem Feature:
1. ✅ `FEATURE_XXX.md` erstellen (während Entwicklung)
2. ✅ `CHANGELOG.md` aktualisieren (bei Release)
3. ✅ `ROADMAP.md` aktualisieren (wenn geplant)

### Bei neuem Bug:
1. ✅ In `BUGS_vX.X.X.md` dokumentieren
2. ✅ In `CHANGELOG.md` → `[Unreleased]` → `Known Issues` verlinken
3. ✅ Issue in GitHub/Linear erstellen (optional)

### Bei Bug-Fix:
1. ✅ Status in `BUGS_vX.X.X.md` auf "Fixed" setzen
2. ✅ In `CHANGELOG.md` → `### 🐛 Fixed` eintragen
3. ✅ Issue in GitHub/Linear schließen

### Bei Release:
1. ✅ `CHANGELOG.md` → `[Unreleased]` → `[X.X.X] - YYYY-MM-DD` umbenennen
2. ✅ Neue `[Unreleased]` Sektion erstellen
3. ✅ `TODO_vX.X.X.md` für nächste Version erstellen
4. ✅ Git Tag `vX.X.X` erstellen

---

## 📁 Datei-Struktur

```
docs/
├── README.md                         # Diese Datei
├── CHANGELOG.md                      # Versions-Historie
├── ROADMAP.md                        # Langfristige Planung
│
├── BUGS_v1.9.1.md                   # Aktuelle Bugs
├── TODO_v1.9.2.md                   # Nächster Sprint
│
├── FEATURE_INTELLIGENT_REPLACEMENT.md  # v1.8.0
├── FEATURE_DASHBOARD.md                # v1.9.0+
├── FEATURE_ABSENCES.md                 # v1.6.0
│
└── archived/                         # Alte Bug-Reports & TODOs
    ├── BUGS_v1.8.0.md
    ├── BUGS_v1.7.0.md
    └── TODO_v1.9.1.md
```

---

## 🎯 Best Practices

### DO ✅
- ✅ Dokumentation **während** der Entwicklung schreiben
- ✅ Code-Beispiele und API-Requests/Responses einbinden
- ✅ Screenshots für UI-Features
- ✅ Test-Szenarien dokumentieren
- ✅ Breaking Changes klar markieren
- ✅ Links zu Related Issues/PRs

### DON'T ❌
- ❌ Code ohne Dokumentation committen
- ❌ CHANGELOG vergessen zu aktualisieren
- ❌ Bugs nur in Chat/Slack dokumentieren
- ❌ Veraltete Dokumentation stehen lassen
- ❌ Zu technisch für non-developers schreiben

---

## 🔗 Externe Links

- **GitHub Repository**: [github.com/your-org/sicherheitsdienst](https://github.com)
- **API Documentation**: [docs.sicherheitsdienst.de/api](https://docs.sicherheitsdienst.de/api)
- **User Manual**: [docs.sicherheitsdienst.de/manual](https://docs.sicherheitsdienst.de/manual)
- **Discord**: [discord.gg/sicherheitsdienst](https://discord.gg)

---

## 📞 Kontakt

**Fragen zur Dokumentation?**
- GitHub Issues: [github.com/your-org/sicherheitsdienst/issues](https://github.com)
- Discord: `#dev-docs` Channel
- Email: dev@sicherheitsdienst.de

---

**Letzte Aktualisierung**: 2025-10-07
**Version**: v1.9.2
**Maintainer**: Development Team
