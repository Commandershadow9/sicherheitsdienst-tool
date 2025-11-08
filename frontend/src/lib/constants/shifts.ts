/**
 * Shift Constants
 * Central source for shift statuses
 */

/**
 * Shift Status Types
 */
export const SHIFT_STATUSES = {
  PLANNED: 'PLANNED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type ShiftStatus = typeof SHIFT_STATUSES[keyof typeof SHIFT_STATUSES]

/**
 * Shift Status Labels (German)
 */
export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  PLANNED: 'Geplant',
  CONFIRMED: 'Bestätigt',
  IN_PROGRESS: 'Läuft',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgesagt',
}

/**
 * Shift Status Colors (Tailwind classes)
 */
export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-200 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
}

/**
 * Helper function to get shift status label
 */
export function getShiftStatusLabel(status: string): string {
  return SHIFT_STATUS_LABELS[status as ShiftStatus] ?? status
}

/**
 * Helper function to get shift status color
 */
export function getShiftStatusColor(status: string): string {
  return SHIFT_STATUS_COLORS[status as ShiftStatus] ?? 'bg-gray-100 text-gray-800'
}
