import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'EMPLOYEE', isActive: true };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    deviceToken: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'd1', userId: 'u1', platform: 'ANDROID', token: 'tok' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'd1', userId: 'u1', platform: 'ANDROID', token: 'tok' }]),
      update: jest.fn().mockResolvedValue({ id: 'd1', userId: 'u1', platform: 'ANDROID', token: 'tok', isActive: false }),
      delete: jest.fn().mockResolvedValue({ id: 'd1' }),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Push tokens routes', () => {
  it('registers token', async () => {
    const res = await request(app).post('/api/push/tokens').send({ platform: 'ANDROID', token: 'tok' });
    expect(res.status).toBe(201);
  });
  it('lists tokens', async () => {
    const res = await request(app).get('/api/push/tokens');
    expect(res.status).toBe(200);
  });
  it('updates token', async () => {
    const res = await request(app).put('/api/push/tokens/tok').send({ isActive: false });
    expect(res.status).toBe(200);
  });
  it('deletes token', async () => {
    // Need to let findUnique return token owned by user
    (global as any).prismaMock.deviceToken.findUnique.mockResolvedValueOnce({ token: 'tok', userId: 'u1' });
    const res = await request(app).delete('/api/push/tokens/tok');
    expect(res.status).toBe(204);
  });
});
