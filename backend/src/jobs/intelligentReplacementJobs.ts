import cron from 'node-cron';
import { Prisma, Shift } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { calculateFairnessScore } from '../services/replacementScoreUtils';
import { calculateCandidateScore, getISOWeek } from '../services/intelligentReplacementService';

type AggregatedMetrics = {
  totalHours: number;
  scheduledHours: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  consecutiveDaysWorked: number;
  restDaysCount: number;
  maxWeeklyHours: number;
  minRestHoursBetweenShifts: number;
};

type AggregationResult = {
  metrics: AggregatedMetrics;
  replacementCount: number;
  restHoursNextShift: number;
};

const HOURS_IN_DAY = 24;
const DEFAULT_MIN_REST_HOURS = 11;

function toDateKey(date: Date): string {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return normalized.toISOString();
}

function calculateDurationHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

async function aggregateEmployeeMetrics(userId: string, month: number, year: number): Promise<AggregationResult> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      status: {
        in: ['ASSIGNED', 'CONFIRMED', 'STARTED', 'COMPLETED'],
      },
      shift: {
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
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

  if (assignments.length === 0) {
    return {
      metrics: {
        totalHours: 0,
        scheduledHours: 0,
        nightShiftCount: 0,
        weekendShiftCount: 0,
        consecutiveDaysWorked: 0,
        restDaysCount: new Date(year, month, 0).getDate(),
        maxWeeklyHours: 0,
        minRestHoursBetweenShifts: DEFAULT_MIN_REST_HOURS,
      },
      replacementCount: 0,
      restHoursNextShift: DEFAULT_MIN_REST_HOURS,
    };
  }

  let totalHours = 0;
  const weeklyHours = new Map<string, number>();
  const uniqueWorkingDays = new Set<string>();
  let nightShiftCount = 0;
  let weekendShiftCount = 0;
  let replacementCount = 0;
  let minRestHoursBetweenShifts = Number.POSITIVE_INFINITY;

  assignments.forEach((assignment, index) => {
    const start = new Date(assignment.shift.startTime);
    const end = new Date(assignment.shift.endTime);

    const duration = calculateDurationHours(start, end);
    totalHours += duration;

    const weekKey = getISOWeek(start);
    weeklyHours.set(weekKey, (weeklyHours.get(weekKey) || 0) + duration);

    uniqueWorkingDays.add(toDateKey(start));

    const startHour = start.getHours();
    if (startHour >= 22 || startHour < 6) {
      nightShiftCount += 1;
    }
    if (start.getDay() === 0 || start.getDay() === 6) {
      weekendShiftCount += 1;
    }

    const assignedAt = new Date(assignment.assignedAt);
    const diffHours = (start.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
    if (diffHours <= HOURS_IN_DAY) {
      replacementCount += 1;
    }

    if (index > 0) {
      const previous = assignments[index - 1];
      const prevEnd = new Date(previous.shift.endTime);
      const restHours = calculateDurationHours(prevEnd, start);
      if (restHours >= 0 && restHours < minRestHoursBetweenShifts) {
        minRestHoursBetweenShifts = restHours;
      }
    }
  });

  const sortedDays = Array.from(uniqueWorkingDays)
    .map((key) => new Date(key))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let currentStreak = 0;

  sortedDays.forEach((day, index) => {
    if (index === 0) {
      currentStreak = 1;
      longestStreak = 1;
      return;
    }

    const prevDay = sortedDays[index - 1];
    const diffDays = Math.round((day.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const restDaysCount = Math.max(daysInMonth - uniqueWorkingDays.size, 0);
  const maxWeeklyHours = Math.max(0, ...weeklyHours.values());

  return {
    metrics: {
      totalHours,
      scheduledHours: totalHours,
      nightShiftCount,
      weekendShiftCount,
      consecutiveDaysWorked: longestStreak,
      restDaysCount,
      maxWeeklyHours,
      minRestHoursBetweenShifts:
        Number.isFinite(minRestHoursBetweenShifts) && minRestHoursBetweenShifts >= 0
          ? minRestHoursBetweenShifts
          : DEFAULT_MIN_REST_HOURS,
    },
    replacementCount,
    restHoursNextShift:
      Number.isFinite(minRestHoursBetweenShifts) && minRestHoursBetweenShifts >= 0
        ? minRestHoursBetweenShifts
        : DEFAULT_MIN_REST_HOURS,
  };
}

async function calculateMonthlyWorkloads(): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const employees = await prisma.user.findMany({
    where: {
      role: { in: ['EMPLOYEE', 'DISPATCHER', 'MANAGER', 'ADMIN'] },
      isActive: true,
    },
    select: { id: true },
  });

  if (employees.length === 0) {
    logger.warn('[IntelligentReplacement] Keine aktiven Nutzer für Workload-Berechnung gefunden.');
    return;
  }

  const aggregation = await Promise.all(
    employees.map(async (employee) => {
      const result = await aggregateEmployeeMetrics(employee.id, month, year);
      return {
        userId: employee.id,
        ...result,
      };
    }),
  );

  const avgNightShifts =
    aggregation.reduce((sum, entry) => sum + entry.metrics.nightShiftCount, 0) / aggregation.length;
  const avgReplacementCount =
    aggregation.reduce((sum, entry) => sum + entry.replacementCount, 0) / aggregation.length;

  for (const entry of aggregation) {
    const fairnessScore = calculateFairnessScore(
      entry.metrics.nightShiftCount,
      avgNightShifts,
      entry.replacementCount,
      avgReplacementCount,
    );

    const uniqueWhere: Prisma.EmployeeWorkloadWhereUniqueInput = {
      employee_workload_user_period_key: {
        userId: entry.userId,
        month,
        year,
      },
    };

    await prisma.employeeWorkload.upsert({
      where: uniqueWhere,
      update: {
        totalHours: entry.metrics.totalHours,
        scheduledHours: entry.metrics.scheduledHours,
        nightShiftCount: entry.metrics.nightShiftCount,
        weekendShiftCount: entry.metrics.weekendShiftCount,
        consecutiveDaysWorked: entry.metrics.consecutiveDaysWorked,
        restDaysCount: entry.metrics.restDaysCount,
        maxWeeklyHours: entry.metrics.maxWeeklyHours,
        minRestHoursBetweenShifts: entry.metrics.minRestHoursBetweenShifts,
        fairnessScore,
        lastCalculated: new Date(),
      },
      create: {
        userId: entry.userId,
        month,
        year,
        totalHours: entry.metrics.totalHours,
        scheduledHours: entry.metrics.scheduledHours,
        nightShiftCount: entry.metrics.nightShiftCount,
        weekendShiftCount: entry.metrics.weekendShiftCount,
        consecutiveDaysWorked: entry.metrics.consecutiveDaysWorked,
        restDaysCount: entry.metrics.restDaysCount,
        maxWeeklyHours: entry.metrics.maxWeeklyHours,
        minRestHoursBetweenShifts: entry.metrics.minRestHoursBetweenShifts,
        fairnessScore,
      },
    });
  }

  logger.info(
    '[IntelligentReplacement] Workloads aktualisiert – Nutzer: %d, Ø NightShifts: %d, Ø Replacements: %d',
    aggregation.length,
    Number.isFinite(avgNightShifts) ? Number(avgNightShifts.toFixed(2)) : 0,
    Number.isFinite(avgReplacementCount) ? Number(avgReplacementCount.toFixed(2)) : 0,
  );
}

async function recalculateFairnessScores(): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const workloads = await prisma.employeeWorkload.findMany({
    where: { month, year },
    select: { userId: true, nightShiftCount: true },
  });

  if (workloads.length === 0) {
    await calculateMonthlyWorkloads();
    return;
  }

  const replacementData = await Promise.all(
    workloads.map(async (workload) => {
      const { replacementCount } = await aggregateEmployeeMetrics(workload.userId, month, year);
      return { userId: workload.userId, replacementCount, nightShiftCount: workload.nightShiftCount };
    }),
  );

  const avgNightShifts =
    replacementData.reduce((sum, entry) => sum + entry.nightShiftCount, 0) / replacementData.length;
  const avgReplacementCount =
    replacementData.reduce((sum, entry) => sum + entry.replacementCount, 0) / replacementData.length;

  for (const entry of replacementData) {
    const fairnessScore = calculateFairnessScore(
      entry.nightShiftCount,
      avgNightShifts,
      entry.replacementCount,
      avgReplacementCount,
    );

    await prisma.employeeWorkload.updateMany({
      where: {
        userId: entry.userId,
        month,
        year,
      },
      data: {
        fairnessScore,
        updatedAt: new Date(),
      },
    });
  }

  logger.info(
    '[IntelligentReplacement] Fairness-Scores aktualisiert – Nutzer: %d, Ø NightShifts: %d, Ø Replacements: %d',
    replacementData.length,
    Number.isFinite(avgNightShifts) ? Number(avgNightShifts.toFixed(2)) : 0,
    Number.isFinite(avgReplacementCount) ? Number(avgReplacementCount.toFixed(2)) : 0,
  );
}

export async function checkComplianceAfterAssignment(assignmentId: string): Promise<void> {
  try {
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        shift: true,
      },
    });

    if (!assignment || !assignment.shift) {
      logger.warn('[IntelligentReplacement] Compliance-Check übersprungen – Assignment %s nicht gefunden.', assignmentId);
      return;
    }

    const shift = assignment.shift as Shift;
    const score = await calculateCandidateScore(assignment.userId, shift);

    const violations: Array<{
      violationType: string;
      severity: 'WARNING' | 'ERROR' | 'CRITICAL';
      description: string;
      value?: number;
      threshold?: number;
    }> = [];

    if (!score.metrics.restHoursOK) {
      const severity = score.metrics.restHours < 9 ? 'CRITICAL' : 'ERROR';
      violations.push({
        violationType: 'REST_TIME_VIOLATED',
        severity,
        description: `Ruhezeit vor Schicht ${shift.title} beträgt nur ${score.metrics.restHours.toFixed(
          1,
        )}h (gesetzlich: 11h).`,
        value: Number(score.metrics.restHours.toFixed(1)),
        threshold: DEFAULT_MIN_REST_HOURS,
      });
    }

    if (score.metrics.maxWeeklyHours > 48) {
      const severity = score.metrics.maxWeeklyHours >= 55 ? 'CRITICAL' : 'WARNING';
      violations.push({
        violationType: 'WEEKLY_HOURS_EXCEEDED',
        severity,
        description: `Wochenstundenzahl bei ${score.metrics.maxWeeklyHours.toFixed(
          1,
        )}h – ArbZG Limit 48h überschritten.`,
        value: Number(score.metrics.maxWeeklyHours.toFixed(1)),
        threshold: 48,
      });
    }

    if (score.metrics.consecutiveDaysWorked > 6) {
      const severity = score.metrics.consecutiveDaysWorked > 8 ? 'CRITICAL' : 'WARNING';
      violations.push({
        violationType: 'CONSECUTIVE_DAYS_EXCEEDED',
        severity,
        description: `Bereits ${score.metrics.consecutiveDaysWorked} Tage in Folge gearbeitet.`,
        value: score.metrics.consecutiveDaysWorked,
        threshold: 6,
      });
    }

    for (const violation of violations) {
      await prisma.complianceViolation.create({
        data: {
          userId: assignment.userId,
          shiftId: assignment.shiftId,
          violationType: violation.violationType,
          severity: violation.severity,
          description: violation.description,
          value: violation.value ?? null,
          threshold: violation.threshold ?? null,
        },
      });
    }

    if (violations.length > 0) {
      logger.warn(
        '[IntelligentReplacement] Compliance-Verstöße nach Assignment %s (%s): %O',
        assignment.id,
        assignment.userId,
        violations,
      );
    }
  } catch (error) {
    logger.error('[IntelligentReplacement] Compliance-Check fehlgeschlagen: %o', error);
  }
}

export function startIntelligentReplacementSchedulers(): void {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_INTELLIGENT_REPLACEMENT_JOBS === 'true') {
    logger.info('[IntelligentReplacement] Scheduler deaktiviert (Testmodus oder Flag gesetzt).');
    return;
  }

  cron.schedule(
    '0 1 * * *',
    async () => {
      logger.info('[IntelligentReplacement] Starte tägliche Workload-Berechnung (01:00 Uhr).');
      await calculateMonthlyWorkloads();
    },
    {
      timezone: 'Europe/Berlin',
    },
  );

  cron.schedule(
    '0 2 * * 1',
    async () => {
      logger.info('[IntelligentReplacement] Starte wöchentliches Fairness-Update (Montag 02:00 Uhr).');
      await recalculateFairnessScores();
    },
    {
      timezone: 'Europe/Berlin',
    },
  );

  logger.info('[IntelligentReplacement] Scheduler initialisiert (01:00 Workload, 02:00 Mo Fairness).');
}
