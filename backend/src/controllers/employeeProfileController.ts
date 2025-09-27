import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { EmploymentType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';

const profileSelect: Prisma.EmployeeProfileSelect = {
  id: true,
  address: true,
  birthDate: true,
  phone: true,
  employmentType: true,
  employmentStart: true,
  employmentEnd: true,
  workSchedule: true,
  hourlyRate: true,
  weeklyTargetHours: true,
  monthlyTargetHours: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  qualifications: {
    orderBy: { validUntil: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      validFrom: true,
      validUntil: true,
    },
  },
  documents: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      filename: true,
      mimeType: true,
      size: true,
      storedAt: true,
      issuedAt: true,
      expiresAt: true,
      createdAt: true,
      uploadedBy: true,
    },
  },
};

function canManage(role: string | undefined) {
  return role === 'ADMIN' || role === 'MANAGER';
}

function resolveTargetUserId(req: Request): string {
  const paramId = req.params.id;
  if (!paramId || paramId === 'me') {
    return req.user!.id;
  }
  return paramId;
}

function ensureSelfOrManager(req: Request, targetUserId: string, extraRoles: string[] = []) {
  if (canManage(req.user!.role) || extraRoles.includes(req.user!.role)) return;
  if (req.user!.id === targetUserId) return;
  throw createError(403, 'Keine Berechtigung für diese Aktion.');
}

function sanitizeAddress(address: unknown): { apply: boolean; value?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput } {
  if (address === undefined) {
    return { apply: false };
  }
  if (address === null) {
    return { apply: true, value: Prisma.JsonNull };
  }
  const { street, postalCode, city, country } = address as Record<string, unknown>;
  const sanitized = {
    street: typeof street === 'string' && street.trim().length > 0 ? street.trim() : undefined,
    postalCode: typeof postalCode === 'string' && postalCode.trim().length > 0 ? postalCode.trim() : undefined,
    city: typeof city === 'string' && city.trim().length > 0 ? city.trim() : undefined,
    country: typeof country === 'string' && country.trim().length > 0 ? country.trim() : undefined,
  };
  const hasValue = Object.values(sanitized).some(Boolean);
  if (!hasValue) {
    return { apply: true, value: Prisma.JsonNull };
  }
  return { apply: true, value: sanitized };
}

async function ensureProfile(userId: string) {
  const existing = await prisma.employeeProfile.findUnique({ where: { userId } });
  if (existing) return existing.id;
  const created = await prisma.employeeProfile.create({
    data: {
      userId,
      employmentType: EmploymentType.FULL_TIME,
    },
    select: { id: true },
  });
  return created.id;
}

function toHours(entries: { startTime: Date; endTime: Date | null; breakTime: number | null }[]): number {
  return entries.reduce((sum, entry) => {
    if (!entry.endTime) return sum;
    const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
    const breakMs = entry.breakTime ? entry.breakTime * 60_000 : 0;
    const effective = Math.max(diffMs - breakMs, 0);
    return sum + effective;
  }, 0) / (1000 * 60 * 60);
}

async function buildTimeSummary(userId: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const last7 = new Date(now);
  last7.setDate(last7.getDate() - 7);

  const [entries7, entries30, entriesYear] = await Promise.all([
    prisma.timeEntry.findMany({ where: { userId, startTime: { gte: last7 } }, select: { startTime: true, endTime: true, breakTime: true } }),
    prisma.timeEntry.findMany({ where: { userId, startTime: { gte: last30 } }, select: { startTime: true, endTime: true, breakTime: true } }),
    prisma.timeEntry.findMany({ where: { userId, startTime: { gte: startOfYear } }, select: { startTime: true, endTime: true, breakTime: true } }),
  ]);

  return {
    last7Days: toHours(entries7),
    last30Days: toHours(entries30),
    yearToDate: toHours(entriesYear),
  };
}

async function fetchProfilePayload(userId: string) {
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
        hireDate: true,
        qualifications: true,
      },
    }),
    prisma.employeeProfile.findUnique({ where: { userId }, select: profileSelect }),
  ]);

  if (!user) {
    throw createError(404, 'Mitarbeiter nicht gefunden.');
  }

  const timeSummary = await buildTimeSummary(userId);
  const upcomingAbsences = await prisma.absence.findMany({
    where: {
      userId,
      status: 'APPROVED',
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: 'asc' },
    take: 5,
    select: {
      id: true,
      type: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });

  return {
    user,
    profile: profile ?? null,
    qualifications: profile?.qualifications ?? [],
    documents: profile?.documents ?? [],
    timeSummary,
    upcomingAbsences,
  };
}

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId, ['DISPATCHER']);
    const payload = await fetchProfilePayload(targetUserId);
    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
};

const SELF_ALLOWED_FIELDS = new Set(['address', 'phone']);

