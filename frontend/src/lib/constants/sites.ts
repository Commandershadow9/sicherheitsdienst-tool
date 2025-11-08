/**
 * Site Constants
 * Central source for site statuses
 */

/**
 * Site Status Types
 */
export const SITE_STATUSES = {
  INQUIRY: 'INQUIRY',
  IN_REVIEW: 'IN_REVIEW',
  CALCULATING: 'CALCULATING',
  OFFER_SENT: 'OFFER_SENT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOST: 'LOST',
} as const

export type SiteStatus = typeof SITE_STATUSES[keyof typeof SITE_STATUSES]

/**
 * Site Status Labels (German)
 */
export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
  INQUIRY: 'Anfrage',
  IN_REVIEW: 'In Prüfung',
  CALCULATING: 'Kalkulation',
  OFFER_SENT: 'Angebot versendet',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  LOST: 'Verloren',
}

/**
 * Site Status Colors (Tailwind classes)
 */
export const SITE_STATUS_COLORS: Record<SiteStatus, string> = {
  INQUIRY: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  CALCULATING: 'bg-orange-100 text-orange-800',
  OFFER_SENT: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
}

/**
 * Helper function to get site status label
 */
export function getSiteStatusLabel(status: string): string {
  return SITE_STATUS_LABELS[status as SiteStatus] ?? status
}

/**
 * Helper function to get site status color
 */
export function getSiteStatusColor(status: string): string {
  return SITE_STATUS_COLORS[status as SiteStatus] ?? 'bg-gray-100 text-gray-800'
}
