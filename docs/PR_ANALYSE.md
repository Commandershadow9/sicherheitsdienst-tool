# PR-Analyse pr-2 bis pr-6

Hinweis: Zunächst nur DIFF-Übersichten (--stat und --name-status) je Branch. Nach deiner Freigabe ergänze ich Zusammenfassungen, MVP-Einordnung und Empfehlungen.

## pr-2

### DIFF --stat (main vs pr-2)

```
 .gitignore                                         |  136 -
 AGENT_INSTRUCTIONS.md                              |   46 +
 LICENSE                                            |   21 -
 README.md                                          |  101 +
 backend/.env.example                               |   14 +
 backend/.gitignore                                 |    5 +
 backend/dist/app.js                                |  330 +
 backend/dist/controllers/index.js                  |   19 +
 backend/dist/controllers/shiftController.js        |  311 +
 backend/dist/controllers/systemController.js       |   80 +
 backend/dist/controllers/userController.js         |  254 +
 backend/dist/middleware/auth.js                    |    1 +
 backend/dist/middleware/validate.js                |    1 +
 backend/dist/routes/index.js                       |   12 +
 backend/dist/routes/shiftRoutes.js                 |   12 +
 backend/dist/routes/systemRoutes.js                |    8 +
 backend/dist/routes/userRoutes.js                  |   11 +
 backend/dist/utils/seedData.js                     |  217 +
 backend/package-lock.json                          | 7559 ++++++++++++++++++++
 backend/package.json                               |   73 +
 .../migrations/20250524115851_init/migration.sql   |  115 +
 backend/prisma/migrations/migration_lock.toml      |    3 +
 backend/prisma/schema.prisma                       |  170 +
 backend/src/app.ts                                 |  164 +
 backend/src/controllers/authController.ts          |   88 +
 backend/src/controllers/index.ts                   |    6 +
 backend/src/controllers/shiftController.ts         |  364 +
 backend/src/controllers/systemController.ts        |   90 +
 backend/src/controllers/userController.ts          |  293 +
 backend/src/middleware/asyncHandler.ts             |    7 +
 backend/src/middleware/auth.ts                     |   64 +
 backend/src/middleware/validate.ts                 |   31 +
 backend/src/routes/authRoutes.ts                   |   19 +
 backend/src/routes/index.ts                        |    7 +
 backend/src/routes/shiftRoutes.ts                  |   25 +
 backend/src/routes/systemRoutes.ts                 |   13 +
 backend/src/routes/userRoutes.ts                   |   36 +
 backend/src/types/express.d.ts                     |    9 +
 backend/src/utils/seedData.ts                      |  253 +
 backend/tsconfig.json                              |   36 +
 build_errors.txt                                   |   15 +
 claude_review/package.json                         |   61 +
 claude_review/tsconfig.json                        |   40 +
 docker-compose.yml                                 |   41 +
 file_list.txt                                      |    0
 45 files changed, 11004 insertions(+), 157 deletions(-)
```

### DIFF --name-status (main vs pr-2)

```
D	.gitignore
A	AGENT_INSTRUCTIONS.md
D	LICENSE
A	README.md
A	backend/.env.example
A	backend/.gitignore
A	backend/dist/app.js
A	backend/dist/controllers/index.js
A	backend/dist/controllers/shiftController.js
A	backend/dist/controllers/systemController.js
A	backend/dist/controllers/userController.js
A	backend/dist/middleware/auth.js
A	backend/dist/middleware/validate.js
A	backend/dist/routes/index.js
A	backend/dist/routes/shiftRoutes.js
A	backend/dist/routes/systemRoutes.js
A	backend/dist/routes/userRoutes.js
A	backend/dist/utils/seedData.js
A	backend/package-lock.json
A	backend/package.json
A	backend/prisma/migrations/20250524115851_init/migration.sql
A	backend/prisma/migrations/migration_lock.toml
A	backend/prisma/schema.prisma
A	backend/src/app.ts
A	backend/src/controllers/authController.ts
A	backend/src/controllers/index.ts
A	backend/src/controllers/shiftController.ts
A	backend/src/controllers/systemController.ts
A	backend/src/controllers/userController.ts
A	backend/src/middleware/asyncHandler.ts
A	backend/src/middleware/auth.ts
A	backend/src/middleware/validate.ts
A	backend/src/routes/authRoutes.ts
A	backend/src/routes/index.ts
A	backend/src/routes/shiftRoutes.ts
A	backend/src/routes/systemRoutes.ts
A	backend/src/routes/userRoutes.ts
A	backend/src/types/express.d.ts
A	backend/src/utils/seedData.ts
A	backend/tsconfig.json
A	build_errors.txt
A	claude_review/package.json
A	claude_review/tsconfig.json
A	docker-compose.yml
A	file_list.txt
```

