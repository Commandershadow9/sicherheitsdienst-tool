import client from 'prom-client';

type AuthLimitCounters = {
  ip429: number;
  user429: number;
  loginAttempts: number;
  loginBlocked: number;
};

const authCounters: AuthLimitCounters = {
  ip429: 0,
  user429: 0,
  loginAttempts: 0,
  loginBlocked: 0,
};

const authIp429Counter = new client.Counter({
  name: 'app_auth_ratelimit_ip_429_total',
  help: 'Total number of auth IP based 429 responses',
});

const authUser429Counter = new client.Counter({
  name: 'app_auth_ratelimit_user_429_total',
  help: 'Total number of auth per-user 429 responses',
});

const loginAttemptsCounter = new client.Counter({
  name: 'app_auth_login_attempts_total',
  help: 'Total number of login attempts inspected by the per-user rate limiter',
});

const loginBlockedCounter = new client.Counter({
  name: 'app_auth_login_blocked_total',
  help: 'Total number of login attempts blocked by the per-user rate limiter',
});

export function incrAuthIp429() {
  authCounters.ip429++;
  authIp429Counter.inc();
}

export function incrAuthUser429() {
  authCounters.user429++;
  authUser429Counter.inc();
}

export function incrLoginLimiterAttempt() {
  authCounters.loginAttempts++;
  loginAttemptsCounter.inc();
}

export function incrLoginLimiterBlocked() {
  authCounters.loginBlocked++;
  loginBlockedCounter.inc();
}

export function getAuthLimitCounters(): AuthLimitCounters {
  return { ...authCounters };
}

export function resetAuthLimitCounters() {
  authCounters.ip429 = 0;
  authCounters.user429 = 0;
  authCounters.loginAttempts = 0;
  authCounters.loginBlocked = 0;
  authIp429Counter.reset();
  authUser429Counter.reset();
  loginAttemptsCounter.reset();
  loginBlockedCounter.reset();
}
