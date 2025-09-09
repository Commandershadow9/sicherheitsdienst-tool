import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN', isActive: true };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

const sendPushMock = jest.fn().mockResolvedValue({ success: true });
jest.mock('../services/pushService', () => ({
  sendPushToUsers: (...args: any[]) => (sendPushMock as any)(...args),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    event: {
      create: jest.fn().mockResolvedValue({ id: 'e1', title: 'T', serviceInstructions: 'Instr' }),
      update: jest.fn().mockResolvedValue({ id: 'e1', title: 'T', serviceInstructions: 'Instr' }),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 'u2' }]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Events push notifications (flagged)', () => {
  beforeEach(() => {
    sendPushMock.mockClear();
    process.env.PUSH_NOTIFY_EVENTS = 'true';
  });
  afterEach(() => {
    process.env.PUSH_NOTIFY_EVENTS = 'false';
  });

  it('sends push on create when enabled', async () => {
    const payload = { title: 'X', startTime: '2024-09-01T08:00:00Z', endTime: '2024-09-01T18:00:00Z', serviceInstructions: 'Text', assignedEmployeeIds: ['u2'] };
    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(201);
    expect(sendPushMock).toHaveBeenCalled();
  });
});

