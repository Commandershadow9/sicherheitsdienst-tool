import type { Shift, EmployeePreferences } from '@prisma/client';

export function calculateWorkloadScore(currentHours: number, targetHours: number): number {
  const utilizationPercent = (currentHours / targetHours) * 100;

  if (utilizationPercent >= 70 && utilizationPercent <= 90) return 100;

  if (
    (utilizationPercent >= 50 && utilizationPercent < 70) ||
    (utilizationPercent > 90 && utilizationPercent <= 95)
  )
    return 80;

  if (
    (utilizationPercent >= 30 && utilizationPercent < 50) ||
    (utilizationPercent > 95 && utilizationPercent <= 100)
  )
    return 60;

  if (utilizationPercent < 30) return 40;
  if (utilizationPercent > 100 && utilizationPercent <= 110) return 40;

  return 0;
}

export function calculateComplianceScore(
  restHours: number,
  weeklyHours: number,
  consecutiveDays: number,
): number {
  let score = 100;

  if (restHours < 11) {
    if (restHours < 9) score -= 100;
    else if (restHours < 10) score -= 50;
    else score -= 20;
  }

  if (weeklyHours > 48) {
    const excess = weeklyHours - 48;
    score -= Math.min(excess * 5, 50);
  }

  if (consecutiveDays > 6) {
    score -= (consecutiveDays - 6) * 10;
  }

  return Math.max(0, score);
}

export function calculateFairnessScore(
  userNightShifts: number,
  teamAvgNightShifts: number,
  userReplacementCount: number,
  teamAvgReplacementCount: number,
  preferences: EmployeePreferences | null,
): number {
  let score = 100;

  // Nachtschicht-Fairness: Berücksichtige Präferenzen
  const nightShiftDeviation = Math.abs(userNightShifts - teamAvgNightShifts);
  if (nightShiftDeviation > 2) {
    // Wenn MA Nachtschichten bevorzugt und viele hat -> NICHT bestrafen (fair!)
    // Wenn MA Nachtschichten ablehnt und viele hat -> bestrafen (unfair!)
    if (preferences?.prefersNightShifts && userNightShifts > teamAvgNightShifts) {
      // MA will Nacht und hat viele -> OK, keine Strafe
      // Sogar kleiner Bonus für die Bereitschaft
      score += 5;
    } else if (preferences?.prefersDayShifts && userNightShifts > teamAvgNightShifts) {
      // MA will keine Nacht, hat aber viele -> unfair!
      score -= nightShiftDeviation * 8; // Höhere Strafe (war 5)
    } else {
      // Keine spezielle Präferenz -> normale Fairness-Logik
      score -= nightShiftDeviation * 5;
    }
  }

  // Replacement-Fairness: Bleibt unverändert
  const replacementDeviation = Math.abs(userReplacementCount - teamAvgReplacementCount);
  if (replacementDeviation > 1) {
    score -= replacementDeviation * 10;
  }

  return Math.max(0, score);
}

