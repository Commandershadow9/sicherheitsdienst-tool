/**
 * Calculation-related constants
 * Used across web and mobile apps
 */

export const CALCULATION_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const

export type CalculationStatus = typeof CALCULATION_STATUS[keyof typeof CALCULATION_STATUS]

export const CALCULATION_STATUS_LABELS: Record<CalculationStatus, string> = {
  DRAFT: 'Entwurf',
  SENT: 'Versendet',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  ARCHIVED: 'Archiviert',
}

export const CALCULATION_STATUS_COLORS: Record<CalculationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
}

/**
 * Helper function to get calculation status label
 */
export function getCalculationStatusLabel(status: string): string {
  return CALCULATION_STATUS_LABELS[status as CalculationStatus] ?? status
}

/**
 * Helper function to get calculation status color classes
 */
export function getCalculationStatusColor(status: string): string {
  return CALCULATION_STATUS_COLORS[status as CalculationStatus] ?? 'bg-gray-100 text-gray-800'
}
