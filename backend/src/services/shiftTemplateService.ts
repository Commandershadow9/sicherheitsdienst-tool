/**
 * Shift Template Service
 * Verwaltet wiederverwendbare Schichtmuster
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import type { ShiftType } from '@prisma/client';

export interface ShiftTemplateCreateInput {
  name: string;
  description?: string;
  shiftType?: ShiftType;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
  duration?: number;
  requiredStaff?: number;
  requiredQualifications?: string[];
  shiftModelType?: string;
  nightShift?: boolean;
  weekendShift?: boolean;
  holidayShift?: boolean;
  wageMultiplier?: number;
  color?: string;
  applicableDays?: number[];
  category?: string;
}

export interface ShiftTemplateUpdateInput extends Partial<ShiftTemplateCreateInput> {
  isActive?: boolean;
}

/**
 * Erstellt ein neues Schicht-Template
 */
export async function createShiftTemplate(data: ShiftTemplateCreateInput) {
  try {
    // Berechne Dauer wenn nicht angegeben
    let duration = data.duration;
    if (!duration) {
      duration = calculateDuration(data.startTime, data.endTime);
    }

    const template = await prisma.shiftTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        shiftType: data.shiftType || 'REGULAR',
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        requiredStaff: data.requiredStaff || 1,
        requiredQualifications: data.requiredQualifications || [],
        shiftModelType: data.shiftModelType,
        nightShift: data.nightShift || false,
        weekendShift: data.weekendShift || false,
        holidayShift: data.holidayShift || false,
        wageMultiplier: data.wageMultiplier || 1.0,
        color: data.color || '#3B82F6',
        applicableDays: data.applicableDays || [1, 2, 3, 4, 5], // Mo-Fr
        category: data.category,
      },
    });

    logger.info(`Shift Template erstellt: ${template.name} (${template.id})`);
    return template;
  } catch (error) {
    logger.error('Fehler beim Erstellen des Shift Templates:', error);
    throw error;
  }
}

/**
 * Listet alle Schicht-Templates auf
 */
export async function listShiftTemplates(options?: {
  isActive?: boolean;
  shiftType?: ShiftType;
  category?: string;
}) {
  try {
    const where: any = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.shiftType) {
      where.shiftType = options.shiftType;
    }

    if (options?.category) {
      where.category = options.category;
    }

    const templates = await prisma.shiftTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return templates;
  } catch (error) {
    logger.error('Fehler beim Laden der Shift Templates:', error);
    throw error;
  }
}

/**
 * Ruft ein einzelnes Template ab
 */
export async function getShiftTemplate(id: string) {
  try {
    const template = await prisma.shiftTemplate.findUnique({
      where: { id },
      include: {
        sites: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return template;
  } catch (error) {
    logger.error(`Fehler beim Laden des Shift Templates ${id}:`, error);
    throw error;
  }
}

/**
 * Aktualisiert ein Template
 */
export async function updateShiftTemplate(id: string, data: ShiftTemplateUpdateInput) {
  try {
    // Berechne Dauer neu wenn Start oder End-Zeit geändert wurde
    let duration = data.duration;
    if ((data.startTime || data.endTime) && !duration) {
      const template = await prisma.shiftTemplate.findUnique({
        where: { id },
        select: { startTime: true, endTime: true },
      });

      if (template) {
        const start = data.startTime || template.startTime;
        const end = data.endTime || template.endTime;
        duration = calculateDuration(start, end);
      }
    }

    const updated = await prisma.shiftTemplate.update({
      where: { id },
      data: {
        ...data,
        ...(duration !== undefined && { duration }),
      },
    });

    logger.info(`Shift Template aktualisiert: ${updated.name} (${id})`);
    return updated;
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren des Shift Templates ${id}:`, error);
    throw error;
  }
}

/**
 * Löscht ein Template
 */
export async function deleteShiftTemplate(id: string) {
  try {
    await prisma.shiftTemplate.delete({
      where: { id },
    });

    logger.info(`Shift Template gelöscht: ${id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Fehler beim Löschen des Shift Templates ${id}:`, error);
    throw error;
  }
}

/**
 * Wendet ein Template auf eine Site an
 */
export async function applyTemplateToSite(templateId: string, siteId: string) {
  try {
    const updated = await prisma.site.update({
      where: { id: siteId },
      data: {
        defaultShiftTemplateId: templateId,
      },
      include: {
        defaultShiftTemplate: true,
      },
    });

    logger.info(`Template ${templateId} auf Site ${siteId} angewendet`);
    return updated;
  } catch (error) {
    logger.error(`Fehler beim Anwenden des Templates auf Site:`, error);
    throw error;
  }
}

/**
 * Hilfsfunktion: Berechnet Dauer in Stunden
 */
function calculateDuration(startTime: string, endTime: string): number {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Wenn End-Zeit kleiner als Start-Zeit, über Mitternacht (24h addieren)
    if (duration < 0) {
      duration += 24 * 60;
    }

    return Math.round(duration / 60 * 10) / 10; // Auf 1 Dezimalstelle runden
  } catch (error) {
    logger.error(`Fehler beim Berechnen der Dauer: ${startTime} - ${endTime}`, error);
    return 8; // Default: 8 Stunden
  }
}

/**
 * Erstellt Standard-Templates beim Projekt-Setup
 */
export async function seedDefaultTemplates() {
  const defaultTemplates: ShiftTemplateCreateInput[] = [
    {
      name: 'Frühschicht Standard',
      description: 'Standard Frühschicht Mo-Fr',
      shiftType: 'REGULAR',
      startTime: '06:00',
      endTime: '14:00',
      requiredStaff: 1,
      color: '#60A5FA', // Hellblau
      applicableDays: [1, 2, 3, 4, 5], // Mo-Fr
      category: 'STANDARD',
    },
    {
      name: 'Spätschicht Standard',
      description: 'Standard Spätschicht Mo-Fr',
      shiftType: 'REGULAR',
      startTime: '14:00',
      endTime: '22:00',
      requiredStaff: 1,
      color: '#FBBF24', // Gelb
      applicableDays: [1, 2, 3, 4, 5],
      category: 'STANDARD',
    },
    {
      name: 'Nachtschicht',
      description: 'Nachtschicht 22-6 Uhr',
      shiftType: 'NIGHT',
      startTime: '22:00',
      endTime: '06:00',
      requiredStaff: 1,
      nightShift: true,
      wageMultiplier: 1.25,
      color: '#6366F1', // Indigo
      applicableDays: [1, 2, 3, 4, 5, 6, 0], // Alle Tage
      category: 'STANDARD',
    },
    {
      name: 'Wochenend-Schicht',
      description: 'Schicht für Wochenenden',
      shiftType: 'WEEKEND',
      startTime: '08:00',
      endTime: '20:00',
      requiredStaff: 1,
      weekendShift: true,
      wageMultiplier: 1.5,
      color: '#EC4899', // Pink
      applicableDays: [6, 0], // Sa-So
      category: 'SPECIAL',
    },
    {
      name: '24h Schicht',
      description: '24-Stunden Dauerschicht',
      shiftType: 'SPECIAL',
      startTime: '06:00',
      endTime: '06:00',
      duration: 24,
      requiredStaff: 2,
      color: '#EF4444', // Rot
      applicableDays: [1, 2, 3, 4, 5, 6, 0],
      category: 'SPECIAL',
    },
  ];

  const created = [];
  for (const template of defaultTemplates) {
    const existing = await prisma.shiftTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      const newTemplate = await createShiftTemplate(template);
      created.push(newTemplate);
    }
  }

  logger.info(`${created.length} Standard-Templates erstellt`);
  return created;
}
