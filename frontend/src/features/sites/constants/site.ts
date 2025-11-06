/**
 * Site-related constants
 * Extracted from SiteDetail.tsx for better maintainability
 */

import type { SiteStatus } from '../types/site'

export const STATUS_LABELS: Record<SiteStatus, string> = {
  INQUIRY: 'Anfrage',
  IN_REVIEW: 'In Prüfung',
  CALCULATING: 'Kalkulation',
  OFFER_SENT: 'Angebot versendet',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  LOST: 'Verloren',
}

export const STATUS_COLORS: Record<SiteStatus, string> = {
  INQUIRY: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  CALCULATING: 'bg-orange-100 text-orange-800',
  OFFER_SENT: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
}

export const ROLE_LABELS: Record<string, string> = {
  OBJEKTLEITER: 'Objektleiter',
  SCHICHTLEITER: 'Schichtleiter',
  MITARBEITER: 'Mitarbeiter',
}
