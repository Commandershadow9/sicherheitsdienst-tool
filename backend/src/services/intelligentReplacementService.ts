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
import {
  calculateWorkloadScore,
  calculateComplianceScore,
  calculateFairnessScore,
  calculatePreferenceScore,
  calculateTotalScore,
  calculateTieBreaker,
  calculateObjectClearanceScore,
} from './replacementScoreUtils';
import { recordCandidateScore } from '../utils/replacementMetrics';

export {
  calculateWorkloadScore,
  calculateComplianceScore,
  calculateFairnessScore,
  calculatePreferenceScore,
  calculateTotalScore,
  calculateTieBreaker,
  calculateObjectClearanceScore,
} from './replacementScoreUtils';

const prisma = new PrismaClient();

// ==================== Types ====================

type TeamAverageCacheEntry = {
  avgNightShifts: number;
  avgReplacementCount: number;
  replacementCounts: Map<string, number>;
  fetchedAt: number;
};

const teamAverageCache = new Map<string, TeamAverageCacheEntry>();

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
  objectClearanceScore?: number; // v1.11.0+: Objekt-Einarbeitungs-Score

  // Detail-Metriken für UI
  metrics: {
    currentMonthHours: number;
    targetMonthHours: number;
    utilizationPercent: number;
    utilizationAfterAssignment: number;
    maxWeeklyHours: number;

    lastShiftEnd: Date | null;
    nextShiftStart: Date;
    restHours: number;
    restHoursRequired: number;
    restHoursOK: boolean;

    consecutiveDaysWorked: number;
    restDaysLast14Days: number;

    nightShiftsThisMonth: number;
    teamAverageNightShifts: number;
    replacementCount: number;
    teamAverageReplacementCount: number;

    preferenceMatch: {
      shiftType: 'MATCH' | 'NEUTRAL' | 'MISMATCH'; // Nacht vs Tag
      shiftDuration: 'MATCH' | 'NEUTRAL' | 'MISMATCH';
      workloadLevel: 'MATCH' | 'NEUTRAL' | 'MISMATCH';
    };
  };

  // Warnungen
  warnings: Array<{
    type:
      | 'REST_TIME'
      | 'OVERWORKED'
      | 'CONSECUTIVE_DAYS'
      | 'PREFERENCE_MISMATCH'
      | 'PENDING_ABSENCE_REQUEST';
    severity: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
  }>;
}

// Type no longer needed - we use inline types and calculate workload live

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
async function getReplacementStats(currentMonth: number, currentYear: number) {
  const cacheKey = `${currentYear}-${currentMonth}`;
  const cached = teamAverageCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
    return cached;
  }

  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  const workloads = await prisma.employeeWorkload.findMany({
    where: {
      month: currentMonth,
      year: currentYear,
    },
  });

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED', 'COMPLETED'] },
      assignedAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      shift: {
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    },
    select: {
      userId: true,
      assignedAt: true,
      shift: {
        select: {
          startTime: true,
        },
      },
    },
  });

  if (workloads.length === 0) {
    const emptyEntry: TeamAverageCacheEntry = {
      avgNightShifts: 0,
      avgReplacementCount: 0,
      replacementCounts: new Map(),
      fetchedAt: Date.now(),
    };
    teamAverageCache.set(cacheKey, emptyEntry);
    return emptyEntry;
  }

  const totalNightShifts = workloads.reduce((sum, w) => sum + w.nightShiftCount, 0);
  const avgNightShifts = totalNightShifts / workloads.length;

  const replacementCounts = new Map<string, number>();
  let totalReplacements = 0;

  assignments.forEach((assignment) => {
    const shiftStart = new Date(assignment.shift.startTime).getTime();
    const assignedAt = new Date(assignment.assignedAt).getTime();
    const diffHours = (shiftStart - assignedAt) / (1000 * 60 * 60);
    if (diffHours <= 24) {
      const previous = replacementCounts.get(assignment.userId) || 0;
      replacementCounts.set(assignment.userId, previous + 1);
      totalReplacements += 1;
    }
  });

  const usersConsidered = replacementCounts.size || workloads.length || 1;
  const avgReplacementCount = usersConsidered ? totalReplacements / usersConsidered : 0;

  const entry: TeamAverageCacheEntry = {
    avgNightShifts,
    avgReplacementCount,
    replacementCounts,
    fetchedAt: Date.now(),
  };

  teamAverageCache.set(cacheKey, entry);
  return entry;
}

async function calculateTeamAverages(currentMonth: number, currentYear: number) {
  const { avgNightShifts, avgReplacementCount, replacementCounts } = await getReplacementStats(
    currentMonth,
    currentYear,
  );

  return {
    avgNightShifts,
    avgReplacementCount,
    replacementCounts,
  };
}

/**
 * Helper: ISO Week Number (YYYY-WW)
 */
