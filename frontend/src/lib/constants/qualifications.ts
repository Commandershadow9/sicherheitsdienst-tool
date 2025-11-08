/**
 * Qualification Constants
 * Central source of truth for all security qualifications
 * Used across web and mobile apps
 */

export const QUALIFICATIONS = {
  // Basic Qualifications
  PARAGRAPH_34A: '§34a GewO',
  SACHKUNDE: 'Sachkundeprüfung',

  // Specialized Training
  BRANDSCHUTZ: 'Brandschutzhelfer',
  ERSTE_HILFE: 'Erste Hilfe',
  EVAKUIERUNG: 'Evakuierungshelfer',

  // Technical Qualifications
  NSL_SCHULUNG: 'NSL-Schulung',
  VIDEOUEBERWACHUNG: 'Videoüberwachung',
  ZUTRITTSKONTROLLE: 'Zutrittskontrolle',

  // Leadership & Management
  OBJEKTLEITER: 'Objektleiter-Qualifikation',
  SCHICHTLEITER: 'Schichtleiter-Qualifikation',
  SICHERHEITSMEISTER: 'Geprüfter Meister für Schutz und Sicherheit',

  // Specialized Areas
  AIRPORT_SECURITY: 'Luftsicherheit',
  EVENT_SECURITY: 'Veranstaltungssicherheit',
  CASH_TRANSPORT: 'Geld- und Werttransport',
  PERSONAL_PROTECTION: 'Personenschutz',

  // Driving Licenses
  FUEHRERSCHEIN_B: 'Führerschein Klasse B',
  FUEHRERSCHEIN_C: 'Führerschein Klasse C',
  FUEHRERSCHEIN_CE: 'Führerschein Klasse CE',

  // Other
  WAFFENSCHEIN: 'Waffensachkunde',
  DIENSTHUND: 'Diensthundeführer',
} as const

export type Qualification = typeof QUALIFICATIONS[keyof typeof QUALIFICATIONS]

/**
 * Qualification categories for better organization
 */
export const QUALIFICATION_CATEGORIES = {
  BASIC: 'Grundqualifikationen',
  SPECIALIZED: 'Fachqualifikationen',
  TECHNICAL: 'Technische Qualifikationen',
  LEADERSHIP: 'Führungsqualifikationen',
  SPECIALIZED_AREAS: 'Spezialbereiche',
  DRIVING: 'Führerscheine',
  OTHER: 'Sonstige',
} as const

export const QUALIFICATIONS_BY_CATEGORY = {
  BASIC: ['§34a GewO', 'Sachkundeprüfung'],
  SPECIALIZED: ['Brandschutzhelfer', 'Erste Hilfe', 'Evakuierungshelfer'],
  TECHNICAL: ['NSL-Schulung', 'Videoüberwachung', 'Zutrittskontrolle'],
  LEADERSHIP: ['Objektleiter-Qualifikation', 'Schichtleiter-Qualifikation', 'Geprüfter Meister für Schutz und Sicherheit'],
  SPECIALIZED_AREAS: ['Luftsicherheit', 'Veranstaltungssicherheit', 'Geld- und Werttransport', 'Personenschutz'],
  DRIVING: ['Führerschein Klasse B', 'Führerschein Klasse C', 'Führerschein Klasse CE'],
  OTHER: ['Waffensachkunde', 'Diensthundeführer'],
}

/**
 * Qualifications that require periodic renewal
 */
export const RENEWABLE_QUALIFICATIONS = [
  'Erste Hilfe',
  'Brandschutzhelfer',
  'NSL-Schulung',
] as const

/**
 * Standard validity periods (in months)
 */
export const QUALIFICATION_VALIDITY_PERIODS: Record<string, number> = {
  'Erste Hilfe': 24,              // 2 years
  'Brandschutzhelfer': 36,        // 3 years
  'NSL-Schulung': 12,             // 1 year
  'Luftsicherheit': 60,           // 5 years
}

/**
 * Helper function to check if a qualification needs renewal
 */
export function isRenewableQualification(qualification: string): boolean {
  return RENEWABLE_QUALIFICATIONS.includes(qualification as any)
}

/**
 * Helper function to get validity period in months
 */
export function getQualificationValidityPeriod(qualification: string): number | null {
  return QUALIFICATION_VALIDITY_PERIODS[qualification] ?? null
}
