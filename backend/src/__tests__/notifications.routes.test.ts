import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn(async () => ({ messageId: 'msg-2' })),
}));

jest.mock('../services/pushService', () => ({
  sendPushToUsers: jest.fn(async () => ({ success: true, count: 1 })),
}));

describe('POST /api/notifications/test', () => {
  it('succeeds with valid payload', async () => {
    const res = await request(app).post('/api/notifications/test').send({
      recipient: 'to@example.com',
      title: 'Hallo',
      body: 'Welt',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('validates payload (422)', async () => {
    const res = await request(app).post('/api/notifications/test').send({ recipient: '' });
    expect(res.status).toBe(422);
  });

  it('rejects unknown channel (422)', async () => {
    const res = await request(app).post('/api/notifications/test').send({
      recipient: 'to@example.com',
      title: 'Hallo',
      body: 'Welt',
      channel: 'sms',
    });
    expect(res.status).toBe(422);
  });

  it('requires userIds for push', async () => {
    const res = await request(app)
      .post('/api/notifications/test')
      .send({ channel: 'push', title: 'Hallo', body: 'Test' });
    expect(res.status).toBe(422);
  });

  it('succeeds for push when userIds and body provided', async () => {
    const res = await request(app)
      .post('/api/notifications/test')
      .send({ channel: 'push', title: 'Hallo', body: 'Test', userIds: ['u1'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/notifications/templates', () => {
  it('returns template metadata', async () => {
    const res = await request(app).get('/api/notifications/templates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