---

## pr-3

### DIFF --stat (main vs pr-3)

```
 .gitignore                                         |  136 -
 AGENT_INSTRUCTIONS.md                              |   46 +
 LICENSE                                            |   21 -
 README.md                                          |  101 +
 backend/.env.example                               |   14 +
 backend/.gitignore                                 |    5 +
 backend/dist/app.js                                |  330 +
 backend/dist/controllers/index.js                  |   19 +
 backend/dist/controllers/shiftController.js        |  311 +
 backend/dist/controllers/systemController.js       |   80 +
 backend/dist/controllers/userController.js         |  254 +
 backend/dist/middleware/auth.js                    |    1 +
 backend/dist/middleware/validate.js                |    1 +
 backend/dist/routes/index.js                       |   12 +
 backend/dist/routes/shiftRoutes.js                 |   12 +
 backend/dist/routes/systemRoutes.js                |    8 +
 backend/dist/routes/userRoutes.js                  |   11 +
 backend/dist/utils/seedData.js                     |  217 +
 backend/package-lock.json                          | 7559 ++++++++++++++++++++
 backend/package.json                               |   73 +
 .../migrations/20250524115851_init/migration.sql   |  115 +
 backend/prisma/migrations/migration_lock.toml      |    3 +
 backend/prisma/schema.prisma                       |  170 +
 backend/src/app.ts                                 |  164 +
 backend/src/controllers/authController.ts          |   88 +
 backend/src/controllers/index.ts                   |    6 +
 backend/src/controllers/shiftController.ts         |  364 +
 backend/src/controllers/systemController.ts        |   90 +
 backend/src/controllers/userController.ts          |  293 +
 backend/src/middleware/asyncHandler.ts             |    7 +
 backend/src/middleware/auth.ts                     |   64 +
 backend/src/middleware/validate.ts                 |   31 +
 backend/src/routes/authRoutes.ts                   |   19 +
 backend/src/routes/index.ts                        |    7 +
 backend/src/routes/shiftRoutes.ts                  |   25 +
 backend/src/routes/systemRoutes.ts                 |   13 +
 backend/src/routes/userRoutes.ts                   |   36 +
 backend/src/types/express.d.ts                     |    9 +
 backend/src/utils/seedData.ts                      |  253 +
 backend/tsconfig.json                              |   36 +
 build_errors.txt                                   |   15 +
 claude_review/package.json                         |   61 +
 claude_review/tsconfig.json                        |   40 +
 docker-compose.yml                                 |   41 +
 file_list.txt                                      |    0
 45 files changed, 11004 insertions(+), 157 deletions(-)
```

### DIFF --name-status (main vs pr-3)