export function getISOWeek(date: Date): string {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * BUG-001 Fix: Berechnet LIVE Workload aus aktuellen Shift Assignments
 * Statt cached employee_workloads → Score ist jetzt interaktiv und berücksichtigt neue Zuweisungen sofort
 */
async function calculateLiveWorkload(
  userId: string,
  month: number,
  year: number,
): Promise<{
  totalHours: number;
  nightShiftCount: number;
  maxWeeklyHours: number;
}> {
  // Monats-Grenzen
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Alle Assignments des Monats laden
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED', 'COMPLETED'] },
      shift: {
        startTime: { gte: monthStart, lte: monthEnd },
      },
    },
    include: {
      shift: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: {
      shift: {
        startTime: 'asc',
      },
    },
  });

  // Total Hours berechnen
  const totalHours = assignments.reduce((sum, assignment) => {
    const duration =
      (new Date(assignment.shift.endTime).getTime() - new Date(assignment.shift.startTime).getTime()) /
      (1000 * 60 * 60);
    return sum + duration;
  }, 0);

  // Nachtschichten zählen (22:00-6:00)
  const nightShiftCount = assignments.filter((assignment) => {
    const hour = new Date(assignment.shift.startTime).getHours();
    return hour >= 22 || hour < 6;
  }).length;

  // Max Weekly Hours berechnen (höchste Wochenstundenzahl im Monat)
  const weeklyHoursMap = new Map<string, number>(); // ISO Week → Hours
  assignments.forEach((assignment) => {
    const startDate = new Date(assignment.shift.startTime);
    const weekKey = getISOWeek(startDate);
    const duration =
      (new Date(assignment.shift.endTime).getTime() - new Date(assignment.shift.startTime).getTime()) /
      (1000 * 60 * 60);

    weeklyHoursMap.set(weekKey, (weeklyHoursMap.get(weekKey) || 0) + duration);
  });

  const maxWeeklyHours = Math.max(0, ...Array.from(weeklyHoursMap.values()));

  return { totalHours, nightShiftCount, maxWeeklyHours };
}

/**
 * Haupt-Funktion: Berechnet Score für einen Kandidaten
 *
 * @param userId User-ID des Kandidaten
 * @param shift Die zu besetzende Schicht
 * @returns CandidateScore Objekt mit allen Details
 */
export async function calculateCandidateScore(userId: string, shift: Shift): Promise<CandidateScore> {
  const startTime = process.hrtime.bigint();

  // User mit Relations laden
  const user = (await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
    },
  })) as (User & { preferences: EmployeePreferences | null }) | null;

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Object-Clearance laden (v1.11.0+)
  let objectClearance = null;
  if (shift.siteId) {
    objectClearance = await prisma.objectClearance.findFirst({
      where: {
        userId,
        siteId: shift.siteId,
      },
      select: {
        status: true,
        trainingCompletedAt: true,
        trainedAt: true,
        validUntil: true,
      },
    });
  }

  // Aktueller Monat/Jahr
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // BUG-001 Fix: Workload LIVE aus Assignments berechnen (statt cached employee_workloads)
  const workload = await calculateLiveWorkload(userId, currentMonth, currentYear);

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
  const userReplacementCount = teamAverages.replacementCounts.get(userId) ?? 0;

  // ========== Scores berechnen ==========
  const workloadScore = calculateWorkloadScore(workload.totalHours, targetHours);
  const complianceScore = calculateComplianceScore(restHours, workload.maxWeeklyHours, consecutiveDays);
  const fairnessScore = calculateFairnessScore(
    workload.nightShiftCount,
    teamAverages.avgNightShifts,
    userReplacementCount,
    teamAverages.avgReplacementCount,
    preferences // Präferenzen übergeben für faire Nachtschicht-Bewertung
  );
  const preferenceScore = calculatePreferenceScore(shift, preferences, workload.totalHours, shiftDuration);

  // Object-Clearance-Score (v1.11.0+)
  const objectClearanceScore = shift.siteId
    ? calculateObjectClearanceScore(objectClearance as any)
    : undefined;

  const totalScore = calculateTotalScore(
    workloadScore,
    complianceScore,
    fairnessScore,
    preferenceScore,
    objectClearanceScore,
  );

  // Tie-Breaker: Bevorzuge MA mit mehr Ruhe bei gleichem Score
  const restDaysLast14Days = 14 - consecutiveDays; // Vereinfacht: 14 Tage - gearbeitete Tage
  const tieBreaker = calculateTieBreaker(restHours, restDaysLast14Days);
  const finalScore = Math.min(100, totalScore + tieBreaker);

  const { recommendation, color } = getRecommendation(finalScore);

  // ========== Metriken sammeln ==========
  const isNightShift = shiftStart.getHours() >= 22 || shiftStart.getHours() < 6;

  const metrics: CandidateScore['metrics'] = {
    currentMonthHours: workload.totalHours,
    targetMonthHours: targetHours,
    utilizationPercent: (workload.totalHours / targetHours) * 100,
    utilizationAfterAssignment: ((workload.totalHours + shiftDuration) / targetHours) * 100,
    maxWeeklyHours: workload.maxWeeklyHours,

    lastShiftEnd,
    nextShiftStart: shiftStart,
    restHours,
    restHoursRequired: 11,
    restHoursOK: restHours >= 11,

    consecutiveDaysWorked: consecutiveDays,
    restDaysLast14Days: 14 - consecutiveDays, // Vereinfacht

    nightShiftsThisMonth: workload.nightShiftCount,
    teamAverageNightShifts: teamAverages.avgNightShifts,
    replacementCount: userReplacementCount,
    teamAverageReplacementCount: teamAverages.avgReplacementCount,

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

  // ========== Metriken erfassen ==========
  const endTime = process.hrtime.bigint();
  const durationSeconds = Number(endTime - startTime) / 1e9; // Nanosekunden → Sekunden

  recordCandidateScore(
    finalScore,
    recommendation,
    durationSeconds,
    { workload: workloadScore, compliance: complianceScore, fairness: fairnessScore, preference: preferenceScore },
    shift.id,
  );

  return {
    userId,
    totalScore: finalScore,
    recommendation,
    color,
    workloadScore,
    complianceScore,
    fairnessScore,
    preferenceScore,
    objectClearanceScore, // v1.11.0+
    metrics,
    warnings,
  };
}