export const upsertProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId);

    const input = req.body as Record<string, any>;
    const updateData: Prisma.EmployeeProfileUpdateInput = {};

    const addressResult = sanitizeAddress(input.address);
    if (addressResult.apply) {
      updateData.address = addressResult.value;
    }

    if (input.birthDate !== undefined) {
      updateData.birthDate = input.birthDate ? new Date(input.birthDate) : null;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone?.trim() || null;
    }
    if (input.employmentType !== undefined && canManage(actor.role)) {
      updateData.employmentType = input.employmentType as EmploymentType;
    }
    if (input.employmentStart !== undefined && canManage(actor.role)) {
      updateData.employmentStart = input.employmentStart ? new Date(input.employmentStart) : null;
    }
    if (input.employmentEnd !== undefined && canManage(actor.role)) {
      updateData.employmentEnd = input.employmentEnd ? new Date(input.employmentEnd) : null;
    }
    if (input.workSchedule !== undefined && canManage(actor.role)) {
      updateData.workSchedule = input.workSchedule?.trim() || null;
    }
    if (input.hourlyRate !== undefined && canManage(actor.role)) {
      updateData.hourlyRate = input.hourlyRate === '' || input.hourlyRate === null || input.hourlyRate === undefined
        ? null
        : new Prisma.Decimal(input.hourlyRate);
    }
    if (input.weeklyTargetHours !== undefined && canManage(actor.role)) {
      updateData.weeklyTargetHours = input.weeklyTargetHours === '' || input.weeklyTargetHours === null || input.weeklyTargetHours === undefined
        ? null
        : Number(input.weeklyTargetHours);
    }
    if (input.monthlyTargetHours !== undefined && canManage(actor.role)) {
      updateData.monthlyTargetHours = input.monthlyTargetHours === '' || input.monthlyTargetHours === null || input.monthlyTargetHours === undefined
        ? null
        : Number(input.monthlyTargetHours);
    }
    if (input.notes !== undefined && canManage(actor.role)) {
      updateData.notes = input.notes?.trim() || null;
    }

    if (!canManage(actor.role)) {
      for (const key of Object.keys(updateData) as (keyof typeof updateData)[]) {
        if (!SELF_ALLOWED_FIELDS.has(key as string)) {
          delete (updateData as any)[key];
        }
      }
    }

    const profileId = await ensureProfile(targetUserId);
    if (Object.keys(updateData).length > 0) {
      await prisma.employeeProfile.update({
        where: { id: profileId },
        data: updateData,
      });
    }

    await submitAuditEvent(req, {
      action: 'EMPLOYEE.PROFILE.UPDATE',
      resourceType: 'EMPLOYEE_PROFILE',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      data: {
        fields: Object.keys(updateData),
      },
    });

    const profileSnapshot = await fetchProfilePayload(targetUserId);
    res.json({ success: true, data: profileSnapshot });
  } catch (error) {
    next(error);
  }
};

export const addQualification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId);
    const profileId = await ensureProfile(targetUserId);
    const { title, description, validFrom, validUntil } = req.body as Record<string, any>;

    const qualification = await prisma.employeeQualification.create({
      data: {
        profileId,
        title,
        description: description?.trim() || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    await submitAuditEvent(req, {
      action: 'EMPLOYEE.QUALIFICATION.ADD',
      resourceType: 'EMPLOYEE_PROFILE',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      data: { qualificationId: qualification.id, title },
    });

    const profileSnapshot = await fetchProfilePayload(targetUserId);
    res.status(201).json({ success: true, data: profileSnapshot });
  } catch (error) {
    next(error);
  }
};

export const deleteQualification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId);
    const { qualificationId } = req.params;

    const qualification = await prisma.employeeQualification.findUnique({
      where: { id: qualificationId },
      select: {
        id: true,
        profile: { select: { userId: true } },
        title: true,
      },
    });
    if (!qualification || qualification.profile.userId !== targetUserId) {
      throw createError(404, 'Qualifikation nicht gefunden.');
    }

    await prisma.employeeQualification.delete({ where: { id: qualificationId } });

    await submitAuditEvent(req, {
      action: 'EMPLOYEE.QUALIFICATION.DELETE',
      resourceType: 'EMPLOYEE_PROFILE',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      data: { qualificationId, title: qualification.title },
    });

    const profileSnapshot = await fetchProfilePayload(targetUserId);
    res.json({ success: true, data: profileSnapshot });
  } catch (error) {
    next(error);
  }
};

export const addDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId);
    const profileId = await ensureProfile(targetUserId);
    const { category, filename, mimeType, size, storedAt, issuedAt, expiresAt } = req.body as Record<string, any>;

    await prisma.employeeDocument.create({
      data: {
        profileId,
        category,
        filename,
        mimeType,
        size,
        storedAt,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        uploadedBy: actor.id,
      },
    });

    await submitAuditEvent(req, {
      action: 'EMPLOYEE.DOCUMENT.ADD',
      resourceType: 'EMPLOYEE_PROFILE',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      data: { category, filename },
    });

    const profileSnapshot = await fetchProfilePayload(targetUserId);
    res.status(201).json({ success: true, data: profileSnapshot });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = resolveTargetUserId(req);
    ensureSelfOrManager(req, targetUserId);
    const { documentId } = req.params;

    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        category: true,
        filename: true,
        profile: { select: { userId: true } },
      },
    });
    if (!document || document.profile.userId !== targetUserId) {
      throw createError(404, 'Dokument nicht gefunden.');
    }

    await prisma.employeeDocument.delete({ where: { id: documentId } });

    await submitAuditEvent(req, {
      action: 'EMPLOYEE.DOCUMENT.DELETE',
      resourceType: 'EMPLOYEE_PROFILE',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      data: { documentId, category: document.category, filename: document.filename },
    });

    const profileSnapshot = await fetchProfilePayload(targetUserId);
    res.json({ success: true, data: profileSnapshot });
  } catch (error) {
    next(error);
  }
};