```
D	.gitignore
A	AGENT_INSTRUCTIONS.md
D	LICENSE
A	README.md
A	backend/.env.example
A	backend/.gitignore
A	backend/dist/app.js
A	backend/dist/controllers/index.js
A	backend/dist/controllers/shiftController.js
A	backend/dist/controllers/systemController.js
A	backend/dist/controllers/userController.js
A	backend/dist/middleware/auth.js
A	backend/dist/middleware/validate.js
A	backend/dist/routes/index.js
A	backend/dist/routes/shiftRoutes.js
A	backend/dist/routes/systemRoutes.js
A	backend/dist/routes/userRoutes.js
A	backend/dist/utils/seedData.js
A	backend/package-lock.json
A	backend/package.json
A	backend/prisma/migrations/20250524115851_init/migration.sql
A	backend/prisma/migrations/migration_lock.toml
A	backend/prisma/schema.prisma
A	backend/src/app.ts
A	backend/src/controllers/authController.ts
A	backend/src/controllers/index.ts
A	backend/src/controllers/shiftController.ts
A	backend/src/controllers/systemController.ts
A	backend/src/controllers/userController.ts
A	backend/src/middleware/asyncHandler.ts
A	backend/src/middleware/auth.ts
A	backend/src/middleware/validate.ts
A	backend/src/routes/authRoutes.ts
A	backend/src/routes/index.ts
A	backend/src/routes/shiftRoutes.ts
A	backend/src/routes/systemRoutes.ts
A	backend/src/routes/userRoutes.ts
A	backend/src/types/express.d.ts
A	backend/src/utils/seedData.ts
A	backend/tsconfig.json
A	build_errors.txt
A	claude_review/package.json
A	claude_review/tsconfig.json
A	docker-compose.yml
A	file_list.txt
```

---

## pr-4

### DIFF --stat (main vs pr-4)

```
 .gitignore                                         |  136 -
 AGENT_INSTRUCTIONS.md                              |   46 +
 LICENSE                                            |   21 -
 README.md                                          |  101 +
 backend/.env.example                               |   14 +
 backend/.gitignore                                 |    5 +
 backend/dist/app.js                                |  330 +
 backend/dist/controllers/index.js                  |   19 +
 backend/dist/controllers/shiftController.js        |  311 +
 backend/dist/controllers/systemController.js       |   80 +
 backend/dist/controllers/userController.js         |  254 +
 backend/dist/middleware/auth.js                    |    1 +
 backend/dist/middleware/validate.js                |    1 +
 backend/dist/routes/index.js                       |   12 +
 backend/dist/routes/shiftRoutes.js                 |   12 +
 backend/dist/routes/systemRoutes.js                |    8 +
 backend/dist/routes/userRoutes.js                  |   11 +
 backend/dist/utils/seedData.js                     |  217 +
 backend/package-lock.json                          | 7559 ++++++++++++++++++++
 backend/package.json                               |   73 +
 .../migrations/20250524115851_init/migration.sql   |  115 +
 backend/prisma/migrations/migration_lock.toml      |    3 +
 backend/prisma/schema.prisma                       |  170 +
 backend/src/app.ts                                 |  164 +
 backend/src/controllers/authController.ts          |   88 +
 backend/src/controllers/index.ts                   |    6 +
 backend/src/controllers/shiftController.ts         |  364 +
 backend/src/controllers/systemController.ts        |   90 +
 backend/src/controllers/userController.ts          |  293 +
 backend/src/middleware/asyncHandler.ts             |    7 +
 backend/src/middleware/auth.ts                     |   64 +
 backend/src/middleware/validate.ts                 |   31 +
 backend/src/routes/authRoutes.ts                   |   18 +
 backend/src/routes/index.ts                        |    6 +
 backend/src/routes/shiftRoutes.ts                  |   24 +
 backend/src/routes/systemRoutes.ts                 |   12 +
 backend/src/routes/userRoutes.ts                   |   35 +
 backend/src/types/express.d.ts                     |    9 +
 backend/src/utils/seedData.ts                      |  253 +
 backend/tsconfig.json                              |   36 +
 build_errors.txt                                   |   15 +
 claude_review/package.json                         |   61 +
 claude_review/tsconfig.json                        |   40 +
 docker-compose.yml                                 |   41 +
 file_list.txt                                      |    0
 45 files changed, 10999 insertions(+), 157 deletions(-)
```

