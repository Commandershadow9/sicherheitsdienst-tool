/**
 * Unit-Tests für Shift Template Service
 * Tests für Template CRUD und Anwendung
 */

import {
  createShiftTemplate,
  getShiftTemplates,
  applyTemplateToSite,
} from '../services/shiftTemplateService';
import { prisma } from '../lib/db';

jest.mock('../lib/db', () => ({
  prisma: {
    shiftTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shift: {
      create: jest.fn(),
    },
  },
}));

describe('ShiftTemplateService - createShiftTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create template with calculated duration', async () => {
    const templateData = {
      name: 'Tagschicht Standard',
      shiftType: 'REGULAR' as const,
      startTime: '08:00',
      endTime: '16:00',
      requiredStaff: 2,
      customerId: 'customer1',
    };

    (prisma.shiftTemplate.create as jest.Mock).mockResolvedValue({
      id: 'template1',
      ...templateData,
      duration: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createShiftTemplate(templateData);

    expect(result.duration).toBe(8); // 16:00 - 08:00 = 8h
    expect(prisma.shiftTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          duration: 8,
        }),
      })
    );
  });

  it('should handle night shift duration calculation (crossing midnight)', async () => {
    const templateData = {
      name: 'Nachtschicht',
      shiftType: 'NIGHT' as const,
      startTime: '22:00',
      endTime: '06:00',
      requiredStaff: 3,
      customerId: 'customer1',
    };

    (prisma.shiftTemplate.create as jest.Mock).mockResolvedValue({
      id: 'template2',
      ...templateData,
      duration: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createShiftTemplate(templateData);

    expect(result.duration).toBe(8); // 22:00 bis 06:00 = 8h
  });

  it('should use custom duration if provided', async () => {
    const templateData = {
      name: 'Flexible Schicht',
      shiftType: 'REGULAR' as const,
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 1,
      customerId: 'customer1',
      duration: 10, // Custom duration
    };

    (prisma.shiftTemplate.create as jest.Mock).mockResolvedValue({
      id: 'template3',
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createShiftTemplate(templateData);

    expect(result.duration).toBe(10);
    expect(prisma.shiftTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          duration: 10,
        }),
      })
    );
  });
});

describe('ShiftTemplateService - getShiftTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return templates for customer', async () => {
    const mockTemplates = [
      {
        id: 'template1',
        name: 'Frühschicht',
        shiftType: 'REGULAR',
        startTime: '06:00',
        endTime: '14:00',
        duration: 8,
        requiredStaff: 2,
        customerId: 'customer1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'template2',
        name: 'Spätschicht',
        shiftType: 'REGULAR',
        startTime: '14:00',
        endTime: '22:00',
        duration: 8,
        requiredStaff: 2,
        customerId: 'customer1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.shiftTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);

    const result = await getShiftTemplates({ customerId: 'customer1' });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Frühschicht');
    expect(result[1].name).toBe('Spätschicht');
  });

  it('should filter templates by shiftType', async () => {
    const mockTemplates = [
      {
        id: 'template3',
        name: 'Nachtschicht',
        shiftType: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        duration: 8,
        requiredStaff: 3,
        customerId: 'customer1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.shiftTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);

    const result = await getShiftTemplates({ customerId: 'customer1', shiftType: 'NIGHT' });

    expect(result).toHaveLength(1);
    expect(result[0].shiftType).toBe('NIGHT');
    expect(prisma.shiftTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shiftType: 'NIGHT',
        }),
      })
    );
  });
});

