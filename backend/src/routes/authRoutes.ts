import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { refreshSchema, loginSchema } from '../validations/authValidation';
import { authenticate } from '../middleware/auth';
import { authIpRateLimit, loginUserRateLimit } from '../middleware/security';
import methodNotAllowed from '../middleware/methodNotAllowed';

// Rate limiters for auth endpoints
const ipLimiter = authIpRateLimit();
const userLoginLimiter = loginUserRateLimit();

const router = Router();

// POST /api/auth/login - Benutzer anmelden
router.post('/login', ipLimiter, userLoginLimiter, validate(loginSchema), asyncHandler(authController.login));

// POST /api/auth/refresh - Tokens erneuern
router.post('/refresh', ipLimiter, validate(refreshSchema), asyncHandler(authController.refresh));

// GET /api/auth/me - Aktuellen Benutzer abrufen
router.get('/me', authenticate, asyncHandler(authController.me));

// POST /api/auth/logout - Benutzer abmelden (Cookies löschen)
router.post('/logout', asyncHandler(authController.logout));

// Hier könnten später weitere Auth-Routen hinzukommen (z.B. Registrierung, Passwort vergessen, etc.)
// router.post('/register', asyncHandler(authController.register));
// router.post('/forgot-password', asyncHandler(authController.forgotPassword));
// router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
// 405
router.all('/login', methodNotAllowed(['POST']));
router.all('/refresh', methodNotAllowed(['POST']));
router.all('/me', authenticate, methodNotAllowed(['GET']));
