/**
 * Intelligent Replacement Service - Phase 2b
 *
 * Scoring-Engine für intelligente Mitarbeiter-Empfehlungen basierend auf:
 * - Workload (Auslastung)
 * - Compliance (ArbZG - Ruhezeiten, Wochenlimit)
 * - Fairness (Vergleich mit Team-Durchschnitt)
 * - Preferences (Mitarbeiter-Präferenzen)
 *
 * Gewichtung:
 * - Workload: 10%
 * - Compliance: 40% (höchste Prio - gesetzliche Anforderungen!)
 * - Fairness: 20%
 * - Preference: 30%
 */

import { PrismaClient, Shift, User, EmployeePreferences, EmployeeWorkload } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== Types ====================

export interface CandidateScore {
  userId: string;
  totalScore: number; // 0-100 (gewichteter Durchschnitt)
  recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  color: 'green' | 'yellow' | 'orange' | 'red';

  // Detail-Scores (jeweils 0-100)
  workloadScore: number;
  complianceScore: number;
  fairnessScore: number;
  preferenceScore: number;

  // Detail-Metriken für UI
  metrics: {
    currentMonthHours: number;
    targetMonthHours: number;
    utilizationPercent: number;

    lastShiftEnd: Date | null;
    nextShiftStart: Date;
    restHours: number;
    restHoursRequired: number;
    restHoursOK: boolean;

    consecutiveDaysWorked: number;
    restDaysLast14Days: number;

    nightShiftsThisMonth: number;
    teamAverageNightShifts: number;

    preferenceMatch: {
      shiftType: 'MATCH' | 'NEUTRAL' | 'MISMATCH'; // Nacht vs Tag
      shiftDuration: 'MATCH' | 'NEUTRAL' | 'MISMATCH';
      workloadLevel: 'MATCH' | 'NEUTRAL' | 'MISMATCH';
    };
  };

  // Warnungen
  warnings: Array<{
    type: 'REST_TIME' | 'OVERWORKED' | 'CONSECUTIVE_DAYS' | 'PREFERENCE_MISMATCH';
    severity: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
  }>;
}

interface UserWithRelations extends User {
  preferences: EmployeePreferences | null;
  workload: EmployeeWorkload[];
}

// ==================== Scoring-Funktionen ====================

/**
 * Berechnet Workload-Score basierend auf aktueller Auslastung
 *
 * Optimal: 70-90% Auslastung = Score 100
 * Gut: 50-70% oder 90-95% = Score 80
 * Akzeptabel: 30-50% oder 95-100% = Score 60
 * Schlecht: < 30% (unterfordert) oder > 100% (überlastet) = Score 40
 * Kritisch: > 110% (deutlich überlastet) = Score 0
 *
 * @param currentHours Aktuelle Stunden im Monat
 * @param targetHours Ziel-Stunden (aus Preferences oder 160h default)
 * @returns Score 0-100
 */
export function calculateWorkloadScore(currentHours: number, targetHours: number): number {
  const utilizationPercent = (currentHours / targetHours) * 100;

  // Optimal: 70-90% Auslastung
  if (utilizationPercent >= 70 && utilizationPercent <= 90) return 100;

  // Gut: 50-70% oder 90-95%
  if (
    (utilizationPercent >= 50 && utilizationPercent < 70) ||
    (utilizationPercent > 90 && utilizationPercent <= 95)
  )
    return 80;

  // Akzeptabel: 30-50% oder 95-100%
  if (
    (utilizationPercent >= 30 && utilizationPercent < 50) ||
    (utilizationPercent > 95 && utilizationPercent <= 100)
  )
    return 60;

  // Schlecht: < 30% (unterfordert) oder > 100% (überlastet)
  if (utilizationPercent < 30) return 40;
  if (utilizationPercent > 100 && utilizationPercent <= 110) return 40;

  // Kritisch: > 110% (deutlich überlastet)
  return 0;
}

/**
 * Berechnet Compliance-Score basierend auf Arbeitszeitgesetz (ArbZG)
 *
 * Prüft:
 * - § 5 ArbZG: Mindestens 11h Ruhezeit zwischen Schichten
 * - § 3 ArbZG: Max 48h pro Woche (Durchschnitt über 6 Monate)
 * - Best Practice: Max 6 Tage in Folge
 *
 * @param restHours Ruhezeit bis zur neuen Schicht (in Stunden)
 * @param weeklyHours Durchschnittliche Wochenstunden (aktuelle Woche)
 * @param consecutiveDays Anzahl konsekutiver Arbeitstage
 * @returns Score 0-100
 */
