import { Router, Request, Response } from 'express';
import { healthz, readyz } from '../controllers/systemController';
import client from 'prom-client';
import { getCounters } from '../utils/stats';
import { register } from '../utils/metrics';

const router = Router();

// Root-level health endpoints
router.get('/healthz', healthz);
router.get('/health', healthz);  // Alias für Docker Healthcheck-Kompatibilität
router.get('/readyz', readyz);

// Prometheus metrics
const reqTotal = new client.Gauge({ name: 'app_requests_total', help: 'Total requests' });
const resp4xx = new client.Gauge({ name: 'app_responses_4xx_total', help: 'Total 4xx responses' });
const resp5xx = new client.Gauge({ name: 'app_responses_5xx_total', help: 'Total 5xx responses' });
router.get('/metrics', async (_req: Request, res: Response) => {
  const c = getCounters();
  reqTotal.set(c.requestsTotal);
  resp4xx.set(c.responses4xx);
  resp5xx.set(c.responses5xx);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
