/**
 * Vordefinierte Schichtplanungs-Templates
 * Ermöglicht schnelles Erstellen häufig verwendeter Schichtmodelle
 */

import type { CreateShiftRuleInput } from './shiftRule'

export type ShiftRuleTemplate = {
  id: string
  name: string
  description: string
  category: 'standard' | '24-7' | 'special'
  icon: string
  rules: Array<Omit<CreateShiftRuleInput, 'siteId' | 'validFrom' | 'validUntil'>>
}

/**
 * Vordefinierte Templates für häufig verwendete Schichtmodelle
 */
export const SHIFT_RULE_TEMPLATES: ShiftRuleTemplate[] = [
  {
    id: 'tagschicht-mo-fr',
    name: 'Tagschicht Mo-Fr',
    description: 'Klassische Tagschicht Montag bis Freitag (08:00-16:00)',
    category: 'standard',
    icon: '☀️',
    rules: [
      {
        siteId: '', // Will be filled in
        name: 'Tagschicht Mo-Fr',
        description: 'Reguläre Tagschicht an Werktagen',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5], // Mo-Fr
        specificDates: [],
        validFrom: '', // Will be filled in
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: '2-schicht-modell',
    name: '2-Schicht-Modell',
    description: 'Tag- und Nachtschicht Mo-Fr (08:00-16:00, 16:00-00:00)',
    category: 'standard',
    icon: '🌓',
    rules: [
      {
        siteId: '',
        name: 'Tagschicht Mo-Fr',
        description: 'Tagschicht an Werktagen',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Spätschicht Mo-Fr',
        description: 'Spätschicht an Werktagen',
        startTime: '16:00',
        endTime: '00:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: '3-schicht-modell',
    name: '3-Schicht-Modell',
    description: 'Früh-, Spät- und Nachtschicht Mo-Fr (06:00-14:00, 14:00-22:00, 22:00-06:00)',
    category: 'standard',
    icon: '⏰',
    rules: [
      {
        siteId: '',
        name: 'Frühschicht Mo-Fr',
        description: 'Frühschicht an Werktagen',
        startTime: '06:00',
        endTime: '14:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Spätschicht Mo-Fr',
        description: 'Spätschicht an Werktagen',
        startTime: '14:00',
        endTime: '22:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Nachtschicht Mo-Fr',
        description: 'Nachtschicht an Werktagen',
        startTime: '22:00',
        endTime: '06:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [1, 2, 3, 4, 5],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: '24-7-durchgehend',
    name: '24/7 Durchgehend',
    description: 'Durchgehende 8-Stunden-Schichten, 7 Tage die Woche (00:00-08:00, 08:00-16:00, 16:00-00:00)',
    category: '24-7',
    icon: '🔄',
    rules: [
      {
        siteId: '',
        name: 'Nachtschicht 24/7',
        description: 'Nachtschicht täglich',
        startTime: '00:00',
        endTime: '08:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Frühschicht 24/7',
        description: 'Frühschicht täglich',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Spätschicht 24/7',
        description: 'Spätschicht täglich',
        startTime: '16:00',
        endTime: '00:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: 'wochenende-only',
    name: 'Nur Wochenende',
    description: 'Tagschicht nur Samstag und Sonntag (08:00-18:00)',
    category: 'special',
    icon: '🎉',
    rules: [
      {
        siteId: '',
        name: 'Wochenend-Schicht',
        description: 'Schicht nur am Wochenende',
        startTime: '08:00',
        endTime: '18:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'WEEKLY',
        daysOfWeek: [0, 6], // Sa-So
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: 'nacht-24-7',
    name: 'Nur Nachtschicht 24/7',
    description: 'Durchgehende Nachtschicht, 7 Tage die Woche (20:00-06:00)',
    category: '24-7',
    icon: '🌙',
    rules: [
      {
        siteId: '',
        name: 'Nachtschicht täglich',
        description: 'Nachtschicht jeden Tag',
        startTime: '20:00',
        endTime: '06:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
  {
    id: '12h-tag-nacht',
    name: '12h Tag/Nacht',
    description: '12-Stunden-Schichten Tag und Nacht, 7 Tage die Woche',
    category: '24-7',
    icon: '⚡',
    rules: [
      {
        siteId: '',
        name: 'Tagschicht 12h',
        description: '12-Stunden-Tagschicht',
        startTime: '06:00',
        endTime: '18:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
      {
        siteId: '',
        name: 'Nachtschicht 12h',
        description: '12-Stunden-Nachtschicht',
        startTime: '18:00',
        endTime: '06:00',
        requiredStaff: 1,
        requiredQualifications: [],
        pattern: 'DAILY',
        daysOfWeek: [],
        specificDates: [],
        validFrom: '',
        priority: 0,
        isActive: true,
      },
    ],
  },
]

/**
 * Filtert Templates nach Kategorie
 */
export function getTemplatesByCategory(category: ShiftRuleTemplate['category']) {
  return SHIFT_RULE_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Findet Template nach ID
 */
export function getTemplateById(id: string) {
  return SHIFT_RULE_TEMPLATES.find((t) => t.id === id)
}
