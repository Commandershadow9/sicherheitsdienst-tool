import { Router, Request, Response } from 'express';
import { healthz, readyz } from '../controllers/systemController';
import client from 'prom-client';
import { getCounters } from '../utils/stats';
import { getAuthLimitCounters } from '../utils/rateLimitStats';
import { register } from '../utils/metrics';

const router = Router();

// Root-level health endpoints
router.get('/healthz', healthz);
router.get('/readyz', readyz);

// Prometheus metrics
const reqTotal = new client.Gauge({ name: 'app_requests_total', help: 'Total requests' });
const resp4xx = new client.Gauge({ name: 'app_responses_4xx_total', help: 'Total 4xx responses' });
const resp5xx = new client.Gauge({ name: 'app_responses_5xx_total', help: 'Total 5xx responses' });
const authIp429 = new client.Gauge({ name: 'app_auth_ratelimit_ip_429_total', help: 'Auth IP 429 count' });
const authUser429 = new client.Gauge({ name: 'app_auth_ratelimit_user_429_total', help: 'Auth per-user 429 count' });

router.get('/metrics', async (_req: Request, res: Response) => {
  const c = getCounters();
  const rl = getAuthLimitCounters();
  reqTotal.set(c.requestsTotal);
  resp4xx.set(c.responses4xx);
  resp5xx.set(c.responses5xx);
  authIp429.set(rl.ip429);
  authUser429.set(rl.user429);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
