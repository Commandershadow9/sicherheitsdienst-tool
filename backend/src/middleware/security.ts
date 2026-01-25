import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { extractClientIp } from '../utils/audit';
import {
  incrAuthIp429,
  incrAuthUser429,
  incrLoginLimiterAttempt,
  incrLoginLimiterBlocked,
  resetAuthLimitCounters,
} from '../utils/rateLimitStats';

// --- Security: Helmet + CORS (ENV allowlist) ---
export function applySecurity(app: Express): void {
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'deny' },
    }),
  );

  const corsAllowlist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Optional: einzelner Origin (Vite/Local Dev)
  if (process.env.CORS_ORIGIN) {
    const parts = process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
    for (const one of parts) {
      if (one && !corsAllowlist.includes(one)) corsAllowlist.push(one);
    }
  }
  if (!corsAllowlist.length) {
    if (process.env.FRONTEND_URL) corsAllowlist.push(process.env.FRONTEND_URL);
    if (process.env.MOBILE_APP_URL) corsAllowlist.push(process.env.MOBILE_APP_URL);
    if (!corsAllowlist.length) {
      corsAllowlist.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:19000');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ];
    for (const origin of devOrigins) {
      if (!corsAllowlist.includes(origin)) corsAllowlist.push(origin);
    }
  }

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // healthchecks/curl
      const ok = corsAllowlist.includes(origin);
      // Bei nicht erlaubtem Origin kein Fehler werfen → keine CORS-Header setzen
      return ok ? callback(null, true) : callback(null, false);
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
}

function extractIp(req: Request): string {
  return extractClientIp(req) || 'anon';
}

// Redis Store (minimal) für express-rate-limit
class RedisRateLimitStore {
  client: Redis;
  windowMs: number;
  prefix: string;

  constructor(client: Redis, windowMs: number, prefix = 'rate-limit:') {
    this.client = client;
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  async increment(key: string) {
    const redisKey = this.prefix + key;
    const ttlMs = this.windowMs;
    const multi = this.client.multi();
    multi.incr(redisKey);
    multi.pexpire(redisKey, ttlMs);
    multi.pttl(redisKey);
    const results = await multi.exec();
    const [countRes, _expireRes, pttlRes] = results ?? [];
    const totalHits = Number(Array.isArray(countRes) ? countRes[1] : countRes);
    let pttl = Number(Array.isArray(pttlRes) ? pttlRes[1] : pttlRes);
    if (!Number.isFinite(pttl) || pttl <= 0) {
      pttl = ttlMs;
    }
    const resetTime = new Date(Date.now() + pttl);
    return { totalHits, resetTime };
  }

  async decrement(key: string) {
    const redisKey = this.prefix + key;
    await this.client.decr(redisKey);
  }

  async resetKey(key: string) {
    await this.client.del(this.prefix + key);
  }

  async resetAll() {
    const keys = await this.client.keys(this.prefix + '*');
    if (keys.length) await this.client.del(keys);
  }
}

const redisStores = new Set<RedisRateLimitStore>();

function createExpressLimiter(opts: {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string;
  onAttempt?: (req: Request) => void;
  onBlocked?: (req: Request) => void;
}): RequestHandler {
  const useRedis = Boolean(process.env.REDIS_URL);
  let store: RedisRateLimitStore | undefined;
  if (useRedis) {
    const client = new Redis(process.env.REDIS_URL as string);
    store = new RedisRateLimitStore(client, opts.windowMs);
    redisStores.add(store);
  }

  const handler = (req: Request, res: Response) => {
    // express-rate-limit default handler: send 429 JSON
    res.status(429).json({ success: false, code: 'TOO_MANY_REQUESTS', message: 'Rate-Limit erreicht.' });
  };

  const limiter = rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: opts.keyGenerator,
    store: store as any,
    handler: (req, res) => {
      const key = opts.keyGenerator(req);
      if (key.startsWith('ip:')) incrAuthIp429();
      else if (key.startsWith('user:')) {
        incrAuthUser429();
        opts.onBlocked?.(req);
      } else {
        opts.onBlocked?.(req);
      }
      return handler(req, res);
    },
  }) as unknown as RequestHandler;

  return ((req: Request, res: Response, next: NextFunction) => {
    opts.onAttempt?.(req);
    return (limiter as unknown as RequestHandler)(req, res, next);
  }) as unknown as RequestHandler;
}

// IP-basiertes Limit für /auth/*: 10 req/Minute per IP, ENV konfigurierbar
export function authIpRateLimit(): RequestHandler {
  const windowMsRaw = Number(process.env.RATE_LIMIT_WINDOW_MS || '60000');
  const max = Number(process.env.RATE_LIMIT_MAX || '10');
  const windowMs = Number.isFinite(windowMsRaw) && windowMsRaw > 0 ? windowMsRaw : 60_000;
  return createExpressLimiter({
    windowMs,
    max,
    keyGenerator: (req) => `ip:${extractIp(req)}`,
  });
}

// Login-Bruteforce-Limiter pro Email (5/15min), unabhängig von IP
export function loginUserRateLimit(): RequestHandler {
  const windowMsRaw = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? Number.NaN);
  const maxRaw = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? Number.NaN);

  const defaultWindowMs = 15 * 60_000;
  const defaultMax = 5;

  const windowMs = Number.isFinite(windowMsRaw) && windowMsRaw > 0 ? windowMsRaw : defaultWindowMs;
  if (Number.isFinite(maxRaw) && maxRaw <= 0) {
    return ((_: Request, __: Response, next: NextFunction) => next()) as unknown as RequestHandler;
  }

  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.max(1, Math.floor(maxRaw)) : defaultMax;
  return createExpressLimiter({
    windowMs,
    max,
    keyGenerator: (req) => {
      const emailRaw = (req.body?.email || '').toString();
      const emailKey = emailRaw.trim().toLowerCase() || 'unknown';
      return `user:${emailKey}`;
    },
    onAttempt: () => {
      incrLoginLimiterAttempt();
    },
    onBlocked: () => {
      incrLoginLimiterBlocked();
    },
  });
}

// Test-Helfer (keine Wirkung mit express-rate-limit + Redis; hier nur Stub)
export async function __resetSecurityRateLimitStores() {
  resetAuthLimitCounters();
  if (!redisStores.size) return;
  await Promise.all(
    Array.from(redisStores, async (store) => {
      try {
        await store.resetAll();
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
           
          console.warn('Failed to reset rate-limit store keyspace', err);
        }
      }
    }),
  );
}
