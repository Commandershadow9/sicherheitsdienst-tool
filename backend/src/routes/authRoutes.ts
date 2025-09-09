import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { refreshSchema, loginSchema } from '../validations/authValidation';
import { authenticate } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';

// Rate limiters for auth endpoints (configurable via AUTH_RATE_LIMIT_*)
const authLimiter = createRateLimit({ keyName: 'auth' });

const router = Router();

// POST /api/auth/login - Benutzer anmelden
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));

// POST /api/auth/refresh - Tokens erneuern
router.post('/refresh', authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));

// GET /api/auth/me - Aktuellen Benutzer abrufen
router.get('/me', authenticate, asyncHandler(authController.me));

// Hier könnten später weitere Auth-Routen hinzukommen (z.B. Registrierung, Passwort vergessen, etc.)
// router.post('/register', asyncHandler(authController.register));
// router.post('/forgot-password', asyncHandler(authController.forgotPassword));
// router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
// 405
router.all('/login', methodNotAllowed(['POST']));
router.all('/refresh', methodNotAllowed(['POST']));
router.all('/me', authenticate, methodNotAllowed(['GET']));
