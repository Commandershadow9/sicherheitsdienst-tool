# Contributing to Zerodox Sicherheitsdienst-Tool

Vielen Dank für Ihr Interesse an diesem Projekt! Hier finden Sie Richtlinien für Beiträge.

## Entwicklungsumgebung einrichten

### Voraussetzungen
- Node.js 20+ (LTS)
- Docker + Docker Compose
- Git

### Setup
```bash
# Repository klonen
git clone https://github.com/Commandershadow9/sicherheitsdienst-tool.git
cd sicherheitsdienst-tool

# Backend Dependencies
cd backend && npm install && npm run db:generate && cd ..

# Frontend Dependencies
cd frontend && npm install && cd ..

# Dev-Stack starten
docker-compose -f docker-compose.dev.yml up -d
```

## Code-Standards

### Commit Messages
Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Neue Funktion hinzufügen
fix: Bug beheben
docs: Dokumentation aktualisieren
refactor: Code-Refactoring
test: Tests hinzufügen/ändern
chore: Build/Tooling-Änderungen
```

### TypeScript
- Strict mode ist aktiviert
- Keine `any` ohne Begründung
- Explizite Typen für Funktionsparameter und Rückgabewerte

### Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Tests
```bash
# Backend Unit Tests
cd backend && npm test

# Frontend E2E Tests
cd frontend && npm run test:e2e
```

## Pull Request Process

1. Fork erstellen und Feature-Branch anlegen
2. Änderungen committen (Conventional Commits)
3. Tests schreiben/aktualisieren
4. Lint und Typecheck ausführen
5. PR erstellen mit Beschreibung der Änderungen

### PR Checkliste
- [ ] Tests geschrieben und bestanden
- [ ] Lint/Typecheck bestanden
- [ ] Dokumentation aktualisiert (falls nötig)
- [ ] CHANGELOG.md aktualisiert (bei Features/Fixes)

## Fragen?

Bei Fragen können Sie ein Issue erstellen oder die bestehende Dokumentation in `/docs` konsultieren.
