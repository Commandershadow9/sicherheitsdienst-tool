import type { Request, Response, NextFunction } from 'express';
import { extractClientIp } from '../utils/audit';

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

function getClientKey(req: Request): string {
  const userId = req.user?.id;
  const ip = extractClientIp(req) || 'anon';
  return `${userId || ip}:notifications:test`;
}

export const notificationsTestRateLimit = (req: Request, res: Response, next: NextFunction) => {
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
  defaultWindowMs?: number;
  defaultPerMin?: number;
}) {
  const cfg = {
    windowMsEnv: options?.windowMsEnv || 'AUTH_RATE_LIMIT_WINDOW_MS',
    perMinEnv: options?.perMinEnv || 'AUTH_RATE_LIMIT_PER_MIN',
    enabledEnv: options?.enabledEnv || 'AUTH_RATE_LIMIT_ENABLED',
    keyName: options?.keyName || 'auth',
  };
  const store = new Map<Key, Bucket>();
  const defaults = {
    windowMs: options?.defaultWindowMs && options.defaultWindowMs > 0 ? options.defaultWindowMs : 60000,
    perMin: options?.defaultPerMin && options.defaultPerMin > 0 ? options.defaultPerMin : 10,
  };

  const getWindowMs = () => {
    const raw = process.env[cfg.windowMsEnv as keyof NodeJS.ProcessEnv] as string | undefined;
    const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : defaults.windowMs;
    return n > 0 ? n : defaults.windowMs;
  };
  const getPerMin = () => {
    const raw = process.env[cfg.perMinEnv as keyof NodeJS.ProcessEnv] as string | undefined;
    const n = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : defaults.perMin;
    return n > 0 ? n : defaults.perMin;
  };
  const getEnabled = () => {
    const raw = String(process.env[cfg.enabledEnv as keyof NodeJS.ProcessEnv] || 'true').toLowerCase();
    return raw !== 'false' && raw !== '0' && raw !== 'off';
  };
  const keyFor = (req: any): string => {
    const userId = req.user?.id;
    const ip = extractClientIp(req) || 'anon';
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
    defaultPerMin: 10,
    defaultWindowMs: 60000,
  });

export const createShiftAssignRateLimit = () =>
  createRateLimit({
    windowMsEnv: 'SHIFT_ASSIGN_RATE_LIMIT_WINDOW_MS',
    perMinEnv: 'SHIFT_ASSIGN_RATE_LIMIT_PER_MIN',
    enabledEnv: 'SHIFT_ASSIGN_RATE_LIMIT_ENABLED',
    keyName: 'shift-assign',
    defaultPerMin: 12,
    defaultWindowMs: 60000,
  });

export const createShiftClockRateLimit = () =>
  createRateLimit({
    windowMsEnv: 'SHIFT_CLOCK_RATE_LIMIT_WINDOW_MS',
    perMinEnv: 'SHIFT_CLOCK_RATE_LIMIT_PER_MIN',
    enabledEnv: 'SHIFT_CLOCK_RATE_LIMIT_ENABLED',
    keyName: 'shift-clock',
    defaultPerMin: 20,
    defaultWindowMs: 60000,
  });
