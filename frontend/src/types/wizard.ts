/**
 * Wizard Types
 * State-Management für den 8-Schritt Wizard
 */

import { Customer } from './customer';
import { BuildingType } from './template';

export interface WizardData {
  // Schritt 1: Kunde
  customer?: Customer;
  customerId?: string;

  // Schritt 2: Objekt-Grunddaten
  siteName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  buildingType?: BuildingType;
  floorCount?: number;
  squareMeters?: number;
  description?: string;

  // Schritt 3: Sicherheitskonzept
  securityConcept?: {
    templateId?: string; // Falls Template verwendet
    templateName?: string;
    tasks: string[];
    shiftModel: string;
    hoursPerWeek: number;
    requiredStaff: number;
    requiredQualifications: string[];
  };

  // Schritt 4: Personal & Zuweisungen
  staff?: {
    siteManagerId?: string; // Objektleiter
    shiftLeaderIds?: string[]; // Schichtleiter
    additionalStaffIds?: string[]; // Weitere Mitarbeiter
  };

  // Schritt 5: Kontrollgänge & NFC-Punkte
  controlPoints?: {
    points: Array<{
      name: string;
      location: string;
      description?: string;
      nfcTagId?: string;
      qrCode?: string;
    }>;
    roundIntervalMinutes?: number; // Wie oft soll kontrolliert werden
    requirePhotos?: boolean;
  };

  // Schritt 6: Kalkulation & Preisberechnung
  calculation?: {
    hourlyRate: number;
    additionalCosts?: number;
    discount?: number; // Prozent
    notes?: string;
  };

  // Schritt 7: Dokumente & Notfallkontakte
  documents?: {
    emergencyContacts: Array<{
      name: string;
      phone: string;
      role?: string;
    }>;
    notes?: string;
  };
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const WIZARD_STEPS = [
  { number: 1, title: 'Kunde', description: 'Kunde auswählen oder anlegen' },
  { number: 2, title: 'Objekt', description: 'Grunddaten & Adresse' },
  { number: 3, title: 'Sicherheitskonzept', description: 'Anforderungen & Templates' },
  { number: 4, title: 'Personal', description: 'MA-Planung & Zuweisungen' },
  { number: 5, title: 'Kontrollgänge', description: 'NFC-Punkte & Rundenwesen' },
  { number: 6, title: 'Kalkulation', description: 'Preise & Angebot' },
  { number: 7, title: 'Dokumente', description: 'Upload & Notfallkontakte' },
  { number: 8, title: 'Abschluss', description: 'Zusammenfassung & Aktivierung' },
] as const;
