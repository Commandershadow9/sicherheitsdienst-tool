/**
 * Date and Time Formatting Utilities
 * Consistent date/time formatting across web and mobile apps
 */

/**
 * Format a date in German locale
 * @param date - Date string, Date object, or timestamp
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  if (isNaN(dateObj.getTime())) {
    return 'Ungültiges Datum'
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
  }[format]

  return new Intl.DateTimeFormat('de-DE', options).format(dateObj)
}

/**
 * Format time (hours and minutes)
 * @param date - Date string, Date object, or timestamp
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string (e.g., "14:30" or "14:30:45")
 */
export function formatTime(
  date: string | Date | number,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  if (isNaN(dateObj.getTime())) {
    return 'Ungültige Zeit'
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  }

  return new Intl.DateTimeFormat('de-DE', options).format(dateObj)
}

/**
 * Format date and time together
 * @param date - Date string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: string | Date | number,
  options: {
    dateFormat?: 'short' | 'medium' | 'long'
    includeSeconds?: boolean
    separator?: string
  } = {}
): string {
  const { dateFormat = 'short', includeSeconds = false, separator = ', ' } = options

  const formattedDate = formatDate(date, dateFormat)
  const formattedTime = formatTime(date, includeSeconds)

  return `${formattedDate}${separator}${formattedTime}`
}

/**
 * Format a date relative to now (e.g., "vor 2 Stunden", "in 3 Tagen")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  if (isNaN(dateObj.getTime())) {
    return 'Ungültiges Datum'
  }

  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second')
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute')
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour')
  } else if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, 'day')
  } else {
    return formatDate(dateObj, 'short')
  }
}

/**
 * Format a duration in hours and minutes
 * @param minutes - Total minutes
 * @returns Formatted duration (e.g., "2h 30min")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}min`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}min`
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  const today = new Date()
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return dateObj.getTime() < new Date().getTime()
}

/**
 * Get day of week name
 */
export function getDayName(date: string | Date | number, format: 'long' | 'short' = 'long'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat('de-DE', {
    weekday: format,
  }).format(dateObj)
}

/**
 * Format a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted range (e.g., "01.01.2024 - 31.01.2024")
 */
export function formatDateRange(
  startDate: string | Date | number,
  endDate: string | Date | number,
  separator: string = ' - '
): string {
  return `${formatDate(startDate, 'short')}${separator}${formatDate(endDate, 'short')}`
}
