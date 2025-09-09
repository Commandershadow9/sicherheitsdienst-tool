import request from 'supertest';
import app from '../app';

describe('API v1 Alias', () => {
  it('GET /api/v1/health → 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});

