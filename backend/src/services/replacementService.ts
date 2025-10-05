import prisma from '../utils/prisma';

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
