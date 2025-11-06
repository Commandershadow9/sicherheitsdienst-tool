# Backend Documentation Archive

**Last Updated:** 2025-11-06

Dieses Verzeichnis enthält archivierte Backend-Dokumentation, die aus historischen Gründen aufbewahrt wird, aber nicht mehr aktiv gepflegt wird.

---

## 📁 Struktur

### `bugs/` - Archivierte Bug-Berichte
Versionsspezifische Bug-Berichte aus Testing-Phasen:

| Dokument | Version | Status | Datum |
|----------|---------|--------|-------|
| `BUGS_v1.9.1.md` | v1.9.1 | ✅ Alle behoben in v1.9.2 | 2025-10-07 |

**Format:** `BUGS_vX.X.X.md` - Ein Dokument pro Minor-Version mit allen gefundenen Bugs.

### `todos/` - Archivierte Sprint-TODOs
Versionsspezifische Sprint-Planungen:

| Dokument | Version | Status | Datum |
|----------|---------|--------|-------|
| `TODO_v1.9.2.md` | v1.9.2 | ✅ Abgeschlossen | 2025-10 |

**Format:** `TODO_vX.X.X.md` - Sprint-Planungen für spezifische Versionen.

### `releases/` - Archivierte Release-Summaries
Detaillierte Release-Zusammenfassungen:

| Dokument | Version | Datum |
|----------|---------|-------|
| `v1.9.2_RELEASE_SUMMARY.md` | v1.9.2 | 2025-10 |

---

## 📖 Aktuelle Dokumentation

Für aktuelle Backend-Dokumentation siehe:

### Haupt-Dokumentation
- **[backend/docs/README.md](../README.md)** - Dokumentations-Übersicht
- **[backend/docs/CHANGELOG.md](../CHANGELOG.md)** - Vollständige Versions-Historie
- **[backend/docs/ROADMAP.md](../ROADMAP.md)** - Langfristige Planung

### Feature-Dokumentation
- **[refactoring/](../refactoring/)** - Refactoring-Dokumentation
- **[deployment/](../deployment/)** - Deployment-Guides
- **[security/](../security/)** - Security-Dokumentation

### Operations
- **[backend/docs/DEPLOYMENT_ISSUES.md](../DEPLOYMENT_ISSUES.md)** - Deployment-Troubleshooting
- **[backend/docs/TEST_SETUP.md](../TEST_SETUP.md)** - Test-Daten & Login-Credentials

---

## 🔄 Archivierungs-Prozess

### Wann wird archiviert?

Dokumentation wird archiviert, wenn:
1. **Bugs:** Alle Bugs einer Version behoben sind
2. **TODOs:** Sprint abgeschlossen ist und alle Tasks erledigt/verschoben sind
3. **Releases:** Release-Summary nicht mehr aktiv referenziert wird

### Wie archivieren?

```bash
# Bug-Berichte nach Bugfix-Release
git mv backend/docs/BUGS_vX.X.X.md backend/docs/archive/bugs/

# Sprint-TODOs nach Sprint-Ende
git mv backend/docs/TODO_vX.X.X.md backend/docs/archive/todos/

# Release-Summaries (optional, nach einigen Monaten)
git mv backend/docs/vX.X.X_RELEASE_SUMMARY.md backend/docs/archive/releases/
```

### Namenskonvention

- **Bugs:** `BUGS_vX.X.X.md` (Minor Version)
- **TODOs:** `TODO_vX.X.X.md` (Minor Version)
- **Releases:** `vX.X.X_RELEASE_SUMMARY.md` (Patch Version)

---

## 📊 Archivierungs-Historie

### 2025-11-06 - Initiale Archivierung
- ✅ BUGS_v1.9.1.md (alle Bugs behoben in v1.9.2)
- ✅ TODO_v1.9.2.md (Sprint abgeschlossen)
- ✅ v1.9.2_RELEASE_SUMMARY.md (Release abgeschlossen)

---

## 🔍 Suche in Archiven

### Alle Bugs zu einem bestimmten Thema finden
```bash
grep -r "keyword" backend/docs/archive/bugs/
```

### Alle TODOs zu einem Feature finden
```bash
grep -r "feature-name" backend/docs/archive/todos/
```

---

## 📝 Hinweise

- **Archivierte Dokumente werden NICHT aktualisiert**
- Für aktuelle Bug-Reports siehe CHANGELOG.md
- Für aktuelle Planung siehe ROADMAP.md oder root docs/TODO.md
- Archivierte Dokumente dienen als historische Referenz

---

**Archiv-Status:** 📦 3 Dokumente archiviert
**Letzte Archivierung:** 2025-11-06
