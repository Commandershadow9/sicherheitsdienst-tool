import client from 'prom-client';

// Initialize default metrics once
client.collectDefaultMetrics();

// Histogram for HTTP request durations (seconds)
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP requests total',
  labelNames: ['method', 'route', 'status_code'] as const,
});

export const register = client.register;
