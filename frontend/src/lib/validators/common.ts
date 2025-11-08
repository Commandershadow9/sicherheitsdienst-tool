/**
 * Common Validation Utilities
 * Used across web and mobile apps
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate German phone number
 * Accepts formats: +49..., 0..., with/without spaces/dashes
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '')

  // Check for German phone number patterns
  const patterns = [
    /^\+49\d{10,11}$/,     // +49... (international)
    /^0\d{9,11}$/,         // 0... (national)
    /^\d{10,12}$/,         // Direct number
  ]

  return patterns.some((pattern) => pattern.test(cleaned))
}

/**
 * Validate German IBAN
 */
export function isValidIBAN(iban: string): boolean {
  // Remove spaces
  const cleaned = iban.replace(/\s/g, '').toUpperCase()

  // Check format
  const ibanRegex = /^DE\d{20}$/
  if (!ibanRegex.test(cleaned)) {
    return false
  }

  // TODO: Implement full IBAN checksum validation (mod-97 algorithm)
  return true
}

/**
 * Validate German postal code
 */
export function isValidPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^\d{5}$/
  return postalCodeRegex.test(postalCode)
}

/**
 * Validate tax ID (Steuer-ID)
 * Format: 11 digits
 */
export function isValidTaxId(taxId: string): boolean {
  const taxIdRegex = /^\d{11}$/
  return taxIdRegex.test(taxId)
}

/**
 * Validate social security number (Sozialversicherungsnummer)
 * Format: 12 alphanumeric characters
 */
export function isValidSocialSecurityNumber(ssn: string): boolean {
  const ssnRegex = /^\d{2}\d{6}[A-Z]\d{3}$/
  return ssnRegex.test(ssn.toUpperCase())
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate that a string is not empty after trimming
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  options: { min?: number; max?: number }
): boolean {
  const length = value.length
  if (options.min !== undefined && length < options.min) return false
  if (options.max !== undefined && length > options.max) return false
  return true
}

/**
 * Validate that a value is a positive number
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

/**
 * Validate that a value is a non-negative number
 */
export function isNonNegativeNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getTime() > Date.now()
}

/**
 * Validate date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getTime() < Date.now()
}

/**
 * Validate that a date is within a range
 */
export function isDateInRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const startObj = typeof start === 'string' ? new Date(start) : start
  const endObj = typeof end === 'string' ? new Date(end) : end

  return dateObj >= startObj && dateObj <= endObj
}
