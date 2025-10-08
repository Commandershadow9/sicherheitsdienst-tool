import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    employeePreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Employee Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('liefert Default-Präferenzen, wenn keine vorhanden', async () => {
    (global as any).prismaMock.employeePreferences.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/users/user-1/preferences');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.prefersDayShifts).toBe(true);
    expect(Array.isArray(res.body.data.preferredSiteIds)).toBe(true);
  });

  it('aktualisiert Präferenzen via PUT', async () => {
    (global as any).prismaMock.employeePreferences.upsert.mockResolvedValueOnce({
      userId: 'user-1',
      prefersNightShifts: true,
      prefersDayShifts: false,
      prefersWeekends: false,
      targetMonthlyHours: 150,
      minMonthlyHours: 120,
      maxMonthlyHours: 180,
      flexibleHours: true,
      prefersLongShifts: false,
      prefersShortShifts: true,
      prefersConsecutiveDays: 5,
      minRestDaysPerWeek: 2,
      preferredSiteIds: ['site-1'],
      avoidedSiteIds: [],
      notes: 'Nur Nachtschichten',
    });

    const res = await request(app)
      .put('/api/users/user-1/preferences')
      .send({
        prefersNightShifts: true,
        prefersDayShifts: false,
        preferredSiteIds: ['site-1'],
        notes: 'Nur Nachtschichten',
      });

    expect(res.status).toBe(200);
    expect((global as any).prismaMock.employeePreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      }),
    );
    expect(res.body.data.prefersNightShifts).toBe(true);
  });
});
