/**
 * Shift Template System
 * Defines shift models and generates shift schedules
 */

export interface ShiftDefinition {
  name: string;
  startTime: string; // HH:mm format (e.g., "06:00")
  endTime: string; // HH:mm format (e.g., "14:00")
  requiredStaff: number;
  days: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  shifts: ShiftDefinition[];
  totalHoursPerWeek: number;
}

/**
 * Shift Templates für verschiedene Schichtmodelle
 */
export const SHIFT_TEMPLATES: Record<string, ShiftTemplate> = {
  '3-SHIFT': {
    id: '3-SHIFT',
    name: '3-Schicht-System (24/7)',
    description: 'Frühschicht, Spätschicht, Nachtschicht - 7 Tage/Woche',
    shifts: [
      {
        name: 'Frühschicht',
        startTime: '06:00',
        endTime: '14:00',
        requiredStaff: 1, // Wird durch calculateStaffDistribution() angepasst
        days: [0, 1, 2, 3, 4, 5, 6], // Mo-So
      },
      {
        name: 'Spätschicht',
        startTime: '14:00',
        endTime: '22:00',
        requiredStaff: 1,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'Nachtschicht',
        startTime: '22:00',
        endTime: '06:00',
        requiredStaff: 1,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
    totalHoursPerWeek: 168, // 24h * 7 Tage
  },

  '2-SHIFT': {
    id: '2-SHIFT',
    name: '2-Schicht-System (24/7)',
    description: 'Tagschicht, Nachtschicht - 7 Tage/Woche',
    shifts: [
      {
        name: 'Tagschicht',
        startTime: '06:00',
        endTime: '18:00',
        requiredStaff: 1,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: 'Nachtschicht',
        startTime: '18:00',
        endTime: '06:00',
        requiredStaff: 1,
        days: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
    totalHoursPerWeek: 168,
  },

  'SINGLE_SHIFT': {
    id: 'SINGLE_SHIFT',
    name: 'Einzelschicht',
    description: 'Eine Schicht pro Tag - konfigurierbare Zeiten',
    shifts: [
      {
        name: 'Tagschicht',
        startTime: '08:00',
        endTime: '18:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5], // Mo-Fr
      },
    ],
    totalHoursPerWeek: 50, // 10h * 5 Tage
  },

  '3-SHIFT_WEEKDAYS': {
    id: '3-SHIFT_WEEKDAYS',
    name: '3-Schicht-System (Mo-Fr)',
    description: 'Frühschicht, Spätschicht, Nachtschicht - nur Wochentage',
    shifts: [
      {
        name: 'Frühschicht',
        startTime: '06:00',
        endTime: '14:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5], // Mo-Fr
      },
      {
        name: 'Spätschicht',
        startTime: '14:00',
        endTime: '22:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5],
      },
      {
        name: 'Nachtschicht',
        startTime: '22:00',
        endTime: '06:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5],
      },
    ],
    totalHoursPerWeek: 120, // 24h * 5 Tage
  },

  '2-SHIFT_WEEKDAYS': {
    id: '2-SHIFT_WEEKDAYS',
    name: '2-Schicht-System (Mo-Fr)',
    description: 'Tagschicht, Nachtschicht - nur Wochentage',
    shifts: [
      {
        name: 'Tagschicht',
        startTime: '06:00',
        endTime: '18:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5],
      },
      {
        name: 'Nachtschicht',
        startTime: '18:00',
        endTime: '06:00',
        requiredStaff: 1,
        days: [1, 2, 3, 4, 5],
      },
    ],
    totalHoursPerWeek: 120,
  },
};

/**
 * Berechnet Personalverteilung auf Schichten
 * Verteilt requiredStaff gleichmäßig auf alle Schichten
 */
export function calculateStaffDistribution(
  template: ShiftTemplate,
  totalRequiredStaff: number
): ShiftDefinition[] {
  const shiftsCount = template.shifts.length;

  if (shiftsCount === 0) {
    return [];
  }

  // Gleichmäßige Verteilung
  const baseStaffPerShift = Math.floor(totalRequiredStaff / shiftsCount);
  const remainder = totalRequiredStaff % shiftsCount;

  return template.shifts.map((shift, index) => ({
    ...shift,
    // Erste 'remainder' Schichten bekommen +1 MA
    requiredStaff: baseStaffPerShift + (index < remainder ? 1 : 0),
  }));
}

/**
 * Mapping von Wizard-Namen zu Template-IDs
 */
const SHIFT_MODEL_MAPPING: Record<string, string> = {
  '3-Schicht (24/7)': '3-SHIFT',
  '2-Schicht (24/7)': '2-SHIFT',
  'Einzelschicht': 'SINGLE_SHIFT',
  '3-Schicht (Mo-Fr)': '3-SHIFT_WEEKDAYS',
  '2-Schicht (Mo-Fr)': '2-SHIFT_WEEKDAYS',
  // Template-IDs direkt unterstützen
  '3-SHIFT': '3-SHIFT',
  '2-SHIFT': '2-SHIFT',
  'SINGLE_SHIFT': 'SINGLE_SHIFT',
  '3-SHIFT_WEEKDAYS': '3-SHIFT_WEEKDAYS',
  '2-SHIFT_WEEKDAYS': '2-SHIFT_WEEKDAYS',
};

/**
 * Gibt Template basierend auf shiftModel-ID oder Namen
 */
export function getShiftTemplate(shiftModelId: string): ShiftTemplate | null {
  const templateId = SHIFT_MODEL_MAPPING[shiftModelId] || shiftModelId;
  return SHIFT_TEMPLATES[templateId] || null;
}

/**
 * Liste aller verfügbaren Templates
 */
export function getAllShiftTemplates(): ShiftTemplate[] {
  return Object.values(SHIFT_TEMPLATES);
}
