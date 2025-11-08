/**
 * Control Round-related constants
 * Used across web and mobile apps
 */

export const CONTROL_ROUND_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  INCOMPLETE: 'INCOMPLETE',
  CANCELLED: 'CANCELLED',
} as const

export type ControlRoundStatus = typeof CONTROL_ROUND_STATUS[keyof typeof CONTROL_ROUND_STATUS]

export const CONTROL_ROUND_STATUS_LABELS: Record<ControlRoundStatus, string> = {
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  INCOMPLETE: 'Unvollständig',
  CANCELLED: 'Abgebrochen',
}

export const CONTROL_ROUND_STATUS_COLORS: Record<ControlRoundStatus, string> = {
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

/**
 * Helper function to get control round status label
 */
export function getControlRoundStatusLabel(status: string): string {
  return CONTROL_ROUND_STATUS_LABELS[status as ControlRoundStatus] ?? status
}

/**
 * Helper function to get control round status color classes
 */
export function getControlRoundStatusColor(status: string): string {
  return CONTROL_ROUND_STATUS_COLORS[status as ControlRoundStatus] ?? 'bg-gray-100 text-gray-800'
}
