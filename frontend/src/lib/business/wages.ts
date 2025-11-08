/**
 * Wage Calculation Business Logic
 * Central source of truth for all wage-related calculations
 * Used across web and mobile apps
 */

import {
  WageGroup,
  SurchargeType,
  getBaseHourlyWage,
  getSurchargeRate,
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
