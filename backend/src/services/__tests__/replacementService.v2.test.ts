import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';
import { findReplacementCandidatesForShiftV2 } from '../replacementService';

describe('replacementService.findReplacementCandidatesForShiftV2', () => {
  const createdUserIds: string[] = [];
  let adminId: string;
  let approvedUserId: string;
  let requestedUserId: string;
  let availableUserId: string;
  let sickUserId: string;
  let siteId: string;
  let shiftId: string;

  beforeAll(async () => {
    const timestamp = Date.now().toString(36);
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
      data: {
        email: `admin-${timestamp}@replacement.test`,
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'Replacement',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminId = admin.id;

    const approvedUser = await prisma.user.create({
      data: {
        email: `approved-${timestamp}@replacement.test`,
        password: passwordHash,
        firstName: 'Anna',
        lastName: 'Approved',
        role: 'EMPLOYEE',
        isActive: true,
      },
    });
    approvedUserId = approvedUser.id;

    const requestedUser = await prisma.user.create({
      data: {
        email: `requested-${timestamp}@replacement.test`,
        password: passwordHash,
        firstName: 'Ralf',
        lastName: 'Requested',
        role: 'EMPLOYEE',
        isActive: true,
      },
    });
    requestedUserId = requestedUser.id;

    const availableUser = await prisma.user.create({
      data: {
        email: `available-${timestamp}@replacement.test`,
        password: passwordHash,
        firstName: 'Vera',
        lastName: 'Available',
        role: 'EMPLOYEE',
        isActive: true,
      },
    });
    availableUserId = availableUser.id;

    const sickUser = await prisma.user.create({
      data: {
        email: `sick-${timestamp}@replacement.test`,
        password: passwordHash,
        firstName: 'Silke',
        lastName: 'Sickness',
        role: 'EMPLOYEE',
        isActive: true,
      },
    });
    sickUserId = sickUser.id;

    createdUserIds.push(approvedUserId, requestedUserId, availableUserId, sickUserId);

    const site = await prisma.site.create({
      data: {
        name: `Test Site ${timestamp}`,
        address: 'Teststraße 1',
        city: 'Teststadt',
        postalCode: '12345',
      },
    });
    siteId = site.id;

    const shift = await prisma.shift.create({
      data: {
        siteId: site.id,
        title: 'Testschicht Ersatzsuche',
        description: 'Integrationstest für Ersatzsuche',
        location: 'Test Location',
        startTime: new Date('2025-12-10T08:00:00.000Z'),
        endTime: new Date('2025-12-10T16:00:00.000Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        status: 'PLANNED',
      },
    });
    shiftId = shift.id;

    const clearanceData = [
      approvedUserId,
      requestedUserId,
      availableUserId,
      sickUserId,
    ].map((userId) =>
      prisma.objectClearance.create({
        data: {
          userId,
          siteId: site.id,
          trainedAt: new Date('2025-12-01T08:00:00.000Z'),
          status: 'ACTIVE',
        },
      }),
    );
    await Promise.all(clearanceData);

    await prisma.absence.create({
      data: {
        userId: approvedUserId,
        createdById: adminId,
        decidedById: adminId,
        type: 'VACATION',
        status: 'APPROVED',
        startsAt: new Date('2025-12-10T00:00:00.000Z'),
        endsAt: new Date('2025-12-10T23:59:59.000Z'),
      },
    });

    await prisma.absence.create({
      data: {
        userId: sickUserId,
        createdById: adminId,
        decidedById: adminId,
        type: 'SICKNESS',
        status: 'APPROVED',
        startsAt: new Date('2025-12-10T00:00:00.000Z'),
        endsAt: new Date('2025-12-10T23:59:59.000Z'),
      },
    });

    await prisma.absence.create({
      data: {
        userId: requestedUserId,
        createdById: adminId,
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: new Date('2025-12-09T00:00:00.000Z'),
        endsAt: new Date('2025-12-11T23:59:59.000Z'),
      },
    });

    await prisma.absence.create({
      data: {
        userId: requestedUserId,
        createdById: adminId,
        type: 'VACATION',
        status: 'REQUESTED',
        startsAt: new Date('2025-12-08T00:00:00.000Z'),
        endsAt: new Date('2025-12-09T23:59:59.000Z'),
      },
    });
  });

  afterAll(async () => {
    await prisma.absence.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.objectClearance.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.shift.delete({
      where: { id: shiftId },
    });
    await prisma.site.delete({
      where: { id: siteId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [...createdUserIds, adminId] } },
    });
  });

  it('excludes approved absences and flags requested absences', async () => {
    const candidates = await findReplacementCandidatesForShiftV2(shiftId);

    expect(candidates.some((candidate) => candidate.id === approvedUserId)).toBe(false);
    expect(candidates.some((candidate) => candidate.id === sickUserId)).toBe(false);

    const requestedCandidate = candidates.find((candidate) => candidate.id === requestedUserId);
    expect(requestedCandidate).toBeDefined();
    expect(requestedCandidate?.warnings.length).toBeGreaterThan(0);

    const pendingWarnings = requestedCandidate?.warnings.filter(
      (warning) => warning.type === 'PENDING_ABSENCE_REQUEST',
    );
    expect(pendingWarnings).toHaveLength(1);
    pendingWarnings?.forEach((warning) => {
      expect(warning.severity).toBe('warning');
      expect(warning.message).toContain('Urlaubsantrag');
      expect(warning.message).toMatch(/Urlaubsantrag offen: \d{2}\.\d{2}\.\d{4} – \d{2}\.\d{2}\.\d{4}/);
    });

    const availableCandidate = candidates.find((candidate) => candidate.id === availableUserId);
    expect(availableCandidate).toBeDefined();
    expect(availableCandidate?.warnings.some((warning) => warning.type === 'PENDING_ABSENCE_REQUEST')).toBe(false);
  });
});
