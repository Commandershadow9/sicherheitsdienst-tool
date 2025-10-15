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
): number {
  const WEIGHTS = {
    workload: 0.1,
    compliance: 0.4,
    fairness: 0.2,
    preference: 0.3,
  };

  return (
    workloadScore * WEIGHTS.workload +
    complianceScore * WEIGHTS.compliance +
    fairnessScore * WEIGHTS.fairness +
    preferenceScore * WEIGHTS.preference
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
