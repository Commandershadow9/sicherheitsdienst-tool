/**
 * Shift Assignment Controller
 * Handles shift assignment and replacement candidate logic
 * Extracted from shiftController.ts (lines 179-210, 618-754, 926-1157)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { submitAuditEvent } from '../utils/audit';
import { findReplacementCandidatesForShiftV2 } from '../services/replacementService';
import { checkComplianceAfterAssignment } from '../jobs/intelligentReplacementJobs';
import { sendShiftChangedEmail } from '../services/emailService';

const EMAIL_FLAG = 'EMAIL_NOTIFY_SHIFTS';

function isEmailNotifyEnabled(): boolean {
  return process.env[EMAIL_FLAG] === 'true';
}

// GET /api/shifts/:id/replacement-candidates
export const getShiftReplacementCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const rawAbsent = req.query.absentUserId;
    const absentUserId = typeof rawAbsent === 'string' && rawAbsent.trim() !== '' ? rawAbsent : undefined;

    const shiftExists = await prisma.shift.count({ where: { id: shiftId } });
    if (!shiftExists) {
      res.status(404).json({ success: false, message: 'Schicht nicht gefunden' });
      return;
    }

    // Nutze V2 für intelligentere Kandidaten-Suche mit Scoring
    const candidates = await findReplacementCandidatesForShiftV2(shiftId, absentUserId);
    res.json({
      success: true,
      data: {
        shiftId,
        candidates,
        stats: {
          total: candidates.length,
          optimal: candidates.filter(c => c.score.recommendation === 'OPTIMAL').length,
          good: candidates.filter(c => c.score.recommendation === 'GOOD').length,
          acceptable: candidates.filter(c => c.score.recommendation === 'ACCEPTABLE').length,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shifts/:id/replacement-candidates-v2
 *
 * Intelligente Ersatz-Mitarbeiter-Suche mit Scoring (Phase 2b - v1.8.0)
 *
 * Berechnet für jeden Kandidaten einen Score basierend auf:
 * - Workload (Auslastung)
 * - Compliance (ArbZG - Ruhezeiten, Wochenlimit)
 * - Fairness (Vergleich mit Team-Durchschnitt)
 * - Preferences (Mitarbeiter-Präferenzen)
 *
 * Gibt zurück: Sortierte Liste mit Scores, Metriken und Warnungen
 *
 * Query-Parameter:
 * - absentUserId?: string - User der ausfällt (optional)
 */
export const getReplacementCandidatesV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: shiftId } = req.params;
    const rawAbsent = req.query.absentUserId;
    const absentUserId = typeof rawAbsent === 'string' && rawAbsent.trim() !== '' ? rawAbsent : undefined;

    // Schicht laden
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      res.status(404).json({ success: false, message: 'Schicht nicht gefunden' });
      return;
    }

    // Kandidaten mit Scoring ermitteln (v1.8.0 - Intelligent Replacement)
    const candidatesWithScores = await findReplacementCandidatesForShiftV2(shiftId, absentUserId);

    // Sortieren: Beste Scores zuerst
    const sortedCandidates = candidatesWithScores.sort((a, b) => b.score.total - a.score.total);

    res.json({
      success: true,
      data: sortedCandidates,
      meta: {
        shift: {
          id: shift.id,
          title: shift.title,
          startTime: shift.startTime,
          endTime: shift.endTime,
          siteId: shift.siteId,
        },
        totalCandidates: sortedCandidates.length,
        optimalCandidates: sortedCandidates.filter((c) => c.score.recommendation === 'OPTIMAL').length,
        goodCandidates: sortedCandidates.filter((c) => c.score.recommendation === 'GOOD').length,
      },
    });
  } catch (error) {
    logger.error('Error in getReplacementCandidatesV2:', error);
    next(error);
  }
};

