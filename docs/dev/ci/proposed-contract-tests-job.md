# CI: Contract-Tests (Vorschlag)

Optionaler CI-Job (nicht aktiviert), um OpenAPI-Validierung/Lint zu ergänzen mit Prism/Dredd. Erfordert Netzwerkzugriff auf laufende API oder Mock.

```yaml
name: contract-tests (proposed)

on:
  workflow_dispatch: {}

jobs:
  prism-mock:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx --yes @stoplight/prism-cli mock docs/openapi.yaml &
      - run: sleep 3
      - run: curl -fsSL http://127.0.0.1:4010/health || true

  dredd-proxy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Start API (compose or node)
        run: |
          echo "This step depends on your API startup strategy"
          # For example: docker-compose up -d api db
      - name: Run Dredd against API
        run: npx --yes dredd docs/openapi.yaml http://localhost:3001/api/v1 || true
```

Hinweis: Als Startpunkt gedacht; nicht in der Standard-`ci.yml` enthalten.

