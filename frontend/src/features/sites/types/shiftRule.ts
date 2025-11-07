/**
 * ShiftRule type definitions for flexible shift planning
 *
 * Supports pattern-based shift scheduling:
 * - DAILY: Shifts every day in date range
 * - WEEKLY: Shifts on specific weekdays (e.g., Mo-Fr)
 * - SPECIFIC_DATES: Shifts only on defined dates (exceptions/special days)
 * - DATE_RANGE: Continuous shifts in time period
 */

export type RulePattern = 'DAILY' | 'WEEKLY' | 'SPECIFIC_DATES' | 'DATE_RANGE'

/**
 * ShiftRule represents a template for generating shifts
 * Multiple rules can exist per site, with priority-based override system
 */
export type ShiftRule = {
  id: string
  siteId: string

  // Schicht-Definition
  name: string // z.B. "Frühschicht Mo-Fr", "Nachtschicht Wochenende"
  startTime: string // HH:MM format (e.g., "06:00", "22:00")
  endTime: string // HH:MM format - if < startTime, overnight shift assumed
  requiredStaff: number // Anzahl benötigter Mitarbeiter
  requiredQualifications: string[] // z.B. ["§34a", "Erste Hilfe"]

  // Wiederholungs-Muster
  pattern: RulePattern
  daysOfWeek: number[] // 0=Sonntag, 1=Montag, ..., 6=Samstag (für WEEKLY pattern)
  specificDates: string[] // ISO date strings (für SPECIFIC_DATES pattern)

  // Gültigkeit
  validFrom: string // ISO date string - ab wann gilt die Regel
  validUntil?: string // ISO date string - bis wann gilt die Regel (optional)

  // Priorität & Status
  priority: number // Höhere Priorität überschreibt niedrigere Regeln am gleichen Tag
  isActive: boolean // Regel aktiv/inaktiv
  description?: string // Optionale Beschreibung

  // Metadaten
  createdAt: string
  updatedAt: string
}

/**
 * Input for creating a new ShiftRule
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateShiftRuleInput = Omit<ShiftRule, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Input for updating an existing ShiftRule
 * All fields optional (partial update)
 */
export type UpdateShiftRuleInput = Partial<CreateShiftRuleInput>

/**
 * Input for generating shifts from rules
 */
export type GenerateShiftsInput = {
  startDate: string // ISO date string - Start des Generierungszeitraums
  endDate: string // ISO date string - Ende des Generierungszeitraums
  preview?: boolean // Wenn true, werden Schichten nur vorgeschaut ohne Erstellung
}

/**
 * Response from shift generation endpoint
 */
export type GenerateShiftsResponse = {
  generated: number // Anzahl generierter/vorgeschauter Schichten
  shifts: Array<{
    startTime: string // ISO datetime
    endTime: string // ISO datetime
    requiredStaff: number
    requiredQualifications: string[]
    ruleName: string // Name der angewendeten Regel
  }>
}

/**
 * Helper constants
 */

export const RULE_PATTERN_LABELS: Record<RulePattern, string> = {
  DAILY: 'Täglich',
  WEEKLY: 'Wöchentlich',
  SPECIFIC_DATES: 'Bestimmte Daten',
  DATE_RANGE: 'Zeitraum',
}

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'So',
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
}

export const WEEKDAY_LABELS_LONG: Record<number, string> = {
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
}
