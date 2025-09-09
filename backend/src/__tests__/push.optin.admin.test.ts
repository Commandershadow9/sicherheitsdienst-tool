import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => { _req.user = { id: 'admin', role: 'ADMIN' }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    user: { update: jest.fn().mockResolvedValue({ id: 'u1', pushOptIn: false }) },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Admin set user push opt-in/out', () => {
  it('sets pushOptIn=false', async () => {
    const res = await request(app).put('/api/push/users/u1/opt').send({ pushOptIn: false });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

