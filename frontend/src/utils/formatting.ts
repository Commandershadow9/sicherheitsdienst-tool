/**
 * Zentrale Formatierungs-Utilities
 * Vermeidet Duplikation von Intl.DateTimeFormat Instanzen
 */

// Datum-Formatter
export const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export const shortDateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

export const longDateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

// Zeit-Formatter
export const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

export const timeFormatterWithSeconds = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

// Kombiniert: Datum + Zeit
export const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Formatiert einen ISO-String zu deutschem Datumsformat
 * @example "2025-10-05T10:00:00Z" → "05.10.2025"
 */
export function formatDate(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  return dateFormatter.format(date)
}

/**
 * Formatiert einen ISO-String zu Uhrzeit
 * @example "2025-10-05T14:30:00Z" → "14:30"
 */
export function formatTime(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  return timeFormatter.format(date)
}

/**
 * Formatiert einen ISO-String zu Datum + Uhrzeit
 * @example "2025-10-05T14:30:00Z" → "05.10.2025, 14:30"
 */
export function formatDateTime(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  return dateTimeFormatter.format(date)
}

/**
 * Formatiert ein Zeitfenster (von-bis)
 * @example "Fr. 05.10. · 08:00 – 16:00 Uhr"
 */
export function formatShiftWindow(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return `${shortDateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)} Uhr`
}

/**
 * Berechnet Anzahl Tage zwischen zwei Daten
 * @example ("2025-10-05", "2025-10-10") → 5
 */
export function calculateDays(startIso: string, endIso: string): number {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const diffMs = end.getTime() - start.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Relativer Zeitstempel (vor X Minuten/Stunden/Tagen)
 * @example vor 5 Minuten, vor 2 Stunden, vor 3 Tagen
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'gerade eben'
  if (diffMinutes < 60) return `vor ${diffMinutes} Minute${diffMinutes !== 1 ? 'n' : ''}`
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`
  if (diffDays < 30) return `vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`
  return formatDate(date)
}
