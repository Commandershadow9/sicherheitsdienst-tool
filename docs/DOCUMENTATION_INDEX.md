# 📚 Dokumentations-Index

**Letztes Update:** 2025-11-06
**Zweck:** Zentrale Übersicht über alle Projekt-Dokumentation

---

## 🚀 Quick Start

Neu im Projekt? Start hier:

1. **[README.md](../README.md)** - Projekt-Übersicht & Quickstart
2. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Verzeichnisstruktur & Code-Organisation
3. **[ONBOARDING.md](ONBOARDING.md)** - Entwickler-Onboarding-Guide
4. **[TODO.md](TODO.md)** - Aktuelle Aufgaben & Roadmap

---

## 📋 Kern-Dokumentation

### Projekt-Management
| Dokument | Beschreibung | Aktualisiert |
|----------|--------------|--------------|
| [TODO.md](TODO.md) | **Haupt-Backlog** - Aktuelle Tasks, Roadmap, Prioritäten | ⭐ Täglich |
| [TODO_ARCHIVE.md](TODO_ARCHIVE.md) | Archivierte/abgeschlossene TODOs | Monatlich |
| [CHANGELOG.md](CHANGELOG.md) | Versions-Historie mit allen Änderungen | Bei Release |

### Architektur & Code
| Dokument | Beschreibung | Aktualisiert |
|----------|--------------|--------------|
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | **Code-Organisation** - Verzeichnisse, Patterns, Navigation | Wöchentlich |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System-Architektur & Modul-Übersicht | Bei größeren Änderungen |
| [RBAC.md](RBAC.md) | Rollen & Berechtigungen | Bei RBAC-Änderungen |
| [DB_INDEXES.md](DB_INDEXES.md) | Datenbank-Indizes & Performance | Bei DB-Änderungen |

### Entwicklung
| Dokument | Beschreibung | Aktualisiert |
|----------|--------------|--------------|
| [ONBOARDING.md](ONBOARDING.md) | **Entwickler-Einstieg** - Setup, Workflows, Best Practices | Quartalsweise |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution-Guidelines | Bei Prozessänderungen |
| [API_CHEATSHEET.md](API_CHEATSHEET.md) | Quick-Reference für alle API-Endpoints | Bei API-Änderungen |
| [UI_COMPONENTS.md](UI_COMPONENTS.md) | Frontend-Komponenten-Übersicht | Bei UI-Änderungen |
| [MAINTAINERS.md](MAINTAINERS.md) | Projekt-Maintainer & Verantwortlichkeiten | Bei Team-Änderungen |

---

## 🎯 Feature-Dokumentation

Detaillierte Dokumentation für spezifische Features:

| Feature | Dokument | Status | Version |
|---------|----------|--------|---------|
| **Dashboard** | [FEATURE_DASHBOARD.md](FEATURE_DASHBOARD.md) | ✅ Complete | v1.7.0+ |
| **Intelligent Replacement** | [FEATURE_INTELLIGENT_REPLACEMENT.md](FEATURE_INTELLIGENT_REPLACEMENT.md) | ✅ Complete | v1.8.0+ |
| **Objekt-Management** | [FEATURE_OBJEKT_MANAGEMENT.md](FEATURE_OBJEKT_MANAGEMENT.md) | ✅ Phase 1-6 Complete | v1.11.0 - v1.16.0 |
| **Intelligent Object Mgmt** | [FEATURE_INTELLIGENT_OBJECT_MANAGEMENT.md](FEATURE_INTELLIGENT_OBJECT_MANAGEMENT.md) | 📋 Planned | Future |
| **Events** | [FEATURE_EVENTS.md](FEATURE_EVENTS.md) | 📋 Planned | Future |
| **Implementation Roadmap** | [IMPLEMENTATION_ROADMAP_INTELLIGENT_OBJEKTE.md](IMPLEMENTATION_ROADMAP_INTELLIGENT_OBJEKTE.md) | 🔄 Ongoing | v1.17.0+ |

---

## 📝 Planning & Design

### Aktive Planung
Dokumentation für Features in Entwicklung oder Planung:

