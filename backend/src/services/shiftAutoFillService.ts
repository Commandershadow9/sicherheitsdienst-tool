/**
 * Shift Auto-Fill Service
 * Intelligente automatische Schicht-Besetzung
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { findReplacementCandidatesForShiftV2 } from './replacementService';

export interface AutoFillOptions {
  shiftIds: string[];
  autoAssign?: boolean; // Wenn true, direkt zuweisen, sonst nur Vorschläge
  preferenceWeight?: number; // 0-100, Gewichtung der Mitarbeiter-Präferenzen
  fairnessWeight?: number; // 0-100, Gewichtung der Fairness (gleichmäßige Verteilung)
}

export interface AutoFillResult {
  shiftId: string;
  shiftTitle: string;
  status: 'filled' | 'partially_filled' | 'unfilled' | 'already_filled';
  assigned: number;
  required: number;
  suggestions: Array<{
    userId: string;
    userName: string;
    score: number;
    reason: string;
    assigned?: boolean;
  }>;
  errors?: string[];
}

/**
 * Füllt Schichten automatisch mit optimalen Mitarbeitern
 */
export async function autoFillShifts(options: AutoFillOptions): Promise<AutoFillResult[]> {
  const { shiftIds, autoAssign = false, preferenceWeight = 50, fairnessWeight = 50 } = options;
  const results: AutoFillResult[] = [];

  try {
    logger.info(`Auto-Fill gestartet für ${shiftIds.length} Schichten (autoAssign: ${autoAssign})`);

    for (const shiftId of shiftIds) {
      const result = await autoFillSingleShift(shiftId, {
        autoAssign,
        preferenceWeight,
        fairnessWeight,
      });
      results.push(result);
    }

    const filledCount = results.filter((r) => r.status === 'filled').length;
    const partialCount = results.filter((r) => r.status === 'partially_filled').length;

    logger.info(
      `Auto-Fill abgeschlossen: ${filledCount} vollständig besetzt, ${partialCount} teilweise besetzt`
    );

    return results;
  } catch (error) {
    logger.error('Fehler beim Auto-Fill:', error);
    throw error;
  }
}

/**
 * Füllt eine einzelne Schicht automatisch
 */
