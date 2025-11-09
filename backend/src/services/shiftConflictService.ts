/**
 * Shift Conflict Analysis Service
 * Erkennt Konflikte in der Schichtplanung
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { addHours, differenceInHours, parseISO } from 'date-fns';

export interface ShiftConflict {
  type: ConflictType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  shiftId: string;
  shiftTitle: string;
  userId?: string;
  userName?: string;
  description: string;
  details?: any;
}

export type ConflictType =
  | 'UNDERSTAFFED'
  | 'OVERSTAFFED'
  | 'NO_CLEARANCE'
  | 'MISSING_QUALIFICATIONS'
  | 'REST_TIME_VIOLATION'
  | 'DOUBLE_BOOKING'
  | 'WEEKLY_HOURS_EXCEEDED'
  | 'CONSECUTIVE_DAYS_EXCEEDED'
  | 'UNASSIGNED';

/**
 * Analysiert Konflikte für einen bestimmten Zeitraum
 */
export async function analyzeShiftConflicts(options: {
  startDate: Date;
  endDate: Date;
  siteId?: string;
  userId?: string;
}): Promise<ShiftConflict[]> {
  const { startDate, endDate, siteId, userId } = options;
  const conflicts: ShiftConflict[] = [];

  try {
    // Lade alle Schichten im Zeitraum
    const where: any = {
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    };

    if (siteId) {
      where.siteId = siteId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            minStaffRequirement: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                qualifications: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // 1. Prüfe Unterbesetzung / Überbesetzung
    for (const shift of shifts) {
      const assignedCount = shift.assignments.length;
      const requiredCount = shift.requiredEmployees;
      const minStaffSite = shift.site?.minStaffRequirement || 1;

      if (assignedCount === 0) {
        conflicts.push({
          type: 'UNASSIGNED',
          severity: 'critical',
          shiftId: shift.id,
          shiftTitle: shift.title,
          description: `Keine Mitarbeiter zugewiesen (${requiredCount} benötigt)`,
        });
      } else if (assignedCount < requiredCount) {
        conflicts.push({
          type: 'UNDERSTAFFED',
          severity: assignedCount < minStaffSite ? 'critical' : 'high',
          shiftId: shift.id,
          shiftTitle: shift.title,
          description: `Unterbesetzt: ${assignedCount}/${requiredCount} Mitarbeiter`,
          details: { assigned: assignedCount, required: requiredCount },
        });
      } else if (assignedCount > requiredCount) {
        conflicts.push({
          type: 'OVERSTAFFED',
          severity: 'low',
          shiftId: shift.id,
          shiftTitle: shift.title,
          description: `Überbesetzt: ${assignedCount}/${requiredCount} Mitarbeiter`,
          details: { assigned: assignedCount, required: requiredCount },
        });
      }

      // 2. Prüfe Qualifikationen pro Mitarbeiter
      for (const assignment of shift.assignments) {
        const user = assignment.user;
        const missingQuals = shift.requiredQualifications.filter(
          (qual) => !user.qualifications.includes(qual)
        );

        if (missingQuals.length > 0) {
          conflicts.push({
            type: 'MISSING_QUALIFICATIONS',
            severity: 'high',
            shiftId: shift.id,
            shiftTitle: shift.title,
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            description: `Fehlende Qualifikationen: ${missingQuals.join(', ')}`,
            details: { missingQualifications: missingQuals },
          });
        }
      }

      // 3. Prüfe Clearances (wenn Site vorhanden)
      if (shift.siteId) {
        for (const assignment of shift.assignments) {
          const clearance = await prisma.objectClearance.findUnique({
            where: {
              userId_siteId: {
                userId: assignment.user.id,
                siteId: shift.siteId,
              },
            },
          });

          if (!clearance || clearance.status !== 'ACTIVE') {
            conflicts.push({
              type: 'NO_CLEARANCE',
              severity: 'critical',
              shiftId: shift.id,
              shiftTitle: shift.title,
              userId: assignment.user.id,
              userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
              description: `Keine aktive Clearance für ${shift.site?.name || 'dieses Objekt'}`,
              details: { clearanceStatus: clearance?.status || 'NONE' },
            });
          }
        }
      }
    }

    // 4. Prüfe Doppelbuchungen
    const doubleBookings = await findDoubleBookings(shifts);
    conflicts.push(...doubleBookings);

    // 5. Prüfe Ruhezeiten
    const restTimeViolations = await findRestTimeViolations(shifts);
    conflicts.push(...restTimeViolations);

    // 6. Prüfe wöchentliche Stunden
    if (userId) {
      const weeklyHoursViolations = await findWeeklyHoursViolations(shifts, userId);
      conflicts.push(...weeklyHoursViolations);
    }

    logger.info(`Konflikt-Analyse abgeschlossen: ${conflicts.length} Konflikte gefunden`);
    return conflicts;
  } catch (error) {
    logger.error('Fehler bei Konflikt-Analyse:', error);
    throw error;
  }
}

/**
 * Findet Doppelbuchungen (Mitarbeiter in überlappenden Schichten)
 */
async function findDoubleBookings(shifts: any[]): Promise<ShiftConflict[]> {
  const conflicts: ShiftConflict[] = [];
  const userShifts = new Map<string, any[]>();

  // Gruppiere Schichten nach User
  for (const shift of shifts) {
    for (const assignment of shift.assignments) {
      const userId = assignment.user.id;
      if (!userShifts.has(userId)) {
        userShifts.set(userId, []);
      }
      userShifts.get(userId)!.push({ shift, assignment });
    }
  }

  // Prüfe Überlappungen pro User
  for (const [userId, userShiftList] of userShifts.entries()) {
    for (let i = 0; i < userShiftList.length; i++) {
      for (let j = i + 1; j < userShiftList.length; j++) {
        const shift1 = userShiftList[i].shift;
        const shift2 = userShiftList[j].shift;

        if (shiftsOverlap(shift1, shift2)) {
          const user = userShiftList[i].assignment.user;
          conflicts.push({
            type: 'DOUBLE_BOOKING',
            severity: 'critical',
            shiftId: shift1.id,
            shiftTitle: shift1.title,
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            description: `Doppelbuchung mit Schicht "${shift2.title}"`,
            details: {
              conflictingShiftId: shift2.id,
              conflictingShiftTitle: shift2.title,
            },
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Findet Verstöße gegen Ruhezeiten (min. 11h Pause)
 */
async function findRestTimeViolations(shifts: any[]): Promise<ShiftConflict[]> {
  const conflicts: ShiftConflict[] = [];
  const MIN_REST_HOURS = 11;

  const userShifts = new Map<string, any[]>();

  // Gruppiere Schichten nach User
  for (const shift of shifts) {
    for (const assignment of shift.assignments) {
      const userId = assignment.user.id;
      if (!userShifts.has(userId)) {
        userShifts.set(userId, []);
      }
      userShifts.get(userId)!.push({ shift, assignment });
    }
  }

  // Prüfe Ruhezeiten pro User
  for (const [userId, userShiftList] of userShifts.entries()) {
    // Sortiere nach Startzeit
    userShiftList.sort((a, b) =>
      new Date(a.shift.startTime).getTime() - new Date(b.shift.startTime).getTime()
    );

    for (let i = 0; i < userShiftList.length - 1; i++) {
      const currentShift = userShiftList[i].shift;
      const nextShift = userShiftList[i + 1].shift;

      const restHours = differenceInHours(
        parseISO(nextShift.startTime),
        parseISO(currentShift.endTime)
      );

      if (restHours < MIN_REST_HOURS) {
        const user = userShiftList[i].assignment.user;
        conflicts.push({
          type: 'REST_TIME_VIOLATION',
          severity: 'critical',
          shiftId: nextShift.id,
          shiftTitle: nextShift.title,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          description: `Ruhezeit zu kurz: ${restHours}h statt ${MIN_REST_HOURS}h`,
          details: {
            actualRestHours: restHours,
            requiredRestHours: MIN_REST_HOURS,
            previousShiftId: currentShift.id,
          },
        });
      }
    }
  }

  return conflicts;
}

/**
 * Findet Verstöße gegen maximale Wochenstunden (48h/Woche)
 */
async function findWeeklyHoursViolations(
  shifts: any[],
  userId: string
): Promise<ShiftConflict[]> {
  const conflicts: ShiftConflict[] = [];
  const MAX_WEEKLY_HOURS = 48;

  // Gruppiere Schichten nach Kalenderwoche
  const weeklyHours = new Map<string, { hours: number; shifts: any[] }>();

  for (const shift of shifts) {
    const assignment = shift.assignments.find((a: any) => a.user.id === userId);
    if (!assignment) continue;

    const weekKey = getWeekKey(new Date(shift.startTime));
    if (!weeklyHours.has(weekKey)) {
      weeklyHours.set(weekKey, { hours: 0, shifts: [] });
    }

    const duration = differenceInHours(
      parseISO(shift.endTime),
      parseISO(shift.startTime)
    );

    const weekData = weeklyHours.get(weekKey)!;
    weekData.hours += duration;
    weekData.shifts.push(shift);

    if (weekData.hours > MAX_WEEKLY_HOURS) {
      const user = assignment.user;
      conflicts.push({
        type: 'WEEKLY_HOURS_EXCEEDED',
        severity: 'high',
        shiftId: shift.id,
        shiftTitle: shift.title,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Wochenstunden überschritten: ${weekData.hours}h / ${MAX_WEEKLY_HOURS}h`,
        details: {
          actualHours: weekData.hours,
          maxHours: MAX_WEEKLY_HOURS,
          week: weekKey,
        },
      });
    }
  }

  return conflicts;
}

/**
 * Prüft ob zwei Schichten sich überlappen
 */
function shiftsOverlap(shift1: any, shift2: any): boolean {
  const start1 = parseISO(shift1.startTime);
  const end1 = parseISO(shift1.endTime);
  const start2 = parseISO(shift2.startTime);
  const end2 = parseISO(shift2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Gibt einen Wochenschlüssel zurück (YYYY-WW)
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Berechnet die Kalenderwoche (ISO 8601)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Gibt Konflikte für ein bestimmtes Shift zurück
 */
export async function getShiftConflicts(shiftId: string): Promise<ShiftConflict[]> {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { startTime: true, endTime: true },
    });

    if (!shift) {
      return [];
    }

    // Analysiere Konflikte für einen kleinen Zeitraum um die Schicht
    return await analyzeShiftConflicts({
      startDate: addHours(new Date(shift.startTime), -48),
      endDate: addHours(new Date(shift.endTime), 48),
    });
  } catch (error) {
    logger.error(`Fehler beim Laden der Konflikte für Shift ${shiftId}:`, error);
    throw error;
  }
}
