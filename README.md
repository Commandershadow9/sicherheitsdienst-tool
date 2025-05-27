# Sicherheitsdienst-Tool

Security service management software for German security companies.

## 🚧 Current Status: DEVELOPMENT - TypeScript Issue

### ✅ What's Working:
- PostgreSQL database running in Docker
- Prisma schema defined and migrated  
- Basic Express server structure
- Database connection established
- Health check endpoint working

### ❌ Current Problem: TypeScript Compilation Error

**Error Message:**
```
TSError: ⨯ Unable to compile TypeScript:
src/routes/userRoutes.ts:10:18 - error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type '(req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>' is not assignable to parameter of type 'Application<Record<string, any>>'.
```

**Problem Location:** `backend/src/routes/userRoutes.ts`

**Issue:** TypeScript cannot resolve Express Router types correctly for async controller functions.

### 🔧 Setup Instructions

1. **Clone repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/sicherheitsdienst-tool.git
   cd sicherheitsdienst-tool
   ```

2. **Start Database:**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Try to start server (will fail with TypeScript error):**
   ```bash
   npm run dev
   ```

### 📊 Tech Stack
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Container:** Docker + docker-compose
- **Development:** nodemon + ts-node

### 🐛 Problem Details

**Files involved:**
- `backend/src/routes/userRoutes.ts` - Router definitions
- `backend/src/controllers/userController.ts` - Controller functions
- `backend/src/app.ts` - Main Express app

**Attempts made:**
- Different TypeScript return types (`Promise<void>`, `Promise<Response>`)
- Various Express Router import methods
- Simplified controller functions
- Inline routes in app.ts

**Error persists despite:**
- Correct Express types installed (`@types/express`)
- Proper TypeScript configuration
- Valid Prisma client generation

### 🎯 Expected Behavior

Server should start successfully and provide these API endpoints:
- `GET /api/health` - Health check (✅ working)
- `GET /api/users` - List all users (❌ blocked by TS error)
- `POST /api/users` - Create user (❌ blocked by TS error)
- `GET /api/users/:id` - Get user by ID (❌ blocked by TS error)

### 🆘 Need Help With

1. Resolving TypeScript compilation error
2. Proper Express + TypeScript + Prisma configuration
3. Alternative routing approach that works with current setup

### 📱 Project Vision

Full security service management platform with:
- Employee management & shift planning
- Time tracking & compliance monitoring
- Mobile app for security staff
- Incident reporting & documentation
- German labor law compliance (DSGVO, ArbZG)

---

**Last Updated:** 2025-05-26  
**Status:** Blocked by TypeScript compilation error