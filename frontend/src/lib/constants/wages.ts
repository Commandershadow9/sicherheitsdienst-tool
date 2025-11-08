/**
 * Wage and Surcharge Configuration
 * Central source of truth for all wage calculations
 * Used across web and mobile apps
 */

/**
 * Wage Groups (Lohngruppen)
 * Based on German security industry standards
 */
export const WAGE_GROUPS = {
  GRUPPE_1: 'GRUPPE_1', // Basis Sicherheitsmitarbeiter
  GRUPPE_2: 'GRUPPE_2', // Geprüfte Sicherheitsfachkraft (§34a)
  GRUPPE_3: 'GRUPPE_3', // Schichtleiter
  GRUPPE_4: 'GRUPPE_4', // Objektleiter
  GRUPPE_5: 'GRUPPE_5', // Sicherheitsmeister
} as const

export type WageGroup = typeof WAGE_GROUPS[keyof typeof WAGE_GROUPS]

export const WAGE_GROUP_LABELS: Record<WageGroup, string> = {
  GRUPPE_1: 'Gruppe 1 - Basis Sicherheitsmitarbeiter',
  GRUPPE_2: 'Gruppe 2 - Geprüfte Sicherheitsfachkraft',
  GRUPPE_3: 'Gruppe 3 - Schichtleiter',
  GRUPPE_4: 'Gruppe 4 - Objektleiter',
  GRUPPE_5: 'Gruppe 5 - Sicherheitsmeister',
}

/**
 * Base hourly wages by group (in EUR)
 * NOTE: These are example values - adjust according to your collective agreement
 */
export const BASE_HOURLY_WAGES: Record<WageGroup, number> = {
  GRUPPE_1: 13.50,
  GRUPPE_2: 15.00,
  GRUPPE_3: 17.50,
  GRUPPE_4: 20.00,
  GRUPPE_5: 23.00,
}

/**
 * Surcharge Types (Zuschläge)
 */
export const SURCHARGE_TYPES = {
  NIGHT: 'NIGHT',           // Nachtzuschlag
  SUNDAY: 'SUNDAY',         // Sonntagszuschlag
  HOLIDAY: 'HOLIDAY',       // Feiertagszuschlag
  SATURDAY: 'SATURDAY',     // Samstag
  OVERTIME: 'OVERTIME',     // Überstunden
  ON_CALL: 'ON_CALL',       // Rufbereitschaft
} as const

export type SurchargeType = typeof SURCHARGE_TYPES[keyof typeof SURCHARGE_TYPES]

export const SURCHARGE_LABELS: Record<SurchargeType, string> = {
  NIGHT: 'Nachtzuschlag',
  SUNDAY: 'Sonntagszuschlag',
  HOLIDAY: 'Feiertagszuschlag',
  SATURDAY: 'Samstagszuschlag',
  OVERTIME: 'Überstundenzuschlag',
  ON_CALL: 'Rufbereitschaft',
}

/**
 * Surcharge rates (percentage of base wage)
 * NOTE: These are example values - adjust according to your collective agreement
 */
export const SURCHARGE_RATES: Record<SurchargeType, number> = {
  NIGHT: 0.25,      // 25% (22:00 - 06:00)
  SUNDAY: 0.50,     // 50%
  HOLIDAY: 1.00,    // 100%
  SATURDAY: 0.25,   // 25%
  OVERTIME: 0.25,   // 25%
  ON_CALL: 0.15,    // 15%
}

/**
 * Night shift time range
 */
export const NIGHT_SHIFT_HOURS = {
  START: 22, // 22:00
  END: 6,    // 06:00
}

/**
 * Tax-free surcharge limits (Steuerfreie Zuschläge)
 * According to German tax law (§3b EStG)
 */
export const TAX_FREE_SURCHARGE_LIMITS: Record<SurchargeType, number | null> = {
  NIGHT: 0.25,      // Max 25% steuerfrei
  SUNDAY: 0.50,     // Max 50% steuerfrei
  HOLIDAY: 1.25,    // Max 125% steuerfrei
  SATURDAY: 0.50,   // Max 50% steuerfrei
  OVERTIME: null,   // Nicht steuerfrei
  ON_CALL: null,    // Nicht steuerfrei
}

/**
 * Social security contribution rates (Sozialversicherungsbeiträge)
 * NOTE: Update these annually according to current rates
 */
export const SOCIAL_SECURITY_RATES = {
  HEALTH_INSURANCE: 0.073,        // 7.3% (employee share)
  PENSION_INSURANCE: 0.093,       // 9.3% (employee share)
  UNEMPLOYMENT_INSURANCE: 0.012,  // 1.2% (employee share)
  CARE_INSURANCE: 0.01775,        // 1.775% (employee share, with surcharge for childless)
  TOTAL_EMPLOYEE: 0.19575,        // ~19.575% total employee contribution
} as const

/**
 * Helper function to get wage group label
 */
export function getWageGroupLabel(group: string): string {
  return WAGE_GROUP_LABELS[group as WageGroup] ?? group
}

/**
 * Helper function to get surcharge label
 */
export function getSurchargeLabel(type: string): string {
  return SURCHARGE_LABELS[type as SurchargeType] ?? type
}

/**
 * Helper function to get base hourly wage for a group
 */
export function getBaseHourlyWage(group: WageGroup): number {
  return BASE_HOURLY_WAGES[group] ?? 13.50
}

/**
 * Helper function to get surcharge rate
 */
export function getSurchargeRate(type: SurchargeType): number {
  return SURCHARGE_RATES[type] ?? 0
}
