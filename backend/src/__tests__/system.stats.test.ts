// Mock Prisma to avoid real DB calls in /api/stats
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { count: jest.fn().mockResolvedValue(10) },
    shift: { count: jest.fn().mockResolvedValue(5) },
    incident: { count: jest.fn().mockResolvedValue(2) },
    timeEntry: { count: jest.fn().mockResolvedValue(7) },
    auditLog: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  })),
}));

import type { Request, Response, NextFunction } from 'express';
import { getSystemStats } from '../controllers/systemController';

describe('/api/stats env fields', () => {
const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV, SPEC_VERSION: '9.9.9', BUILD_SHA: 'deadbeef' };
});

afterEach(() => {
  process.env = OLD_ENV;
});

  function createRes() {
    const res: Partial<Response> & { statusCode?: number; payload?: unknown } = {};
    res.status = jest.fn(function status(this: typeof res, code: number) {
      this.statusCode = code;
      return this as unknown as Response;
    });
    res.json = jest.fn(function json(this: typeof res, payload: unknown) {
      this.payload = payload;
      return this as unknown as Response;
    });
    return res as Response & { statusCode?: number; payload?: unknown };
  }

  function createReq(): Request {
    return { query: {}, headers: {} } as unknown as Request;
  }

  it('GET /api/stats contains env.specVersion and env.buildSha', async () => {
    const { getSystemStats } = require('../controllers/systemController');
    const prisma = require('../utils/prisma').default;
    const auditLogCount = prisma.auditLog.count as jest.Mock;
    auditLogCount.mockReset().mockResolvedValue(0);
    const auditLogGroupBy = prisma.auditLog.groupBy as jest.Mock;
    auditLogGroupBy.mockReset().mockResolvedValue([]);
    const auditLogFindFirst = prisma.auditLog.findFirst as jest.Mock;
    auditLogFindFirst.mockReset().mockResolvedValue(null);
    const req = createReq();
    const res = createRes();

    await getSystemStats(req, res, jest.fn() as NextFunction);

    expect(res.json).toHaveBeenCalled();
    const jsonMock = res.json as unknown as jest.Mock;
    const payload = jsonMock.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data.env.specVersion).toBe('9.9.9');
    expect(payload.data.env.buildSha).toBe('deadbeef');
  });

  it('reports push success rate using delivered and failed counters', async () => {
    const { resetNotifyCounters, incrPushSuccess, incrPushFail } = require('../utils/notifyStats');
    resetNotifyCounters();
    incrPushSuccess(7);
    incrPushFail(undefined, 3);
    const { getSystemStats } = require('../controllers/systemController');
    const prisma = require('../utils/prisma').default;
    const auditLogCount = prisma.auditLog.count as jest.Mock;
    auditLogCount
      .mockReset()
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(25);
    const auditLogGroupBy = prisma.auditLog.groupBy as jest.Mock;
    auditLogGroupBy.mockReset().mockResolvedValue([
      { outcome: 'SUCCESS', _count: 80 },
      { outcome: 'DENIED', _count: 15 },
      { outcome: 'ERROR', _count: 5 },
    ]);
    const auditLogFindFirst = prisma.auditLog.findFirst as jest.Mock;
    auditLogFindFirst.mockReset().mockResolvedValue({
      id: 'log-latest',
      occurredAt: new Date('2025-09-19T08:00:00.000Z'),
      action: 'SHIFT.ASSIGN',
      outcome: 'SUCCESS',
    });
    const req = createReq();
    const res = createRes();

    await getSystemStats(req, res, jest.fn() as NextFunction);

    const jsonMock = res.json as unknown as jest.Mock;
    const payload = jsonMock.mock.calls[0][0];
    const pushRate = payload?.data?.notifications?.successRate?.push;
    expect(pushRate).not.toBeNull();
    expect(pushRate).toBeCloseTo(7 / (7 + 3));
    expect(payload?.data?.auditTrail).toMatchObject({
      total: 100,
      last24h: 25,
      outcomes: expect.objectContaining({ SUCCESS: 80, DENIED: 15, ERROR: 5 }),
      latest: expect.objectContaining({ id: 'log-latest' }),
    });
  });
});
