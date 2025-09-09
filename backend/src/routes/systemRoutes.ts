import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler'; // Importiere den asyncHandler
import * as systemController from '../controllers/systemController'; // Geänderter Import-Stil
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

// GET /api/health - System Health Check
router.get('/health', asyncHandler(systemController.healthCheck));

// GET /api/stats - System Statistics
router.get('/stats', asyncHandler(systemController.getSystemStats));

// 405
router.all('/health', methodNotAllowed(['GET']));
router.all('/stats', methodNotAllowed(['GET']));

export default router;
