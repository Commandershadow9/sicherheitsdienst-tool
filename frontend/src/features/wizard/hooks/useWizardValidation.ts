import { WizardData, WizardStep } from '../../../types/wizard';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  missingSteps: number[];
}

/**
 * Validate wizard data for a specific step
 */
export function validateWizardStep(step: WizardStep, data: WizardData): ValidationResult {
  const errors: Record<string, string> = {};
  const missingSteps: number[] = [];

  switch (step) {
    case 1:
      // Step 1: Customer
      if (!data.customer && !data.customerId) {
        errors.customer = 'Bitte wählen Sie einen Kunden aus oder legen Sie einen neuen an';
        missingSteps.push(1);
      }
      break;

    case 2:
      // Step 2: Object
      if (!data.siteName || data.siteName.trim() === '') {
        errors.siteName = 'Objektname ist erforderlich';
        missingSteps.push(2);
      }
      if (!data.address || data.address.trim() === '') {
        errors.address = 'Adresse ist erforderlich';
        missingSteps.push(2);
      }
      if (!data.city || data.city.trim() === '') {
        errors.city = 'Stadt ist erforderlich';
        missingSteps.push(2);
      }
      if (!data.postalCode || data.postalCode.trim() === '') {
        errors.postalCode = 'PLZ ist erforderlich';
        missingSteps.push(2);
      }
      if (!data.buildingType) {
        errors.buildingType = 'Gebäudetyp ist erforderlich';
        missingSteps.push(2);
      }
      break;

    case 3:
      // Step 3: Security Concept
      if (!data.securityConcept) {
        errors.securityConcept = 'Sicherheitskonzept ist erforderlich';
        missingSteps.push(3);
      } else {
        if (!data.securityConcept.tasks || data.securityConcept.tasks.length === 0) {
          errors.tasks = 'Mindestens eine Aufgabe ist erforderlich';
          missingSteps.push(3);
        }
        if (!data.securityConcept.shiftModel) {
          errors.shiftModel = 'Schichtmodell ist erforderlich';
          missingSteps.push(3);
        }
        if (!data.securityConcept.hoursPerWeek || data.securityConcept.hoursPerWeek <= 0) {
          errors.hoursPerWeek = 'Stunden pro Woche müssen größer als 0 sein';
          missingSteps.push(3);
        }
        if (!data.securityConcept.requiredStaff || data.securityConcept.requiredStaff <= 0) {
          errors.requiredStaff = 'Mindestens 1 Mitarbeiter erforderlich';
          missingSteps.push(3);
        }
      }
      break;

    case 4:
      // Step 4: Staff (optional - no hard requirements)
      break;

    case 5:
      // Step 5: Control Points (optional)
      break;

    case 6:
      // Step 6: Calculation
      if (!data.calculation || !data.calculation.hourlyRate || data.calculation.hourlyRate <= 0) {
        errors.calculation = 'Stundensatz ist erforderlich';
        missingSteps.push(6);
      }
      break;

    case 7:
      // Step 7: Documents (optional)
      break;

    case 8:
      // Step 8: Summary - validate all required steps
      const step1Valid = validateWizardStep(1, data);
      const step2Valid = validateWizardStep(2, data);
      const step3Valid = validateWizardStep(3, data);
      const step6Valid = validateWizardStep(6, data);

      Object.assign(errors, step1Valid.errors, step2Valid.errors, step3Valid.errors, step6Valid.errors);
      missingSteps.push(...step1Valid.missingSteps, ...step2Valid.missingSteps, ...step3Valid.missingSteps, ...step6Valid.missingSteps);
      break;
  }

  // Remove duplicates from missingSteps
  const uniqueMissingSteps = Array.from(new Set(missingSteps));

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingSteps: uniqueMissingSteps,
  };
}

/**
 * Check if wizard is ready for completion
 */
export function isWizardComplete(data: WizardData): boolean {
  const validation = validateWizardStep(8, data);
  return validation.isValid;
}
