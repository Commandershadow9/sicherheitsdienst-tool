import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/users - Alle Mitarbeiter abrufen
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);
    const sortBy = (req.query.sortBy as string) || 'firstName';
    const sortDir = (req.query.sortDir as string) === 'desc' ? 'desc' : 'asc';
    const filtersFromQueryParam = (req.query.filter as Record<string, string>) || {};
    const filters: Record<string, string> = { ...filtersFromQueryParam };
    const rawQuery = req.query as Record<string, unknown>;
    for (const key of Object.keys(rawQuery)) {
      const m = key.match(/^filter\[(.+)\]$/);
      if (m) filters[m[1]] = String(rawQuery[key] as any);
    }

    const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt', 'role', 'isActive'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      res.status(400).json({ success: false, message: `Ungültiges Sortierfeld: ${sortBy}`, allowed: allowedSortFields });
      return;
    }

    const where: any = {};
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
    const data = await prisma.user.findMany({ where, select, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    res.json({ data, pagination: { page, pageSize, total, totalPages }, sort: { by: sortBy, dir: sortDir }, filters: Object.keys(where).length ? filters : undefined });
    return;
  } catch (error) {
    console.error('Error fetching users from database:', error);
    next(error);
    return;
  }
};

// POST /api/users - Neuen Mitarbeiter erstellen
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    // Validation
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Email, Passwort, Vorname und Nachname sind erforderlich',
      });
      return;
    }

    // Password hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role as any, // TypeScript-Fix für Enum
        employeeId,
        hireDate: hireDate ? new Date(hireDate) : null,
        qualifications: Array.isArray(qualifications) ? qualifications : [],
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

    res.status(201).json({
      success: true,
      message: 'Mitarbeiter erfolgreich in Datenbank erstellt',
      data: user,
    });
  } catch (error: any) {
    console.error('Error creating user in database:', error);

    // Prisma unique constraint error
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'E-Mail oder Mitarbeiter-ID bereits in Datenbank vergeben',
      });
      return;
    }

    next(error);
  }
};

// GET /api/users/:id - Einzelnen Mitarbeiter abrufen
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      res.status(404).json({
        success: false,
        message: 'Mitarbeiter nicht in Datenbank gefunden',
      });
      return;
    }

    res.json({
      success: true,
      message: `Mitarbeiter ${user.firstName} ${user.lastName} aus Datenbank geladen`,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user from database:', error);
    next(error);
  }
};

// PUT /api/users/:id - Mitarbeiter aktualisieren
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    res.json({
      success: true,
      message: 'Mitarbeiter erfolgreich aktualisiert',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user in database:', error);

    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'E-Mail oder Mitarbeiter-ID bereits vergeben',
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Mitarbeiter nicht gefunden',
      });
      return;
    }

    next(error);
  }
};

// DELETE /api/users/:id - Mitarbeiter deaktivieren (soft delete)
export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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

    res.json({
      success: true,
      message: 'Mitarbeiter erfolgreich deaktiviert',
      data: deactivatedUser,
    });
  } catch (error: any) {
    console.error('Error deactivating user:', error);

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Mitarbeiter nicht gefunden',
      });
      return;
    }

    next(error);
  }
};
