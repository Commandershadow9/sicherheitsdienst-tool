/**
 * Wage Calculation Business Logic
 * Central source of truth for all wage-related calculations
 * Used across web and mobile apps
 */

import {
  WageGroup,
  SurchargeType,
  ActivityType,
  getBaseHourlyWage,
  getSurchargeRate,
  getActivityWageAdjustment,
  NIGHT_SHIFT_HOURS,
  TAX_FREE_SURCHARGE_LIMITS,
  SOCIAL_SECURITY_RATES,
} from '../constants/wages'

export interface WageCalculationInput {
  wageGroup: WageGroup
  hoursWorked: number
  date: Date
  startTime?: string // "HH:MM" format
  endTime?: string // "HH:MM" format
  surcharges?: SurchargeType[]
}

export interface WageCalculationResult {
  baseWage: number
  surcharges: {
    type: SurchargeType
    rate: number
    amount: number
    taxFree: boolean
  }[]
  totalSurcharges: number
  grossWage: number
  taxFreeSurcharges: number
  taxableSurcharges: number
  netWageEstimate: number // Approximate after social security
}

/**
 * Calculate total wage including surcharges
 */
export function calculateWage(input: WageCalculationInput): WageCalculationResult {
  const baseHourlyRate = getBaseHourlyWage(input.wageGroup)
  const baseWage = baseHourlyRate * input.hoursWorked

  const surchargeDetails = (input.surcharges || []).map((type) => {
    const rate = getSurchargeRate(type)
    const amount = baseWage * rate
    const taxFreeLimit = TAX_FREE_SURCHARGE_LIMITS[type]
    const taxFree = taxFreeLimit !== null && rate <= taxFreeLimit

    return {
      type,
      rate,
      amount,
      taxFree,
    }
  })

  const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0)
  const taxFreeSurcharges = surchargeDetails
    .filter((s) => s.taxFree)
    .reduce((sum, s) => sum + s.amount, 0)
  const taxableSurcharges = totalSurcharges - taxFreeSurcharges

  const grossWage = baseWage + totalSurcharges

  // Approximate net wage (after social security contributions)
  // Note: This is a simplified calculation. Actual tax depends on many factors.
  const socialSecurityDeduction = (baseWage + taxableSurcharges) * SOCIAL_SECURITY_RATES.TOTAL_EMPLOYEE
  const netWageEstimate = grossWage - socialSecurityDeduction

  return {
    baseWage,
    surcharges: surchargeDetails,
    totalSurcharges,
    grossWage,
    taxFreeSurcharges,
    taxableSurcharges,
    netWageEstimate,
  }
}

/**
 * Determine applicable surcharges based on date and time
 */
export function determineApplicableSurcharges(
  date: Date,
  startTime?: string,
  endTime?: string
): SurchargeType[] {
  const surcharges: SurchargeType[] = []

  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

  // Check for Sunday
  if (dayOfWeek === 0) {
    surcharges.push('SUNDAY')
  }

  // Check for Saturday
  if (dayOfWeek === 6) {
    surcharges.push('SATURDAY')
  }

  // Check for German public holidays (simplified - add full list)
  if (isGermanPublicHoliday(date)) {
    surcharges.push('HOLIDAY')
  }

  // Check for night shift
  if (startTime && endTime) {
    if (isNightShift(startTime, endTime)) {
      surcharges.push('NIGHT')
    }
  }

  return surcharges
}

/**
 * Check if a time range includes night shift hours
 */
function isNightShift(startTime: string, endTime: string): boolean {
  const [startHour] = startTime.split(':').map(Number)
  const [endHour] = endTime.split(':').map(Number)

  // Night shift: 22:00 - 06:00
  return (
    startHour >= NIGHT_SHIFT_HOURS.START ||
    endHour <= NIGHT_SHIFT_HOURS.END ||
    (startHour < NIGHT_SHIFT_HOURS.END && endHour > NIGHT_SHIFT_HOURS.START)
  )
}

/**
 * Check if a date is a German public holiday
 * NOTE: This is a simplified version. Add full implementation with:
 * - New Year's Day
 * - Good Friday, Easter Monday (calculated)
 * - Labour Day (May 1)
 * - Ascension Day (calculated)
 * - Whit Monday (calculated)
 * - German Unity Day (October 3)
 * - Christmas (December 25-26)
 * - Regional holidays (depending on state)
 */
