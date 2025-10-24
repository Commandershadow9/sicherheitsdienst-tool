import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/templates
 * Liste aller aktiven Vorlagen
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { buildingType } = req.query;

    const where: Prisma.SiteTemplateWhereInput = {
      isActive: true,
    };

    if (buildingType) {
      where.buildingType = buildingType as any;
    }

    const templates = await prisma.siteTemplate.findMany({
      where,
      orderBy: [
        { buildingType: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({ templates });
    return;
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Vorlagen' });
    return;
  }
};

/**
 * GET /api/templates/:id
 * Einzelne Vorlage abrufen
 */
export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await prisma.siteTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      res.status(404).json({ error: 'Vorlage nicht gefunden' });
      return;
    }

    res.json(template);
    return;
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Vorlage' });
    return;
  }
};

/**
 * POST /api/templates
 * Neue Vorlage erstellen
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      buildingType,
      hoursPerWeek,
      shiftModel,
      requiredStaff,
      requiredQualifications,
      tasks,
      basePrice,
    } = req.body;

    // Validierung
    if (!name || !buildingType || !hoursPerWeek || !shiftModel || !requiredStaff || !basePrice) {
      res.status(400).json({
        error: 'Name, Gebäudetyp, Stunden/Woche, Schichtmodell, Personal und Preis sind Pflichtfelder',
      });
      return;
    }

    const template = await prisma.siteTemplate.create({
      data: {
        name,
        description,
        buildingType,
        hoursPerWeek: parseInt(hoursPerWeek),
        shiftModel,
        requiredStaff: parseInt(requiredStaff),
        requiredQualifications: requiredQualifications || [],
        tasks: tasks || [],
        basePrice: parseFloat(basePrice),
        isActive: true,
      },
    });

    res.status(201).json(template);
    return;
  } catch (error) {
    console.error('Error creating template:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'Eine Vorlage mit diesem Namen existiert bereits',
        });
        return;
      }
    }

    res.status(500).json({ error: 'Fehler beim Erstellen der Vorlage' });
    return;
  }
};

/**
 * PUT /api/templates/:id
 * Vorlage aktualisieren
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      buildingType,
      hoursPerWeek,
      shiftModel,
      requiredStaff,
      requiredQualifications,
      tasks,
      basePrice,
      isActive,
    } = req.body;

    // Prüfen ob Vorlage existiert
    const existingTemplate = await prisma.siteTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      res.status(404).json({ error: 'Vorlage nicht gefunden' });
      return;
    }

    const template = await prisma.siteTemplate.update({
      where: { id },
      data: {
        name,
        description,
        buildingType,
        hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : undefined,
        shiftModel,
        requiredStaff: requiredStaff ? parseInt(requiredStaff) : undefined,
        requiredQualifications,
        tasks,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        isActive,
      },
    });

    res.json(template);
    return;
  } catch (error) {
    console.error('Error updating template:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'Eine Vorlage mit diesem Namen existiert bereits',
        });
        return;
      }
    }

    res.status(500).json({ error: 'Fehler beim Aktualisieren der Vorlage' });
    return;
  }
};

/**
 * DELETE /api/templates/:id
 * Vorlage löschen (oder deaktivieren)
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Prüfen ob Vorlage existiert
    const template = await prisma.siteTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      res.status(404).json({ error: 'Vorlage nicht gefunden' });
      return;
    }

    if (permanent === 'true') {
      // Permanent löschen
      await prisma.siteTemplate.delete({
        where: { id },
      });
      res.status(204).send();
      return;
    } else {
      // Nur deaktivieren
      const updated = await prisma.siteTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      res.json(updated);
      return;
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Vorlage' });
    return;
  }
};
