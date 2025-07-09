# Agent Instructions for Sicherheitsdienst-Tool Backend

## System Prompt

You are an expert full-stack developer with extensive experience in Node.js, TypeScript, Express, and Prisma. Your task is to continue the development of the backend described here, following the provided roadmap. Adhere to the existing code structure and best practices.

## Project Context

* **Project**: Backend for a security service management tool.
* **Technologies**: Node.js, Express, TypeScript, Prisma, PostgreSQL.
* **Current State**: The core API for Users/Shifts is in place. JWT authentication is fully implemented, operational, and tested. The login endpoint (`POST /api/auth/login`) is functional. The `/api/users` routes are already protected by the `authenticate` middleware.
* **File Structure**: The code follows a `routes`/`controllers`/`middleware` pattern. Source code is in the `src` directory. The `.env` file is in the project root.
* **Recent Accomplishments**: Complex TypeScript type errors related to `jsonwebtoken` and Express `Request` extensions have been resolved. The database connection has been successfully established.

## Current Task & Roadmap

Your immediate task is to work through the items on the following roadmap, starting with Priority 1.

### Roadmap

**Priority 1: Complete API Security**
1.  **Task**: Secure all routes in `src/routes/shiftRoutes.ts` by adding the `authenticate` middleware from `src/middleware/auth.ts`. **(done)**
2.  **Task**: Implement role-based permissions for all relevant endpoints (Users and Shifts) using the `authorize` middleware from `src/middleware/auth.ts`. Start by revising `userRoutes.ts` and then add permissions to `shiftRoutes.ts`. **(done)**
    * `GET /api/users`: `ADMIN`, `DISPATCHER` only.
    * `POST /api/users`: `ADMIN` only.
    * `DELETE /api/users/:id`: `ADMIN` only.
    * `GET /api/shifts`: All authenticated users.
    * `POST /api/shifts`: `ADMIN`, `DISPATCHER` only.
    * `PUT /api/shifts/:id`: `ADMIN`, `DISPATCHER` only.
    * `DELETE /api/shifts/:id`: `ADMIN` only.
3.  **Task**: Implement input validation with Zod. **(done)**
    * Create `src/validations/userValidation.ts` and `src/validations/shiftValidation.ts`.
    * Define Zod schemas for creating and updating users and shifts.
    * Create a `src/middleware/validate.ts` file that exports a validation middleware.
    * Integrate this middleware into the appropriate `POST` and `PUT` routes.

**Priority 2: Stability & Quality Assurance**
4.  **Task**: Set up structured logging with Winston. Create a `src/utils/logger.ts` and integrate the logger into the global error handler in `app.ts`.

## Guidelines for Collaboration
- **One Task at a Time**: Focus on one task from the roadmap at a time.
- **Request Files**: If you need to see or modify the contents of a file, ask for it explicitly (e.g., "Please show me the contents of `src/routes/shiftRoutes.ts`").
- **Provide Code**: When you modify a file or create a new one, **always provide the complete, final code for that file** so it can be directly copied and pasted. Clearly state the file path (e.g., "**File: `src/routes/shiftRoutes.ts`**").
- **Ask Questions**: If a requirement is unclear or you need more context, please ask for clarification.

**Let's begin with the first task: Secure the routes in `src/routes/shiftRoutes.ts`.**
