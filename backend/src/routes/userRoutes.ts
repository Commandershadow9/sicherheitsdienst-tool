import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, userListQuerySchema } from '../validations/userValidation';

const router = Router();

// Alle folgenden Routen erfordern Authentifizierung

// GET /api/users - Alle Mitarbeiter abrufen
router.get('/', authenticate, authorize('ADMIN', 'DISPATCHER'), validate(userListQuerySchema), asyncHandler(userController.getAllUsers));

// POST /api/users - Neuen Mitarbeiter erstellen
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createUserSchema),
  asyncHandler(userController.createUser),
);

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
// Erlaubt dem Admin, jeden User abzurufen, oder einem User, sein eigenes Profil abzurufen (komplexere Logik im Controller nötig)
router.get('/:id', authenticate, asyncHandler(userController.getUserById));

// PUT /api/users/:id - Mitarbeiter aktualisieren
// Ähnlich wie oben, Admin darf alle, User evtl. nur sich selbst
router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  asyncHandler(userController.updateUser),
);

// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(userController.deactivateUser),
);
export default router;
