import { describe, it, expect } from 'vitest';
import { validateWizardStep, isWizardComplete } from '../useWizardValidation';
import { WizardData } from '../../../../types/wizard';

describe('useWizardValidation', () => {
  describe('validateWizardStep - Step 1 (Customer)', () => {
    it('should pass validation with customerId', () => {
      const data: WizardData = {
        customerId: 'customer-123',
      };

      const result = validateWizardStep(1, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.missingSteps).toEqual([]);
    });

    it('should pass validation with customer object', () => {
      const data: WizardData = {
        customer: {
          id: 'c1',
          companyName: 'Test GmbH',
          address: 'Teststraße 1',
          city: 'Berlin',
          postalCode: '10115',
          country: 'DE',
          paymentTerms: 'NET30',
          contacts: [],
          primaryContact: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+49123456789',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const result = validateWizardStep(1, data);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation without customer', () => {
      const data: WizardData = {};

      const result = validateWizardStep(1, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.customer).toBeDefined();
      expect(result.missingSteps).toContain(1);
    });
  });

  describe('validateWizardStep - Step 2 (Object)', () => {
    it('should pass validation with all required fields', () => {
      const data: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'OFFICE',
      };

      const result = validateWizardStep(2, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should fail validation without siteName', () => {
      const data: WizardData = {
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'OFFICE',
      };

      const result = validateWizardStep(2, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.siteName).toBeDefined();
    });

    it('should fail validation without address', () => {
      const data: WizardData = {
        siteName: 'Test Objekt',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'OFFICE',
      };

      const result = validateWizardStep(2, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.address).toBeDefined();
    });

    it('should fail validation without buildingType', () => {
      const data: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
      };

      const result = validateWizardStep(2, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.buildingType).toBeDefined();
    });
  });

  describe('validateWizardStep - Step 3 (Security Concept)', () => {
    it('should pass validation with complete security concept', () => {
      const data: WizardData = {
        securityConcept: {
          tasks: ['Türdienst', 'Kontrollgang'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: ['34a'],
        },
      };

      const result = validateWizardStep(3, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should fail validation without tasks', () => {
      const data: WizardData = {
        securityConcept: {
          tasks: [],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: [],
        },
      };

      const result = validateWizardStep(3, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.tasks).toBeDefined();
    });

    it('should fail validation without shiftModel', () => {
      const data: WizardData = {
        securityConcept: {
          tasks: ['Türdienst'],
          shiftModel: '',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: [],
        },
      };

      const result = validateWizardStep(3, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.shiftModel).toBeDefined();
    });

    it('should fail validation with invalid hoursPerWeek', () => {
      const data: WizardData = {
        securityConcept: {
          tasks: ['Türdienst'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 0,
          requiredStaff: 3,
          requiredQualifications: [],
        },
      };

      const result = validateWizardStep(3, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.hoursPerWeek).toBeDefined();
    });

    it('should fail validation with invalid requiredStaff', () => {
      const data: WizardData = {
        securityConcept: {
          tasks: ['Türdienst'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 0,
          requiredQualifications: [],
        },
      };

      const result = validateWizardStep(3, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.requiredStaff).toBeDefined();
    });
  });

  describe('validateWizardStep - Step 6 (Calculation)', () => {
    it('should pass validation with valid hourlyRate', () => {
      const data: WizardData = {
        calculation: {
          hourlyRate: 25.5,
        },
      };

      const result = validateWizardStep(6, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should fail validation without hourlyRate', () => {
      const data: WizardData = {};

      const result = validateWizardStep(6, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.calculation).toBeDefined();
    });

    it('should fail validation with zero hourlyRate', () => {
      const data: WizardData = {
        calculation: {
          hourlyRate: 0,
        },
      };

      const result = validateWizardStep(6, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.calculation).toBeDefined();
    });

    it('should fail validation with negative hourlyRate', () => {
      const data: WizardData = {
        calculation: {
          hourlyRate: -10,
        },
      };

      const result = validateWizardStep(6, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.calculation).toBeDefined();
    });
  });

  describe('validateWizardStep - Step 8 (Summary)', () => {
    it('should pass validation with all required data', () => {
      const data: WizardData = {
        customerId: 'customer-123',
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'OFFICE',
        securityConcept: {
          tasks: ['Türdienst'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: [],
        },
        calculation: {
          hourlyRate: 25.5,
        },
      };

      const result = validateWizardStep(8, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should aggregate errors from all required steps', () => {
      const data: WizardData = {
        // Missing customer, siteName, securityConcept, calculation
      };

      const result = validateWizardStep(8, data);

      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      expect(result.missingSteps.length).toBeGreaterThan(0);
    });
  });

  describe('isWizardComplete', () => {
    it('should return true for complete wizard data', () => {
      const data: WizardData = {
        customerId: 'customer-123',
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'OFFICE',
        securityConcept: {
          tasks: ['Türdienst'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: [],
        },
        calculation: {
          hourlyRate: 25.5,
        },
      };

      const result = isWizardComplete(data);

      expect(result).toBe(true);
    });

    it('should return false for incomplete wizard data', () => {
      const data: WizardData = {
        siteName: 'Test Objekt',
        // Missing required fields
      };

      const result = isWizardComplete(data);

      expect(result).toBe(false);
    });
  });
});