function isGermanPublicHoliday(date: Date): boolean {
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  // Fixed holidays
  const fixedHolidays = [
    { month: 1, day: 1 },   // New Year
    { month: 5, day: 1 },   // Labour Day
    { month: 10, day: 3 },  // German Unity
    { month: 12, day: 25 }, // Christmas
    { month: 12, day: 26 }, // Boxing Day
  ]

  return fixedHolidays.some((h) => h.month === month && h.day === day)

  // TODO: Add calculated holidays (Easter, Ascension, Whit Monday)
}

/**
 * Calculate monthly wage from hourly rate and expected hours
 */
export function calculateMonthlyWage(
  wageGroup: WageGroup,
  monthlyHours: number
): number {
  const hourlyRate = getBaseHourlyWage(wageGroup)
  return hourlyRate * monthlyHours
}

/**
 * Calculate overtime pay
 * Overtime = hours beyond normal weekly hours (typically 40-48h/week)
 */
export function calculateOvertimePay(
  wageGroup: WageGroup,
  overtimeHours: number,
  overtimeRate: number = 0.25 // 25% surcharge
): number {
  const baseHourlyRate = getBaseHourlyWage(wageGroup)
  const overtimeHourlyRate = baseHourlyRate * (1 + overtimeRate)
  return overtimeHours * overtimeHourlyRate
}

/**
 * Estimate annual gross salary
 */
export function estimateAnnualSalary(
  wageGroup: WageGroup,
  weeklyHours: number = 40,
  averageSurchargePercentage: number = 0.15 // 15% average surcharges
): number {
  const weeksPerYear = 52
  const annualHours = weeklyHours * weeksPerYear
  const baseAnnualWage = getBaseHourlyWage(wageGroup) * annualHours
  const surchargesEstimate = baseAnnualWage * averageSurchargePercentage
  return baseAnnualWage + surchargesEstimate
}

// ============================================================================
// FLEXIBLE WAGE SYSTEM (Employee, Activity, Site Overrides)
// ============================================================================

/**
 * Wage override configuration
 * This allows customization at different levels:
 * 1. Employee base wage (overrides tariff)
 * 2. Activity-specific wage adjustments
 * 3. Site-specific wage overrides
 */
export interface WageOverrides {
  // Employee-specific base hourly wage (overrides BSDW tariff)
  employeeBaseWage?: number

  // Employee-specific activity wages (overrides default activity adjustments)
  employeeActivityWages?: Partial<Record<ActivityType, number>>

  // Site-specific wage override (final override, highest priority)
  siteWageOverride?: number
}

/**
 * Calculate effective hourly wage with override hierarchy
 * Priority (highest to lowest):
 * 1. Site wage override (if set)
 * 2. Employee activity-specific wage (if set for this activity)
 * 3. Employee base wage + default activity adjustment
 * 4. BSDW tariff wage + default activity adjustment
 *
 * @param wageGroup - BSDW tariff wage group
 * @param activityType - Type of security activity
 * @param overrides - Optional wage overrides
 * @returns Effective hourly wage in EUR
 */
export function calculateEffectiveHourlyWage(
  wageGroup: WageGroup,
  activityType?: ActivityType,
  overrides?: WageOverrides
): number {
  // Priority 1: Site-specific override (highest priority)
  if (overrides?.siteWageOverride !== undefined) {
    return overrides.siteWageOverride
  }

  // Priority 2: Employee activity-specific wage
  if (activityType && overrides?.employeeActivityWages?.[activityType] !== undefined) {
    return overrides.employeeActivityWages[activityType]!
  }

  // Priority 3: Employee base wage + activity adjustment
  if (overrides?.employeeBaseWage !== undefined) {
    const baseWage = overrides.employeeBaseWage
    const activityAdjustment = activityType ? getActivityWageAdjustment(activityType) : 0
    return baseWage + activityAdjustment
  }

  // Priority 4: BSDW tariff + activity adjustment (default)
  const tariffWage = getBaseHourlyWage(wageGroup)
  const activityAdjustment = activityType ? getActivityWageAdjustment(activityType) : 0
  return tariffWage + activityAdjustment
}

/**
 * Advanced wage calculation with flexible overrides
 */
export interface FlexibleWageCalculationInput {
  wageGroup: WageGroup
  hoursWorked: number
  date: Date
  activityType?: ActivityType
  overrides?: WageOverrides
  startTime?: string
  endTime?: string
  surcharges?: SurchargeType[]
}

