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
    priceModel: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    siteCalculation: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    siteTemplate: {
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
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
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

describe('Price Models & Calculations Routes (E2E-light)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const pm = (global as any).prismaMock;
    pm.priceModel.findMany.mockReset();
    pm.priceModel.create.mockReset();
    pm.priceModel.findUnique.mockReset();
    pm.priceModel.update.mockReset();
    pm.priceModel.delete.mockReset();
    pm.siteCalculation.findMany.mockReset();
    pm.siteCalculation.create.mockReset();
    pm.siteCalculation.findUnique.mockReset();
    pm.siteCalculation.update.mockReset();
    pm.siteCalculation.delete.mockReset();
    pm.siteCalculation.findFirst.mockReset();
  });

  // ===== PRICE MODELS =====

  it('GET /api/price-models → 200 (ok)', async () => {
    const mockModels = [
      { id: 'pm1', name: 'Standard 2025', isActive: true, hourlyRateEmployee: 13.5 },
      { id: 'pm2', name: 'Premium 2025', isActive: true, hourlyRateEmployee: 15.0 },
    ];
    (global as any).prismaMock.priceModel.findMany.mockResolvedValueOnce(mockModels);
    const res = await request(app).get('/api/price-models');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect((global as any).prismaMock.priceModel.findMany).toHaveBeenCalled();
  });

  it('POST /api/price-models → 201 (created)', async () => {
    const payload = {
      name: 'Test Model',
      hourlyRateEmployee: 13.5,
      hourlyRateShiftLeader: 16.0,
      hourlyRateSiteManager: 18.5,
      nightSurcharge: 25,
      saturdaySurcharge: 25,
      sundaySurcharge: 50,
      holidaySurcharge: 100,
      nslCertificateSurcharge: 1.5,
      dogHandlerSurcharge: 2.5,
      weaponLicenseSurcharge: 2.0,
      overheadPercentage: 12,
      profitMarginPercentage: 15,
      isActive: true,
    };
    (global as any).prismaMock.priceModel.create.mockResolvedValueOnce({ id: 'pm1', ...payload });
    const res = await request(app).post('/api/price-models').send(payload);
    expect(res.status).toBe(201);
    expect((global as any).prismaMock.priceModel.create).toHaveBeenCalled();
  });

  it('POST /api/price-models → 422 (validation error)', async () => {
    const res = await request(app).post('/api/price-models').send({ name: '' });
    expect(res.status).toBe(422);
  });

  it('GET /api/price-models/:id → 200 (ok)', async () => {
    const mockModel = { id: 'pm1', name: 'Standard 2025', hourlyRateEmployee: 13.5 };
    (global as any).prismaMock.priceModel.findUnique.mockResolvedValueOnce(mockModel);
    const res = await request(app).get('/api/price-models/pm1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('pm1');
  });

  it('GET /api/price-models/:id → 404 (not found)', async () => {
    (global as any).prismaMock.priceModel.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/price-models/unknown');
    expect(res.status).toBe(404);
  });

  it('PUT /api/price-models/:id → 200 (updated)', async () => {
    (global as any).prismaMock.priceModel.update.mockResolvedValueOnce({ id: 'pm1', name: 'Updated' });
    const res = await request(app).put('/api/price-models/pm1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect((global as any).prismaMock.priceModel.update).toHaveBeenCalled();
  });

  it('DELETE /api/price-models/:id → 204 (deleted)', async () => {
    (global as any).prismaMock.priceModel.delete.mockResolvedValueOnce({ id: 'pm1' });
    const res = await request(app).delete('/api/price-models/pm1');
    expect(res.status).toBe(204);
  });

  // ===== SITE CALCULATIONS =====

  it('GET /api/sites/:siteId/calculations → 200 (ok)', async () => {
    const mockCalcs = [
      { id: 'calc1', siteId: 's1', version: 1, status: 'DRAFT', totalPriceMonthly: 15000 },
      { id: 'calc2', siteId: 's1', version: 2, status: 'SENT', totalPriceMonthly: 16000 },
    ];
    (global as any).prismaMock.siteCalculation.findMany.mockResolvedValueOnce(mockCalcs);
    const res = await request(app).get('/api/sites/s1/calculations');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect((global as any).prismaMock.siteCalculation.findMany).toHaveBeenCalled();
  });

  it('POST /api/sites/:siteId/calculations → 201 (created)', async () => {
    const payload = {
      priceModelId: 'pm1',
      requiredStaff: 3,
      hoursPerWeek: 168,
      contractDurationMonths: 12,
      hoursDay: 112,
      hoursNight: 56,
      hoursSaturday: 32,
      hoursSunday: 32,
      hoursHoliday: 16,
      employeeCount: 6,
      shiftLeaderCount: 2,
      siteManagerCount: 1,
      riskSurchargePercentage: 10,
      distanceSurcharge: 0.5,
      setupCostUniform: 300,
      setupCostEquipment: 150,
      setupCostOther: 0,
    };
    const mockCalc = {
      id: 'calc1',
      siteId: 's1',
      version: 1,
      status: 'DRAFT',
      ...payload,
      totalPersonnelCostMonthly: 15668,
      totalOverheadMonthly: 1880,
      totalProfitMonthly: 2632,
      totalPriceMonthly: 20180,
      calculatedBy: 'u1',
      calculatedAt: new Date(),
    };
    (global as any).prismaMock.siteCalculation.findFirst.mockResolvedValueOnce(null);
    (global as any).prismaMock.siteCalculation.create.mockResolvedValueOnce(mockCalc);
    const res = await request(app).post('/api/sites/s1/calculations').send(payload);
    expect(res.status).toBe(201);
    expect((global as any).prismaMock.siteCalculation.create).toHaveBeenCalled();
  });

  it('POST /api/sites/:siteId/calculations → 422 (validation error)', async () => {
    const res = await request(app).post('/api/sites/s1/calculations').send({ requiredStaff: -1 });
    expect(res.status).toBe(422);
  });

  it('GET /api/sites/:siteId/calculations/:id → 200 (ok)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', version: 1, status: 'DRAFT', totalPriceMonthly: 15000 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    const res = await request(app).get('/api/sites/s1/calculations/calc1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('calc1');
  });

  it('GET /api/sites/:siteId/calculations/:id → 404 (not found)', async () => {
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/sites/s1/calculations/unknown');
    expect(res.status).toBe(404);
  });

  it('PUT /api/sites/:siteId/calculations/:id → 200 (updated)', async () => {
    const existingCalc = {
      id: 'calc1',
      siteId: 's1',
      version: 1,
      status: 'DRAFT',
      requiredStaff: 3,
      hoursPerWeek: 168,
    };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(existingCalc);
    (global as any).prismaMock.siteCalculation.update.mockResolvedValueOnce({ ...existingCalc, requiredStaff: 4 });
    const res = await request(app).put('/api/sites/s1/calculations/calc1').send({ requiredStaff: 4 });
    expect(res.status).toBe(200);
    expect((global as any).prismaMock.siteCalculation.update).toHaveBeenCalled();
  });

  it('DELETE /api/sites/:siteId/calculations/:id → 204 (deleted)', async () => {
    (global as any).prismaMock.siteCalculation.delete.mockResolvedValueOnce({ id: 'calc1' });
    const res = await request(app).delete('/api/sites/s1/calculations/calc1');
    expect(res.status).toBe(204);
  });

  // ===== CALCULATION ACTIONS =====

  it('POST /api/sites/:siteId/calculations/:id/send → 200 (status updated to SENT)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', status: 'DRAFT', version: 1 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    (global as any).prismaMock.siteCalculation.update.mockResolvedValueOnce({ ...mockCalc, status: 'SENT' });
    const res = await request(app).post('/api/sites/s1/calculations/calc1/send');
    expect(res.status).toBe(200);
    expect((global as any).prismaMock.siteCalculation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'calc1' },
        data: expect.objectContaining({ status: 'SENT' }),
      })
    );
  });

  it('POST /api/sites/:siteId/calculations/:id/accept → 200 (status updated to ACCEPTED)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', status: 'SENT', version: 1 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    (global as any).prismaMock.siteCalculation.update.mockResolvedValueOnce({ ...mockCalc, status: 'ACCEPTED' });
    const res = await request(app).post('/api/sites/s1/calculations/calc1/accept');
    expect(res.status).toBe(200);
  });

  it('POST /api/sites/:siteId/calculations/:id/reject → 200 (status updated to REJECTED)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', status: 'SENT', version: 1 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    (global as any).prismaMock.siteCalculation.update.mockResolvedValueOnce({ ...mockCalc, status: 'REJECTED' });
    const res = await request(app).post('/api/sites/s1/calculations/calc1/reject').send({ notes: 'Preis zu hoch' });
    expect(res.status).toBe(200);
  });

  it('POST /api/sites/:siteId/calculations/:id/archive → 200 (status updated to ARCHIVED)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', status: 'REJECTED', version: 1 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    (global as any).prismaMock.siteCalculation.update.mockResolvedValueOnce({ ...mockCalc, status: 'ARCHIVED' });
    const res = await request(app).post('/api/sites/s1/calculations/calc1/archive');
    expect(res.status).toBe(200);
  });

  it('POST /api/sites/:siteId/calculations/:id/archive → 400 (already archived)', async () => {
    const mockCalc = { id: 'calc1', siteId: 's1', status: 'ARCHIVED', version: 1 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    const res = await request(app).post('/api/sites/s1/calculations/calc1/archive');
    expect(res.status).toBe(400);
  });

  it('POST /api/sites/:siteId/calculations/:id/duplicate → 201 (new version created)', async () => {
    const originalCalc = {
      id: 'calc1',
      siteId: 's1',
      version: 1,
      status: 'SENT',
      requiredStaff: 3,
      hoursPerWeek: 168,
      totalPriceMonthly: 20180,
    };
    const latestCalc = { ...originalCalc, version: 2 };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(originalCalc);
    (global as any).prismaMock.siteCalculation.findFirst.mockResolvedValueOnce(latestCalc);
    (global as any).prismaMock.siteCalculation.create.mockResolvedValueOnce({
      ...originalCalc,
      id: 'calc3',
      version: 3,
      status: 'DRAFT',
    });
    const res = await request(app).post('/api/sites/s1/calculations/calc1/duplicate');
    expect(res.status).toBe(201);
    expect((global as any).prismaMock.siteCalculation.create).toHaveBeenCalled();
  });

  // ===== EMAIL & PDF (Integration-Test-Stubs) =====

  it('POST /api/sites/:siteId/calculations/:id/send-email → 200 (email queued)', async () => {
    const mockCalc = {
      id: 'calc1',
      siteId: 's1',
      version: 1,
      totalPriceMonthly: 20180,
      site: { id: 's1', name: 'Messe Berlin' },
      calculator: { id: 'u1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com' },
    };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    const res = await request(app)
      .post('/api/sites/s1/calculations/calc1/send-email')
      .send({ recipientEmail: 'kunde@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('E-Mail wird versendet');
  });

  it('POST /api/sites/:siteId/calculations/:id/send-email → 400 (missing email)', async () => {
    const res = await request(app).post('/api/sites/s1/calculations/calc1/send-email').send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/sites/:siteId/calculations/:id/pdf → 200 (PDF generated)', async () => {
    const mockCalc = {
      id: 'calc1',
      siteId: 's1',
      version: 1,
      totalPriceMonthly: 20180,
      totalPersonnelCostMonthly: 15668,
      totalOverheadMonthly: 1880,
      totalProfitMonthly: 2632,
      hoursDay: 112,
      hoursNight: 56,
      hoursSaturday: 32,
      hoursSunday: 32,
      hoursHoliday: 16,
      riskSurchargePercentage: 10,
      distanceSurcharge: 0.5,
      notes: 'Test notes',
      site: { id: 's1', name: 'Messe Berlin', address: 'Messedamm 22', city: 'Berlin' },
      calculator: { id: 'u1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com' },
    };
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(mockCalc);
    const res = await request(app).get('/api/sites/s1/calculations/calc1/pdf');
    // PDF generation should return 200 with application/pdf content type
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('GET /api/sites/:siteId/calculations/:id/pdf → 404 (calculation not found)', async () => {
    (global as any).prismaMock.siteCalculation.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/sites/s1/calculations/unknown/pdf');
    expect(res.status).toBe(404);
  });
});

describe('Wizard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const pm = (global as any).prismaMock;
    pm.site.create.mockReset();
    pm.customer.findMany.mockReset();
    pm.customer.create.mockReset();
    pm.siteTemplate.findMany.mockReset();
  });

  it('POST /api/sites → 201 (Wizard: Complete site with security concept)', async () => {
    const wizardPayload = {
      name: 'Wizard Test Objekt',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      buildingType: 'Bürogebäude',
      floorCount: 5,
      squareMeters: 2000,
      customerId: 'customer-123',
      requiredStaff: 3,
      requiredQualifications: ['34a', 'Erste Hilfe'],
      securityConcept: {
        tasks: ['Türdienst', 'Kontrollgang'],
        shiftModel: '3-Schicht-System',
        hoursPerWeek: 168,
        templateId: 'template-1',
        templateName: 'Standard Büro',
      },
      emergencyContacts: [
        { name: 'Hausmeister', phone: '+49111111111', role: 'Gebäudeverwaltung' },
      ],
      description: 'Premium Bürogebäude',
      notes: 'Kalkulation: Sonderkonditionen vereinbart\n\nHinweise: Zugang nur mit Schlüsselkarte',
    };

    (global as any).prismaMock.site.create.mockResolvedValueOnce({
      id: 'site-123',
      ...wizardPayload
    });

    const res = await request(app).post('/api/sites').send(wizardPayload);

    expect(res.status).toBe(201);
    expect((global as any).prismaMock.site.create).toHaveBeenCalled();

    // Verify securityConcept was passed correctly
    const createCall = (global as any).prismaMock.site.create.mock.calls[0][0];
    expect(createCall.data.securityConcept).toBeDefined();
    expect(createCall.data.requiredStaff).toBe(3);
    expect(createCall.data.requiredQualifications).toEqual(['34a', 'Erste Hilfe']);
  });

  it('POST /api/sites → 201 (Wizard: Minimal required fields only)', async () => {
    const minimalPayload = {
      name: 'Minimal Objekt',
      address: 'Straße 1',
      city: 'Hamburg',
      postalCode: '20095',
    };

    (global as any).prismaMock.site.create.mockResolvedValueOnce({
      id: 'site-456',
      ...minimalPayload
    });

    const res = await request(app).post('/api/sites').send(minimalPayload);

    expect(res.status).toBe(201);
    expect((global as any).prismaMock.site.create).toHaveBeenCalled();
  });

  it('POST /api/sites → 422 (Wizard: Missing required field siteName)', async () => {
    const invalidPayload = {
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      // Missing 'name'
    };

    const res = await request(app).post('/api/sites').send(invalidPayload);

    expect(res.status).toBe(422);
  });

  it('POST /api/sites → 201 (Wizard: With emergency contacts)', async () => {
    const payload = {
      name: 'Objekt mit Notfallkontakten',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      emergencyContacts: [
        { name: 'Hausmeister', phone: '+49111', role: 'Technik' },
        { name: 'Eigentümer', phone: '+49222' },
      ],
    };

    (global as any).prismaMock.site.create.mockResolvedValueOnce({
      id: 'site-789',
      ...payload
    });

    const res = await request(app).post('/api/sites').send(payload);

    expect(res.status).toBe(201);

    const createCall = (global as any).prismaMock.site.create.mock.calls[0][0];
    expect(createCall.data.emergencyContacts).toHaveLength(2);
  });

  it('POST /api/sites → 201 (Wizard: With customer information)', async () => {
    const payload = {
      name: 'Objekt mit Kundeninfo',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      customerName: 'Max Mustermann',
      customerCompany: 'Test GmbH',
      customerEmail: 'max@test.de',
      customerPhone: '+49123456789',
    };

    (global as any).prismaMock.site.create.mockResolvedValueOnce({
      id: 'site-abc',
      ...payload
    });

    const res = await request(app).post('/api/sites').send(payload);

    expect(res.status).toBe(201);

    const createCall = (global as any).prismaMock.site.create.mock.calls[0][0];
    expect(createCall.data.customerName).toBe('Max Mustermann');
    expect(createCall.data.customerCompany).toBe('Test GmbH');
  });

  it('GET /api/customers → 200 (Wizard: List customers for selection)', async () => {
    const mockCustomers = [
      {
        id: 'c1',
        companyName: 'Test GmbH',
        city: 'Berlin',
        postalCode: '10115',
        primaryContact: { name: 'Test User', email: 'test@example.com', phone: '+49123' },
      },
      {
        id: 'c2',
        companyName: 'Demo AG',
        city: 'Hamburg',
        postalCode: '20095',
        primaryContact: { name: 'Demo User', email: 'demo@example.com', phone: '+49456' },
      },
    ];

    (global as any).prismaMock.customer.findMany.mockResolvedValueOnce(mockCustomers);

    const res = await request(app).get('/api/customers');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect((global as any).prismaMock.customer.findMany).toHaveBeenCalled();
  });

  it('POST /api/customers → 201 (Wizard: Create new customer inline)', async () => {
    const newCustomer = {
      companyName: 'Neue Firma GmbH',
      city: 'München',
      postalCode: '80331',
      primaryContact: {
        name: 'Hans Schmidt',
        email: 'hans@neue-firma.de',
        phone: '+49789',
      },
    };

    (global as any).prismaMock.customer.create.mockResolvedValueOnce({
      id: 'c-new',
      ...newCustomer
    });

    const res = await request(app).post('/api/customers').send(newCustomer);

    expect(res.status).toBe(201);
    expect((global as any).prismaMock.customer.create).toHaveBeenCalled();
  });

  it('GET /api/templates → 200 (Wizard: List security concept templates)', async () => {
    const mockTemplates = [
      {
        id: 't1',
        name: 'Standard Büro',
        tasks: ['Empfang', 'Türdienst'],
        shiftModel: '2-Schicht-System',
        hoursPerWeek: 80,
        requiredStaff: 2,
        requiredQualifications: ['34a'],
      },
      {
        id: 't2',
        name: 'Premium Industrie',
        tasks: ['Werkschutz', 'Kontrollgang', 'Videoüberwachung'],
        shiftModel: '3-Schicht-System',
        hoursPerWeek: 168,
        requiredStaff: 4,
        requiredQualifications: ['34a', 'Erste Hilfe', 'Brandschutz'],
      },
    ];

    (global as any).prismaMock.siteTemplate.findMany.mockResolvedValueOnce(mockTemplates);

    const res = await request(app).get('/api/templates');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect((global as any).prismaMock.siteTemplate.findMany).toHaveBeenCalled();
  });

  it('POST /api/sites → 201 (Wizard: Site with template-based security concept)', async () => {
    const payload = {
      name: 'Objekt mit Template',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      securityConcept: {
        templateId: 'template-1',
        templateName: 'Standard Büro',
        tasks: ['Empfang', 'Türdienst', 'Zusätzliche Aufgabe'],
        shiftModel: '2-Schicht-System',
        hoursPerWeek: 80,
      },
      requiredStaff: 2,
      requiredQualifications: ['34a'],
    };

    (global as any).prismaMock.site.create.mockResolvedValueOnce({
      id: 'site-template',
      ...payload
    });

    const res = await request(app).post('/api/sites').send(payload);

    expect(res.status).toBe(201);

    const createCall = (global as any).prismaMock.site.create.mock.calls[0][0];
    expect(createCall.data.securityConcept.templateId).toBe('template-1');
    expect(createCall.data.securityConcept.tasks).toContain('Zusätzliche Aufgabe');
  });
});
