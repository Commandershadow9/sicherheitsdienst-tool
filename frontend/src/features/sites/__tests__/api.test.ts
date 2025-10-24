import { describe, it, expect } from 'vitest';
import { transformWizardDataToSitePayload } from '../api';
import { WizardData } from '../../../types/wizard';

describe('Sites API', () => {
  describe('transformWizardDataToSitePayload', () => {
    it('should transform minimal wizard data correctly', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload).toEqual({
        name: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        status: 'ACTIVE',
      });
    });

    it('should include customerId when provided', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        customerId: 'customer-123',
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.customerId).toBe('customer-123');
    });

    it('should extract customer information from customer object', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        customer: {
          id: 'c1',
          companyName: 'Test GmbH',
          city: 'Berlin',
          postalCode: '10115',
          primaryContact: {
            name: 'Max Mustermann',
            email: 'max@test.de',
            phone: '+49123456789',
          },
        },
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.customerName).toBe('Max Mustermann');
      expect(payload.customerCompany).toBe('Test GmbH');
      expect(payload.customerEmail).toBe('max@test.de');
      expect(payload.customerPhone).toBe('+49123456789');
    });

    it('should include building information', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'Bürogebäude',
        floorCount: 5,
        squareMeters: 2000,
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.buildingType).toBe('Bürogebäude');
      expect(payload.floorCount).toBe(5);
      expect(payload.squareMeters).toBe(2000);
    });

    it('should include security concept with template reference', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        securityConcept: {
          templateId: 'template-1',
          templateName: 'Standard Büro',
          tasks: ['Türdienst', 'Kontrollgang'],
          shiftModel: '3-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 3,
          requiredQualifications: ['34a', 'Erste Hilfe'],
        },
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.requiredStaff).toBe(3);
      expect(payload.requiredQualifications).toEqual(['34a', 'Erste Hilfe']);
      expect(payload.securityConcept).toEqual({
        tasks: ['Türdienst', 'Kontrollgang'],
        shiftModel: '3-Schicht-System',
        hoursPerWeek: 168,
        templateId: 'template-1',
        templateName: 'Standard Büro',
      });
    });

    it('should include emergency contacts from documents', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        documents: {
          emergencyContacts: [
            { name: 'Hausmeister', phone: '+49111111111', role: 'Gebäudeverwaltung' },
            { name: 'Eigentümer', phone: '+49222222222' },
          ],
          notes: 'Wichtige Hinweise',
        },
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.emergencyContacts).toHaveLength(2);
      expect(payload.emergencyContacts?.[0]).toEqual({
        name: 'Hausmeister',
        phone: '+49111111111',
        role: 'Gebäudeverwaltung',
      });
    });

    it('should combine notes from calculation and documents', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        calculation: {
          hourlyRate: 25.5,
          notes: 'Sonderkonditionen vereinbart',
        },
        documents: {
          emergencyContacts: [],
          notes: 'Zugang nur mit Schlüsselkarte',
        },
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.notes).toContain('Kalkulation: Sonderkonditionen vereinbart');
      expect(payload.notes).toContain('Hinweise: Zugang nur mit Schlüsselkarte');
      expect(payload.notes).toContain('\n\n');
    });

    it('should include description when provided', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        description: 'Großes Bürogebäude im Zentrum',
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.description).toBe('Großes Bürogebäude im Zentrum');
    });

    it('should always set status to ACTIVE', () => {
      const wizardData: WizardData = {
        siteName: 'Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.status).toBe('ACTIVE');
    });

    it('should handle complete wizard data with all optional fields', () => {
      const wizardData: WizardData = {
        customerId: 'customer-123',
        siteName: 'Komplettes Test Objekt',
        address: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        buildingType: 'Bürogebäude',
        floorCount: 10,
        squareMeters: 5000,
        description: 'Premium Bürogebäude',
        securityConcept: {
          templateId: 'template-1',
          templateName: 'Premium',
          tasks: ['Empfang', 'Türdienst', 'Kontrollgang', 'Videoüberwachung'],
          shiftModel: '4-Schicht-System',
          hoursPerWeek: 168,
          requiredStaff: 4,
          requiredQualifications: ['34a', 'Erste Hilfe', 'Brandschutz'],
        },
        calculation: {
          hourlyRate: 30,
          additionalCosts: 500,
          discount: 10,
          notes: 'Langzeitvertrag',
        },
        documents: {
          emergencyContacts: [
            { name: 'Hausmeister', phone: '+49111', role: 'Technik' },
          ],
          notes: 'Alarmsystem Code: 1234',
        },
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.customerId).toBe('customer-123');
      expect(payload.name).toBe('Komplettes Test Objekt');
      expect(payload.buildingType).toBe('Bürogebäude');
      expect(payload.floorCount).toBe(10);
      expect(payload.squareMeters).toBe(5000);
      expect(payload.description).toBe('Premium Bürogebäude');
      expect(payload.requiredStaff).toBe(4);
      expect(payload.requiredQualifications).toHaveLength(3);
      expect(payload.securityConcept?.templateId).toBe('template-1');
      expect(payload.emergencyContacts).toHaveLength(1);
      expect(payload.notes).toContain('Langzeitvertrag');
      expect(payload.notes).toContain('Alarmsystem Code: 1234');
      expect(payload.status).toBe('ACTIVE');
    });

    it('should handle empty optional fields gracefully', () => {
      const wizardData: WizardData = {
        siteName: '',
        address: '',
        city: '',
        postalCode: '',
      };

      const payload = transformWizardDataToSitePayload(wizardData);

      expect(payload.name).toBe('');
      expect(payload.address).toBe('');
      expect(payload.city).toBe('');
      expect(payload.postalCode).toBe('');
    });
  });
});
