# Sicherheitsdienst-Tool Backend

![CI](https://github.com/Commandershadow9/sicherheitsdienst-tool/actions/workflows/ci.yml/badge.svg?branch=main)

This is the backend for a comprehensive management tool for security services. It provides a REST API to manage employees, shifts, time tracking, and other operational data. The project is built with Node.js, Express, TypeScript, and Prisma, using a PostgreSQL database.
It follows consistent coding standards (EditorConfig, Prettier, ESLint v9) and includes smoke tests.

## Current Project Status

The project is in a stable development stage. The basic API structure is established, and a **complete authentication system based on JSON Web Tokens (JWT) has been successfully implemented and tested.**

- **Core Functions**: CRUD operations for `Users` and `Shifts` are in place.
- **Authentication**: Users can log in via `POST /api/auth/login` to receive a valid JWT.
- **Security**: User routes (`/api/users`) are protected by middleware and require authentication.
- **Logging**: Structured application logs are written using Winston.
- **Validation**: Zod-based request validation via middleware.
- **RBAC**: Route-level authorization with roles (e.g. ADMIN, DISPATCHER).

## Technology Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL (can be run via Docker)
- **Authentication**: JSON Web Tokens (JWT) with `bcryptjs` for password hashing.
- **Development Environment**: `ts-node` and `nodemon` for live-reloading.

---

## Setup & Installation (For Developers)

Follow these steps to set up and run the project locally:

1.  **Prerequisites**:
    - Node.js (v18 or higher)
    - Docker and Docker Compose (for the PostgreSQL database)
    - PostgreSQL client tools (optional)
    - A `.env` file (see `.env.example`)

2.  **Clone & Install Repository**:

    ```bash
    git clone <your-repository-url>
    cd backend
    npm install
    ```

3.  **Start Database**:
    - Start the PostgreSQL container using Docker Compose. The Docker setup is pre-configured in your `package.json`.
      ```bash
      npm run docker:up
      ```

4.  **Configure Environment Variables**:
    - Copy the template file `.env.example` to create a `.env` file in the `backend` main directory.
    - Adjust the `DATABASE_URL` in the `.env` file to match your local PostgreSQL settings. Replace placeholders with correct values:
      ```env
      DATABASE_URL="postgresql://your_postgres_user:your_password@localhost:5432/sicherheitsdienst_db?schema=public"
      ```
    - Generate a secure `JWT_SECRET` (at least 32 random characters).

5.  **Migrate and Seed Database**:
    - Apply all Prisma migrations to create the database tables and populate the database with initial test data:
      ```bash
      npx prisma migrate dev
      npm run db:seed
      ```
    - To reset the database, you can use `npm run db:reset`.

6.  **Start Server**:
    - Start the development server:
      ```bash
      npm run dev
      ```
    - The server should now be running at `http://localhost:3001`.

### Available NPM Scripts

- `npm run dev`: Starts the server in development mode with live-reloading.
- `npm run build`: Compiles the TypeScript code to the `./dist` folder.
- `npm run start`: Starts the compiled application from the `./dist` folder.
- `npm run db:migrate`: Applies database migrations.
- `npm run db:seed`: Populates the database with test data from `src/utils/seedData.ts`.
- `npm run db:studio`: Opens Prisma Studio for easy database management in the browser.

---

## Development Standards

- EditorConfig: see `.editorconfig` (LF, UTF-8, 2 spaces, trim EOL).
- Prettier: see root `.prettierrc.json` and `.prettierignore`.
- ESLint v9: see `backend/eslint.config.mjs` (TypeScript rules, strict parser options).
- TypeScript: strict config in `backend/tsconfig.json`.

## Scripts (Backend)

From within `backend/`:

- `dev`: Runs the server with `ts-node` via `src/server.ts` and watches `src/**`.
- `build`: Compiles TypeScript into `dist/`.
- `start`: Launches compiled app `dist/server.js`.
- `test`: Runs Jest tests (unit + smoke).
- `test:watch`: Runs tests once (no watch-mode).
- `typecheck`: Type-only compilation (`--noEmit`).
- `lint` / `lint:fix`: ESLint check/fix.
- `format` / `format:write`: Prettier check/write.
- `db:*`: Prisma helpers (generate, migrate, seed, studio, reset).

## Testing

- Tests are written with Jest and avoid port-binding. Controller and middleware smoke tests simulate Express `req/res/next`.
- Health and stats controllers handle lack of DB (503), tests pass in both cases (connected/disconnected).

## Docker Compose

- See `docker-compose.yml` for Postgres (`db`) and pgAdmin (`pgadmin`) with healthchecks.
- Customize env vars with `.env` or environment overrides (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.).
- If you want an API service in Compose, add a `Dockerfile` for `backend` and a service `api` depending on `db: service_healthy`.

## Server Bootstrap

- `src/app.ts` exports the Express app with routes and middleware.
- `src/server.ts` is the runtime entry (listens on `PORT`, handles graceful shutdown with Prisma).

## Compose Quickstart

Local dev with containers (database + API):

1. Create env file for backend

```bash
cp backend/.env.example backend/.env
# In backend/.env, set at least:
# DATABASE_URL="postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public"
# JWT_SECRET="change-me"
```

2. Start database first, wait for healthy

```bash
docker compose up -d db
```

3. Run migrations against the containerized DB

```bash
docker compose run --rm -e DATABASE_URL="postgresql://admin:admin123@db:5432/sicherheitsdienst_db?schema=public" api npx prisma migrate deploy
```

4. Start API and pgAdmin

```bash
docker compose up -d api pgadmin
# API health: http://localhost:3001/api/health
# pgAdmin: http://localhost:8080 (default creds from compose env)
```

Tip: For pure host development (no API container), run `npm run dev` in `backend/` and point `DATABASE_URL` to `localhost` instead of `db`.

## Beispiel: Site API (curl)

Voraussetzung: Auth-Header `Authorization: Bearer <TOKEN>`

Create:
curl -X POST http://localhost:3001/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"HQ","address":"Main St 1","city":"Berlin","postalCode":"10115"}'

List:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sites

Get by id:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sites/<id>

Update:
curl -X PUT http://localhost:3001/api/sites/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"HQ Süd"}'

Delete:
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sites/<id>

Hinweise:
- POST/PUT erfordern Rollen ADMIN/DISPATCHER; DELETE nur ADMIN.
- 400 bei Validierungsfehlern, 404 bei unbekannter ID, 409 bei Duplikaten.

## Docker Compose: Start/Stop/Logs

- Start (im Projekt-Root):
  docker compose up -d
  - Wartet auf gesunde DB (Healthcheck).
  - API führt beim Start automatisch `prisma migrate deploy` aus.

- Stop:
  docker compose down

- Logs (folgen):
  docker compose logs -f
  docker compose logs -f api
  docker compose logs -f db

- Neuaufsetzen (DB behalten):
  docker compose up -d --build

Migrationshinweis:
- Die API-Container starten mit:
  npx prisma migrate deploy && node dist/server.js
- Dadurch laufen Datenbankmigrationen reproduzierbar beim Containerstart.
- Sicherstellen, dass `DATABASE_URL`, `JWT_SECRET` (und optional SMTP_*) in `backend/.env` bzw. Umgebung gesetzt sind.

## Branch Protection

- Empfohlene Einstellungen sind in `docs/BRANCH_PROTECTION.md` beschrieben.
- Aktiviere in GitHub → Settings → Branches → Branch protection rules für `main`:
  - Require a pull request before merging (Review)
  - Require status checks to pass before merging → `lint-test-build`
  - Optional: Require branches to be up to date before merging

## Further Development Plan (Roadmap)

Based on the original plan, here are the next recommended steps to advance the project.

### Phase 1: Finalize Core API and Security

- [x] **Secure `shiftRoutes.ts`**: Add the `authenticate` middleware to all routes in `src/routes/shiftRoutes.ts` to ensure only authenticated users can access shift data.
- [x] **Implement Role-Based Permissions (`authorize`)**: Utilize the existing `authorize` middleware from `src/middleware/auth.ts` to secure API endpoints with granular control.
  - **Examples**: Only `ADMIN` and `DISPATCHER` can create new shifts. Only `ADMIN` can delete users.
- [x] **Implement Input Validation (Zod)**: Create validation schemas in the `src/validations/` folder for all `POST` and `PUT` requests. Integrate the `validate` middleware into the corresponding routes to ensure data integrity.

### Phase 2: Stability & Quality Assurance

- [x] **Structured Logging (Winston)**: Create a `src/utils/logger.ts` to set up a central logging system. Integrate the logger into the global error handler and key controllers to log requests, errors, and system events.
- [ ] **Write Tests (Jest)**: Set up Jest and Supertest (already in `devDependencies`) to write unit and integration tests for controllers and business logic in the `src/__tests__` directory.

### Phase 3: New Features & Documentation

- [ ] **API Documentation (Swagger)**: Implement `swagger-jsdoc` and `swagger-ui-express` to generate interactive API documentation at an `/api-docs` endpoint. Annotate routes with JSDoc comments for Swagger to recognize them.
- [ ] **Expand Core Features**:
  - **Time Tracking**: Create models, controllers, and routes for employee clock-in/out (`TimeEntry`).
  - **Incident Reporting**: Implement an API for reporting and managing incidents.
