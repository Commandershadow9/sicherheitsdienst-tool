import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { streamCsv } from '../utils/csv';
import { submitAuditEvent } from '../utils/audit';

const toAuditErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'UNKNOWN_ERROR');

const normalizePrismaTarget = (target: unknown): string[] | undefined => {
  if (!target) return undefined;
  if (Array.isArray(target)) return target.map((entry) => String(entry));
  return [String(target)];
};


// GET /api/users - Alle Mitarbeiter abrufen
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const q = req.query as Record<string, any>;
  // Defaults (stabil)
  const page = Math.max(parseInt((q.page as string) || '1', 10), 1);
  const pageSizeRaw = parseInt((q.pageSize as string) || (q.pagesize as string) || '25', 10);
  const pageSize = Math.min(Math.max(pageSizeRaw || 25, 1), 100);
  const sortBy = (q.sortBy as string) || 'firstName';
  const sortDir = (q.sortDir as string) === 'desc' ? 'desc' : 'asc';
  const queryText = (q.query as string) || '';

  // Filter sammeln (kompatibel)
  const filtersFromQueryParam = (q.filter as Record<string, string>) || {};
  const filters: Record<string, string> = { ...filtersFromQueryParam };
  for (const key of Object.keys(q)) {
    const m = key.match(/^filter\[(.+)\]$/);
    if (m) filters[m[1]] = String(q[key] as any);
  }
  if (typeof q.role === 'string' && q.role) filters.role = q.role;
  if (typeof q.isActive !== 'undefined') filters.isActive = String(q.isActive);

  const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt', 'role', 'isActive'];
  if (sortBy && !allowedSortFields.includes(sortBy)) {
    const error = createError(400, `Ungültiges Sortierfeld: ${sortBy}`);
    (error as any).allowedFields = allowedSortFields;
    return next(error);
  }

  const where: Record<string, unknown> = {};
  if (queryText) {
    where.OR = [
      { email: { contains: queryText, mode: 'insensitive' } },
      { firstName: { contains: queryText, mode: 'insensitive' } },
      { lastName: { contains: queryText, mode: 'insensitive' } },
    ];
  }
  if (filters) {
    if (typeof filters.firstName === 'string' && filters.firstName)
      where.firstName = { contains: filters.firstName, mode: 'insensitive' };
    if (typeof filters.lastName === 'string' && filters.lastName)
      where.lastName = { contains: filters.lastName, mode: 'insensitive' };
    if (typeof filters.email === 'string' && filters.email)
      where.email = { contains: filters.email, mode: 'insensitive' };
    if (typeof filters.employeeId === 'string' && filters.employeeId)
      where.employeeId = { contains: filters.employeeId, mode: 'insensitive' };
    if (typeof filters.role === 'string' && filters.role) where.role = filters.role as any;
    if (typeof filters.isActive === 'string' && filters.isActive)
      where.isActive = filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined;
  }

  const select = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true,
    employeeId: true,
    isActive: true,
    hireDate: true,
    qualifications: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const skip = (page - 1) * pageSize;

  // Export: gleiche Filter, keine Pagination
  const accept = (req.headers['accept'] as string) || '';
  if (accept.includes('text/csv') || accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    const all = await prisma.user.findMany({ where, select, orderBy: { [sortBy]: sortDir as any } });
    if (accept.includes('text/csv')) {
      const header = ['id','email','firstName','lastName','phone','role','employeeId','isActive','hireDate','qualifications','createdAt','updatedAt'];
      async function* rows() {
        for (const u of all as any[]) {
          yield {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone ?? '',
            role: u.role,
            employeeId: u.employeeId ?? '',
            isActive: u.isActive ? 'true' : 'false',
            hireDate: u.hireDate ? new Date(u.hireDate).toISOString() : '',
            qualifications: Array.isArray(u.qualifications) ? u.qualifications.join('|') : '',
            createdAt: new Date(u.createdAt).toISOString(),
            updatedAt: new Date(u.updatedAt).toISOString(),
          } as Record<string, unknown>;
        }
      }
      await streamCsv(res, 'users.csv', header, rows());
      return;
    }
    // XLSX-Export
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('users');
    const header = ['id','email','firstName','lastName','phone','role','employeeId','isActive','hireDate','qualifications','createdAt','updatedAt'];
    ws.addRow(header);
    for (const u of all as any[]) {
      ws.addRow([
        u.id,
        u.email,
        u.firstName,
        u.lastName,
        u.phone ?? '',
        u.role,
        u.employeeId ?? '',
        u.isActive ? 'true' : 'false',
        u.hireDate ? new Date(u.hireDate).toISOString() : '',
        Array.isArray(u.qualifications) ? u.qualifications.join('|') : '',
        new Date(u.createdAt).toISOString(),
        new Date(u.updatedAt).toISOString(),
      ]);
    }
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="users.xlsx"');
    res.setHeader('Content-Length', String(buffer.length));
    res.status(200).end(buffer);
    return;
  }

  const data = await prisma.user.findMany({ where, select, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

  res.json({ data, pagination: { page, pageSize, total, totalPages }, sort: { by: sortBy, dir: sortDir }, filters: Object.keys(where).length ? filters : undefined });
};

// POST /api/users - Neuen Mitarbeiter erstellen
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role = 'EMPLOYEE',
    employeeId,
    hireDate,
    qualifications = [],
  } = req.body;

  try {
    const missingFields = ['email', 'password', 'firstName', 'lastName'].filter((field) => {
      const value = (req.body as Record<string, unknown>)[field];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });
    if (missingFields.length > 0) {
      await submitAuditEvent(req, {
        action: 'USER.CREATE.FAIL',
        resourceType: 'USER',
        resourceId: null,
        outcome: 'FAIL',
        data: { reason: 'VALIDATION', missing: missingFields },
      });
      return next(createError(400, 'Email, Passwort, Vorname und Nachname sind erforderlich'));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 🔐 MULTI-TENANCY: customerId vom authentifizierten User übernehmen
    const customerId = req.user?.customerId;
    if (!customerId) {
      return next(createError(403, 'Keine Customer-Zuordnung gefunden'));
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role as any,
        employeeId,
        hireDate: hireDate ? new Date(hireDate) : null,
        qualifications: Array.isArray(qualifications) ? qualifications : [],
        customerId, // 🔐 Multi-Tenancy
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        employeeId: true,
        isActive: true,
        hireDate: true,
        qualifications: true,
        createdAt: true,
      },
    });

    await submitAuditEvent(req, {
      action: 'USER.CREATE.SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      outcome: 'SUCCESS',
      data: { id: user.id, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'Mitarbeiter erfolgreich in Datenbank erstellt',
      data: user,
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      await submitAuditEvent(req, {
        action: 'USER.CREATE.FAIL',
        resourceType: 'USER',
        resourceId: null,
        outcome: 'FAIL',
        data: {
          reason: 'UNIQUE_CONSTRAINT',
          target: normalizePrismaTarget((error as any)?.meta?.target),
          email,
          employeeId,
        },
      });
      return next(createError(400, 'E-Mail oder Mitarbeiter-ID bereits in Datenbank vergeben'));
    }

    await submitAuditEvent(req, {
      action: 'USER.CREATE.ERROR',
      resourceType: 'USER',
      resourceId: null,
      outcome: 'ERROR',
      data: { error: toAuditErrorMessage(error), email },
    });
    return next(error);
  }
};

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      employeeId: true,
      isActive: true,
      hireDate: true,
      qualifications: true,
      createdAt: true,
      shifts: {
        include: {
          shift: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              location: true,
              status: true,
            },
          },
        },
      },
      timeEntries: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          breakTime: true,
          notes: true,
        },
        orderBy: {
          startTime: 'desc',
        },
        take: 10, // Letzte 10 Einträge
      },
    },
  });

  if (!user) {
    return next(createError(404, 'Mitarbeiter nicht in Datenbank gefunden'));
  }

  res.json({
    success: true,
    message: `Mitarbeiter ${user.firstName} ${user.lastName} aus Datenbank geladen`,
    data: user,
  });
};

