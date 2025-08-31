import * as siteController from '../controllers/siteController';

const mPrisma = {
  site: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return { PrismaClient: jest.fn(() => mPrisma) };
});

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.payload = payload;
    return res;
  };
  return res;
}

describe('siteController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllSites returns list', async () => {
    const req: any = {};
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.findMany.mockResolvedValueOnce([{ id: '1', name: 'HQ', address: 'A', city: 'B', postalCode: 'C' }]);
    await siteController.getAllSites(req as any, res as any, next as any);
    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
  });

  it('createSite 201', async () => {
    const req: any = { body: { name: 'HQ', address: 'A', city: 'B', postalCode: 'C' } };
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.create.mockResolvedValueOnce({ id: '1', ...req.body });
    await siteController.createSite(req as any, res as any, next as any);
    expect(res.statusCode).toBe(201);
  });

  it('createSite 409 on duplicate', async () => {
    const req: any = { body: { name: 'HQ', address: 'A', city: 'B', postalCode: 'C' } };
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.create.mockRejectedValueOnce({ code: 'P2002' });
    await siteController.createSite(req as any, res as any, next as any);
    expect(res.statusCode).toBe(409);
  });

  it('getSiteById 404 not found', async () => {
    const req: any = { params: { id: 'x' } };
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.findUnique.mockResolvedValueOnce(null);
    await siteController.getSiteById(req as any, res as any, next as any);
    expect(res.statusCode).toBe(404);
  });

  it('updateSite 404 not found', async () => {
    const req: any = { params: { id: 'x' }, body: { name: 'N' } };
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.update.mockRejectedValueOnce({ code: 'P2025' });
    await siteController.updateSite(req as any, res as any, next as any);
    expect(res.statusCode).toBe(404);
  });

  it('deleteSite 404 not found', async () => {
    const req: any = { params: { id: 'x' } };
    const res = mockRes();
    const next = jest.fn();
    mPrisma.site.delete.mockRejectedValueOnce({ code: 'P2025' });
    await siteController.deleteSite(req as any, res as any, next as any);
    expect(res.statusCode).toBe(404);
  });
});

