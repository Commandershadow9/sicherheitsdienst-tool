import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/sites - Alle Sites
export const getAllSites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sites = await prisma.site.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, message: `${sites.length} Sites geladen`, data: sites, count: sites.length });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites - Neue Site anlegen
export const createSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, postalCode } = req.body;
    const site = await prisma.site.create({ data: { name, address, city, postalCode } });
    res.status(201).json({ success: true, message: 'Site erfolgreich erstellt', data: site });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Site existiert bereits (Name + Adresse muss eindeutig sein).' });
      return;
    }
    next(error);
  }
};

// GET /api/sites/:id - Einzelsite
export const getSiteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    res.json({ success: true, message: 'Site geladen', data: site });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:id - Site aktualisieren
export const updateSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, address, city, postalCode } = req.body;
    const updated = await prisma.site.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
      },
    });
    res.json({ success: true, message: 'Site aktualisiert', data: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Site existiert bereits (Name + Adresse muss eindeutig sein).' });
      return;
    }
    next(error);
  }
};

// DELETE /api/sites/:id - Site löschen
export const deleteSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.site.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    next(error);
  }
};