export interface FlexibleWageCalculationResult extends WageCalculationResult {
  effectiveHourlyRate: number
  wageSource: 'SITE_OVERRIDE' | 'EMPLOYEE_ACTIVITY' | 'EMPLOYEE_BASE' | 'TARIFF'
  activityAdjustment?: number
}

/**
 * Calculate wage with flexible override system
 * Supports employee-specific and site-specific wage overrides
 */
export function calculateFlexibleWage(
  input: FlexibleWageCalculationInput
): FlexibleWageCalculationResult {
  // Determine effective hourly rate
  const effectiveHourlyRate = calculateEffectiveHourlyWage(
    input.wageGroup,
    input.activityType,
    input.overrides
  )

  // Determine wage source for transparency
  let wageSource: 'SITE_OVERRIDE' | 'EMPLOYEE_ACTIVITY' | 'EMPLOYEE_BASE' | 'TARIFF'
  let activityAdjustment: number | undefined

  if (input.overrides?.siteWageOverride !== undefined) {
    wageSource = 'SITE_OVERRIDE'
  } else if (
    input.activityType &&
    input.overrides?.employeeActivityWages?.[input.activityType] !== undefined
  ) {
    wageSource = 'EMPLOYEE_ACTIVITY'
  } else if (input.overrides?.employeeBaseWage !== undefined) {
    wageSource = 'EMPLOYEE_BASE'
    activityAdjustment = input.activityType
      ? getActivityWageAdjustment(input.activityType)
      : undefined
  } else {
    wageSource = 'TARIFF'
    activityAdjustment = input.activityType
      ? getActivityWageAdjustment(input.activityType)
      : undefined
  }

  // Calculate base wage
  const baseWage = effectiveHourlyRate * input.hoursWorked

  // Calculate surcharges
  const surchargeDetails = (input.surcharges || []).map((type) => {
    const rate = getSurchargeRate(type)
    const amount = baseWage * rate
    const taxFreeLimit = TAX_FREE_SURCHARGE_LIMITS[type]
    const taxFree = taxFreeLimit !== null && rate <= taxFreeLimit

    return {
      type,
      rate,
      amount,
      taxFree,
    }
  })

  const totalSurcharges = surchargeDetails.reduce((sum, s) => sum + s.amount, 0)
  const taxFreeSurcharges = surchargeDetails
    .filter((s) => s.taxFree)
    .reduce((sum, s) => sum + s.amount, 0)
  const taxableSurcharges = totalSurcharges - taxFreeSurcharges

  const grossWage = baseWage + totalSurcharges

  // Social security deduction
  const socialSecurityDeduction =
    (baseWage + taxableSurcharges) * SOCIAL_SECURITY_RATES.TOTAL_EMPLOYEE
  const netWageEstimate = grossWage - socialSecurityDeduction

  return {
    effectiveHourlyRate,
    wageSource,
    activityAdjustment,
    baseWage,
    surcharges: surchargeDetails,
    totalSurcharges,
    grossWage,
    taxFreeSurcharges,
    taxableSurcharges,
    netWageEstimate,
  }
}

/**
 * Helper: Get wage breakdown for display purposes
 */
export function getWageBreakdown(
  wageGroup: WageGroup,
  activityType?: ActivityType,
  overrides?: WageOverrides
): {
  tariffWage: number
  activityAdjustment: number
  employeeBaseWage?: number
  employeeActivityWage?: number
  siteOverride?: number
  effectiveWage: number
  source: string
} {
  const tariffWage = getBaseHourlyWage(wageGroup)
  const activityAdjustment = activityType ? getActivityWageAdjustment(activityType) : 0
  const effectiveWage = calculateEffectiveHourlyWage(wageGroup, activityType, overrides)

  let source = 'BSDW Tarifvertrag'

  if (overrides?.siteWageOverride !== undefined) {
    source = 'Objekt-spezifisch'
  } else if (
    activityType &&
    overrides?.employeeActivityWages?.[activityType] !== undefined
  ) {
    source = 'MA-Tätigkeitsart'
  } else if (overrides?.employeeBaseWage !== undefined) {
    source = 'MA-Basislohn'
  }

  return {
    tariffWage,
    activityAdjustment,
    employeeBaseWage: overrides?.employeeBaseWage,
    employeeActivityWage:
      activityType && overrides?.employeeActivityWages
        ? overrides.employeeActivityWages[activityType]
        : undefined,
    siteOverride: overrides?.siteWageOverride,
    effectiveWage,
    source,
  }
}
