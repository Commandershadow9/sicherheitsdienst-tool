import request from 'supertest';

// Wir setzen ENV vor dem Import von app, damit Middleware korrekt konfiguriert wird
const ALLOWED = 'https://allowed.example.com';
const DISALLOWED = 'https://evil.example.com';

describe('Security headers & CORS', () => {
  let app: any;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = `${ALLOWED}, http://localhost:3000`;
    jest.resetModules();
    app = (await import('../app')).default;
  });

  test('helmet headers present on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBeDefined();
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  test('CORS allows whitelisted origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', ALLOWED);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  test('CORS blocks non-whitelisted origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', DISALLOWED);
    // Bei geblocktem Origin setzt cors keine ACAO-Header
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(200);
  });

  test('CORS fallback allows FRONTEND_URL when CORS_ORIGINS unset', async () => {
    process.env.CORS_ORIGINS = '';
    process.env.FRONTEND_URL = 'https://frontend.example.com';
    jest.resetModules();
    const app2 = (await import('../app')).default;
    const res = await request(app2).get('/api/health').set('Origin', 'https://frontend.example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://frontend.example.com');
  });
});
