import request from 'supertest';
import app from '../app';

// Prisma-Client global mocken, wird für diesen Test nicht benötigt
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Auth Login Validation', () => {
  it('POST /api/auth/login → 422 bei ungültiger Payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

