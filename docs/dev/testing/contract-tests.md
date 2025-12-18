# Contract-Tests (OpenAPI)

Ziel: Sicherstellen, dass Implementierung und `docs/openapi.yaml` konsistent sind.

## Validierung/Lint (bereits in CI)
- Validate: `npx --yes swagger-cli@latest validate docs/openapi.yaml`
- Lint: `npx --yes @redocly/cli@latest lint docs/openapi.yaml --format=github || true`

## Lokale Mock-/Contract-Tests (optional)
- Prism (Mock/Proxy):
  - Install: `npm i -D @stoplight/prism-cli` (oder global via `npx`)
  - Start Mock: `npx prism mock docs/openapi.yaml`
  - Start Proxy: `npx prism proxy docs/openapi.yaml http://localhost:3001/api/v1`
- Dredd (BDD-Contract Tests):
  - Install: `npm i -D dredd`
  - Run: `npx dredd docs/openapi.yaml http://localhost:3001/api/v1`

Hinweis: Diese Tools sind optional und nicht fest in CI integriert. Für produktionsnahe Tests empfiehlt sich eine eigene Staging‑Umgebung mit realer API.

