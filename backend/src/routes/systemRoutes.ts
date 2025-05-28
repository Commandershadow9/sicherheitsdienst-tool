import { Router } from 'express';
import { healthCheck, getSystemStats } from '../controllers/systemController';

const router = Router();

// GET /api/health - System Health Check
router.get('/health', healthCheck);

// GET /api/stats - System Statistics
router.get('/stats', getSystemStats);

export default router;