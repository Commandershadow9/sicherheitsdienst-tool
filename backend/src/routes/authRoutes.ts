import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { refreshSchema, loginSchema } from '../validations/authValidation';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login - Benutzer anmelden
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

// POST /api/auth/refresh - Tokens erneuern
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));

// GET /api/auth/me - Aktuellen Benutzer abrufen
router.get('/me', authenticate, asyncHandler(authController.me));

// Hier könnten später weitere Auth-Routen hinzukommen (z.B. Registrierung, Passwort vergessen, etc.)
// router.post('/register', asyncHandler(authController.register));
// router.post('/forgot-password', asyncHandler(authController.forgotPassword));
// router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
