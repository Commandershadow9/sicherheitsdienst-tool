import request from 'supertest';

describe('healthz and readyz', () => {
  it('GET /healthz returns {status:"ok"}', async () => {
    let app: any;
    jest.isolateModules(() => {
      // Mock prisma to avoid real DB init side effects in other imports
      jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ $queryRaw: jest.fn(async () => 1) })) }));
      app = require('../app').default;
    });
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /readyz returns deps ok (db ok, smtp skip)', async () => {
    let app: any;
    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ $queryRaw: jest.fn(async () => 1) })) }));
      app = require('../app').default;
    });
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', deps: { db: 'ok', smtp: 'skip' } });
  });

  it('GET /readyz returns 503 when DB fails', async () => {
    let app: any;
    jest.isolateModules(() => {
      // Mock the prisma instance used by controllers directly
      jest.doMock('../utils/prisma', () => ({ __esModule: true, default: { $queryRaw: jest.fn(async () => { throw new Error('DB down'); }) } }));
      app = require('../app').default;
    });
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'not-ready', deps: { db: 'fail', smtp: 'skip' } });
  });
});
