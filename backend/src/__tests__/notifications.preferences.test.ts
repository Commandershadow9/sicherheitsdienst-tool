import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'ADMIN' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = require('../utils/prisma').default as any;

describe('notification preferences routes', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
  });

  it('GET /api/notifications/preferences/me returns current preferences', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ emailOptIn: true, pushOptIn: false });
    const res = await request(app).get('/api/notifications/preferences/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ emailOptIn: true, pushOptIn: false });
  });

  it('PUT /api/notifications/preferences/me updates preferences', async () => {
    prismaMock.user.update.mockResolvedValue({ emailOptIn: false, pushOptIn: true });
    const res = await request(app)
      .put('/api/notifications/preferences/me')
      .send({ emailOptIn: false, pushOptIn: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ emailOptIn: false, pushOptIn: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { emailOptIn: false, pushOptIn: true },
      select: { emailOptIn: true, pushOptIn: true },
    });
  });

  it('PUT /api/notifications/preferences/me requires at least one field', async () => {
    const res = await request(app).put('/api/notifications/preferences/me').send({});
    expect(res.status).toBe(422);
  });
});
