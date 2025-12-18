# Dokumentationsindex (Cut)

Diese Datei ist die zentrale Übersicht nach dem Stabilisierungslauf.
Struktur: `docs/product/`, `docs/dev/`, `docs/ops/`, `docs/security/`.

## Produkt
| Datei | Zweck | Zielgruppe | Qualität |
| --- | --- | --- | --- |
| docs/product/PROJECT_STATUS.md | Stabiler Cut, Reifegrad, Scope | PM, Tech Lead | gut |
| docs/product/NEXT_STEPS.md | Schritte nach Pause, Warnungen | PM, Tech Lead | gut |
| docs/product/MVP_PLAN_PRUEFEN.md | MVP-Definition & Plan-Flow | PM, Ops | gut |
| docs/product/TODO.md | Aktueller Backlog | PM, Tech Lead | ok |
| docs/product/TODO_ARCHIVE.md | Historischer Backlog | PM | ok |
| docs/product/CHANGELOG.md | Doku-Releasehistorie | PM, Ops | ok |
| docs/product/FEATURE_OBJEKT_MANAGEMENT.md | Feature-Konzept & Status | PM, Eng | ok |
| docs/product/FEATURE_DASHBOARD.md | Feature-Details Dashboard | PM, Eng | ok |
| docs/product/FEATURE_INTELLIGENT_REPLACEMENT.md | Feature-Details Replacement | PM, Eng | ok |
| docs/product/FEATURE_INTELLIGENT_OBJECT_MANAGEMENT.md | Geplantes Feature | PM | veraltet |
| docs/product/FEATURE_EVENTS.md | Geplantes Feature | PM | veraltet |
| docs/product/IMPLEMENTATION_ROADMAP_INTELLIGENT_OBJEKTE.md | Roadmap-Notizen | PM | ok |
| docs/product/UI_COMPONENTS.md | UI-Bausteine | PM, FE | ok |
| docs/product/UX_IMPROVEMENT_PLAN.md | UX-Ideenliste | PM, FE | ok |
| docs/product/KONZEPT.pdf | Ursprungskonzept | PM, Stakeholder | ok |
| docs/product/planning/README.md | Planungs-Index | PM | ok |
| docs/product/planning/replacement-scoring-improvements.md | Planungsnotizen | PM, Eng | ok |
| docs/product/planning/scoring-objekt-integration.md | Planungsnotizen | PM, Eng | ok |
| docs/product/planning/security-hardening.md | Planungsnotizen | PM, Eng | ok |
| docs/product/planning/sicherheitskonzept-modul-konzept.md | Planungsnotizen | PM, Eng | ok |
| docs/product/planning/completed/* | Historische Planung | PM | ok |
| docs/product/releases/* | Release-Notizen | PM, Ops | ok |
| docs/product/reports/backend-mvp-assessment-2025-09-10.md | Reifegrad-Report | PM, Eng | ok |
| docs/product/archive/* | Historische Inhalte | PM | veraltet |

## Entwicklung
| Datei | Zweck | Zielgruppe | Qualität |
| --- | --- | --- | --- |
| docs/dev/PROJECT_STRUCTURE.md | Code-/Repo-Navigation | Eng | ok |
| docs/dev/ARCHITECTURE.md | Architekturübersicht | Eng | ok |
| docs/dev/QA_GATES.md | QA-Gates für Cut/Release | Eng, QA | gut |
| docs/dev/ONBOARDING.md | Einstieg & Workflow | Eng | ok |
| docs/dev/CONTRIBUTING.md | Contribution-Regeln | Eng | ok |
| docs/dev/API_CHEATSHEET.md | API-Quickref | Eng | ok |
| docs/dev/API_EXAMPLES.http | REST-Client Beispiele | Eng | ok |
| docs/dev/openapi.yaml | OpenAPI Spec | Eng, QA | ok |
| docs/dev/DB_INDEXES.md | DB-Indizes | Eng | ok |
| docs/dev/TESTING.md | Golden Test Command & Voraussetzungen | Eng, QA | gut |
| docs/archive/TESTING_v1.10.0.md | Test-Guide (alt) | Eng | veraltet |
| docs/dev/CHATGPT_CONTEXT_PROMPT.md | KI-Kontext | Eng | ok |
| docs/archive/DOCUMENTATION_INDEX.md | Doku-Index (alt) | Eng | ok |
| docs/dev/MAINTAINERS.md | Verantwortlichkeiten | Eng, PM | ok |
| docs/dev/testing/contract-tests.md | Contract-Test Guide | Eng | ok |
| docs/dev/ci/proposed-contract-tests-job.md | CI-Idee (Proposal) | Eng | ok |
| docs/dev/sessions/* | Session-Logs | Eng | ok |
| docs/dev/pr_descriptions/* | PR-Texte | Eng | veraltet |

## Operations
| Datei | Zweck | Zielgruppe | Qualität |
| --- | --- | --- | --- |
| docs/ops/README.md | Ops-Runbook & Einstieg | Ops | gut |
| docs/ops/GO_NO_GO.md | Go/No-Go Checkliste | Ops | gut |
| docs/ops/CONFIGURATION.md | ENV/Config Overview | Ops | ok |
| docs/ops/DEPLOYMENT_CHECKLIST.md | Deployment-Checkliste | Ops | ok |
| docs/ops/TROUBLESHOOTING_LOGIN.md | Login-Troubleshooting | Ops | ok |
| docs/ops/system-health.md | Health/Readiness | Ops | ok |
| docs/ops/setup-https-letsencrypt.md | HTTPS Setup | Ops | ok |
| docs/ops/document-storage-checklist.md | Storage Checklist | Ops | ok |
| docs/ops/dsgvo-compliance.md | DSGVO-Guide | Ops, Legal | ok |
| docs/ops/monitoring-compose.yml | Monitoring Compose | Ops | ok |
| docs/ops/prometheus.yml | Prometheus Config | Ops | ok |
| docs/ops/prometheus-alerts.yaml | Alerts | Ops | ok |
| docs/ops/grafana-dashboard.json | Dashboard | Ops | ok |
| docs/ops/alertmanager.yml | Alertmanager Config | Ops | ok |
| docs/ops/alertmanager.discord.example.yml | Beispiel-Receiver | Ops | ok |
| docs/ops/setup-document-storage.sh | Storage Setup | Ops | ok |
| docs/ops/backup.sh | Backup Script | Ops | ok |
| docs/ops/configure-firewall.sh | Firewall Setup | Ops | ok |
| docs/ops/clamscan.service | ClamAV Unit | Ops | ok |
| docs/ops/clamscan.timer | ClamAV Timer | Ops | ok |

## Security
| Datei | Zweck | Zielgruppe | Qualität |
| --- | --- | --- | --- |
| docs/security/MULTI_TENANCY.md | Tenant-Isolation Design | Eng, Security | ok |
| docs/security/RBAC.md | Rollen & Rechte | Eng, Security | ok |
| docs/security/analysis/auth-hardening-report.md | Security-Analyse | Security | ok |
| docs/security/analysis/PHASE1-ANALYSE-2025-09-11.md | Phase-Analyse | Security | ok |

## Archive
- `docs/archive/HEUTE_ABEND_TESTEN.md` – Release-spezifischer Testplan (v1.8.0).
- `docs/archive/TESTING_v1.10.0.md` – Test-Guide (alt).
- `docs/archive/DOCUMENTATION_INDEX.md` – Doku-Index (alt).

## Doppelte/überlappende Inhalte
- `CHANGELOG.md` im Repo-Root vs. `docs/product/CHANGELOG.md` (Redundanz, teils unterschiedliche Details).
- `docs/archive/DOCUMENTATION_INDEX.md` vs. `docs/_index.md` (Index-Doppelung).
- Feature-Roadmaps in `docs/product/*` überschneiden sich mit `docs/product/planning/*`.

## Potenziell veraltet
- `docs/archive/TESTING_v1.10.0.md` (alt, Test-Infra derzeit instabil).
- `docs/product/FEATURE_EVENTS.md`, `docs/product/FEATURE_INTELLIGENT_OBJECT_MANAGEMENT.md` (Planung, kein Cut-Status).
- `docs/dev/pr_descriptions/*`, `docs/product/archive/*` (historisch).

## Offene Punkte (MVP/Cut)
- Exakte Abnahmekriterien/Regelwerk für „Plan prüfen“ (Arbeitszeitrecht/Policies).
- Test-Infra stabilisieren (ENV/Prisma-Mocks).
- Go/No-Go Automatisierung (Backups/Restore testbar per Script).
