import request from 'supertest';
import app from '../app';

// Prisma not needed; mock minimal to avoid accidental DB usage
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Error Responses (shape smoke tests)', () => {
  it('GET /api/sites without auth → 401 with standard shape', async () => {
    const res = await request(app).get('/api/sites');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
    expect(typeof res.body.message).toBe('string');
  });

  it('POST /api/auth/login invalid payload → 422 with standard shape', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

