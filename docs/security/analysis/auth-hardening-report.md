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

## Tenant-Binding Security (Issue #29)

**Date:** 2025-12-17
**Status:** Completed

### 1. Token Payload Enrichment
- **Action:** Added `customerId` to the payload of both Access Token and Refresh Token during `login` and `refresh`.
- **Reasoning:** Ensures the token itself carries the authoritative tenant context, preventing reliance on potentially spoofable headers or request context during the critical refresh flow.

### 2. Strict Tenant Verification
- **Mechanism:** In `POST /api/auth/refresh`:
    1.  Verify Refresh Token signature.
    2.  Extract `customerId` from token payload.
    3.  Load User from DB.
    4.  **Enforce:** `user.customerId === token.customerId`.
- **Outcome:** If a user is moved to another tenant or if a token is manipulated/stolen from another context, the refresh fails with `401 Unauthorized`.
- **Prevention:** Mitigates Cross-Tenant Access attacks where a valid token from Tenant A might be used to gain access or refresh tokens for Tenant B (if the system only checked `userId`).

### 3. Verification
- **Unit Tests:** Added tests in `backend/src/__tests__/auth.refresh.test.ts`.
    - `POST /api/auth/refresh → 200 (ok with customerId)`: Verifies new tokens contain `customerId`.
    - `POST /api/auth/refresh → 401 (Tenant Mismatch)`: Verifies that a valid signed token with a mismatched `customerId` is rejected.

