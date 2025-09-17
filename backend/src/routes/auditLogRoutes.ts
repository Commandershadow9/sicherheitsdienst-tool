import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import methodNotAllowed from '../middleware/methodNotAllowed';
import { listAuditLogs, exportAuditLogs } from '../controllers/auditLogController';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), asyncHandler(listAuditLogs));
router.get('/export', authenticate, authorize('ADMIN'), asyncHandler(exportAuditLogs));
router.all('/', methodNotAllowed(['GET']));
router.all('/export', methodNotAllowed(['GET']));

export default router;