describe('ShiftTemplateService - applyTemplateToSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create shift from template for single date', async () => {
    const mockTemplate = {
      id: 'template1',
      name: 'Tagschicht',
      shiftType: 'REGULAR',
      startTime: '08:00',
      endTime: '16:00',
      duration: 8,
      requiredStaff: 2,
      requiredQualifications: ['Erste Hilfe'],
      wageMultiplier: 1.0,
      color: '#3B82F6',
      description: 'Standard Tagschicht',
      customerId: 'customer1',
    };

    (prisma.shiftTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.shift.create as jest.Mock).mockResolvedValue({
      id: 'shift1',
      siteId: 'site1',
      title: 'Tagschicht',
      startTime: new Date('2025-01-10T08:00:00Z'),
      endTime: new Date('2025-01-10T16:00:00Z'),
      requiredEmployees: 2,
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await applyTemplateToSite({
      templateId: 'template1',
      siteId: 'site1',
      dates: [new Date('2025-01-10')],
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tagschicht');
    expect(prisma.shift.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          siteId: 'site1',
          title: 'Tagschicht',
          requiredEmployees: 2,
        }),
      })
    );
  });

  it('should create multiple shifts for date range', async () => {
    const mockTemplate = {
      id: 'template2',
      name: 'Bewachung',
      shiftType: 'REGULAR',
      startTime: '10:00',
      endTime: '18:00',
      duration: 8,
      requiredStaff: 1,
      requiredQualifications: [],
      customerId: 'customer1',
    };

    (prisma.shiftTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.shift.create as jest.Mock)
      .mockResolvedValueOnce({
        id: 'shift1',
        siteId: 'site1',
        title: 'Bewachung',
        startTime: new Date('2025-01-10T10:00:00Z'),
        endTime: new Date('2025-01-10T18:00:00Z'),
        requiredEmployees: 1,
        status: 'PLANNED',
      })
      .mockResolvedValueOnce({
        id: 'shift2',
        siteId: 'site1',
        title: 'Bewachung',
        startTime: new Date('2025-01-11T10:00:00Z'),
        endTime: new Date('2025-01-11T18:00:00Z'),
        requiredEmployees: 1,
        status: 'PLANNED',
      })
      .mockResolvedValueOnce({
        id: 'shift3',
        siteId: 'site1',
        title: 'Bewachung',
        startTime: new Date('2025-01-12T10:00:00Z'),
        endTime: new Date('2025-01-12T18:00:00Z'),
        requiredEmployees: 1,
        status: 'PLANNED',
      });

    const dates = [
      new Date('2025-01-10'),
      new Date('2025-01-11'),
      new Date('2025-01-12'),
    ];

    const result = await applyTemplateToSite({
      templateId: 'template2',
      siteId: 'site1',
      dates,
    });

    expect(result).toHaveLength(3);
    expect(prisma.shift.create).toHaveBeenCalledTimes(3);
  });

  it('should throw error if template not found', async () => {
    (prisma.shiftTemplate.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      applyTemplateToSite({
        templateId: 'nonexistent',
        siteId: 'site1',
        dates: [new Date('2025-01-10')],
      })
    ).rejects.toThrow('Template nicht gefunden');
  });

  it('should override template values if provided', async () => {
    const mockTemplate = {
      id: 'template3',
      name: 'Basisschicht',
      shiftType: 'REGULAR',
      startTime: '08:00',
      endTime: '16:00',
      duration: 8,
      requiredStaff: 2,
      requiredQualifications: [],
      customerId: 'customer1',
    };

    (prisma.shiftTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.shift.create as jest.Mock).mockResolvedValue({
      id: 'shift4',
      siteId: 'site1',
      title: 'Spezielle Schicht',
      startTime: new Date('2025-01-10T08:00:00Z'),
      endTime: new Date('2025-01-10T16:00:00Z'),
      requiredEmployees: 5,
      requiredQualifications: ['Waffenschein'],
      status: 'PLANNED',
    });

    const result = await applyTemplateToSite({
      templateId: 'template3',
      siteId: 'site1',
      dates: [new Date('2025-01-10')],
      overrides: {
        title: 'Spezielle Schicht',
        requiredEmployees: 5,
        requiredQualifications: ['Waffenschein'],
      },
    });

    expect(result[0].title).toBe('Spezielle Schicht');
    expect(result[0].requiredEmployees).toBe(5);
    expect(prisma.shift.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Spezielle Schicht',
          requiredEmployees: 5,
        }),
      })
    );
  });
});
