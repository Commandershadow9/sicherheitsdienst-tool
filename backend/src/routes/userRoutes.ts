import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';
import * as employeeProfileController from '../controllers/employeeProfileController';
import { authenticate, authorize, authorizeSelfOr } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validations/userValidation';
import {
  updateEmployeeProfileSchema,
  createQualificationSchema,
  createDocumentSchema,
} from '../validations/employeeProfileValidation';
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
router.get(
  '/:id/profile',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(employeeProfileController.getProfile),
);
router.put(
  '/:id/profile',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER', 'DISPATCHER'),
  validate(updateEmployeeProfileSchema),
  asyncHandler(employeeProfileController.upsertProfile),
);
router.post(
  '/:id/profile/qualifications',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER'),
  validate(createQualificationSchema),
  asyncHandler(employeeProfileController.addQualification),
);
router.delete(
  '/:id/profile/qualifications/:qualificationId',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER'),
  asyncHandler(employeeProfileController.deleteQualification),
);
router.post(
  '/:id/profile/documents',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER'),
  validate(createDocumentSchema),
  asyncHandler(employeeProfileController.addDocument),
);
router.get(
  '/:id/profile/documents/:documentId/download',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(employeeProfileController.downloadDocument),
);
router.delete(
  '/:id/profile/documents/:documentId',
  authenticate,
  authorizeSelfOr('ADMIN', 'MANAGER'),
  asyncHandler(employeeProfileController.deleteDocument),
);
router.all('/:id/profile', authenticate, methodNotAllowed(['GET', 'PUT']));
router.all('/:id/profile/qualifications', authenticate, methodNotAllowed(['POST']));
router.all('/:id/profile/qualifications/:qualificationId', authenticate, methodNotAllowed(['DELETE']));
router.all('/:id/profile/documents', authenticate, methodNotAllowed(['POST']));
router.all('/:id/profile/documents/:documentId', authenticate, methodNotAllowed(['DELETE']));
export default router;
