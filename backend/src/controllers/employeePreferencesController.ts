import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

type PreferencesPayload = Partial<{
  prefersNightShifts: boolean;
  prefersDayShifts: boolean;
  prefersWeekends: boolean;
  targetMonthlyHours: number;
  minMonthlyHours: number;
  maxMonthlyHours: number;
  flexibleHours: boolean;
  prefersLongShifts: boolean;
  prefersShortShifts: boolean;
  prefersConsecutiveDays: number | null;
  minRestDaysPerWeek: number;
  preferredSiteIds: string[];
  avoidedSiteIds: string[];
  notes: string | null;
}>;

const DEFAULT_PREFERENCES = {
  prefersNightShifts: false,
  prefersDayShifts: true,
  prefersWeekends: false,
  targetMonthlyHours: 160,
  minMonthlyHours: 120,
  maxMonthlyHours: 200,
  flexibleHours: true,
  prefersLongShifts: false,
  prefersShortShifts: false,
  prefersConsecutiveDays: 5,
  minRestDaysPerWeek: 2,
  preferredSiteIds: [] as string[],
  avoidedSiteIds: [] as string[],
  notes: null as string | null,
};

function sanitizePayload(payload: Record<string, unknown>): PreferencesPayload {
  const data: PreferencesPayload = {};
  (['prefersNightShifts', 'prefersDayShifts', 'prefersWeekends', 'targetMonthlyHours', 'minMonthlyHours', 'maxMonthlyHours', 'flexibleHours', 'prefersLongShifts', 'prefersShortShifts', 'prefersConsecutiveDays', 'minRestDaysPerWeek', 'preferredSiteIds', 'avoidedSiteIds', 'notes'] as const).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      (data as Record<string, unknown>)[key] = payload[key];
    }
  });
  return data;
}

export const getEmployeePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const preferences = await prisma.employeePreferences.findUnique({
      where: { userId: id },
    });

    if (!preferences) {
      res.json({
        success: true,
        data: {
          userId: id,
          ...DEFAULT_PREFERENCES,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: id,
        prefersNightShifts: preferences.prefersNightShifts,
        prefersDayShifts: preferences.prefersDayShifts,
        prefersWeekends: preferences.prefersWeekends,
        targetMonthlyHours: preferences.targetMonthlyHours,
        minMonthlyHours: preferences.minMonthlyHours,
        maxMonthlyHours: preferences.maxMonthlyHours,
        flexibleHours: preferences.flexibleHours,
        prefersLongShifts: preferences.prefersLongShifts,
        prefersShortShifts: preferences.prefersShortShifts,
        prefersConsecutiveDays: preferences.prefersConsecutiveDays,
        minRestDaysPerWeek: preferences.minRestDaysPerWeek,
        preferredSiteIds: preferences.preferredSiteIds,
        avoidedSiteIds: preferences.avoidedSiteIds,
        notes: preferences.notes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertEmployeePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payload = sanitizePayload(req.body ?? {});

    if (Object.keys(payload).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Mindestens ein Feld ist erforderlich, um Präferenzen zu aktualisieren.',
      });
      return;
    }

    if (payload.preferredSiteIds !== undefined) {
      payload.preferredSiteIds = Array.isArray(payload.preferredSiteIds) ? payload.preferredSiteIds : [];
    }
    if (payload.avoidedSiteIds !== undefined) {
      payload.avoidedSiteIds = Array.isArray(payload.avoidedSiteIds) ? payload.avoidedSiteIds : [];
    }

    const result = await prisma.employeePreferences.upsert({
      where: { userId: id },
      update: payload,
      create: {
        userId: id,
        ...DEFAULT_PREFERENCES,
        ...payload,
      },
    });

    logger.info('Employee preferences updated for %s', id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
