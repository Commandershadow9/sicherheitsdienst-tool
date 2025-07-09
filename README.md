# Sicherheitsdienst-Tool Backend

This is the backend for a comprehensive management tool for security services. It provides a REST API to manage employees, shifts, time tracking, and other operational data. The project is built with Node.js, Express, TypeScript, and Prisma, using a PostgreSQL database.

## Current Project Status

The project is in a stable development stage. The basic API structure is established, and a **complete authentication system based on JSON Web Tokens (JWT) has been successfully implemented and tested.**

* **Core Functions**: CRUD operations for `Users` and `Shifts` are in place.
* **Authentication**: Users can log in via `POST /api/auth/login` to receive a valid JWT.
* **Security**: User routes (`/api/users`) are protected by middleware and require authentication.

## Technology Stack

* **Runtime Environment**: Node.js
* **Framework**: Express.js
* **Language**: TypeScript
* **Database ORM**: Prisma
* **Database**: PostgreSQL (can be run via Docker)
* **Authentication**: JSON Web Tokens (JWT) with `bcryptjs` for password hashing.
* **Development Environment**: `ts-node` and `nodemon` for live-reloading.

---

## Setup & Installation (For Developers)

Follow these steps to set up and run the project locally:

1.  **Prerequisites**:
    * Node.js (v18 or higher)
    * Docker and Docker Compose (for the PostgreSQL database)

2.  **Clone & Install Repository**:
    ```bash
    git clone <your-repository-url>
    cd backend
    npm install
    ```

3.  **Start Database**:
    * Start the PostgreSQL container using Docker Compose. The Docker setup is pre-configured in your `package.json`.
        ```bash
        npm run docker:up
        ```

4.  **Configure Environment Variables**:
    * Copy the template file `.env.example` to create a `.env` file in the `backend` main directory.
    * Adjust the `DATABASE_URL` in the `.env` file to match your local PostgreSQL settings. Replace `your_password` with the correct password:
        ```env
        DATABASE_URL="postgresql://your_postgres_user:your_password@localhost:5432/sicherheitsdienst_db?schema=public"
        ```
    * Generate a secure `JWT_SECRET` (at least 32 random characters).

5.  **Migrate and Seed Database**:
    * Apply all Prisma migrations to create the database tables and populate the database with initial test data:
        ```bash
        npx prisma migrate dev
        npm run db:seed
        ```
    * To reset the database, you can use `npm run db:reset`.

6.  **Start Server**:
    * Start the development server:
        ```bash
        npm run dev
        ```
    * The server should now be running at `http://localhost:3001`.

### Available NPM Scripts

* `npm run dev`: Starts the server in development mode with live-reloading.
* `npm run build`: Compiles the TypeScript code to the `./dist` folder.
* `npm run start`: Starts the compiled application from the `./dist` folder.
* `npm run db:migrate`: Applies database migrations.
* `npm run db:seed`: Populates the database with test data from `src/utils/seedData.ts`.
* `npm run db:studio`: Opens Prisma Studio for easy database management in the browser.

---

## Further Development Plan (Roadmap)

Based on the original plan, here are the next recommended steps to advance the project.

### Phase 1: Finalize Core API and Security

* [ ] **Secure `shiftRoutes.ts`**: Add the `authenticate` middleware to all routes in `src/routes/shiftRoutes.ts` to ensure only authenticated users can access shift data.
* [ ] **Implement Role-Based Permissions (`authorize`)**: Utilize the existing `authorize` middleware from `src/middleware/auth.ts` to secure API endpoints with granular control.
    * **Examples**: Only `ADMIN` and `DISPATCHER` can create new shifts. Only `ADMIN` can delete users.
* [ ] **Implement Input Validation (Zod)**: Create validation schemas in the `src/validations/` folder for all `POST` and `PUT` requests. Integrate the `validate` middleware into the corresponding routes to ensure data integrity.

### Phase 2: Stability & Quality Assurance

* [ ] **Structured Logging (Winston)**: Create a `src/utils/logger.ts` to set up a central logging system. Integrate the logger into the global error handler and key controllers to log requests, errors, and system events.
* [ ] **Write Tests (Jest)**: Set up Jest and Supertest (already in `devDependencies`) to write unit and integration tests for controllers and business logic in the `src/__tests__` directory.

### Phase 3: New Features & Documentation

* [ ] **API Documentation (Swagger)**: Implement `swagger-jsdoc` and `swagger-ui-express` to generate interactive API documentation at an `/api-docs` endpoint. Annotate routes with JSDoc comments for Swagger to recognize them.
* [ ] **Expand Core Features**:
    * **Time Tracking**: Create models, controllers, and routes for employee clock-in/out (`TimeEntry`).
    * **Incident Reporting**: Implement an API for reporting and managing incidents.