export function calculateComplianceScore(
  restHours: number,
  weeklyHours: number,
  consecutiveDays: number
): number {
  let score = 100;

  // ArbZG § 5: Mindestens 11h Ruhezeit
  if (restHours < 11) {
    if (restHours < 9) score -= 100; // Kritischer Verstoß
    else if (restHours < 10) score -= 50;
    else score -= 20;
  }

  // ArbZG § 3: Max 48h pro Woche (Durchschnitt)
  if (weeklyHours > 48) {
    const excess = weeklyHours - 48;
    score -= Math.min(excess * 5, 50); // -5 Punkte pro Überstunde, max -50
  }

  // Empfehlung: Max 6 Tage in Folge
  if (consecutiveDays > 6) {
    score -= (consecutiveDays - 6) * 10;
  }

  return Math.max(0, score);
}

/**
 * Berechnet Fairness-Score basierend auf Vergleich mit Team-Durchschnitt
 *
 * Vergleicht:
 * - Anzahl Nachtschichten im Monat
 * - Anzahl Ersatz-Einsätze (spontane Zuweisungen)
 *
 * @param userNightShifts Nachtschichten des Users
 * @param teamAvgNightShifts Team-Durchschnitt Nachtschichten
 * @param userReplacementCount Ersatz-Einsätze des Users
 * @param teamAvgReplacementCount Team-Durchschnitt Ersatz-Einsätze
 * @returns Score 0-100
 */
export function calculateFairnessScore(
  userNightShifts: number,
  teamAvgNightShifts: number,
  userReplacementCount: number,
  teamAvgReplacementCount: number
): number {
  let score = 100;

  // Vergleich Nachtschichten
  const nightShiftDeviation = Math.abs(userNightShifts - teamAvgNightShifts);
  if (nightShiftDeviation > 2) {
    score -= nightShiftDeviation * 5; // -5 Punkte pro Abweichung
  }

  // Vergleich Ersatz-Einsätze
  const replacementDeviation = Math.abs(userReplacementCount - teamAvgReplacementCount);
  if (replacementDeviation > 1) {
    score -= replacementDeviation * 10;
  }

  return Math.max(0, score);
}

/**
 * Berechnet Preference-Score basierend auf Mitarbeiter-Präferenzen
 *
 * Prüft Match mit:
 * - Schicht-Typ (Nacht vs Tag)
 * - Stunden-Niveau (Min/Target/Max)
 * - Site-Präferenzen
 * - Wochenend-Präferenzen
 *
 * @param shift Die zu besetzende Schicht
 * @param preferences Mitarbeiter-Präferenzen
 * @param currentHours Aktuelle Monatsstunden
 * @param shiftDurationHours Dauer der Schicht in Stunden
 * @returns Score 0-100
 */
export function calculatePreferenceScore(
  shift: Shift,
  preferences: EmployeePreferences | null,
  currentHours: number,
  shiftDurationHours: number
): number {
  if (!preferences) return 50; // Neutral, wenn keine Präferenzen vorhanden

  let score = 100;

  // Schicht-Typ Check (Nacht vs Tag)
  const shiftStart = new Date(shift.startTime);
  const isNightShift = shiftStart.getHours() >= 22 || shiftStart.getHours() < 6;

  if (isNightShift && !preferences.prefersNightShifts) score -= 30;
  if (!isNightShift && preferences.prefersNightShifts) score -= 20;

  // Wochenend-Check
  const isWeekend = shiftStart.getDay() === 0 || shiftStart.getDay() === 6;
  if (isWeekend && !preferences.prefersWeekends) score -= 15;

  // Stunden-Niveau Check
  const projectedHours = currentHours + shiftDurationHours;
  if (projectedHours > preferences.maxMonthlyHours) score -= 40; // Überschreitet Maximum
  if (projectedHours < preferences.minMonthlyHours) score -= 20; // Unterschreitet Minimum

  // Site-Präferenzen
  if (shift.siteId) {
    if (preferences.avoidedSiteIds.includes(shift.siteId)) score -= 50; // Vermiedene Site
    if (preferences.preferredSiteIds.includes(shift.siteId)) score += 10; // Bevorzugte Site (Bonus)
  }

  // Schicht-Länge
  if (shiftDurationHours >= 10 && !preferences.prefersLongShifts) score -= 10;
  if (shiftDurationHours <= 6 && !preferences.prefersShortShifts) score -= 10;

  return Math.max(0, Math.min(100, score)); // Clamp 0-100
}

