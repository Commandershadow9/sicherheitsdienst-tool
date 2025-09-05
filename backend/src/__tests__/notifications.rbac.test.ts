import request from 'supertest';

describe('RBAC for /api/notifications/test', () => {
  const payload = { recipient: 'to@example.com', title: 'Hi', body: 'There' };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('denies anonymous (401)', async () => {
    let app: any;
    jest.isolateModules(() => {
      // Use real auth (no token) to trigger 401; still mock email service
      jest.doMock('../services/emailService', () => ({
        sendEmail: jest.fn(async () => ({ messageId: 'msg' })),
      }));
      app = require('../app').default;
    });
    const res = await request(app).post('/api/notifications/test').set('Content-Type', 'application/json').send(payload);
    expect(res.status).toBe(401);
  });

  it('allows ADMIN (200)', async () => {
    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../middleware/auth', () => {
        const actual = jest.requireActual('../middleware/auth');
        return {
          ...actual,
          authenticate: (req: any, _res: any, next: any) => {
            req.user = { role: 'ADMIN' };
            next();
          },
        };
      });
      jest.doMock('../services/emailService', () => ({
        sendEmail: jest.fn(async () => ({ messageId: 'msg' })),
      }));
      app = require('../app').default;
    });
    const res = await request(app).post('/api/notifications/test').set('Content-Type', 'application/json').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows MANAGER (200)', async () => {
    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../middleware/auth', () => {
        const actual = jest.requireActual('../middleware/auth');
        return {
          ...actual,
          authenticate: (req: any, _res: any, next: any) => {
            req.user = { role: 'MANAGER' };
            next();
          },
        };
      });
      jest.doMock('../services/emailService', () => ({
        sendEmail: jest.fn(async () => ({ messageId: 'msg' })),
      }));
      app = require('../app').default;
    });
    const res = await request(app).post('/api/notifications/test').set('Content-Type', 'application/json').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('denies EMPLOYEE (403)', async () => {
    let app: any;
    jest.isolateModules(() => {
      jest.doMock('../middleware/auth', () => {
        const actual = jest.requireActual('../middleware/auth');
        return {
          ...actual,
          authenticate: (req: any, _res: any, next: any) => {
            req.user = { role: 'EMPLOYEE' };
            next();
          },
        };
      });
      jest.doMock('../services/emailService', () => ({
        sendEmail: jest.fn(async () => ({ messageId: 'msg' })),
      }));
      app = require('../app').default;
    });
    const res = await request(app).post('/api/notifications/test').set('Content-Type', 'application/json').send(payload);
    expect(res.status).toBe(403);
  });
});
