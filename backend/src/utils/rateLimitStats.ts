type AuthLimitCounters = {
  ip429: number;
  user429: number;
};

const authCounters: AuthLimitCounters = {
  ip429: 0,
  user429: 0,
};

export function incrAuthIp429() {
  authCounters.ip429++;
}

export function incrAuthUser429() {
  authCounters.user429++;
}

export function getAuthLimitCounters(): AuthLimitCounters {
  return { ...authCounters };
}

