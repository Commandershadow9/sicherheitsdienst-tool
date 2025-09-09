import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('System 405 Method Not Allowed', () => {
  it('POST /api/health → 405', async () => {
    const res = await request(app).post('/api/health');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET');
  });

  it('PUT /api/stats → 405', async () => {
    const res = await request(app).put('/api/stats');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET');
  });
});

