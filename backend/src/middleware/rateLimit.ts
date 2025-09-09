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

export const notificationsTestRateLimit = (req: any, res: any, next: any) => {
  const key = `${req.ip || req.headers['x-forwarded-for'] || 'anon'}:notifications:test`;
  const now = Date.now();
  const windowMs = getWindow();
  const limit = getLimit();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (b.count < limit) {
    b.count++;
    return next();
  }
  const retryAfter = Math.max(0, Math.ceil((b.resetAt - now) / 1000));
  res.set('Retry-After', String(retryAfter));
  return res.status(429).json({
    success: false,
    message: 'Rate-Limit erreicht.',
    code: 'TOO_MANY_REQUESTS',
  });
};

