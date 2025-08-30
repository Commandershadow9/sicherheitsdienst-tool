import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/authController';
// Ggf. Validierungs-Middleware importieren, wenn du Login-Validierung hinzufügst
// import { validate } from '../middleware/validate';
// import { loginSchema } from '../validations/authValidation'; // Müsste noch erstellt werden

const router = Router();

// POST /api/auth/login - Benutzer anmelden
// Hier könntest du eine Validierungs-Middleware einfügen, z.B. validate(loginSchema)
router.post('/login', asyncHandler(authController.login));

// Hier könnten später weitere Auth-Routen hinzukommen (z.B. Registrierung, Passwort vergessen, etc.)
// router.post('/register', asyncHandler(authController.register));
// router.post('/forgot-password', asyncHandler(authController.forgotPassword));
// router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