export function calculatePreferenceScore(
  shift: Shift,
  preferences: EmployeePreferences | null,
  currentHours: number,
  shiftDurationHours: number,
): number {
  if (!preferences) return 50;

  let score = 100;

  const shiftStart = new Date(shift.startTime);
  const isNightShift = shiftStart.getHours() >= 22 || shiftStart.getHours() < 6;

  if (isNightShift && !preferences.prefersNightShifts) score -= 30;
  if (!isNightShift && preferences.prefersNightShifts) score -= 20;

  const isWeekend = shiftStart.getDay() === 0 || shiftStart.getDay() === 6;
  if (isWeekend && !preferences.prefersWeekends) score -= 15;

  const projectedHours = currentHours + shiftDurationHours;
  if (projectedHours > preferences.maxMonthlyHours) score -= 40;
  if (projectedHours < preferences.minMonthlyHours) score -= 20;

  if (shift.siteId) {
    if (preferences.avoidedSiteIds.includes(shift.siteId)) score -= 50;
    if (preferences.preferredSiteIds.includes(shift.siteId)) score += 10;
  }

  if (shiftDurationHours >= 10 && !preferences.prefersLongShifts) score -= 10;
  if (shiftDurationHours <= 6 && !preferences.prefersShortShifts) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function calculateTotalScore(
  workloadScore: number,
  complianceScore: number,
  fairnessScore: number,
  preferenceScore: number,
  objectClearanceScore?: number,
): number {
  // Neue Gewichtungen (v1.11.0+) mit Object-Clearance-Score
  // Alt: 10% Workload, 40% Compliance, 20% Fairness, 30% Preference
  // Neu: 5% Workload, 35% Compliance, 15% Fairness, 25% Preference, 20% ObjectClearance
  const hasObjectScore = objectClearanceScore !== undefined;

  const WEIGHTS = hasObjectScore
    ? {
        workload: 0.05,
        compliance: 0.35,
        fairness: 0.15,
        preference: 0.25,
        objectClearance: 0.2,
      }
    : {
        workload: 0.1,
        compliance: 0.4,
        fairness: 0.2,
        preference: 0.3,
        objectClearance: 0.0,
      };

  return (
    workloadScore * WEIGHTS.workload +
    complianceScore * WEIGHTS.compliance +
    fairnessScore * WEIGHTS.fairness +
    preferenceScore * WEIGHTS.preference +
    (objectClearanceScore || 0) * WEIGHTS.objectClearance
  );
}

/**
 * Tie-Breaker: Wenn zwei Kandidaten den gleichen totalScore haben,
 * bevorzuge den mit mehr Ruhezeit und mehr Ruhetagen.
 *
 * Gibt einen kleinen Bonus (max +1.0) zurück, der zum totalScore addiert wird.
 */
export function calculateTieBreaker(restHours: number, consecutiveRestDays: number): number {
  let bonus = 0;

  // Bonus für mehr als Minimum-Ruhe (11h = gesetzlich)
  if (restHours > 11) {
    // Pro 12h zusätzliche Ruhe: +0.25 Bonus (max +0.5)
    bonus += Math.min((restHours - 11) / 48, 0.5);
  }

  // Bonus für mehr Ruhetage in den letzten 14 Tagen
  if (consecutiveRestDays > 1) {
    // Pro Ruhetag: +0.1 Bonus (max +0.5)
    bonus += Math.min((consecutiveRestDays - 1) * 0.1, 0.5);
  }

  return Math.min(bonus, 1.0); // Max +1.0 Bonus
}

/**
 * Object-Clearance-Score (v1.11.0+)
 *
 * Bewertet, ob ein MA für ein Objekt eingearbeitet ist.
 *
 * @param clearance - ObjectClearance-Objekt (oder null, falls keine Clearance vorhanden)
 * @returns Score 0-100
 *
 * Scoring-Logik:
 * - Keine Clearance: 0 Punkte (MA nicht eingearbeitet)
 * - ACTIVE: 100 Punkte (voll einsatzfähig)
 * - TRAINING: 50 Punkte (in Einarbeitung, bedingt einsetzbar)
 * - EXPIRED/REVOKED: 0 Punkte (nicht mehr gültig)
 * - Bonus: +10 für abgeschlossenes Training
 * - Bonus: +5 für frische Clearance (< 30 Tage alt)
 * - Malus: -20 für bald ablaufende Clearance (< 14 Tage)
 */
export function calculateObjectClearanceScore(clearance: {
  status: 'ACTIVE' | 'TRAINING' | 'EXPIRED' | 'REVOKED';
  trainingCompletedAt: Date | null;
  trainedAt?: Date | null;
  validUntil?: Date | null;
} | null): number {
  // Keine Clearance = 0 Punkte
  if (!clearance) return 0;

  // Status-basierter Score
  const statusScores = {
    ACTIVE: 100,
    TRAINING: 50, // In Einarbeitung = reduzierter Score
    EXPIRED: 0,
    REVOKED: 0,
  };

  let score = statusScores[clearance.status] || 0;

  // Bonus für abgeschlossene Einarbeitung
  if (clearance.trainingCompletedAt) {
    score += 10;
  }

  // Bonus für frische Clearance (< 30 Tage alt)
  if (clearance.trainedAt) {
    const daysSinceTrained = Math.floor(
      (Date.now() - new Date(clearance.trainedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceTrained < 30) {
      score += 5;
    }
  }

  // Malus für bald ablaufende Clearance (< 14 Tage)
  if (clearance.validUntil) {
    const daysUntilExpiry = Math.floor(
      (new Date(clearance.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 14 && daysUntilExpiry >= 0) {
      score -= 20;
    }
  }

  return Math.max(0, Math.min(100, score));
}