// PUT /api/users/:id - Mitarbeiter aktualisieren
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const {
    email,
    firstName,
    lastName,
    phone,
    role,
    employeeId,
    hireDate,
    qualifications,
    isActive,
  } = req.body;

  try {
    const actor = req.user as any;
    const isAdmin = actor?.role === 'ADMIN';
    const isSelf = actor?.id === id;
    if (!isAdmin) {
      if (!isSelf) {
        await submitAuditEvent(req, {
          action: 'USER.UPDATE.DENIED',
          resourceType: 'USER',
          resourceId: id,
          outcome: 'DENIED',
          data: { reason: 'RBAC_BLOCK' },
        });
        return next(createError(403, 'Keine Berechtigung für diese Aktion.'));
      }
      const providedKeys = Object.keys(req.body || {});
      const allowedForSelf = new Set(['email', 'firstName', 'lastName', 'phone']);
      const disallowed = providedKeys.filter((k) => !allowedForSelf.has(k));
      if (disallowed.length > 0) {
        await submitAuditEvent(req, {
          action: 'USER.UPDATE.DENIED',
          resourceType: 'USER',
          resourceId: id,
          outcome: 'DENIED',
          data: { reason: 'FIELD_RESTRICTED', fields: disallowed },
        });
        return next(createError(403, `Nicht erlaubt, folgende Felder zu ändern: ${disallowed.join(', ')}`));
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(role && { role: role as any }),
        ...(employeeId !== undefined && { employeeId }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(qualifications && {
          qualifications: Array.isArray(qualifications) ? qualifications : [],
        }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        employeeId: true,
        isActive: true,
        hireDate: true,
        qualifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await submitAuditEvent(req, {
      action: 'USER.UPDATE.SUCCESS',
      resourceType: 'USER',
      resourceId: updatedUser.id,
      outcome: 'SUCCESS',
      data: {
        changes: Object.keys(req.body || {}).filter((key) => key !== 'password'),
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });

    res.json({
      success: true,
      message: 'Mitarbeiter erfolgreich aktualisiert',
      data: updatedUser,
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      await submitAuditEvent(req, {
        action: 'USER.UPDATE.FAIL',
        resourceType: 'USER',
        resourceId: id,
        outcome: 'FAIL',
        data: {
          reason: 'UNIQUE_CONSTRAINT',
          target: normalizePrismaTarget((error as any)?.meta?.target),
        },
      });
      return next(createError(400, 'E-Mail oder Mitarbeiter-ID bereits in Datenbank vergeben'));
    }
    if (error?.code === 'P2025') {
      await submitAuditEvent(req, {
        action: 'USER.UPDATE.FAIL',
        resourceType: 'USER',
        resourceId: id,
        outcome: 'FAIL',
        data: { reason: 'NOT_FOUND' },
      });
      return next(createError(404, 'Mitarbeiter nicht in Datenbank gefunden'));
    }

    await submitAuditEvent(req, {
      action: 'USER.UPDATE.ERROR',
      resourceType: 'USER',
      resourceId: id,
      outcome: 'ERROR',
      data: { error: toAuditErrorMessage(error) },
    });
    return next(error);
  }
};

// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
      },
    });

    await submitAuditEvent(req, {
      action: 'USER.DEACTIVATE.SUCCESS',
      resourceType: 'USER',
      resourceId: deactivatedUser.id,
      outcome: 'SUCCESS',
      data: { email: deactivatedUser.email },
    });

    res.json({
      success: true,
      message: 'Mitarbeiter erfolgreich deaktiviert',
      data: deactivatedUser,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      await submitAuditEvent(req, {
        action: 'USER.DEACTIVATE.FAIL',
        resourceType: 'USER',
        resourceId: id,
        outcome: 'FAIL',
        data: { reason: 'NOT_FOUND' },
      });
      return next(createError(404, 'Mitarbeiter nicht in Datenbank gefunden'));
    }

    await submitAuditEvent(req, {
      action: 'USER.DEACTIVATE.ERROR',
      resourceType: 'USER',
      resourceId: id,
      outcome: 'ERROR',
      data: { error: toAuditErrorMessage(error) },
    });
    return next(error);
  }
};
