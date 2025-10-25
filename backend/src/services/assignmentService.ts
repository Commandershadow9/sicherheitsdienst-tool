import prisma from '../utils/prisma';
import { calculateCandidateScore } from './intelligentReplacementService';
import type { ReplacementCandidateV2, ReplacementCandidateWarning } from './replacementService';

export type AssignmentCandidate = ReplacementCandidateV2;

/**
 * Findet intelligente MA-Kandidaten für die Zuweisung zu einer Schicht
 * Nutzt das gleiche Scoring-System wie Replacement (calculateCandidateScore)
 */
export async function findAssignmentCandidatesForShift(
  shiftId: string,
  options?: {
    role?: string; // Optional: Filter by role (EMPLOYEE, MANAGER, etc.)
    limit?: number; // Optional: Limit number of candidates
  },
): Promise<AssignmentCandidate[]> {
  // 1. Hole Shift-Daten für Scoring
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      assignments: {
        where: { status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] } },
        select: { userId: true },
      },
    },
  });

  if (!shift || !shift.siteId) {
    return [];
  }

  const assignedUserIds = new Set(shift.assignments.map((a) => a.userId));

  // 2. Finde Abwesenheiten während der Schicht
  // APPROVED absences: User NICHT verfügbar (komplett ausschließen)
  const approvedAbsences = await prisma.absence.findMany({
    where: {
      status: 'APPROVED',
      startsAt: { lt: shift.endTime },
      endsAt: { gt: shift.startTime },
    },
    select: { userId: true },
  });

  const absentUserIds = new Set(approvedAbsences.map((a) => a.userId));

  // REQUESTED absences: User verfügbar, aber mit Warning anzeigen
  const requestedAbsences = await prisma.absence.findMany({
    where: {
      status: 'REQUESTED',
      startsAt: { lt: shift.endTime },
      endsAt: { gt: shift.startTime },
    },
    select: {
      userId: true,
      type: true,
      startsAt: true,
      endsAt: true,
    },
  });

  const requestedAbsencesByUser = new Map<string, typeof requestedAbsences[0][]>();
  for (const req of requestedAbsences) {
    const arr = requestedAbsencesByUser.get(req.userId) || [];
    arr.push(req);
    requestedAbsencesByUser.set(req.userId, arr);
  }

  // 3. Hole Clearances für das Objekt
  const clearances = await prisma.objectClearance.findMany({
    where: {
      siteId: shift.siteId,
      status: { in: ['ACTIVE', 'TRAINING'] }, // TRAINING auch erlauben (mit niedrigerem Score)
      OR: [{ validUntil: null }, { validUntil: { gte: shift.startTime } }],
    },
    select: {
      userId: true,
      status: true,
      trainedAt: true,
      validUntil: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          qualifications: true,
        },
      },
    },
  });

  // 4. Filter Kandidaten
  let candidates = clearances.filter(
    (clearance) =>
      !assignedUserIds.has(clearance.userId) && // Nicht bereits zugewiesen
      !absentUserIds.has(clearance.userId), // Nicht abwesend
  );

  // Optional: Filter by role
  if (options?.role) {
    candidates = candidates.filter((c) => c.user.role === options.role);
  }

  // 5. Berechne Scores für jeden Kandidaten
  const candidatesWithScores = await Promise.all(
    candidates.map(async (clearance) => {
      const user = clearance.user;
      const requiredQuals = shift.requiredQualifications || [];
      const userQuals = user.qualifications || [];

      // Check qualifications
      const missingQuals = requiredQuals.filter((q) => !userQuals.includes(q));
      const hasRequiredQuals = missingQuals.length === 0;

      // Determine site access status
      let siteAccessStatus: 'CLEARED' | 'NOT_CLEARED' | 'EXPIRED';
      if (clearance.status === 'ACTIVE') {
        siteAccessStatus = 'CLEARED';
      } else if (clearance.status === 'TRAINING') {
        siteAccessStatus = 'NOT_CLEARED'; // Training = not fully cleared yet
      } else {
        siteAccessStatus = 'EXPIRED';
      }

      // Calculate intelligent score
      const scoreResult = await calculateCandidateScore(user.id, shift);

      // Add warnings for pending absence requests
      const warnings: ReplacementCandidateWarning[] = [
        ...scoreResult.warnings.map((w) => ({
          type: w.type,
          severity: w.severity.toLowerCase() as 'info' | 'warning' | 'error',
          message: w.message,
        })),
      ];

      const pendingAbsences = requestedAbsencesByUser.get(user.id);
      if (pendingAbsences && pendingAbsences.length > 0) {
        for (const req of pendingAbsences) {
          warnings.push({
            type: 'PENDING_ABSENCE_REQUEST',
            severity: 'warning',
            message: `Offener Urlaubsantrag: ${req.type} (${req.startsAt.toLocaleDateString('de-DE')} - ${req.endsAt.toLocaleDateString('de-DE')})`,
          });
        }
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.id.slice(0, 8).toUpperCase(), // Fallback
        hasRequiredQualifications: hasRequiredQuals,
        missingQualifications: missingQuals,
        siteAccessStatus,
        isAvailable: true,
        score: {
          total: scoreResult.totalScore,
          recommendation: scoreResult.recommendation,
          color: scoreResult.color,
          workload: scoreResult.workloadScore,
          compliance: scoreResult.complianceScore,
          fairness: scoreResult.fairnessScore,
          preference: scoreResult.preferenceScore,
        },
        metrics: {
          currentHours: scoreResult.metrics.currentMonthHours,
          targetHours: scoreResult.metrics.targetMonthHours,
          utilizationPercent: scoreResult.metrics.utilizationPercent,
          restHours: scoreResult.metrics.restHours,
          weeklyHours: 0, // Not available in CandidateScore
          consecutiveDays: scoreResult.metrics.consecutiveDaysWorked,
          nightShiftCount: scoreResult.metrics.nightShiftsThisMonth,
          avgNightShiftCount: scoreResult.metrics.teamAverageNightShifts,
          replacementCount: scoreResult.metrics.replacementCount,
          avgReplacementCount: scoreResult.metrics.teamAverageReplacementCount,
        },
        warnings,
      };
    }),
  );

  // 6. Sortiere nach Score (höchster zuerst)
  candidatesWithScores.sort((a, b) => b.score.total - a.score.total);

  // 7. Optional: Limit results
  if (options?.limit && options.limit > 0) {
    return candidatesWithScores.slice(0, options.limit);
  }

  return candidatesWithScores;
}

/**
 * Hilfsfunktion: Hole Assignment-Kandidaten für mehrere Schichten gleichzeitig
 * Nützlich für Bulk-Assignment
 */
export async function findAssignmentCandidatesForMultipleShifts(
  shiftIds: string[],
  options?: {
    role?: string;
    limit?: number;
  },
): Promise<Map<string, AssignmentCandidate[]>> {
  const results = new Map<string, AssignmentCandidate[]>();

  await Promise.all(
    shiftIds.map(async (shiftId) => {
      const candidates = await findAssignmentCandidatesForShift(shiftId, options);
      results.set(shiftId, candidates);
    }),
  );

  return results;
}
