import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn(async () => ({ messageId: 'msg-2' })),
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

  it('rejects non-email channel (400)', async () => {
    const res = await request(app).post('/api/notifications/test').send({
      recipient: 'to@example.com',
      title: 'Hallo',
      body: 'Welt',
      channel: 'sms',
    });
    expect(res.status).toBe(400);
  });
});

