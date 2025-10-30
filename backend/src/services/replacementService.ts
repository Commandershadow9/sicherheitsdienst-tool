import prisma from '../utils/prisma';
import { calculateCandidateScore, type CandidateScore } from './intelligentReplacementService';

export type ReplacementCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  clearanceStatus: string;
  clearanceTrainedAt: string;
  clearanceValidUntil: string | null;
  hasRequiredQualifications: boolean;
  missingQualifications: string[];
  siteAccessStatus: 'CLEARED' | 'NOT_CLEARED' | 'EXPIRED';
  isAvailable: boolean;
};

export type ReplacementCandidateV2 = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  hasRequiredQualifications: boolean;
  missingQualifications: string[];
  siteAccessStatus: 'CLEARED' | 'NOT_CLEARED' | 'EXPIRED';
  isAvailable: boolean;
  score: {
    total: number;
    recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
    color: 'green' | 'yellow' | 'orange' | 'red';
    workload: number;
    compliance: number;
    fairness: number;
    preference: number;
  };
  metrics: {
    currentHours: number;
    targetHours: number;
    utilizationPercent: number;
    restHours: number;
    weeklyHours: number;
    consecutiveDays: number;
    nightShiftCount: number;
    avgNightShiftCount: number;
    replacementCount: number;
    avgReplacementCount: number;
  };
  warnings: ReplacementCandidateWarning[];
};

export type ReplacementCandidateWarning = {
  type: ReplacementWarningType;
  severity: 'info' | 'warning' | 'error';
  message: string;
};

type ReplacementWarningType =
  | CandidateScore['warnings'][number]['type']
  | 'PENDING_ABSENCE_REQUEST';

export async function findReplacementCandidatesForShift(
  shiftId: string,
  absentUserId?: string,
): Promise<ReplacementCandidate[]> {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      siteId: true,
      startTime: true,
      endTime: true,
      requiredQualifications: true,
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

  const absences = await prisma.absence.findMany({
    where: {
      status: 'APPROVED',
      startsAt: { lt: shift.endTime },
      endsAt: { gt: shift.startTime },
    },
    select: { userId: true },
  });

  const absentUserIds = new Set(absences.map((a) => a.userId));
  if (absentUserId) {
    absentUserIds.add(absentUserId);
  }

  const clearances = await prisma.objectClearance.findMany({
    where: {
      siteId: shift.siteId,
      status: 'ACTIVE',
      OR: [
        { validUntil: null },
        { validUntil: { gte: shift.startTime } },
      ],
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
        },
      },
    },
  });

  const requiredQuals = shift.requiredQualifications || [];

  return clearances
    .filter((clearance) => !assignedUserIds.has(clearance.userId) && !absentUserIds.has(clearance.userId))
    .map((clearance) => ({
      id: clearance.user.id,
      firstName: clearance.user.firstName,
      lastName: clearance.user.lastName,
      email: clearance.user.email,
      employeeId: clearance.user.id.slice(0, 8).toUpperCase(), // Fallback employeeId
      clearanceStatus: clearance.status,
      clearanceTrainedAt: clearance.trainedAt.toISOString(),
      clearanceValidUntil: clearance.validUntil?.toISOString() || null,
      hasRequiredQualifications: true, // Simplified: clearance already filters for site access
      missingQualifications: [], // Simplified
      siteAccessStatus: 'CLEARED' as const, // Already filtered by clearance
      isAvailable: true, // Already filtered by absences
    }));
}

/**
 * v2 API - Intelligent Replacement mit Scoring
 * Findet Ersatz-Kandidaten und berechnet intelligent Scores für jeden
 */
