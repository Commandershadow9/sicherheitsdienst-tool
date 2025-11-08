/**
 * Master Library Export
 * Single import point for all shared utilities, constants, and business logic
 *
 * Usage Examples:
 * import { formatEuro, formatDate, CALCULATION_STATUS, calculateWage, isValidEmail } from '@/lib'
 */

// Constants
export * from './constants'

// Formatters
export * from './formatters'

// Validators
export * from './validators'

// Business Logic
export * from './business'

// Existing utilities (keep backward compatibility)
export * from './utils'
export * from './api'
export * from './toast-helpers'