| Dokument | Status | Priorität | Beschreibung |
|----------|--------|-----------|--------------|
| [replacement-scoring-improvements.md](planning/replacement-scoring-improvements.md) | 🔄 Ongoing | Hoch | Verbesserungen am Scoring-System |
| [scoring-objekt-integration.md](planning/scoring-objekt-integration.md) | ⏳ Partial | Mittel | Integration Objekt-Scoring |
| [security-hardening.md](planning/security-hardening.md) | 📋 Planned | Hoch | Sicherheits-Härtung |
| [sicherheitskonzept-modul-konzept.md](planning/sicherheitskonzept-modul-konzept.md) | 🚧 Phase 1-2 ✅ | Hoch | Sicherheitskonzept-Modul (38K) |

### Abgeschlossene Features
Siehe [planning/completed/README.md](planning/completed/README.md) für vollständige Liste:
- Objekt-Management Suite (Phases 1-6)
- Abwesenheits-Management
- Mitarbeiter-Profile
- NFC/QR Kontrollgänge
- Kalkulations-System
- Und mehr...

---

## 🛠️ Operations & Deployment

### Betrieb
| Dokument | Beschreibung |
|----------|--------------|
| [ops/README.md](ops/README.md) | Ops-Übersicht & Runbooks |
| [ops/document-storage-checklist.md](ops/document-storage-checklist.md) | Dokument-Speicher Setup |
| [ops/dsgvo-compliance.md](ops/dsgvo-compliance.md) | DSGVO-Compliance-Guide |
| [ops/setup-https-letsencrypt.md](ops/setup-https-letsencrypt.md) | HTTPS/SSL Setup |
| [ops/system-health.md](ops/system-health.md) | System-Health Monitoring |

### Deployment
| Dokument | Beschreibung |
|----------|--------------|
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Deployment-Checkliste |

---

## 🧪 Testing

| Dokument | Beschreibung |
|----------|--------------|
| [testing/contract-tests.md](testing/contract-tests.md) | OpenAPI Contract Tests Guide |
| [TESTING_v1.10.0.md](TESTING_v1.10.0.md) | Testing-Guide für v1.10.0 |
| [ci/proposed-contract-tests-job.md](ci/proposed-contract-tests-job.md) | Vorgeschlagene CI-Jobs |

---

## 🔒 Security

| Dokument | Beschreibung |
|----------|--------------|
| [security/MULTI_TENANCY.md](security/MULTI_TENANCY.md) | Multi-Tenancy-Architektur |
| [planning/security-hardening.md](planning/security-hardening.md) | Security-Hardening-Plan |
| [TROUBLESHOOTING_LOGIN.md](TROUBLESHOOTING_LOGIN.md) | Login-Probleme beheben |

---

## 📊 Reports & Analysis

| Dokument | Typ | Datum |
|----------|-----|-------|
| [reports/backend-mvp-assessment-2025-09-10.md](reports/backend-mvp-assessment-2025-09-10.md) | Backend Assessment | 2025-09-10 |
| [analysis/PHASE1-ANALYSE-2025-09-11.md](analysis/PHASE1-ANALYSE-2025-09-11.md) | Phase 1 Analyse | 2025-09-11 |

---

## 📦 Releases

Alle Release-Notes und Changelogs:

| Version | Dokument | Datum |
|---------|----------|-------|
| v1.16.0 | [releases/v1.16.0.md](releases/v1.16.0.md) | 2025-10 |
| v1.8.0 | [releases/v1.8.0-summary.md](releases/v1.8.0-summary.md) | 2025-09 |
| v1.5.1 | [releases/v1.5.1.md](releases/v1.5.1.md) | 2025-09 |
| v1.5.0 | [releases/v1.5.0.md](releases/v1.5.0.md) | 2025-09 |
| v1.4.0 | [releases/v1.4.0.md](releases/v1.4.0.md) | 2025-09 |
| v1.3.1 | [releases/v1.3.1.md](releases/v1.3.1.md) | 2025-09 |
| v1.3.0 | [releases/v1.3.0.md](releases/v1.3.0.md) | 2025-09 |
| v1.2.0 RC | [releases/v1.2.0-rc.1.md](releases/v1.2.0-rc.1.md) | 2025-08 |
| v1.1.1 | [releases/v1.1.1.md](releases/v1.1.1.md) | 2025-08 |
| Bugfixes | [releases/bugfix-2025-10-04.md](releases/bugfix-2025-10-04.md) | 2025-10-04 |
| v2025-09-09 | [releases/v2025-09-09.md](releases/v2025-09-09.md) | 2025-09-09 |

