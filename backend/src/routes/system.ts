import { Router } from 'express';
import { healthz, readyz } from '../controllers/systemController';

const router = Router();

// Root-level health endpoints
router.get('/healthz', healthz);
router.get('/readyz', readyz);

export default router;