// GET /api/shifts/:id/assignment-candidates - Intelligente MA-Vorschläge für Schicht-Zuweisung
export const getShiftAssignmentCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role, limit } = req.query;

    // Import assignment service
    const { findAssignmentCandidatesForShift } = await import('../services/assignmentService');

    const candidates = await findAssignmentCandidatesForShift(id, {
      role: role as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    // Sort by score (descending)
    const sortedCandidates = candidates.sort((a, b) => b.score.total - a.score.total);

    res.status(200).json({
      success: true,
      data: {
        shiftId: id,
        candidates: sortedCandidates,
        stats: {
          total: sortedCandidates.length,
          optimal: sortedCandidates.filter((c) => c.score.recommendation === 'OPTIMAL').length,
          good: sortedCandidates.filter((c) => c.score.recommendation === 'GOOD').length,
          acceptable: sortedCandidates.filter((c) => c.score.recommendation === 'ACCEPTABLE').length,
          notRecommended: sortedCandidates.filter((c) => c.score.recommendation === 'NOT_RECOMMENDED').length,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getShiftAssignmentCandidates:', error);
    next(error);
  }
};

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
export const assignUserToShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      await submitAuditEvent(req, {
        action: 'SHIFT.ASSIGN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'MISSING_USER_ID' },
      });
      res.status(400).json({
        success: false,
        message: 'Benutzer-ID ist erforderlich',
      });
      return;
    }

    // Prüfen ob Schicht existiert
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { assignments: true },
    });

    if (!shift) {
      await submitAuditEvent(req, {
        action: 'SHIFT.ASSIGN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'SHIFT_NOT_FOUND', userId },
      });
      res.status(404).json({
        success: false,
        message: 'Schicht nicht gefunden',
      });
      return;
    }

    // Prüfen ob bereits zugewiesen
    const existingAssignment = await prisma.shiftAssignment.findUnique({
      where: {
        userId_shiftId: {
          userId,
          shiftId,
        },
      },
    });

    if (existingAssignment) {
      await submitAuditEvent(req, {
        action: 'SHIFT.ASSIGN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'ALREADY_ASSIGNED', userId },
      });
      res.status(400).json({
        success: false,
        message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen',
      });
      return;
    }

    // Zuweisung erstellen
    const assignment = await prisma.shiftAssignment.create({
      data: {
        userId,
        shiftId,
        status: 'ASSIGNED',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        shift: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    checkComplianceAfterAssignment(assignment.id).catch((error: unknown) =>
      logger.error('Compliance-Check nach Zuweisung fehlgeschlagen: %o', error),
    );

    await submitAuditEvent(req, {
      action: 'SHIFT.ASSIGN',
      resourceType: 'SHIFT',
      resourceId: shiftId,
      outcome: 'SUCCESS',
      data: { assignmentId: assignment.id, userId },
    });
    res.status(201).json({
      success: true,
      message: 'Mitarbeiter erfolgreich zur Schicht zugewiesen',
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error assigning user to shift:', error);

    if (error.code === 'P2002') {
      await submitAuditEvent(req, {
        action: 'SHIFT.ASSIGN',
        resourceType: 'SHIFT',
        resourceId: req.params.id,
        outcome: 'DENIED',
        data: { reason: 'ALREADY_ASSIGNED', userId: req.body?.userId },
      });
      res.status(400).json({
        success: false,
        message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen',
      });
      return;
    }

    await submitAuditEvent(req, {
      action: 'SHIFT.ASSIGN',
      resourceType: 'SHIFT',
      resourceId: req.params.id,
      outcome: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' },
    });
    next(error);
  }
};

// POST /api/shifts/bulk-assign - Mitarbeiter zu mehreren Schichten zuweisen (Bulk-Operation)
export const bulkAssignUserToShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, shiftIds } = req.body;

    // Validation
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Benutzer-ID ist erforderlich',
      });
      return;
    }

    if (!Array.isArray(shiftIds) || shiftIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Mindestens eine Schicht-ID ist erforderlich',
      });
      return;
    }

    // Limit to 50 shifts at once
    if (shiftIds.length > 50) {
      res.status(400).json({
        success: false,
        message: 'Maximal 50 Schichten gleichzeitig',
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden',
      });
      return;
    }

    // Fetch all shifts
    const shifts = await prisma.shift.findMany({
      where: { id: { in: shiftIds } },
      include: { assignments: true },
    });

    if (shifts.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Keine gültigen Schichten gefunden',
      });
      return;
    }

    // Check for existing assignments
    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        userId,
        shiftId: { in: shiftIds },
      },
    });

    const existingShiftIds = new Set(existingAssignments.map((a) => a.shiftId));
    const shiftsToAssign = shifts.filter((s) => !existingShiftIds.has(s.id));

    if (shiftsToAssign.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Benutzer ist bereits allen ausgewählten Schichten zugewiesen',
      });
      return;
    }

    // Create assignments
    const assignmentsData = shiftsToAssign.map((shift) => ({
      userId,
      shiftId: shift.id,
      status: 'ASSIGNED' as const,
      assignedAt: new Date(),
    }));

    const result = await prisma.shiftAssignment.createMany({
      data: assignmentsData,
      skipDuplicates: true,
    });

    // Submit audit events
    await Promise.all(
      shiftsToAssign.map((shift) =>
        submitAuditEvent(req, {
          action: 'SHIFT.BULK_ASSIGN',
          resourceType: 'SHIFT',
          resourceId: shift.id,
          outcome: 'SUCCESS',
          data: { userId, shiftId: shift.id },
        }),
      ),
    );

    // Send notification emails if enabled
    if (isEmailNotifyEnabled()) {
      try {
        const assignedShifts = shiftsToAssign.map((s) => s.title).join(', ');
        await sendShiftChangedEmail(
          user.email,
          `${result.count} Schichten`,
          `Sie wurden folgenden Schichten zugewiesen: ${assignedShifts}`,
        );
      } catch (emailError) {
        logger.error('Fehler beim Versenden der Bulk-Zuweisungs-E-Mail:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: `${result.count} Schichten erfolgreich zugewiesen`,
      data: {
        assigned: result.count,
        skipped: existingShiftIds.size,
        total: shiftIds.length,
        shifts: shiftsToAssign.map((s) => ({
          id: s.id,
          title: s.title,
          startTime: s.startTime,
        })),
      },
    });
  } catch (error) {
    logger.error('Error in bulkAssignUserToShifts:', error);
    next(error);
  }
};