### DIFF --name-status (main vs pr-4)

```
D	.gitignore
A	AGENT_INSTRUCTIONS.md
D	LICENSE
A	README.md
A	backend/.env.example
A	backend/.gitignore
A	backend/dist/app.js
A	backend/dist/controllers/index.js
A	backend/dist/controllers/shiftController.js
A	backend/dist/controllers/systemController.js
A	backend/dist/controllers/userController.js
A	backend/dist/middleware/auth.js
A	backend/dist/middleware/validate.js
A	backend/dist/routes/index.js
A	backend/dist/routes/shiftRoutes.js
A	backend/dist/routes/systemRoutes.js
A	backend/dist/routes/userRoutes.js
A	backend/dist/utils/seedData.js
A	backend/package-lock.json
A	backend/package.json
A	backend/prisma/migrations/20250524115851_init/migration.sql
A	backend/prisma/migrations/migration_lock.toml
A	backend/prisma/schema.prisma
A	backend/src/app.ts
A	backend/src/controllers/authController.ts
A	backend/src/controllers/index.ts
A	backend/src/controllers/shiftController.ts
A	backend/src/controllers/systemController.ts
A	backend/src/controllers/userController.ts
A	backend/src/middleware/asyncHandler.ts
A	backend/src/middleware/auth.ts
A	backend/src/middleware/validate.ts
A	backend/src/routes/authRoutes.ts
A	backend/src/routes/index.ts
A	backend/src/routes/shiftRoutes.ts
A	backend/src/routes/systemRoutes.ts
A	backend/src/routes/userRoutes.ts
A	backend/src/types/express.d.ts
A	backend/src/utils/seedData.ts
A	backend/tsconfig.json
A	build_errors.txt
A	claude_review/package.json
A	claude_review/tsconfig.json
A	docker-compose.yml
A	file_list.txt
```

---

## pr-5

### DIFF --stat (main vs pr-5)

```
 .gitignore                                         |  136 -
 AGENT_INSTRUCTIONS.md                              |   46 +
 LICENSE                                            |   21 -
 README.md                                          |  101 +
 backend/.env.example                               |   14 +
 backend/.gitignore                                 |    5 +
 backend/dist/app.js                                |  330 +
 backend/dist/controllers/index.js                  |   19 +
 backend/dist/controllers/shiftController.js        |  311 +
 backend/dist/controllers/systemController.js       |   80 +
 backend/dist/controllers/userController.js         |  254 +
 backend/dist/middleware/auth.js                    |    1 +
 backend/dist/middleware/validate.js                |    1 +
 backend/dist/routes/index.js                       |   12 +
 backend/dist/routes/shiftRoutes.js                 |   12 +
 backend/dist/routes/systemRoutes.js                |    8 +
 backend/dist/routes/userRoutes.js                  |   11 +
 backend/dist/utils/seedData.js                     |  217 +
 backend/package-lock.json                          | 7559 ++++++++++++++++++++
 backend/package.json                               |   73 +
 .../migrations/20250524115851_init/migration.sql   |  115 +
 backend/prisma/migrations/migration_lock.toml      |    3 +
 backend/prisma/schema.prisma                       |  170 +
 backend/src/app.ts                                 |  163 +
 backend/src/controllers/authController.ts          |   87 +
 backend/src/controllers/index.ts                   |    5 +
 backend/src/controllers/shiftController.ts         |  363 +
 backend/src/controllers/systemController.ts        |   89 +
 backend/src/controllers/userController.ts          |  292 +
 backend/src/middleware/asyncHandler.ts             |    6 +
 backend/src/middleware/auth.ts                     |   63 +
 backend/src/middleware/validate.ts                 |   30 +
 backend/src/routes/authRoutes.ts                   |   18 +
 backend/src/routes/index.ts                        |    6 +
 backend/src/routes/shiftRoutes.ts                  |   24 +
 backend/src/routes/systemRoutes.ts                 |   12 +
 backend/src/routes/userRoutes.ts                   |   35 +
 backend/src/types/express.d.ts                     |    8 +
 backend/src/utils/seedData.ts                      |  252 +
 backend/tsconfig.json                              |   36 +
 build_errors.txt                                   |   15 +
 claude_review/package.json                         |   61 +
 claude_review/tsconfig.json                        |   40 +
 docker-compose.yml                                 |   41 +
 file_list.txt                                      |    0
 45 files changed, 10988 insertions(+), 157 deletions(-)
```