export async function findReplacementCandidatesForShiftV2(
  shiftId: string,
  absentUserId?: string,
): Promise<ReplacementCandidateV2[]> {
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
  if (absentUserId) {
    absentUserIds.add(absentUserId);
  }

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

  // Map userId → pending absence info
  const pendingAbsencesByUser = requestedAbsences.reduce<
    Map<string, Array<(typeof requestedAbsences)[number]>>
  >((map, absence) => {
    const existing = map.get(absence.userId) ?? [];
    existing.push(absence);
    map.set(absence.userId, existing);
    return map;
  }, new Map());

  // 3. Lade ALLE aktiven Mitarbeiter (nicht nur mit Clearance)
  const allUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ['EMPLOYEE', 'MANAGER'] }, // Nur MA-Rollen
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // 4. Lade Clearances separat (für Status-Check)
  const clearances = await prisma.objectClearance.findMany({
    where: {
      siteId: shift.siteId,
      status: 'ACTIVE',
      OR: [{ validUntil: null }, { validUntil: { gte: shift.startTime } }],
    },
    select: {
      userId: true,
      status: true,
      trainedAt: true,
      validUntil: true,
    },
  });

  const clearancesByUserId = new Map(clearances.map(c => [c.userId, c]));

  // 5. Filtere nur bereits zugewiesene und abwesende Mitarbeiter aus
  const availableUsers = allUsers
    .filter((user) => !assignedUserIds.has(user.id) && !absentUserIds.has(user.id));

  // 5. Berechne Scores für jeden Kandidaten
  const candidatesWithScores = await Promise.all(
    availableUsers.map(async (user) => {
      try {
        const candidateScore = await calculateCandidateScore(user.id, shift);

        const pendingAbsences = pendingAbsencesByUser.get(user.id) ?? [];
        const enrichedWarnings: CandidateScore['warnings'] = [...candidateScore.warnings];

        if (pendingAbsences.length > 0) {
          const formatDate = (date: Date) =>
            new Intl.DateTimeFormat('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).format(date);

          const pendingWarnings = pendingAbsences
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
            .map((absence) => {
              const absenceType =
                absence.type === 'VACATION'
                  ? 'Urlaubsantrag'
                  : absence.type === 'SICKNESS'
                    ? 'Krankmeldung'
                    : 'Abwesenheitsantrag';

              return {
                type: 'PENDING_ABSENCE_REQUEST' as const,
                severity: 'WARNING' as const,
                message: `⚠️ ${absenceType} offen: ${formatDate(absence.startsAt)} – ${formatDate(absence.endsAt)}`,
              };
            });

          enrichedWarnings.unshift(...pendingWarnings);
        }

        // Prüfe Clearance-Status
        const clearance = clearancesByUserId.get(user.id);
        const hasClearance = !!clearance;

        const warnings: ReplacementCandidateWarning[] = enrichedWarnings.map((warning) => ({
          type: warning.type,
          severity: warning.severity.toLowerCase() as ReplacementCandidateWarning['severity'],
          message: warning.message,
        }));

        // Füge Warning hinzu wenn keine Clearance vorhanden
        if (!hasClearance) {
          warnings.unshift({
            type: 'MISSING_CLEARANCE' as any,
            severity: 'warning',
            message: '⚠️ Keine Objekt-Clearance - Einweisung erforderlich',
          });
        }

        // Transform Backend Score Structure → Frontend Expected Structure
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.id.slice(0, 8).toUpperCase(),
          hasRequiredQualifications: true,
          missingQualifications: [],
          siteAccessStatus: hasClearance ? ('CLEARED' as const) : ('NOT_CLEARED' as const),
          isAvailable: true,
          score: {
            total: candidateScore.totalScore,
            recommendation: candidateScore.recommendation,
            color: candidateScore.color,
            workload: candidateScore.workloadScore,
            compliance: candidateScore.complianceScore,
            fairness: candidateScore.fairnessScore,
            preference: candidateScore.preferenceScore,
          },
          metrics: {
            currentHours: candidateScore.metrics.currentMonthHours,
            targetHours: candidateScore.metrics.targetMonthHours,
            utilizationPercent: candidateScore.metrics.utilizationPercent,
            utilizationAfterAssignment: candidateScore.metrics.utilizationAfterAssignment,
            restHours: candidateScore.metrics.restHours,
            weeklyHours: candidateScore.metrics.maxWeeklyHours,
            consecutiveDays: candidateScore.metrics.consecutiveDaysWorked,
            nightShiftCount: candidateScore.metrics.nightShiftsThisMonth,
            avgNightShiftCount: candidateScore.metrics.teamAverageNightShifts,
            replacementCount: candidateScore.metrics.replacementCount,
            avgReplacementCount: candidateScore.metrics.teamAverageReplacementCount,
          },
          warnings,
        };
      } catch (error) {
        console.error(`Error calculating score for user ${user.id}:`, error);
        // Return fallback with minimal score for failed calculations
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.id.slice(0, 8).toUpperCase(),
          hasRequiredQualifications: true,
          missingQualifications: [],
          siteAccessStatus: 'CLEARED' as const,
          isAvailable: true,
          score: {
            total: 0,
            recommendation: 'NOT_RECOMMENDED' as const,
            color: 'red' as const,
            workload: 0,
            compliance: 0,
            fairness: 0,
            preference: 0,
          },
          metrics: {
            currentHours: 0,
            targetHours: 160,
            utilizationPercent: 0,
            utilizationAfterAssignment: 0,
            restHours: 0,
            weeklyHours: 0,
            consecutiveDays: 0,
            nightShiftCount: 0,
            avgNightShiftCount: 0,
            replacementCount: 0,
            avgReplacementCount: 0,
          },
          warnings: [
            {
              type: 'PREFERENCE_MISMATCH' as const,
              severity: 'error' as const,
              message: 'Fehler beim Berechnen des Scores',
            },
          ],
        };
      }
    }),
  );

  // 6. Sortiere nach Score (beste zuerst)
  return candidatesWithScores.sort((a, b) => b.score.total - a.score.total);
}
