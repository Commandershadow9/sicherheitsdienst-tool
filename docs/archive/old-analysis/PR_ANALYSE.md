# PR-Analyse pr-2 bis pr-6

Quelle: AGENT_INSTRUCTIONS.md und docs/KONZEPT.pdf (Roadmap/DoD). Fokus: MVP = OpenAPI v1, Auth + RBAC, Entity „Site“, Docker Compose, CI. Artefakte (`dist/`, Review-/Fehlerdateien) und Entfernen von `LICENSE`/`.gitignore` sind nicht konzepttreu.

## pr-2
- Kurzinhalt: Bringt Express/TypeScript/Prisma-Backend mit Auth (JWT), Users/Shifts-CRUD, Seeds und Docker; enthält jedoch eingecheckte Build-/Review-Artefakte und entfernt `LICENSE`/`.gitignore`.
- Einordnung: MVP-relevant (Kernfunktionen vorhanden).
- Empfehlung: Konzepttreu neu schreiben (keine Artefakte einchecken, `LICENSE`/`.gitignore` beibehalten).

## pr-3
- Kurzinhalt: Nahezu identisch zu pr-2 ohne erkennbaren Mehrwert; ähnliche Artefakte/Entfernungen.
- Einordnung: Irrelevant (Duplikat).
- Empfehlung: Verwerfen.

## pr-4
- Kurzinhalt: Variante von pr-2 mit minimalen Unterschieden; gleiche Struktur und gleiche Probleme (Artefakte, Entfernen von Standarddateien).
- Einordnung: Irrelevant (Duplikat).
- Empfehlung: Verwerfen.

## pr-5
- Kurzinhalt: Ebenfalls pr-2-ähnlich (Auth, CRUD, Prisma) mit marginalen Deltas; Artefakte weiterhin vorhanden.
- Einordnung: Irrelevant (Duplikat).
- Empfehlung: Verwerfen.

## pr-6
- Kurzinhalt: Wie pr-2, zusätzlich RBAC an Routen, Zod-Validierung und Logging (Winston); dennoch Artefakte/Entfernungen enthalten.
- Einordnung: Post-MVP (sinnvolle Härtungen über MVP hinaus).
- Empfehlung: Konzepttreu neu schreiben (Inhalte übernehmen, aber sauber, ohne Artefakte; `LICENSE`/`.gitignore` erhalten).