### DIFF --name-status (main vs pr-5)

```
D	.gitignore
A	AGENT_INSTRUCTIONS.md
D	LICENSE
A	README.md
A	backend/.env.example
A	backend/.gitignore
A	backend/dist/app.js
A	backend/dist/controllers/index.js
A	backend/dist/controllers/shiftController.js
A	backend/dist/controllers/systemController.js
A	backend/dist/controllers/userController.js
A	backend/dist/middleware/auth.js
A	backend/dist/middleware/validate.js
A	backend/dist/routes/index.js
A	backend/dist/routes/shiftRoutes.js
A	backend/dist/routes/systemRoutes.js
A	backend/dist/routes/userRoutes.js
A	backend/dist/utils/seedData.js
A	backend/package-lock.json
A	backend/package.json
A	backend/prisma/migrations/20250524115851_init/migration.sql
A	backend/prisma/migrations/migration_lock.toml
A	backend/prisma/schema.prisma
A	backend/src/app.ts
A	backend/src/controllers/authController.ts
A	backend/src/controllers/index.ts
A	backend/src/controllers/shiftController.ts
A	backend/src/controllers/systemController.ts
A	backend/src/controllers/userController.ts
A	backend/src/middleware/asyncHandler.ts
A	backend/src/middleware/auth.ts
A	backend/src/middleware/validate.ts
A	backend/src/routes/authRoutes.ts
A	backend/src/routes/index.ts
A	backend/src/routes/shiftRoutes.ts
A	backend/src/routes/systemRoutes.ts
A	backend/src/routes/userRoutes.ts
A	backend/src/types/express.d.ts
A	backend/src/utils/seedData.ts
A	backend/tsconfig.json
A	build_errors.txt
A	claude_review/package.json
A	claude_review/tsconfig.json
A	docker-compose.yml
A	file_list.txt
```

---

## pr-6

### DIFF --stat (main vs pr-6)

```
 .gitignore                                         |  136 -
 AGENT_INSTRUCTIONS.md                              |   46 +
 LICENSE                                            |   21 -
 README.md                                          |  102 +
 backend/.env.example                               |   14 +
 backend/.gitignore                                 |    6 +
 backend/dist/app.js                                |  330 +
 backend/dist/controllers/index.js                  |   19 +
 backend/dist/controllers/shiftController.js        |  311 +
 backend/dist/controllers/systemController.js       |   80 +
 backend/dist/controllers/userController.js         |  254 +
 backend/dist/middleware/auth.js                    |    1 +
 backend/dist/middleware/validate.js                |    1 +
 backend/dist/routes/index.js                       |   12 +
 backend/dist/routes/shiftRoutes.js                 |   12 +
 backend/dist/routes/systemRoutes.js                |    8 +
 backend/dist/routes/userRoutes.js                  |   11 +
 backend/dist/utils/seedData.js                     |  217 +
 backend/package-lock.json                          | 7559 ++++++++++++++++++++
 backend/package.json                               |   73 +
 .../migrations/20250524115851_init/migration.sql   |  115 +
 backend/prisma/migrations/migration_lock.toml      |    3 +
 backend/prisma/schema.prisma                       |  170 +
 backend/src/app.ts                                 |  170 +
 backend/src/controllers/authController.ts          |   88 +
 backend/src/controllers/index.ts                   |    6 +
 backend/src/controllers/shiftController.ts         |  364 +
 backend/src/controllers/systemController.ts        |   90 +
 backend/src/controllers/userController.ts          |  293 +
 backend/src/middleware/asyncHandler.ts             |    7 +
 backend/src/middleware/auth.ts                     |   64 +
 backend/src/middleware/validate.ts                 |   31 +
 backend/src/routes/authRoutes.ts                   |   19 +
 backend/src/routes/index.ts                        |    7 +
 backend/src/routes/shiftRoutes.ts                  |   44 +
 backend/src/routes/systemRoutes.ts                 |   13 +
 backend/src/routes/userRoutes.ts                   |   49 +
 backend/src/types/express.d.ts                     |    9 +
 backend/src/utils/logger.ts                        |   48 +
 backend/src/utils/seedData.ts                      |  253 +
 backend/src/validations/shiftValidation.ts         |   30 +
 backend/src/validations/userValidation.ts          |   35 +
 backend/tsconfig.json                              |   36 +
 build_errors.txt                                   |   15 +
 claude_review/package.json                         |   61 +
 claude_review/tsconfig.json                        |   40 +
 docker-compose.yml                                 |   41 +
 file_list.txt                                      |    0
 48 files changed, 11157 insertions(+), 157 deletions(-)
```

