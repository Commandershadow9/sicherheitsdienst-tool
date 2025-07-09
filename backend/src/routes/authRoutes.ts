import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as authController from '../controllers/authController';
// Optionally import validation middleware when adding login validation
// import { validate } from '../middleware/validate';
// import { loginSchema } from '../validations/authValidation'; // To be created

const router = Router();

// POST /api/auth/login - Log in a user
// You could add a validation middleware here, e.g. validate(loginSchema)
router.post('/login', asyncHandler(authController.login));

// Additional auth routes may be added later (e.g. registration, forgot password)
// router.post('/register', asyncHandler(authController.register));
// router.post('/forgot-password', asyncHandler(authController.forgotPassword));
// router.post('/reset-password', asyncHandler(authController.resetPassword));
export default router;
