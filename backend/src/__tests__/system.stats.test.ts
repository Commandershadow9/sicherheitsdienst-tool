import request from 'supertest';

// Mock Prisma to avoid real DB calls in /api/stats
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { count: jest.fn().mockResolvedValue(10) },
    shift: { count: jest.fn().mockResolvedValue(5) },
    incident: { count: jest.fn().mockResolvedValue(2) },
    timeEntry: { count: jest.fn().mockResolvedValue(7) },
    $queryRaw: jest.fn(),
  })),
}));

describe('/api/stats env fields', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, SPEC_VERSION: '9.9.9', BUILD_SHA: 'deadbeef' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('GET /api/stats contains env.specVersion and env.buildSha', async () => {
    const app = require('../app').default;
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.env');
    expect(res.body.data.env).toHaveProperty('specVersion');
    expect(res.body.data.env).toHaveProperty('buildSha');
    expect(res.body.data.env.specVersion).toBe('9.9.9');
    expect(res.body.data.env.buildSha).toBe('deadbeef');
  });

  it('reports push success rate using delivered and failed counters', async () => {
    const { resetNotifyCounters, incrPushSuccess, incrPushFail } = require('../utils/notifyStats');
    resetNotifyCounters();
    incrPushSuccess(7);
    incrPushFail(undefined, 3);
    const app = require('../app').default;
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    const pushRate = res.body?.data?.notifications?.successRate?.push;
    expect(pushRate).not.toBeNull();
    expect(pushRate).toBeCloseTo(7 / (7 + 3));
  });
});

