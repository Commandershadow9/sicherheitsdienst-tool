# Authentication Hardening Report (Issue #28)

**Date:** 2025-12-17
**Status:** Completed

## Changes Implemented

### 1. Token Storage Migration
- **Previous State:** Tokens (Access & Refresh) were sent in the JSON response body and stored in `localStorage` by the frontend.
- **New State:** Tokens are strictly sent as `HttpOnly`, `Secure` (in prod), `SameSite=Lax` cookies.
- **Action:** Removed `token` and `refreshToken` fields from the JSON response body of `/auth/login` and `/auth/refresh` endpoints in `backend/src/controllers/authController.ts`.

### 2. Frontend Updates
- Verified that `frontend` code does not read/write tokens to `localStorage`.
- Fixed `frontend/src/features/auth/AuthProvider.tsx` to correctly handle the nested response structure from the backend.
- Updated `frontend/src/features/auth/AuthProvider.test.tsx` and `interceptors.test.ts` to reflect the cookie-based architecture and remove outdated `localStorage` tests.

### 3. CSRF Strategy
- **Protection:** Reliance on `SameSite=Lax` cookie attribute.
- **Reasoning:** `SameSite=Lax` prevents the browser from sending cookies on cross-site POST requests (standard CSRF attack vector), while allowing them on top-level navigations (safe for user experience).
- **HttpOnly:** Prevents XSS attacks from reading the tokens.
- **Path Restriction:** The `refreshToken` cookie is scoped to `/api/auth/refresh`, limiting its exposure.

## Verification
- **Login:** Returns 200 OK with `Set-Cookie` headers for `accessToken` and `refreshToken`. Body contains only user data.
- **Refresh:** Returns 200 OK with new `Set-Cookie` headers. Body contains status message only.
- **Logout:** Clears cookies.
- **Reload:** `/auth/me` endpoint successfully authenticates using the `accessToken` cookie.
- **Tests:** All frontend auth tests passed.

### 4. Runtime Verification (2025-12-17)
- **Login:** Verified `Set-Cookie` headers for `accessToken` and `refreshToken` (HttpOnly, Secure, SameSite=Lax). Body does NOT contain tokens.
- **Refresh:** Verified `Set-Cookie` headers. Confirmed endpoint accepts empty body when cookie is present (validation schema updated).
- **Logout:** Verified `Set-Cookie` headers with `Expires` in the past. Updated `logout` logic to explicitly include `secure`, `sameSite`, and `httpOnly` options to ensure reliable clearing in all browsers.
- **Access Control:** Confirmed `401 Unauthorized` when accessing protected endpoints without cookies.

