type Key = string;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<Key, Bucket>();

function getWindow(): number {
  const raw = process.env.NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS;
  const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : 60000;
  return n > 0 ? n : 60000;
}

function getLimit(): number {
  const raw = process.env.NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN;
  const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : 10;
  return n > 0 ? n : 10;
}

function isEnabled(): boolean {
  const raw = (process.env.NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED || 'true').toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

function getClientKey(req: any): string {
  const userId = req.user?.id;
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const firstForwarded = xff.split(',')[0]?.trim();
  const ip = firstForwarded || req.ip || 'anon';
  return `${userId || ip}:notifications:test`;
}

export const notificationsTestRateLimit = (req: any, res: any, next: any) => {
  if (!isEnabled()) return next();

  const key = getClientKey(req);
  const now = Date.now();
  const windowMs = getWindow();
  const limit = getLimit();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 1, resetAt: now + windowMs };
    buckets.set(key, b);
  } else if (b.count < limit) {
    b.count++;
  } else {
    const retryAfter = Math.max(0, Math.ceil((b.resetAt - now) / 1000));
    res.set('Retry-After', String(retryAfter));
    res.set('RateLimit-Limit', String(limit));
    res.set('RateLimit-Remaining', '0');
    res.set('RateLimit-Reset', String(Math.max(0, Math.ceil((b.resetAt - now) / 1000))));
    return res.status(429).json({
      success: false,
      message: 'Rate-Limit erreicht.',
      code: 'TOO_MANY_REQUESTS',
    });
  }

  // Erfolgsfall → Header setzen
  const remaining = Math.max(0, limit - b.count);
  res.set('RateLimit-Limit', String(limit));
  res.set('RateLimit-Remaining', String(remaining));
  res.set('RateLimit-Reset', String(Math.max(0, Math.ceil((b.resetAt - now) / 1000))));
  return next();
};

// Generic, in-memory sliding window-ish limiter (fixed window)
export function createRateLimit(options?: {
  windowMsEnv?: string;
  perMinEnv?: string;
  enabledEnv?: string;
  keyName?: string; // used in the bucket key suffix for separation
}) {
  const cfg = {
    windowMsEnv: options?.windowMsEnv || 'AUTH_RATE_LIMIT_WINDOW_MS',
    perMinEnv: options?.perMinEnv || 'AUTH_RATE_LIMIT_PER_MIN',
    enabledEnv: options?.enabledEnv || 'AUTH_RATE_LIMIT_ENABLED',
    keyName: options?.keyName || 'auth',
  };
  const store = new Map<Key, Bucket>();

  const getWindowMs = () => {
    const raw = process.env[cfg.windowMsEnv as keyof NodeJS.ProcessEnv] as string | undefined;
    const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : 60000;
    return n > 0 ? n : 60000;
  };
  const getPerMin = () => {
    const raw = process.env[cfg.perMinEnv as keyof NodeJS.ProcessEnv] as string | undefined;
    const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : 10;
    return n > 0 ? n : 10;
  };
  const getEnabled = () => {
    const raw = String(process.env[cfg.enabledEnv as keyof NodeJS.ProcessEnv] || 'true').toLowerCase();
    return raw !== 'false' && raw !== '0' && raw !== 'off';
  };
  const keyFor = (req: any): string => {
    const userId = req.user?.id;
    const xff = (req.headers['x-forwarded-for'] as string) || '';
    const firstForwarded = xff.split(',')[0]?.trim();
    const ip = firstForwarded || req.ip || 'anon';
    return `${userId || ip}:${cfg.keyName}`;
  };

  return (req: any, res: any, next: any) => {
    if (!getEnabled()) return next();
    const key = keyFor(req);
    const now = Date.now();
    const windowMs = getWindowMs();
    const limit = getPerMin();
    let b = store.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 1, resetAt: now + windowMs };
      store.set(key, b);
    } else if (b.count < limit) {
      b.count++;
    } else {
      const retryAfter = Math.max(0, Math.ceil((b.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      res.set('RateLimit-Limit', String(limit));
      res.set('RateLimit-Remaining', '0');
      res.set('RateLimit-Reset', String(Math.max(0, Math.ceil((b.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, message: 'Rate-Limit erreicht.', code: 'TOO_MANY_REQUESTS' });
    }
    const remaining = Math.max(0, limit - b.count);
    res.set('RateLimit-Limit', String(limit));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(Math.max(0, Math.ceil((b.resetAt - now) / 1000))));
    return next();
  };
}

// Convenience factory for write-heavy endpoints (POST/PUT/DELETE)
export const createWriteRateLimit = () =>
  createRateLimit({
    windowMsEnv: 'WRITE_RATE_LIMIT_WINDOW_MS',
    perMinEnv: 'WRITE_RATE_LIMIT_PER_MIN',
    enabledEnv: 'WRITE_RATE_LIMIT_ENABLED',
    keyName: 'write',
  });