async function autoFillSingleShift(
  shiftId: string,
  options: {
    autoAssign: boolean;
    preferenceWeight: number;
    fairnessWeight: number;
  }
): Promise<AutoFillResult> {
  try {
    // Lade Schicht-Details
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
              },
            },
          },
        },
      },
    });

    if (!shift) {
      return {
        shiftId,
        shiftTitle: 'Unbekannt',
        status: 'unfilled',
        assigned: 0,
        required: 0,
        suggestions: [],
        errors: ['Schicht nicht gefunden'],
      };
    }

    const currentAssigned = shift.assignments.length;
    const required = shift.requiredEmployees;

    // Bereits vollständig besetzt?
    if (currentAssigned >= required) {
      return {
        shiftId,
        shiftTitle: shift.title,
        status: 'already_filled',
        assigned: currentAssigned,
        required,
        suggestions: [],
      };
    }

    // Hole Kandidaten via Smart-Matching
    const candidates = await findReplacementCandidatesForShiftV2(shiftId);

    // Filtere bereits zugewiesene Mitarbeiter
    const assignedUserIds = new Set(shift.assignments.map((a: any) => a.user.id));
    const availableCandidates = candidates.filter(
      (c: any) => !assignedUserIds.has(c.id)
    );

    // Keine Kandidaten verfügbar?
    if (availableCandidates.length === 0) {
      return {
        shiftId,
        shiftTitle: shift.title,
        status: 'unfilled',
        assigned: currentAssigned,
        required,
        suggestions: [],
        errors: ['Keine verfügbaren Kandidaten gefunden'],
      };
    }

    // Sortiere Kandidaten nach Score
    const sortedCandidates = availableCandidates
      .sort((a: any, b: any) => b.score.total - a.score.total)
      .slice(0, required - currentAssigned); // Nur benötigte Anzahl

    const suggestions = sortedCandidates.map((c: any) => ({
      userId: c.id,
      userName: `${c.firstName} ${c.lastName}`,
      score: c.score.total,
      reason: getReasonText(c.score.recommendation),
      assigned: false,
    }));

    // Auto-Assign aktiviert?
    let assignedCount = 0;
    const errors: string[] = [];

    if (options.autoAssign) {
      for (const candidate of sortedCandidates) {
        try {
          // Nur zuweisen wenn Score gut genug (>60)
          if (candidate.score.total < 60) {
            logger.warn(
              `Kandidat ${candidate.firstName} ${candidate.lastName} übersprungen (Score zu niedrig: ${candidate.score.total})`
            );
            continue;
          }

          // Zuweisen
          await prisma.shiftAssignment.create({
            data: {
              userId: candidate.id,
              shiftId: shift.id,
              status: 'ASSIGNED',
            },
          });

          assignedCount++;
          const suggestion = suggestions.find((s: any) => s.userId === candidate.id);
          if (suggestion) {
            suggestion.assigned = true;
          }

          logger.info(
            `Auto-Assign: ${candidate.firstName} ${candidate.lastName} → ${shift.title} (Score: ${candidate.score.total})`
          );
        } catch (error: any) {
          logger.error(`Fehler beim Auto-Assign für ${candidate.id}:`, error);
          errors.push(`Zuweisung für ${candidate.firstName} ${candidate.lastName} fehlgeschlagen`);
        }
      }
    }

    const newAssigned = currentAssigned + assignedCount;
    let status: AutoFillResult['status'];

    if (newAssigned >= required) {
      status = 'filled';
    } else if (newAssigned > currentAssigned) {
      status = 'partially_filled';
    } else {
      status = 'unfilled';
    }

    return {
      shiftId,
      shiftTitle: shift.title,
      status,
      assigned: newAssigned,
      required,
      suggestions,
      ...(errors.length > 0 && { errors }),
    };
  } catch (error) {
    logger.error(`Fehler beim Auto-Fill für Schicht ${shiftId}:`, error);
    return {
      shiftId,
      shiftTitle: 'Fehler',
      status: 'unfilled',
      assigned: 0,
      required: 0,
      suggestions: [],
      errors: [error instanceof Error ? error.message : 'Unbekannter Fehler'],
    };
  }
}

/**
 * Gibt einen lesbaren Text für die Empfehlung zurück
 */
function getReasonText(recommendation: string): string {
  switch (recommendation) {
    case 'OPTIMAL':
      return 'Optimal - Sehr gut geeignet';
    case 'GOOD':
      return 'Gut geeignet';
    case 'ACCEPTABLE':
      return 'Akzeptabel';
    case 'NOT_RECOMMENDED':
      return 'Nicht empfohlen';
    default:
      return 'Unbekannt';
  }
}

/**
 * Füllt ALLE unbesetzten Schichten in einem Zeitraum
 */
export async function autoFillPeriod(options: {
  startDate: Date;
  endDate: Date;
  siteId?: string;
  autoAssign?: boolean;
}): Promise<AutoFillResult[]> {
  try {
    // Finde alle unbesetzten/unterbesetzten Schichten
    const where: any = {
      startTime: { gte: options.startDate },
      endTime: { lte: options.endDate },
      status: { in: ['PLANNED', 'ACTIVE'] },
    };

    if (options.siteId) {
      where.siteId = options.siteId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    // Filtere nur unterbesetzte Schichten
    const understaffedShifts = shifts.filter(
      (shift) => shift._count.assignments < shift.requiredEmployees
    );

    logger.info(
      `Auto-Fill für Zeitraum: ${understaffedShifts.length} unterbesetzte Schichten gefunden`
    );

    if (understaffedShifts.length === 0) {
      return [];
    }

    // Auto-Fill durchführen
    return await autoFillShifts({
      shiftIds: understaffedShifts.map((s) => s.id),
      autoAssign: options.autoAssign || false,
    });
  } catch (error) {
    logger.error('Fehler beim Auto-Fill für Zeitraum:', error);
    throw error;
  }
}
