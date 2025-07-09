import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler'; // Import asyncHandler
import * as systemController from '../controllers/systemController'; // Updated import style

const router = Router();

// GET /api/health - System Health Check
router.get('/health', asyncHandler(systemController.healthCheck));

// GET /api/stats - System Statistics
router.get('/stats', asyncHandler(systemController.getSystemStats));
export default router;
