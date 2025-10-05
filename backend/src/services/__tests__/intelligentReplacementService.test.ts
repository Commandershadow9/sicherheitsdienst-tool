/**
 * Unit Tests für Intelligent Replacement Service (Phase 2b)
 */

import {
  calculateWorkloadScore,
  calculateComplianceScore,
  calculateFairnessScore,
  calculatePreferenceScore,
  calculateTotalScore,
} from '../intelligentReplacementService';
import { EmployeePreferences, Shift } from '@prisma/client';

describe('intelligentReplacementService', () => {
  describe('calculateWorkloadScore', () => {
    it('should return 100 for optimal utilization (70-90%)', () => {
      expect(calculateWorkloadScore(120, 160)).toBe(100); // 75%
      expect(calculateWorkloadScore(128, 160)).toBe(100); // 80%
      expect(calculateWorkloadScore(144, 160)).toBe(100); // 90%
    });

    it('should return 80 for good utilization (50-70% or 90-95%)', () => {
      expect(calculateWorkloadScore(80, 160)).toBe(80); // 50%
      expect(calculateWorkloadScore(96, 160)).toBe(80); // 60%
      expect(calculateWorkloadScore(152, 160)).toBe(80); // 95%
    });

    it('should return 60 for acceptable utilization (30-50% or 95-100%)', () => {
      expect(calculateWorkloadScore(48, 160)).toBe(60); // 30%
      expect(calculateWorkloadScore(64, 160)).toBe(60); // 40%
      expect(calculateWorkloadScore(160, 160)).toBe(60); // 100%
    });

    it('should return 40 for underutilization (<30%)', () => {
      expect(calculateWorkloadScore(32, 160)).toBe(40); // 20%
      expect(calculateWorkloadScore(16, 160)).toBe(40); // 10%
    });

    it('should return 40 for slight overwork (100-110%)', () => {
      expect(calculateWorkloadScore(168, 160)).toBe(40); // 105%
    });

    it('should return 0 for critical overwork (>110%)', () => {
      expect(calculateWorkloadScore(180, 160)).toBe(0); // 112.5%
      expect(calculateWorkloadScore(200, 160)).toBe(0); // 125%
    });
  });

  describe('calculateComplianceScore', () => {
    it('should return 100 for full compliance', () => {
      expect(calculateComplianceScore(12, 40, 5)).toBe(100);
      expect(calculateComplianceScore(15, 35, 4)).toBe(100);
    });

    it('should penalize insufficient rest time', () => {
      expect(calculateComplianceScore(10.5, 40, 5)).toBe(80); // 11h - 0.5h → -20
      expect(calculateComplianceScore(9.5, 40, 5)).toBe(50); // 10h - 0.5h → -50
      expect(calculateComplianceScore(8, 40, 5)).toBe(0); // < 9h → -100
    });

    it('should penalize excessive weekly hours (ArbZG)', () => {
      expect(calculateComplianceScore(12, 50, 5)).toBe(90); // 48h + 2h → -10
      expect(calculateComplianceScore(12, 55, 5)).toBe(65); // 48h + 7h → -35
      expect(calculateComplianceScore(12, 60, 5)).toBe(50); // 48h + 12h → -50 (max penalty)
    });

    it('should penalize excessive consecutive days', () => {
      expect(calculateComplianceScore(12, 40, 7)).toBe(90); // 6 days + 1 → -10
      expect(calculateComplianceScore(12, 40, 9)).toBe(70); // 6 days + 3 → -30
    });

    it('should combine multiple penalties', () => {
      expect(calculateComplianceScore(10, 52, 8)).toBe(40); // -20 (rest) -20 (weekly) -20 (consec) = 40
    });

    it('should never go below 0', () => {
      expect(calculateComplianceScore(5, 70, 10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateFairnessScore', () => {
    it('should return 100 for perfect fairness', () => {
      expect(calculateFairnessScore(5, 5, 2, 2)).toBe(100);
      expect(calculateFairnessScore(3, 3.5, 1, 1.2)).toBe(100); // Within tolerance
    });

    it('should penalize night shift deviation', () => {
      expect(calculateFairnessScore(8, 5, 2, 2)).toBe(85); // 3 shifts above avg → -15
      expect(calculateFairnessScore(10, 5, 2, 2)).toBe(75); // 5 shifts above avg → -25
    });

    it('should penalize replacement count deviation', () => {
      expect(calculateFairnessScore(5, 5, 4, 2)).toBe(80); // 2 replacements above avg → -20
      expect(calculateFairnessScore(5, 5, 6, 2)).toBe(60); // 4 replacements above avg → -40
    });

    it('should combine both penalties', () => {
      expect(calculateFairnessScore(8, 5, 4, 2)).toBe(65); // -15 (night) -20 (replace) = 65
    });

    it('should never go below 0', () => {
      expect(calculateFairnessScore(20, 5, 10, 2)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculatePreferenceScore', () => {
    const mockShiftNight: Shift = {
      id: 'shift1',
      siteId: 'site1',
      title: 'Nachtschicht',
      description: null,
      location: 'Test',
      startTime: new Date('2025-10-05T22:00:00Z'), // 22 Uhr = Nacht
      endTime: new Date('2025-10-06T06:00:00Z'),
      requiredEmployees: 1,
      requiredQualifications: [],
      status: 'PLANNED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockShiftDay: Shift = {
      ...mockShiftNight,
      id: 'shift2',
      title: 'Tagschicht',
      startTime: new Date('2025-10-05T08:00:00Z'), // 8 Uhr = Tag
      endTime: new Date('2025-10-05T16:00:00Z'),
    };

    const mockShiftWeekend: Shift = {
      ...mockShiftNight,
      id: 'shift3',
      startTime: new Date('2025-10-05T10:00:00Z'), // Samstag
      endTime: new Date('2025-10-05T18:00:00Z'),
    };

    const mockPreferences: EmployeePreferences = {
      id: 'pref1',
      userId: 'user1',
      prefersNightShifts: false,
      prefersDayShifts: true,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      flexibleHours: true,
      prefersLongShifts: false,
      prefersShortShifts: false,
      prefersConsecutiveDays: 5,
      minRestDaysPerWeek: 2,
      preferredSiteIds: ['site2'],
      avoidedSiteIds: [],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return 50 if no preferences exist', () => {
      const score = calculatePreferenceScore(mockShiftDay, null, 120, 8);
      expect(score).toBe(50);
    });

    it('should penalize night shift for day-preferring employee', () => {
      const score = calculatePreferenceScore(mockShiftNight, mockPreferences, 120, 8);
      expect(score).toBeLessThan(100);
      expect(score).toBe(70); // -30 for night shift mismatch
    });

    it('should not penalize day shift for day-preferring employee', () => {
      const score = calculatePreferenceScore(mockShiftDay, mockPreferences, 120, 8);
      expect(score).toBeGreaterThanOrEqual(80); // No night shift penalty
    });

    it('should penalize if exceeds max monthly hours', () => {
      const score = calculatePreferenceScore(mockShiftDay, mockPreferences, 195, 8); // 195 + 8 = 203 > 200
      expect(score).toBeLessThan(60); // -40 for exceeding max + other penalties
      expect(score).toBeGreaterThan(40);
    });

    it('should penalize if below min monthly hours', () => {
      const score = calculatePreferenceScore(mockShiftDay, mockPreferences, 100, 8); // 100 + 8 = 108 < 120
      expect(score).toBeLessThan(80); // -20 for below min + other penalties
      expect(score).toBeGreaterThan(60);
    });

    it('should penalize avoided sites', () => {
      const prefsWithAvoid: EmployeePreferences = {
        ...mockPreferences,
        avoidedSiteIds: ['site1'],
      };
      const score = calculatePreferenceScore(mockShiftDay, prefsWithAvoid, 120, 8);
      expect(score).toBeLessThan(50); // -50 for avoided site + other penalties
      expect(score).toBeGreaterThan(30);
    });

    it('should reward preferred sites', () => {
      const score = calculatePreferenceScore(
        { ...mockShiftDay, siteId: 'site2' },
        mockPreferences,
        120,
        8
      );
      expect(score).toBeGreaterThanOrEqual(90); // Bonus, but clamped at 100
      expect(score).toBeLessThanOrEqual(100); // Clamped to max
    });

    it('should penalize long shifts if not preferred', () => {
      const longShift = { ...mockShiftDay, endTime: new Date('2025-10-05T20:00:00Z') }; // 12h shift
      const score = calculatePreferenceScore(longShift, mockPreferences, 120, 12);
      expect(score).toBeLessThan(90); // -10 for long shift
    });

    it('should clamp score between 0 and 100', () => {
      // Multiple penalties
      const badPrefs: EmployeePreferences = {
        ...mockPreferences,
        avoidedSiteIds: ['site1'],
        maxMonthlyHours: 150,
      };
      const score = calculatePreferenceScore(mockShiftNight, badPrefs, 145, 8); // Night + Avoided + Exceeds max
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateTotalScore', () => {
    it('should apply correct weights', () => {
      // Compliance: 40%, Preference: 30%, Fairness: 20%, Workload: 10%
      const score = calculateTotalScore(80, 90, 70, 60);
      // 80*0.1 + 90*0.4 + 70*0.2 + 60*0.3 = 8 + 36 + 14 + 18 = 76
      expect(score).toBe(76);
    });

    it('should prioritize compliance (40% weight)', () => {
      const highCompliance = calculateTotalScore(100, 100, 100, 100);
      const lowCompliance = calculateTotalScore(100, 0, 100, 100);
      expect(highCompliance).toBe(100);
      expect(lowCompliance).toBe(60); // Only 60% remain when compliance is 0
    });

    it('should handle all zeros', () => {
      const score = calculateTotalScore(0, 0, 0, 0);
      expect(score).toBe(0);
    });

    it('should handle all 100s', () => {
      const score = calculateTotalScore(100, 100, 100, 100);
      expect(score).toBe(100);
    });

    it('should produce reasonable scores for typical cases', () => {
      // Typical good candidate: good compliance, decent rest
      const goodCandidate = calculateTotalScore(70, 95, 80, 75);
      expect(goodCandidate).toBeGreaterThanOrEqual(80);

      // Typical acceptable candidate: some issues
      const acceptableCandidate = calculateTotalScore(60, 70, 60, 50);
      expect(acceptableCandidate).toBeGreaterThanOrEqual(60);
      expect(acceptableCandidate).toBeLessThan(80);
    });
  });
});