### DIFF --name-status (main vs pr-6)

```
D	.gitignore
A	AGENT_INSTRUCTIONS.md
D	LICENSE
A	README.md
A	backend/.env.example
A	backend/.gitignore
A	backend/dist/app.js
A	backend/dist/controllers/index.js
A	backend/dist/controllers/shiftController.js
A	backend/dist/controllers/systemController.js
A	backend/dist/controllers/userController.js
A	backend/dist/middleware/auth.js
A	backend/dist/middleware/validate.js
A	backend/dist/routes/index.js
A	backend/dist/routes/shiftRoutes.js
A	backend/dist/routes/systemRoutes.js
A	backend/dist/routes/userRoutes.js
A	backend/dist/utils/seedData.js
A	backend/package-lock.json
A	backend/package.json
A	backend/prisma/migrations/20250524115851_init/migration.sql
A	backend/prisma/migrations/migration_lock.toml
A	backend/prisma/schema.prisma
A	backend/src/app.ts
A	backend/src/controllers/authController.ts
A	backend/src/controllers/index.ts
A	backend/src/controllers/shiftController.ts
A	backend/src/controllers/systemController.ts
A	backend/src/controllers/userController.ts
A	backend/src/middleware/asyncHandler.ts
A	backend/src/middleware/auth.ts
A	backend/src/middleware/validate.ts
A	backend/src/routes/authRoutes.ts
A	backend/src/routes/index.ts
A	backend/src/routes/shiftRoutes.ts
A	backend/src/routes/systemRoutes.ts
A	backend/src/routes/userRoutes.ts
A	backend/src/types/express.d.ts
A	backend/src/utils/logger.ts
A	backend/src/utils/seedData.ts
A	backend/src/validations/shiftValidation.ts
A	backend/src/validations/userValidation.ts
A	backend/tsconfig.json
A	build_errors.txt
A	claude_review/package.json
A	claude_review/tsconfig.json
A	docker-compose.yml
A	file_list.txt
```

---

Wenn du ein vollständiges Patch-Diff für einen Branch sehen möchtest, sag Bescheid – die Patches sind sehr groß, daher hier zunächst nur die Übersichten.

---

Hinweis zur Einordnung: Die Datei `docs/KONZEPT.md` ist im Repo nicht vorhanden. Die folgende Analyse basiert daher auf expliziten Annahmen zum MVP: Kernfunktionalitäten sind Authentifizierung (JWT), Nutzer- und Schicht-CRUD, Basis-Health/Stats-Endpunkte, Prisma-Schema/Migrationen und solider Fehler-Handler. Post-MVP: Validierung (zod), rollenbasierte Autorisierung an Routen, strukturiertes Logging. Irrelevant/unerwünscht: eingecheckte Build-Artefakte (`dist/`), Review-Artefakte (`claude_review/`), provisorische Dateien (`build_errors.txt`, `file_list.txt`), Entfernen von `LICENSE`/`.gitignore`.

