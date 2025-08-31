import request from 'supertest';
import app from '../app';

// Prisma-Client global mocken, damit Controller darauf zugreifen und Tests Methoden überschreiben können
jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    site: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

// Auth-/Authorize-Middleware für Tests durchreichen
jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Sites Routes (E2E-light)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const pm = (global as any).prismaMock;
    pm.site.findMany.mockReset();
    pm.site.create.mockReset();
    pm.site.findUnique.mockReset();
    pm.site.update.mockReset();
    pm.site.delete.mockReset();
  });

  it('POST /api/sites → 201 (ok)', async () => {
    const payload = { name: 'Messe Berlin', address: 'Messedamm 22', city: 'Berlin', postalCode: '14055' };
    (global as any).prismaMock.site.create.mockResolvedValueOnce({ id: 's1', ...payload });
    const res = await request(app).post('/api/sites').send(payload);
    expect(res.status).toBe(201);
    expect((global as any).prismaMock.site.create).toHaveBeenCalled();
  });

  it('POST /api/sites → 422 (Zod)', async () => {
    const res = await request(app).post('/api/sites').send({ name: '' });
    expect(res.status).toBe(422);
  });

  it('POST /api/sites → 409 (Duplicate)', async () => {
    const payload = { name: 'Dup', address: 'A', city: 'C', postalCode: 'Z' };
    (global as any).prismaMock.site.create.mockRejectedValueOnce({ code: 'P2002' });
    const res = await request(app).post('/api/sites').send(payload);
    expect(res.status).toBe(409);
  });

  it('GET /api/sites/:id → 404 (not found)', async () => {
    (global as any).prismaMock.site.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/sites/unknown');
    expect(res.status).toBe(404);
  });

  it('PUT /api/sites/:id → 200 (ok)', async () => {
    (global as any).prismaMock.site.update.mockResolvedValueOnce({ id: 's1', name: 'Neu', address: 'A', city: 'C', postalCode: 'Z' });
    const res = await request(app).put('/api/sites/s1').send({ name: 'Neu' });
    expect(res.status).toBe(200);
    expect((global as any).prismaMock.site.update).toHaveBeenCalled();
  });

  it('PUT /api/sites/:id → 404 (not found)', async () => {
    (global as any).prismaMock.site.update.mockRejectedValueOnce({ code: 'P2025' });
    const res = await request(app).put('/api/sites/sX').send({ name: 'Neu' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/sites/:id → 409 (duplicate)', async () => {
    (global as any).prismaMock.site.update.mockRejectedValueOnce({ code: 'P2002' });
    const res = await request(app).put('/api/sites/s1').send({ name: 'Dup', address: 'A' });
    expect(res.status).toBe(409);
  });

  it('PUT /api/sites/:id → 422 (Zod)', async () => {
    const res = await request(app).put('/api/sites/s1').send({ name: '' });
    expect(res.status).toBe(422);
  });

  it('DELETE /api/sites/:id → 204 (no content)', async () => {
    (global as any).prismaMock.site.delete.mockResolvedValueOnce({ id: 's1', name: 'X' });
    const res = await request(app).delete('/api/sites/s1');
    expect(res.status).toBe(204);
  });

  it('DELETE /api/sites/:id → 404 (not found)', async () => {
    (global as any).prismaMock.site.delete.mockRejectedValueOnce({ code: 'P2025' });
    const res = await request(app).delete('/api/sites/s404');
    expect(res.status).toBe(404);
  });
});
