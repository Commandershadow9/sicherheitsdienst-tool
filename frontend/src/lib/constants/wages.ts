/**
 * Wage and Surcharge Configuration
 * Central source of truth for all wage calculations
 * Used across web and mobile apps
 */

/**
 * Wage Groups (Lohngruppen)
 * Based on BSDW Tarifvertrag für Sicherheitsdienste 2024
 */
export const WAGE_GROUPS = {
  GRUPPE_1: 'GRUPPE_1', // Einfache Tätigkeiten
  GRUPPE_2: 'GRUPPE_2', // Mit IHK-Zertifikat
  GRUPPE_3: 'GRUPPE_3', // §34a GewO Sachkundeprüfung
  GRUPPE_4: 'GRUPPE_4', // Qualifizierte Fachkraft
  GRUPPE_5: 'GRUPPE_5', // Schichtführer
  GRUPPE_6: 'GRUPPE_6', // Objektleiter
  GRUPPE_7: 'GRUPPE_7', // Sicherheitsmeister
} as const

export type WageGroup = typeof WAGE_GROUPS[keyof typeof WAGE_GROUPS]

export const WAGE_GROUP_LABELS: Record<WageGroup, string> = {
  GRUPPE_1: 'Lohngruppe 1 - Einfache Tätigkeiten',
  GRUPPE_2: 'Lohngruppe 2 - Mit IHK-Zertifikat',
  GRUPPE_3: 'Lohngruppe 3 - §34a GewO Sachkundeprüfung',
  GRUPPE_4: 'Lohngruppe 4 - Qualifizierte Fachkraft',
  GRUPPE_5: 'Lohngruppe 5 - Schichtführer',
  GRUPPE_6: 'Lohngruppe 6 - Objektleiter',
  GRUPPE_7: 'Lohngruppe 7 - Geprüfter Meister für Schutz und Sicherheit',
}

/**
 * Base hourly wages by BSDW Tarifvertrag 2024 (in EUR)
 * NOTE: Values based on BSDW (Bundesverband der Sicherheitswirtschaft)
 * May vary by region (Bundesland) - these are average values
 */
export const BASE_HOURLY_WAGES: Record<WageGroup, number> = {
  GRUPPE_1: 13.00,  // Mindestlohn Sicherheit
  GRUPPE_2: 14.00,  // Mit IHK-Zertifikat
  GRUPPE_3: 15.50,  // §34a Sachkundeprüfung
  GRUPPE_4: 16.50,  // Qualifizierte Fachkraft
  GRUPPE_5: 17.50,  // Schichtführer
  GRUPPE_6: 19.00,  // Objektleiter
  GRUPPE_7: 22.00,  // Sicherheitsmeister
}

/**
 * Activity Types (Tätigkeitsarten)
 * Different security activities may have different wage rates
 */
export const ACTIVITY_TYPES = {
  OBJEKTSCHUTZ: 'OBJEKTSCHUTZ',               // Standard object security
  VERANSTALTUNG: 'VERANSTALTUNG',             // Event security
  BEWACHUNG: 'BEWACHUNG',                     // Surveillance/guarding
  REVIER: 'REVIER',                           // Patrol service
  EMPFANG: 'EMPFANG',                         // Reception/concierge
  NSL: 'NSL',                                 // Control center
  INTERVENTION: 'INTERVENTION',               // Intervention service
  WERTTRANSPORT: 'WERTTRANSPORT',             // Cash/valuables transport
  PERSONENSCHUTZ: 'PERSONENSCHUTZ',           // Personal protection
  BEWAFFNET: 'BEWAFFNET',                     // Armed security
  WERKSCHUTZ: 'WERKSCHUTZ',                   // Factory security
  CITYSTREIFE: 'CITYSTREIFE',                 // City patrol
  VERKEHRSDIENST: 'VERKEHRSDIENST',           // Traffic service
  FLUGHAFEN: 'FLUGHAFEN',                     // Airport security
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  OBJEKTSCHUTZ: 'Objektschutz',
  VERANSTALTUNG: 'Veranstaltungssicherheit',
  BEWACHUNG: 'Bewachung',
  REVIER: 'Revierdienst',
  EMPFANG: 'Empfangsdienst',
  NSL: 'NSL (Notruf- und Serviceleitstelle)',
  INTERVENTION: 'Interventionsdienst',
  WERTTRANSPORT: 'Geld- und Werttransport',
  PERSONENSCHUTZ: 'Personenschutz',
  BEWAFFNET: 'Bewaffneter Sicherheitsdienst',
  WERKSCHUTZ: 'Werkschutz',
  CITYSTREIFE: 'City-Streife',
  VERKEHRSDIENST: 'Verkehrsdienst',
  FLUGHAFEN: 'Flughafensicherheit',
}

/**
 * Default wage adjustments for specific activities (optional)
 * These can be overridden at employee or site level
 */
export const ACTIVITY_WAGE_ADJUSTMENTS: Partial<Record<ActivityType, number>> = {
  VERANSTALTUNG: 1.00,      // +1€ für Veranstaltungen
  BEWAFFNET: 5.00,          // +5€ für bewaffneten Dienst
  PERSONENSCHUTZ: 7.00,     // +7€ für Personenschutz
  WERTTRANSPORT: 4.00,      // +4€ für Werttransport
  FLUGHAFEN: 2.00,          // +2€ für Flughafensicherheit
  NSL: 1.50,                // +1,50€ für NSL
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
 * Helper function to get activity type label
 */
export function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPE_LABELS[type as ActivityType] ?? type
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
  return BASE_HOURLY_WAGES[group] ?? 13.00
}

/**
 * Helper function to get activity wage adjustment
 */
export function getActivityWageAdjustment(activityType: ActivityType): number {
  return ACTIVITY_WAGE_ADJUSTMENTS[activityType] ?? 0
}

/**
 * Helper function to get surcharge rate
 */
export function getSurchargeRate(type: SurchargeType): number {
  return SURCHARGE_RATES[type] ?? 0
}