## Analyse und Empfehlungen

### pr-2

- **Kurzsummary:** Führt ein vollständiges Express/TypeScript/Prisma-Backend mit Auth (JWT), CRUD für Users/Shifts, Middleware und Prisma-Migration ein. Enthält zusätzlich Docker-Setup und Seed-Daten; checkt aber `dist/` und Hilfsdateien ein und entfernt `LICENSE`/`.gitignore`.
- **Einordnung:** MVP-relevant (Kernfunktionen vorhanden), mit problematischen Repo-Artefakten.
- **Empfehlung:** konzepttreu neu schreiben.
- **Begründung:** Inhalte und Schnittstellen sind nützlich, aber Build-/Review-Artefakte entfernen und `LICENSE`/`.gitignore` bewahren; optional RBAC/Validierung später ergänzen.

### pr-3

- **Kurzsummary:** Inhaltlich nahezu identisch zu pr-2 (Backend + Auth + CRUD), minimale Abweichungen in Code/Zeilenzahlen. Entfernt ebenfalls `LICENSE`/`.gitignore` und enthält Artefakte.
- **Einordnung:** Irrelevant (Duplikat von pr-2 ohne klaren Mehrwert).
- **Empfehlung:** verwerfen.
- **Begründung:** Kein funktionaler Zusatznutzen gegenüber pr-2; gleiche Aufräumprobleme.

### pr-4

- **Kurzsummary:** Variante von pr-2 mit kleinen Formatierungs-/Minimalunterschieden; gleiche Struktur (Auth, Users/Shifts-CRUD). Entfernt `LICENSE`/`.gitignore` und enthält Artefakte.
- **Einordnung:** Irrelevant (weiteres Duplikat ohne klaren Mehrwert).
- **Empfehlung:** verwerfen.
- **Begründung:** Kein zusätzlicher Nutzen; identische Aufräumarbeiten nötig wie pr-2.

### pr-5

- **Kurzsummary:** Ebenfalls sehr nahe an pr-2, geringfügig geringere Zeilenzahl; gleiche Features (Auth, CRUD, Prisma). Entfernt `LICENSE`/`.gitignore` und bringt Artefakte mit.
- **Einordnung:** Irrelevant (Duplikat ohne Mehrwert).
- **Empfehlung:** verwerfen.
- **Begründung:** Keine neuen Kernfeatures vs. pr-2; Aufräumaufwand analog.

### pr-6

- **Kurzsummary:** Baut auf pr-2 auf und ergänzt rollenbasierte Autorisierung an Routen, zod-Validierung und strukturiertes Logging (Winston). Enthält weiterhin `dist/` und diverse Artefakte und entfernt `LICENSE`/`.gitignore`.
- **Einordnung:** Post-MVP (liefert sinnvolle Härtungen über den MVP hinaus, Kern ist enthalten).
- **Empfehlung:** konzepttreu neu schreiben.
- **Begründung:** Funktional die stärkste Basis (RBAC, Validation, Logger). Für Merge: Artefakte entfernen, `LICENSE`/`.gitignore` erhalten, README/Env/DB-Skripte konsolidieren.

---

Vorschlag für die weitere Vorgehensweise:

- pr-6 als funktionale Referenz verwenden, aber sauber neu aufsetzen (ohne `dist/`, ohne Review-/Fehlerdateien, mit bestehender `LICENSE`/`.gitignore`).
- MVP-treu zunächst Auth + Users/Shifts CRUD + Health/Stats mergen; Post-MVP (RBAC, zod, Logger) separat in kleineren, fokussierten PRs.