---

## 📝 Sessions & PR Descriptions

### Session Notes
| Dokument | Datum | Beschreibung |
|----------|-------|--------------|
| [sessions/SESSION_2025-10-23.md](sessions/SESSION_2025-10-23.md) | 2025-10-23 | Session-Notizen |

### Pull Request Descriptions
| PR | Dokument | Beschreibung |
|----|----------|--------------|
| #2 | [pr_descriptions/pr-2.md](pr_descriptions/pr-2.md) | PR #2 Beschreibung |
| #6 | [pr_descriptions/pr-6.md](pr_descriptions/pr-6.md) | PR #6 Beschreibung |
| Planning | [pr_descriptions/pr-planning-2025-09-09.md](pr_descriptions/pr-planning-2025-09-09.md) | Planning PR 2025-09-09 |

---

## 🗂️ Archiv

Veraltete Dokumentation (historische Referenz):

### Archive-Struktur
```
docs/archive/
├── old-analysis/          # Veraltete Analyse-Dokumente
├── old-planning/          # Veraltete Planungsdokumente (inkl. historische Roadmap)
└── old-sessions/          # Veraltete Session-Notizen
```

Siehe [archive/README.md](archive/README.md) für Details.

---

## 🔍 Wie finde ich...?

### ...aktuelle Aufgaben?
→ [TODO.md](TODO.md) - Haupt-Backlog mit Prioritäten

### ...wie das Projekt strukturiert ist?
→ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Vollständige Code-Organisation

### ...wie ich anfange zu entwickeln?
→ [ONBOARDING.md](ONBOARDING.md) - Entwickler-Onboarding

### ...API-Dokumentation?
→ [API_CHEATSHEET.md](API_CHEATSHEET.md) - Quick-Reference für alle Endpoints

### ...Feature-Details?
→ [FEATURE_*.md](#-feature-dokumentation) - Detaillierte Feature-Dokumentation

### ...Deployment-Infos?
→ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) + [ops/](ops/) - Deployment & Operations

### ...Testing-Guides?
→ [testing/](testing/) - Testing-Dokumentation

### ...abgeschlossene Features?
→ [planning/completed/](planning/completed/) - Archiv implementierter Features

---

## 📞 Support & Hilfe

Bei Fragen:
1. **Dokumentation durchsuchen** - Nutze diesen Index
2. **TODO.md checken** - Aktuelle Tasks und bekannte Issues
3. **TROUBLESHOOTING_LOGIN.md** - Bei Login-Problemen
4. **MAINTAINERS.md** - Kontakt zu Projekt-Maintainern

---

## 🎯 Best Practices

### Für Entwickler
1. **Start mit [ONBOARDING.md](ONBOARDING.md)** - Setup & Workflows
2. **Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Verstehe Code-Organisation
3. **Lies [CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution-Guidelines
4. **Nutze [API_CHEATSHEET.md](API_CHEATSHEET.md)** - Als Quick-Reference

### Für neue Features
1. **Check [TODO.md](TODO.md)** - Ist es schon geplant?
2. **Erstelle Planning-Doc in [planning/](planning/)** - Beschreibe Feature
3. **Referenziere bestehende Features** - Nutze [FEATURE_*.md](#-feature-dokumentation)
4. **Nach Implementierung** - Move to [planning/completed/](planning/completed/)

### Für Dokumentation
1. **Halte [TODO.md](TODO.md) aktuell** - Bei jeder größeren Änderung
2. **Update [CHANGELOG.md](CHANGELOG.md)** - Bei jedem Release
3. **Archiviere alte Docs** - Move zu [archive/](archive/)
4. **Update diesen Index** - Bei neuen Dokumenten

---

**Dokumentations-Status:** ✅ Aktuell (2025-11-06)
**Wartung:** Dieser Index sollte bei jedem neuen Dokument aktualisiert werden.
