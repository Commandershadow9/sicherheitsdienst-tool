import type { Request, Response } from 'express';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../utils/csv', () => ({
  streamCsv: jest.fn().mockResolvedValue(undefined),
}));

import { listAuditLogs, exportAuditLogs } from '../controllers/auditLogController';

const prismaMock = require('../utils/prisma').default;
const findManyMock = prismaMock.auditLog.findMany as jest.Mock;
const countMock = prismaMock.auditLog.count as jest.Mock;
const streamCsvMock = require('../utils/csv').streamCsv as jest.Mock;

function createResponse() {
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

describe('auditLogController.listAuditLogs', () => {
  beforeEach(() => {
    findManyMock.mockReset();
    countMock.mockReset();
    streamCsvMock.mockClear();
  });

  it('applies filters and returns paginated payload', async () => {
    const now = new Date('2025-09-19T07:30:00.000Z');
    findManyMock.mockResolvedValue([
      {
        id: 'log-1',
        occurredAt: now,
        action: 'SHIFT.ASSIGN',
        resourceType: 'SHIFT',
        resourceId: 'shift-1',
        actorId: 'admin-1',
        outcome: 'SUCCESS',
        actorIp: '203.0.113.10',
        data: { userId: 'employee-1' },
      },
    ]);
    countMock.mockResolvedValue(7);

    const req = {
      query: {
        actorId: 'admin-1',
        resourceType: 'SHIFT',
        resourceId: 'shift-1',
        action: 'SHIFT.ASSIGN',
        outcome: 'SUCCESS',
        from: '2025-09-17T00:00:00.000Z',
        to: '2025-09-19T23:59:59.000Z',
        page: '2',
        pageSize: '5',
      },
    } as unknown as Request;
    const res = createResponse();

    await listAuditLogs(req, res, jest.fn());

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: { occurredAt: 'desc' },
        where: expect.objectContaining({
          actorId: 'admin-1',
          resourceType: 'SHIFT',
          resourceId: 'shift-1',
          action: 'SHIFT.ASSIGN',
          outcome: 'SUCCESS',
          occurredAt: expect.objectContaining({
            gte: new Date('2025-09-17T00:00:00.000Z'),
            lte: new Date('2025-09-19T23:59:59.000Z'),
          }),
        }),
      }),
    );
    expect(countMock).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        pagination: expect.objectContaining({ page: 2, pageSize: 5, total: 7, totalPages: 2 }),
      }),
    );
  });

  it('rejects invalid date filters with 400', async () => {
    const req = {
      query: {
        from: 'not-a-date',
      },
    } as unknown as Request;
    const res = createResponse();

    await listAuditLogs(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('streams CSV export when format is csv', async () => {
    findManyMock
      .mockResolvedValueOnce([
        {
          id: 'log-1',
          occurredAt: new Date('2025-09-19T12:00:00.000Z'),
          action: 'AUTH.LOGIN',
          resourceType: 'AUTH',
          resourceId: 'user-1',
          actorId: 'user-1',
          actorRole: 'ADMIN',
          actorIp: '203.0.113.10',
          outcome: 'SUCCESS',
          requestId: 'req-1',
          userAgent: 'jest',
          data: { email: 'admin@example.com' },
        },
      ])
      .mockResolvedValueOnce([]);

    const req = {
      query: {
        format: 'csv',
      },
      headers: {},
    } as unknown as Request;
    const res = createResponse();

    await exportAuditLogs(req, res, jest.fn());

    expect(streamCsvMock).toHaveBeenCalledTimes(1);
    const iterable = streamCsvMock.mock.calls[0][3];
    const iterator = iterable[Symbol.asyncIterator]();
    await iterator.next();
    expect(findManyMock).toHaveBeenCalled();
  });

  it('rejects export without csv accept or format', async () => {
    const req = {
      query: {},
      headers: {},
    } as unknown as Request;
    const res = createResponse();

    await exportAuditLogs(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(406);
    expect(streamCsvMock).not.toHaveBeenCalled();
  });
});
