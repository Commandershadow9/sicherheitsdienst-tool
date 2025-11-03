/**
 * Shift Generator
 * Generates shift schedules based on templates and site requirements
 */

import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, format, isBefore } from 'date-fns';
import { getShiftTemplate, calculateStaffDistribution, type ShiftDefinition } from './shiftTemplates';

export interface GenerateShiftsOptions {
  siteId: string;
  siteName: string;
  shiftModel: string; // Template-ID (z.B. "3-SHIFT")
  requiredStaff: number; // Gesamtanzahl benötigter MA (fallback)
  requiredQualifications: string[];
  startDate: Date;
  daysAhead: number; // Wie viele Tage voraus generieren (default: 30)
  shiftModelData?: any; // Optional: Komplette Shift-Definitionen aus SecurityConcept
}

export interface GeneratedShift {
  siteId: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  requiredEmployees: number;
  requiredQualifications: string[];
  status: 'PLANNED';
}

/**
 * Generiert Schichten basierend auf Template und Optionen
 */
export function generateShifts(options: GenerateShiftsOptions): GeneratedShift[] {
  const {
    siteId,
    siteName,
    shiftModel,
    requiredStaff,
    requiredQualifications,
    startDate,
    daysAhead = 30,
    shiftModelData,
  } = options;

  let shiftsWithStaff: any[];

  // NEUE LOGIK: SecurityConcept shiftModelData hat Vorrang (Single Source of Truth)
  if (shiftModelData && shiftModelData.shifts && Array.isArray(shiftModelData.shifts)) {
    // Nutze Shift-Definitionen direkt aus SecurityConcept
    shiftsWithStaff = shiftModelData.shifts.map((shift: any) => ({
      name: shift.name,
      startTime: shift.start,
      endTime: shift.end,
      requiredStaff: shift.requiredStaff || 1,
      days: [0, 1, 2, 3, 4, 5, 6], // Alle Tage (Mo-So), kann später verfeinert werden
    }));
  } else {
    // ALTE LOGIK: Template-basiert (Fallback)
    const template = getShiftTemplate(shiftModel);
    if (!template) {
      throw new Error(`Unbekanntes Schichtmodell: ${shiftModel}`);
    }
    // Personalverteilung berechnen
    shiftsWithStaff = calculateStaffDistribution(template, requiredStaff);
  }

  const generatedShifts: GeneratedShift[] = [];

  // Für jeden Tag in der Periode
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Für jede Schicht-Definition
    for (const shiftDef of shiftsWithStaff) {
      // Prüfen ob Schicht an diesem Wochentag aktiv ist
      if (!shiftDef.days.includes(dayOfWeek)) {
        continue;
      }

      // Schicht-Zeiten parsen
      const startTimeParts = shiftDef.startTime.split(':');
      const endTimeParts = shiftDef.endTime.split(':');

      const startHour = parseInt(startTimeParts[0], 10);
      const startMinute = parseInt(startTimeParts[1], 10);
      const endHour = parseInt(endTimeParts[0], 10);
      const endMinute = parseInt(endTimeParts[1], 10);

      // Start-Zeit erstellen
      let shiftStart = setHours(currentDate, startHour);
      shiftStart = setMinutes(shiftStart, startMinute);
      shiftStart = setSeconds(shiftStart, 0);
      shiftStart = setMilliseconds(shiftStart, 0);

      // End-Zeit erstellen
      let shiftEnd = setHours(currentDate, endHour);
      shiftEnd = setMinutes(shiftEnd, endMinute);
      shiftEnd = setSeconds(shiftEnd, 0);
      shiftEnd = setMilliseconds(shiftEnd, 0);

      // Wenn End-Zeit vor Start-Zeit liegt → Nachtschicht, +1 Tag
      if (isBefore(shiftEnd, shiftStart)) {
        shiftEnd = addDays(shiftEnd, 1);
      }

      // Schicht erstellen
      generatedShifts.push({
        siteId,
        title: `${siteName} - ${shiftDef.name}`,
        description: shiftDef.name,
        location: siteName,
        startTime: shiftStart,
        endTime: shiftEnd,
        requiredEmployees: shiftDef.requiredStaff,
        requiredQualifications,
        status: 'PLANNED',
      });
    }
  }

  return generatedShifts;
}

/**
 * Generiert Schichten für einen bestimmten Datumsbereich
 */
export function generateShiftsForDateRange(
  options: GenerateShiftsOptions,
  endDate: Date
): GeneratedShift[] {
  const daysDiff = Math.ceil((endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24));
  return generateShifts({ ...options, daysAhead: Math.max(1, daysDiff) });
}

/**
 * Statistiken für generierte Schichten
 */
export function getShiftGenerationStats(shifts: GeneratedShift[]) {
  const totalShifts = shifts.length;
  const totalRequiredEmployees = shifts.reduce((sum, shift) => sum + shift.requiredEmployees, 0);

  // Gruppierung nach Schicht-Name
  const shiftsByName: Record<string, number> = {};
  shifts.forEach((shift) => {
    const name = shift.title.split(' - ').pop() || 'Unknown';
    shiftsByName[name] = (shiftsByName[name] || 0) + 1;
  });

  return {
    totalShifts,
    totalRequiredEmployees,
    shiftsByName,
    averageEmployeesPerShift: totalShifts > 0 ? totalRequiredEmployees / totalShifts : 0,
  };
}
