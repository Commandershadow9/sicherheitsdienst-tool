/**
 * Shift Time Tracking Controller
 * Handles clock-in/clock-out functionality
 * Extracted from shiftController.ts (lines 757-926)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';

// POST /api/shifts/:id/clock-in
export const clockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const userId = (req.user as { id?: string })?.id;
    const { at, location, notes } = req.body;
    if (!userId) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_IN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'UNAUTHENTICATED' },
      });
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }
    const assigned = await prisma.shiftAssignment.findUnique({
      where: { userId_shiftId: { userId, shiftId } },
    });
    if (!assigned) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_IN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'NOT_ASSIGNED', userId },
      });
      res.status(403).json({ success: false, message: 'Nicht für diese Schicht zugewiesen' });
      return;
    }
    const open = await prisma.timeEntry.findFirst({ where: { userId, endTime: null } });
    if (open) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_IN',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'OPEN_ENTRY_EXISTS', userId, openEntryId: open.id },
      });
      res.status(400).json({ success: false, message: 'Es existiert bereits ein offener Zeiteintrag' });
      return;
    }
    const start = new Date(at);
    const entry = await prisma.timeEntry.create({
      data: { userId, shiftId, startTime: start, startLocation: location || null, notes: notes || null },
    });
    const warnings: string[] = [];
    const last = await prisma.timeEntry.findFirst({
      where: { userId, endTime: { not: null } },
      orderBy: { endTime: 'desc' },
    });
    if (last?.endTime) {
      const hoursRest = (start.getTime() - new Date(last.endTime).getTime()) / 3_600_000;
      if (hoursRest < 11) warnings.push('WARN_REST_PERIOD_LT_11H');
    }
    await submitAuditEvent(req, {
      action: 'SHIFT.CLOCK_IN',
      resourceType: 'SHIFT',
      resourceId: shiftId,
      outcome: 'SUCCESS',
      data: { timeEntryId: entry.id, userId, at },
    });
    res.json({ success: true, message: 'Clock-in erfasst', data: entry, warnings });
  } catch (error) {
    await submitAuditEvent(req, {
      action: 'SHIFT.CLOCK_IN',
      resourceType: 'SHIFT',
      resourceId: req.params.id,
      outcome: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' },
    });
    next(error);
  }
};

// POST /api/shifts/:id/clock-out
export const clockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const userId = (req.user as { id?: string })?.id;
    const { at, breakTime, location, notes } = req.body;
    if (!userId) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_OUT',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'UNAUTHENTICATED' },
      });
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }
    const assigned = await prisma.shiftAssignment.findUnique({
      where: { userId_shiftId: { userId, shiftId } },
    });
    if (!assigned) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_OUT',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'NOT_ASSIGNED', userId },
      });
      res.status(403).json({ success: false, message: 'Nicht für diese Schicht zugewiesen' });
      return;
    }
    const openEntry = await prisma.timeEntry.findFirst({ where: { userId, shiftId, endTime: null } });
    if (!openEntry) {
      await submitAuditEvent(req, {
        action: 'SHIFT.CLOCK_OUT',
        resourceType: 'SHIFT',
        resourceId: shiftId,
        outcome: 'DENIED',
        data: { reason: 'NO_OPEN_ENTRY', userId },
      });
      res.status(400).json({ success: false, message: 'Kein offener Clock-In gefunden' });
      return;
    }
    const end = new Date(at);
    const breakMins = typeof breakTime === 'number' && breakTime >= 0 ? breakTime : 0;
    const updated = await prisma.timeEntry.update({
      where: { id: openEntry.id },
      data: {
        endTime: end,
        breakMinutes: breakMins,
        endLocation: location || null,
        notes: notes || openEntry.notes,
      },
    });
    const warnings: string[] = [];
    const durationMs = end.getTime() - new Date(openEntry.startTime).getTime();
    const durationHours = durationMs / 3_600_000;
    if (durationHours > 10) warnings.push('WARN_DURATION_GT_10H');
    if (durationHours < 1) warnings.push('WARN_DURATION_LT_1H');
    await submitAuditEvent(req, {
      action: 'SHIFT.CLOCK_OUT',
      resourceType: 'SHIFT',
      resourceId: shiftId,
      outcome: 'SUCCESS',
      data: { timeEntryId: updated.id, userId, at, breakTime: breakMins },
    });
    res.json({ success: true, message: 'Clock-out erfasst', data: updated, warnings });
  } catch (error) {
    await submitAuditEvent(req, {
      action: 'SHIFT.CLOCK_OUT',
      resourceType: 'SHIFT',
      resourceId: req.params.id,
      outcome: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' },
    });
    next(error);
  }
};
