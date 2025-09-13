import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';
import { authenticate, authorize, authorizeSelfOr } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validations/userValidation';
import { userListQuerySchema } from '../validators/userValidators';
import { createWriteRateLimit } from '../middleware/rateLimit';

const writeLimiter = createWriteRateLimit();
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

// Alle folgenden Routen erfordern Authentifizierung

// GET /api/users - Alle Mitarbeiter abrufen (JSON oder CSV via Accept)
router.get('/', authenticate, authorize('ADMIN', 'DISPATCHER'), validate(userListQuerySchema), asyncHandler(userController.getAllUsers));

// POST /api/users - Neuen Mitarbeiter erstellen
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  writeLimiter,
  validate(createUserSchema),
  asyncHandler(userController.createUser),
);

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
// Erlaubt dem Admin, jeden User abzurufen, oder einem User, sein eigenes Profil abzurufen (komplexere Logik im Controller nötig)
// Detailansicht: ADMIN oder Self-Access
router.get('/:id', authenticate, authorizeSelfOr('ADMIN'), asyncHandler(userController.getUserById));

// PUT /api/users/:id - Mitarbeiter aktualisieren
// Ähnlich wie oben, Admin darf alle, User evtl. nur sich selbst
// Update: ADMIN oder Self-Access (Controller beschränkt veränderbare Felder bei Self)
router.put(
  '/:id',
  authenticate,
  authorizeSelfOr('ADMIN'),
  writeLimiter,
  validate(updateUserSchema),
  asyncHandler(userController.updateUser),
);

// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  writeLimiter,
  asyncHandler(userController.deactivateUser),
);
// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
export default router;
