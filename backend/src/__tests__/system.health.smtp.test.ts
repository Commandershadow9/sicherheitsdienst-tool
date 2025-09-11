import request from 'supertest';

describe('Readiness SMTP checks (optional)', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('deps.smtp = skip when flag disabled', async () => {
    process.env.READINESS_CHECK_SMTP = 'false';
    process.env.SMTP_HOST = 'smtp.example.com';
    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../utils/prisma', () => ({ __esModule: true, default: { $queryRaw: jest.fn(async () => 1) } }));
      app = require('../app').default;
    });
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ deps: { smtp: 'skip' } });
  }, 10000);

  it('deps.smtp = ok when verify succeeds', async () => {
    process.env.READINESS_CHECK_SMTP = 'true';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';

    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../utils/prisma', () => ({ __esModule: true, default: { $queryRaw: jest.fn(async () => 1) } }));
      // mock nodemailer
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ verify: jest.fn(async () => true) })),
      }), { virtual: true } as any);
      app = require('../app').default;
    });
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ deps: { smtp: 'ok' } });
  });

  it('deps.smtp = fail when verify throws or times out', async () => {
    process.env.READINESS_CHECK_SMTP = 'true';
    process.env.READINESS_SMTP_TIMEOUT_MS = '10';
    process.env.SMTP_HOST = 'smtp.example.com';

    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../utils/prisma', () => ({ __esModule: true, default: { $queryRaw: jest.fn(async () => 1) } }));
      // mock nodemailer to hang (simulate timeout)
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ verify: jest.fn(async () => { await new Promise(()=>{}); }) })),
      }), { virtual: true } as any);
      app = require('../app').default;
    });
    const res = await request(app).get('/readyz');
    // even if verify hangs, timeout should flip to 'fail'
    expect(res.status).toBe(200);
    expect(res.body.deps.smtp).toBe('fail');
  });
});
