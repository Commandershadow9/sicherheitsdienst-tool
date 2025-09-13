# Maintainers Checklist

Kurzleitfaden für Repo‑Pflege, Konventionen und regelmäßige Checks.

## Branch‑Protection
- Default Branch: `main`
- Require PRs for changes (no direct push)
- Required status checks:
  - `ci` (unit/lint/build)
  - `commitlint` (Conventional Commits)
  - `e2e-smoke` (smoke.spec)
- Squash‑Merge als Standard (Commit‑History sauber halten)

## Release Flow (semver‑leicht)
- Labels: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`
- Changelog pflegen (kurz, gruppiert nach Typ)
- Tagging optional (z. B. `v1.2.3`) bei relevanten Meilensteinen

## Branch‑Management
- Feature‑Branches: PR gegen `main` (Squash)
- Stale Branches: nach Merge löschen (lokal + `git push origin :branch`)
- Regelmäßig prüfen: `git branch -r --sort=-committerdate | head -n 20`

## CI/Smokes
- `health-smoke` (p95 SLA) und `api-smoke` (Login/Users/Sites) regelmäßig im Blick
- `e2e-smoke` für PRs/Pushes; `e2e-full` periodisch (z. B. nightly) oder gezielt
- Artefakte (Playwright Reports/Traces/Videos) bei Flakes für Debug nutzen

## ENV/Secrets
- GitHub Secrets: keine Secrets im Repo
- .env.example aktuell halten (nur notwendige Variablen)
- Compose‑Profile (dev/monitoring) dokumentieren

## Docs/Conventions
- Conventional Commits enforced (commitlint)
- PR‑Template Checkliste nutzen
- README/GETTING_STARTED aktualisieren bei UX‑relevanten Änderungen

## Clean‑up Routine (monatlich)
- Offene alte PRs/Branches sichten, schließen/mergen oder archivieren
- Monitoring‑Dashboards/Alerts kurz prüfen (p95/5xx/Top‑Routes)
- Tickets/ROADMAP syncen (Status aktuell?)