/**
 * Berechnet Gesamt-Score für einen Kandidaten
 *
 * Gewichtung:
 * - Compliance: 40% (gesetzliche Anforderungen!)
 * - Preference: 30% (Mitarbeiter-Zufriedenheit)
 * - Fairness: 20% (gerechte Verteilung)
 * - Workload: 10% (Auslastung)
 *
 * @param workloadScore 0-100
 * @param complianceScore 0-100
 * @param fairnessScore 0-100
 * @param preferenceScore 0-100
 * @returns totalScore 0-100
 */
export function calculateTotalScore(
  workloadScore: number,
  complianceScore: number,
  fairnessScore: number,
  preferenceScore: number
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
 * Bestimmt Empfehlungs-Level basierend auf Score
 *
 * @param score 0-100
 * @returns recommendation + color
 */
function getRecommendation(score: number): {
  recommendation: CandidateScore['recommendation'];
  color: CandidateScore['color'];
} {
  if (score >= 80) return { recommendation: 'OPTIMAL', color: 'green' };
  if (score >= 60) return { recommendation: 'GOOD', color: 'yellow' };
  if (score >= 40) return { recommendation: 'ACCEPTABLE', color: 'orange' };
  return { recommendation: 'NOT_RECOMMENDED', color: 'red' };
}

/**
 * Berechnet Schicht-Dauer in Stunden
 */
function calculateShiftDuration(shift: Shift): number {
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Findet letzte Schicht eines Mitarbeiters
 */
async function findLastShiftEnd(userId: string): Promise<Date | null> {
  const lastAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      userId,
      shift: {
        endTime: {
          lt: new Date(),
        },
      },
    },
    include: {
      shift: true,
    },
    orderBy: {
      shift: {
        endTime: 'desc',
      },
    },
  });

  return lastAssignment?.shift.endTime || null;
}

/**
 * Berechnet konsekutive Arbeitstage
 */
async function calculateConsecutiveDays(userId: string): Promise<number> {
  // Vereinfachte Implementierung - kann später optimiert werden
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      shift: {
        startTime: {
          gte: twoWeeksAgo,
          lte: now,
        },
      },
    },
    include: {
      shift: true,
    },
    orderBy: {
      shift: {
        startTime: 'desc',
      },
    },
  });

  if (assignments.length === 0) return 0;

  // Zähle konsekutive Tage rückwärts
  let consecutiveDays = 0;
  const shiftDates = assignments.map((a) => new Date(a.shift.startTime).toDateString());
  const uniqueDates = [...new Set(shiftDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      consecutiveDays = 1;
      continue;
    }

    const currentDate = new Date(uniqueDates[i]);
    const previousDate = new Date(uniqueDates[i - 1]);
    const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays;
}

/**
 * Berechnet Team-Durchschnitt für Fairness-Score
 */
async function calculateTeamAverages(currentMonth: number, currentYear: number) {
  const workloads = await prisma.employeeWorkload.findMany({
    where: {
      month: currentMonth,
      year: currentYear,
    },
  });

  if (workloads.length === 0) {
    return { avgNightShifts: 0, avgReplacementCount: 0 };
  }

  const totalNightShifts = workloads.reduce((sum, w) => sum + w.nightShiftCount, 0);
  const avgNightShifts = totalNightShifts / workloads.length;

  // Replacement Count kann später über ein separates Feld getrackt werden
  // Für jetzt verwenden wir einen Dummy-Wert
  const avgReplacementCount = 0;

  return { avgNightShifts, avgReplacementCount };
}

/**
 * Haupt-Funktion: Berechnet Score für einen Kandidaten
 *
 * @param userId User-ID des Kandidaten
 * @param shift Die zu besetzende Schicht
 * @returns CandidateScore Objekt mit allen Details
 */
