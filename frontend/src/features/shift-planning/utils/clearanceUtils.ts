/**
 * Clearance Utilities
 * Helper-Funktionen für Clearance-Status und Compliance-Checks
 */

import { isAfter, parseISO } from 'date-fns';
import type { ObjectClearance } from '../../shifts/api';

export type ClearanceStatus = 'CLEARED' | 'EXPIRED' | 'NOT_CLEARED' | 'EXPIRING_SOON';

export interface ClearanceCheck {
  status: ClearanceStatus;
  clearance?: ObjectClearance;
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  color: string;
}

/**
 * Prüft ob ein Mitarbeiter für eine Site die erforderliche Clearance hat
 */
export function checkClearanceForSite(
  clearances: ObjectClearance[] | undefined,
  siteId: string
): ClearanceCheck {
  if (!clearances || clearances.length === 0) {
    return {
      status: 'NOT_CLEARED',
      message: 'Keine Einarbeitung',
      severity: 'error',
      color: 'text-red-600 bg-red-50 border-red-200',
    };
  }

  const clearance = clearances.find((c) => c.siteId === siteId);

  if (!clearance) {
    return {
      status: 'NOT_CLEARED',
      message: 'Keine Objekt-Einarbeitung',
      severity: 'error',
      color: 'text-red-600 bg-red-50 border-red-200',
    };
  }

  // Check if revoked or suspended
  if (clearance.status === 'REVOKED' || clearance.status === 'SUSPENDED') {
    return {
      status: 'NOT_CLEARED',
      clearance,
      message: clearance.status === 'REVOKED' ? 'Einarbeitung entzogen' : 'Einarbeitung suspendiert',
      severity: 'error',
      color: 'text-red-600 bg-red-50 border-red-200',
    };
  }

  // Check expiration
  if (clearance.validUntil) {
    const expiryDate = parseISO(clearance.validUntil);
    const now = new Date();

    // Expired
    if (isAfter(now, expiryDate)) {
      return {
        status: 'EXPIRED',
        clearance,
        message: 'Einarbeitung abgelaufen',
        severity: 'error',
        color: 'text-red-600 bg-red-50 border-red-200',
      };
    }

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (isAfter(thirtyDaysFromNow, expiryDate)) {
      return {
        status: 'EXPIRING_SOON',
        clearance,
        message: 'Einarbeitung läuft bald ab',
        severity: 'warning',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
      };
    }
  }

  // All good
  return {
    status: 'CLEARED',
    clearance,
    message: 'Eingearbeitet',
    severity: 'success',
    color: 'text-green-600 bg-green-50 border-green-200',
  };
}

/**
 * Prüft ob Mitarbeiter die erforderlichen Qualifikationen hat
 */
export function checkQualifications(
  userQualifications: string[] | undefined,
  requiredQualifications: string[]
): {
  hasAll: boolean;
  missing: string[];
  message: string;
  severity: 'success' | 'warning' | 'error';
  color: string;
} {
  if (requiredQualifications.length === 0) {
    return {
      hasAll: true,
      missing: [],
      message: 'Keine Qualifikationen erforderlich',
      severity: 'success',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
    };
  }

  if (!userQualifications || userQualifications.length === 0) {
    return {
      hasAll: false,
      missing: requiredQualifications,
      message: `${requiredQualifications.length} Qualifikation(en) fehlen`,
      severity: 'error',
      color: 'text-red-600 bg-red-50 border-red-200',
    };
  }

  const missing = requiredQualifications.filter((req) => !userQualifications.includes(req));

  if (missing.length === 0) {
    return {
      hasAll: true,
      missing: [],
      message: 'Alle Qualifikationen vorhanden',
      severity: 'success',
      color: 'text-green-600 bg-green-50 border-green-200',
    };
  }

  return {
    hasAll: false,
    missing,
    message: `${missing.length} Qualifikation(en) fehlen`,
    severity: 'error',
    color: 'text-red-600 bg-red-50 border-red-200',
  };
}

/**
 * Kombinierte Compliance-Prüfung (Clearance + Qualifikationen)
 */
export function checkCompliance(
  clearances: ObjectClearance[] | undefined,
  userQualifications: string[] | undefined,
  siteId: string,
  requiredQualifications: string[]
): {
  isCompliant: boolean;
  clearanceCheck: ClearanceCheck;
  qualificationCheck: ReturnType<typeof checkQualifications>;
  warnings: Array<{ type: string; message: string; severity: 'warning' | 'error' }>;
} {
  const clearanceCheck = checkClearanceForSite(clearances, siteId);
  const qualificationCheck = checkQualifications(userQualifications, requiredQualifications);

  const warnings: Array<{ type: string; message: string; severity: 'warning' | 'error' }> = [];

  if (clearanceCheck.status !== 'CLEARED') {
    warnings.push({
      type: 'CLEARANCE',
      message: clearanceCheck.message,
      severity: clearanceCheck.status === 'EXPIRING_SOON' ? 'warning' : 'error',
    });
  }

  if (!qualificationCheck.hasAll) {
    warnings.push({
      type: 'QUALIFICATIONS',
      message: qualificationCheck.message,
      severity: 'error',
    });
  }

  const isCompliant = clearanceCheck.status === 'CLEARED' && qualificationCheck.hasAll;

  return {
    isCompliant,
    clearanceCheck,
    qualificationCheck,
    warnings,
  };
}
