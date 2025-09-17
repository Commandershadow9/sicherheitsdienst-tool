import type { Request } from 'express';
import { recordAuditEvent, getAuditActorIp } from '../utils/auditTrail';

jest.mock('../services/auditLogService', () => ({
  logAuditEvent: jest.fn(async () => true),
}));

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

const { logAuditEvent } = require('../services/auditLogService');

describe('auditTrail utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records audit event with request metadata', async () => {
    const req = {
      headers: {
        'user-agent': 'jest-agent',
        'x-forwarded-for': '203.0.113.10, 10.0.0.2',
      },
      user: { id: 'user-1', role: 'ADMIN' },
      id: 'req-123',
    } as unknown as Request;

    await recordAuditEvent(req, {
      action: 'TEST.EVENT',
      resourceType: 'TEST',
      outcome: 'SUCCESS',
    });

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEST.EVENT',
        actorId: 'user-1',
        actorRole: 'ADMIN',
        actorIp: '203.0.113.10',
        requestId: 'req-123',
        userAgent: 'jest-agent',
        outcome: 'SUCCESS',
        occurredAt: expect.any(Date),
      }),
    );
  });

  it('prefers overrides over request context', async () => {
    const req = {
      headers: {},
      user: { id: 'user-2', role: 'DISPATCHER' },
      ip: '10.10.10.10',
    } as unknown as Request;

    await recordAuditEvent(
      req,
      {
        action: 'TEST.OVERRIDE',
        resourceType: 'TEST',
        resourceId: 'res-1',
        outcome: 'DENIED',
      },
      {
        actorId: 'override-user',
        actorRole: 'SYSTEM',
        actorIp: '198.51.100.5',
        requestId: 'override-request',
        userAgent: 'override-agent',
      },
    );

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'override-user',
        actorRole: 'SYSTEM',
        actorIp: '198.51.100.5',
        requestId: 'override-request',
        userAgent: 'override-agent',
      }),
    );
  });

  it('falls back to req.ip when headers missing', () => {
    const req = {
      headers: {},
      ip: '192.0.2.12',
    } as unknown as Request;
    expect(getAuditActorIp(req)).toBe('192.0.2.12');
  });
});
