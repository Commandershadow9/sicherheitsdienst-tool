import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { login, refresh } from '../controllers/authController';

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../utils/auditTrail', () => ({
  recordAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../utils/prisma').default;
const bcrypt = require('bcryptjs');
const { recordAuditEvent } = require('../utils/auditTrail');

function createMockResponse() {
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

describe('authController', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockReset();
    bcrypt.compare.mockReset();
    recordAuditEvent.mockClear();
    process.env = { ...originalEnv, JWT_SECRET: 'jwt-secret', REFRESH_SECRET: 'refresh-secret' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('logs success for valid login', async () => {
    const user = { id: 'user-1', email: 'user@example.com', password: 'hashed', role: 'ADMIN', isActive: true };
    prisma.user.findUnique.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);

    const req = {
      body: { email: user.email, password: 'pw' },
      headers: {},
      id: 'req-1',
    } as unknown as Request;
    const res = createMockResponse();

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(recordAuditEvent).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ action: 'AUTH.LOGIN', outcome: 'SUCCESS' }),
      expect.objectContaining({ actorId: user.id, actorRole: user.role }),
    );
  });

  it('logs denied outcome for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'user@example.com', password: 'hashed', role: 'ADMIN', isActive: true });
    bcrypt.compare.mockResolvedValue(false);

    const req = {
      body: { email: 'user@example.com', password: 'wrong' },
      headers: {},
      id: 'req-2',
    } as unknown as Request;
    const res = createMockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ action: 'AUTH.LOGIN', outcome: 'DENIED' }),
      expect.objectContaining({ actorId: 'user-2' }),
    );
  });

  it('logs success for refresh token renewal', async () => {
    const user = { id: 'user-3', role: 'DISPATCHER', isActive: true };
    prisma.user.findUnique.mockResolvedValue(user);
    const refreshToken = jwt.sign({ userId: user.id, role: user.role }, 'refresh-secret');

    const req = {
      body: { refreshToken },
      headers: {},
      id: 'req-3',
    } as unknown as Request;
    const res = createMockResponse();

    await refresh(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(recordAuditEvent).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ action: 'AUTH.REFRESH', outcome: 'SUCCESS', resourceId: user.id }),
      expect.objectContaining({ actorId: user.id, actorRole: user.role }),
    );
  });

  it('logs denied outcome for invalid refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const req = {
      body: { refreshToken: 'invalid' },
      headers: {},
      id: 'req-4',
    } as unknown as Request;
    const res = createMockResponse();

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ action: 'AUTH.REFRESH', outcome: 'DENIED' }),
      expect.objectContaining({ actorId: null }),
    );
  });
});
