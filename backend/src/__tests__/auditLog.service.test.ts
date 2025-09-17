jest.mock('../utils/prisma', () => {
  const create = jest.fn();
  const createMany = jest.fn();
  return {
    __esModule: true,
    default: {
      auditLog: {
        create,
        createMany,
      },
    },
  };
});

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

import prisma from '../utils/prisma';
import {
  logAuditEvent,
  flushAuditLogQueue,
  getAuditLogQueueSize,
  __resetAuditLogService,
} from '../services/auditLogService';

describe('auditLogService', () => {
  const prismaClient = prisma as unknown as {
    auditLog: {
      create: jest.Mock;
      createMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaClient.auditLog.create.mockReset();
    prismaClient.auditLog.createMany.mockReset();
    __resetAuditLogService();
  });

  it('writes audit log entry immediately when persistence succeeds', async () => {
    prismaClient.auditLog.create.mockResolvedValueOnce({ id: 'log-1' });

    const success = await logAuditEvent({
      action: 'SHIFT.ASSIGN',
      resourceType: 'SHIFT',
      resourceId: 'shift-1',
      actorId: 'user-1',
      outcome: 'SUCCESS',
    });

    expect(success).toBe(true);
    expect(prismaClient.auditLog.create).toHaveBeenCalledTimes(1);
    const payload = prismaClient.auditLog.create.mock.calls[0][0].data;
    expect(payload).toMatchObject({
      action: 'SHIFT.ASSIGN',
      resourceType: 'SHIFT',
      resourceId: 'shift-1',
      actorId: 'user-1',
      outcome: 'SUCCESS',
    });
    expect(payload.occurredAt).toBeInstanceOf(Date);
    expect(getAuditLogQueueSize()).toBe(0);
  });

  it('queues audit entry when write fails and flush persists batch later', async () => {
    prismaClient.auditLog.create.mockRejectedValueOnce(new Error('db down'));
    prismaClient.auditLog.createMany.mockResolvedValue({ count: 1 });

    const success = await logAuditEvent({
      action: 'SHIFT.ASSIGN',
      resourceType: 'SHIFT',
      resourceId: 'shift-2',
    });

    expect(success).toBe(false);
    expect(getAuditLogQueueSize()).toBe(1);

    const written = await flushAuditLogQueue();
    expect(written).toBe(1);
    expect(prismaClient.auditLog.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          action: 'SHIFT.ASSIGN',
          resourceType: 'SHIFT',
          resourceId: 'shift-2',
        }),
      ]),
    });
    expect(getAuditLogQueueSize()).toBe(0);
  });

  it('keeps queue filled when batch flush fails', async () => {
    prismaClient.auditLog.create.mockRejectedValue(new Error('down'));
    prismaClient.auditLog.createMany.mockRejectedValueOnce(new Error('still down'));

    await logAuditEvent({ action: 'USER.UPDATE', resourceType: 'USER', resourceId: 'user-9' });
    expect(getAuditLogQueueSize()).toBe(1);

    await flushAuditLogQueue();
    expect(prismaClient.auditLog.createMany).toHaveBeenCalledTimes(1);
    expect(getAuditLogQueueSize()).toBe(1);
  });
});
