type Counters = {
  requestsTotal: number;
  responses4xx: number;
  responses5xx: number;
};

const counters: Counters = {
  requestsTotal: 0,
  responses4xx: 0,
  responses5xx: 0,
};

export function onRequestStart() {
  counters.requestsTotal++;
}

export function onResponseStatus(status: number) {
  if (status >= 500) counters.responses5xx++;
  else if (status >= 400) counters.responses4xx++;
}

export function getCounters(): Counters {
  return { ...counters };
}