export async function calculateCandidateScore(userId: string, shift: Shift): Promise<CandidateScore> {
  // User mit Relations laden
  const user = (await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      workload: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      },
    },
  })) as UserWithRelations | null;

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Aktueller Monat/Jahr
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Workload für aktuellen Monat (oder Default-Werte)
  const workload = user.workload[0] || {
    totalHours: 0,
    nightShiftCount: 0,
    consecutiveDaysWorked: 0,
    maxWeeklyHours: 0,
  };

  // Preferences (oder Defaults)
  const preferences = user.preferences;
  const targetHours = preferences?.targetMonthlyHours || 160;

  // Shift-Details
  const shiftDuration = calculateShiftDuration(shift);
  const shiftStart = new Date(shift.startTime);

  // Letzte Schicht finden
  const lastShiftEnd = await findLastShiftEnd(userId);
  const restHours = lastShiftEnd ? (shiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60) : 24;

  // Konsekutive Tage berechnen
  const consecutiveDays = await calculateConsecutiveDays(userId);

  // Team-Durchschnitte
  const teamAverages = await calculateTeamAverages(currentMonth, currentYear);

  // ========== Scores berechnen ==========
  const workloadScore = calculateWorkloadScore(workload.totalHours, targetHours);
  const complianceScore = calculateComplianceScore(restHours, workload.maxWeeklyHours, consecutiveDays);
  const fairnessScore = calculateFairnessScore(
    workload.nightShiftCount,
    teamAverages.avgNightShifts,
    0, // TODO: Replacement Count tracken
    teamAverages.avgReplacementCount
  );
  const preferenceScore = calculatePreferenceScore(shift, preferences, workload.totalHours, shiftDuration);

  const totalScore = calculateTotalScore(workloadScore, complianceScore, fairnessScore, preferenceScore);
  const { recommendation, color } = getRecommendation(totalScore);

  // ========== Metriken sammeln ==========
  const isNightShift = shiftStart.getHours() >= 22 || shiftStart.getHours() < 6;
  const isWeekend = shiftStart.getDay() === 0 || shiftStart.getDay() === 6;

  const metrics: CandidateScore['metrics'] = {
    currentMonthHours: workload.totalHours,
    targetMonthHours: targetHours,
    utilizationPercent: (workload.totalHours / targetHours) * 100,

    lastShiftEnd,
    nextShiftStart: shiftStart,
    restHours,
    restHoursRequired: 11,
    restHoursOK: restHours >= 11,

    consecutiveDaysWorked: consecutiveDays,
    restDaysLast14Days: 14 - consecutiveDays, // Vereinfacht

    nightShiftsThisMonth: workload.nightShiftCount,
    teamAverageNightShifts: teamAverages.avgNightShifts,

    preferenceMatch: {
      shiftType:
        (isNightShift && preferences?.prefersNightShifts) || (!isNightShift && preferences?.prefersDayShifts)
          ? 'MATCH'
          : 'MISMATCH',
      shiftDuration:
        (shiftDuration >= 10 && preferences?.prefersLongShifts) ||
        (shiftDuration <= 6 && preferences?.prefersShortShifts)
          ? 'MATCH'
          : 'NEUTRAL',
      workloadLevel:
        workload.totalHours >= (preferences?.minMonthlyHours || 120) &&
        workload.totalHours <= (preferences?.maxMonthlyHours || 200)
          ? 'MATCH'
          : 'MISMATCH',
    },
  };

  // ========== Warnungen generieren ==========
  const warnings: CandidateScore['warnings'] = [];

  if (restHours < 11) {
    warnings.push({
      type: 'REST_TIME',
      severity: restHours < 9 ? 'ERROR' : 'WARNING',
      message: `Ruhezeit nur ${restHours.toFixed(1)}h (ArbZG §5: mind. 11h)`,
    });
  }

  if (workload.totalHours + shiftDuration > (preferences?.maxMonthlyHours || 200)) {
    warnings.push({
      type: 'OVERWORKED',
      severity: 'WARNING',
      message: `Überschreitet maximale Monatsstunden (${preferences?.maxMonthlyHours || 200}h)`,
    });
  }

  if (consecutiveDays > 6) {
    warnings.push({
      type: 'CONSECUTIVE_DAYS',
      severity: 'WARNING',
      message: `${consecutiveDays} Tage in Folge (empfohlen: max 6)`,
    });
  }

  if (metrics.preferenceMatch.shiftType === 'MISMATCH') {
    warnings.push({
      type: 'PREFERENCE_MISMATCH',
      severity: 'INFO',
      message: isNightShift ? 'Bevorzugt Tagschichten' : 'Bevorzugt Nachtschichten',
    });
  }

  return {
    userId,
    totalScore,
    recommendation,
    color,
    workloadScore,
    complianceScore,
    fairnessScore,
    preferenceScore,
    metrics,
    warnings,
  };
}
