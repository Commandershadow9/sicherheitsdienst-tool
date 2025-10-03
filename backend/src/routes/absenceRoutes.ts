import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import methodNotAllowed from '../middleware/methodNotAllowed';
import { validate } from '../middleware/validate';
import { createAbsenceSchema, absenceDecisionSchema, listAbsenceQuerySchema } from '../validations/absenceValidation';
import {
  listAbsences,
  createAbsence,
  getAbsenceById,
  approveAbsence,
  rejectAbsence,
  cancelAbsence,
  uploadAbsenceDocument,
  downloadAbsenceDocument,
  deleteAbsenceDocument,
} from '../controllers/absenceController';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'), validate(listAbsenceQuerySchema), asyncHandler(listAbsences));
router.post('/', authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'), validate(createAbsenceSchema), asyncHandler(createAbsence));
router.get('/:id', authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'), asyncHandler(getAbsenceById));
router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), validate(absenceDecisionSchema), asyncHandler(approveAbsence));
router.post('/:id/reject', authorize('ADMIN', 'MANAGER'), validate(absenceDecisionSchema), asyncHandler(rejectAbsence));
router.post(
  '/:id/cancel',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'),
  asyncHandler(cancelAbsence),
);

// Document routes
router.post(
  '/:id/documents',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'),
  asyncHandler(uploadAbsenceDocument),
);
router.get(
  '/:id/documents/:documentId/download',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'),
  asyncHandler(downloadAbsenceDocument),
);
router.delete(
  '/:id/documents/:documentId',
  authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'),
  asyncHandler(deleteAbsenceDocument),
);

router.all('/', methodNotAllowed(['GET', 'POST']));
router.all('/:id', methodNotAllowed(['GET', 'POST']));
router.all('/:id/approve', methodNotAllowed(['POST']));
router.all('/:id/reject', methodNotAllowed(['POST']));
router.all('/:id/cancel', methodNotAllowed(['POST']));
router.all('/:id/documents', methodNotAllowed(['POST']));
router.all('/:id/documents/:documentId/download', methodNotAllowed(['GET']));
router.all('/:id/documents/:documentId', methodNotAllowed(['DELETE']));

export default router;
