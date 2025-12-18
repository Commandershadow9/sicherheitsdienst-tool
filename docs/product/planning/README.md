# Planning Documents

**Last Updated:** 2025-11-06

Dieses Verzeichnis enthält aktive Planungsdokumente für Features in Entwicklung oder zukünftige Implementierung.

---

## 📋 Active Planning Documents

### High Priority

| Dokument | Status | Letzte Aktualisierung | Beschreibung |
|----------|--------|----------------------|--------------|
| **[sicherheitskonzept-modul-konzept.md](sicherheitskonzept-modul-konzept.md)** | 🚧 Phase 1-2 ✅ Complete | 2025-10-26 | Vollständiges Sicherheitskonzept-Management (38K) |
| **[replacement-scoring-improvements.md](replacement-scoring-improvements.md)** | 🔄 Ongoing Improvements | - | Verbesserungen am Intelligent Replacement Scoring |
| **[security-hardening.md](security-hardening.md)** | 📋 Planned | - | Sicherheits-Härtungsmaßnahmen |

### Medium Priority

| Dokument | Status | Letzte Aktualisierung | Beschreibung |
|----------|--------|----------------------|--------------|
| **[scoring-objekt-integration.md](scoring-objekt-integration.md)** | ✅ Partially Complete | - | Integration des Objekt-Scorings in Replacement-System |

---

## ✅ Completed Features

Abgeschlossene Planungsdokumente wurden nach `completed/` verschoben:

| Dokument | Verschoben am | Version | Status |
|----------|---------------|---------|--------|
| `absences.md` | 2025-11-06 | v1.5.0 - v1.10.0 | ✅ MVP Complete |
| `employee-profile.md` | 2025-11-06 | v1.x.x | ✅ Core Complete |
| Objekt-Management Suite | 2025-11-06 | v1.11.0 - v1.16.0 | ✅ Phase 1-6 Complete |
| NFC/QR Control Rounds | 2025-11-06 | v1.14.0 | ✅ Complete |
| Calculation System | 2025-11-06 | v1.15.0 | ✅ Complete |

**Vollständige Liste:** Siehe [completed/README.md](completed/README.md)

---

## 🎯 Planning Document Lifecycle

### 1. New Feature Planning
Wenn ein neues Feature geplant wird:
1. Erstelle ein neues Markdown-Dokument in diesem Verzeichnis
2. Nutze eine klare Struktur:
   - Vision & Ziele
   - Scope & Requirements
   - Technical Design
   - Implementation Plan
   - Testing Strategy
3. Füge es zu [docs/TODO.md](../TODO.md) hinzu
4. Update dieses README

### 2. During Implementation
Während der Entwicklung:
- Halte das Planning-Doc aktuell mit Progress-Updates
- Dokumentiere wichtige Designentscheidungen
- Verlinke auf relevante PRs und Commits

### 3. After Completion
Nach erfolgreicher Implementierung:
1. Markiere das Dokument als "✅ Complete"
2. Verschiebe es nach `completed/`
3. Update [completed/README.md](completed/README.md)
4. Update [docs/TODO.md](../TODO.md)
5. Update dieses README

---

## 📝 Document Templates

### Basic Planning Document Structure

```markdown
# [Feature Name] – Konzept

**Status:** 📋 Planned / 🚧 In Progress / ✅ Complete
**Priorität:** 🔥 Critical / ⬆️ High / ➡️ Medium / ⬇️ Low
**Ziel:** [One-liner description]
**Erstellt:** YYYY-MM-DD
**Letzte Aktualisierung:** YYYY-MM-DD

---

## Vision & Ziele
[Warum brauchen wir dieses Feature? Was ist das Endziel?]

## Scope
### In Scope
- Feature A
- Feature B

### Out of Scope
- Feature C (Future)

## Requirements
### Functional Requirements
1. Requirement 1
2. Requirement 2

### Non-Functional Requirements
- Performance: ...
- Security: ...
- Scalability: ...

## Technical Design
### Data Model
[Prisma Schema, Database Structure]

### API Design
[Endpoints, Request/Response]

### Frontend Components
[Component Structure]

## Implementation Plan
### Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]
- [ ] Task 3

## Testing Strategy
- Unit Tests: ...
- Integration Tests: ...
- E2E Tests: ...

## Success Metrics
- Metric 1
- Metric 2

## Open Questions
- Question 1?
- Question 2?

---

**Implementation Status:**
- [ ] Backend Complete
- [ ] Frontend Complete
- [ ] Tests Complete
- [ ] Documentation Complete
```

---

## 🔗 Related Documentation

- **[docs/TODO.md](../TODO.md)** - Main backlog and roadmap
- **[docs/FEATURE_*.md](../)** - Detailed feature documentation
- **[docs/CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[completed/README.md](completed/README.md)** - Completed features archive

---

## 📊 Current Statistics

- **Active Planning Docs:** 4
- **Completed & Archived:** 11+
- **Total Features Planned:** 15+

---

**Maintenance:** Update this README whenever planning documents are added, moved, or completed.
