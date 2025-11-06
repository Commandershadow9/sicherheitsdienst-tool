/**
 * Site Assignment Controller
 * Handles site assignments, qualification checks, and assignment candidates
 * Extracted from siteController.ts (lines 334-699)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/sites/:id/assignments - Get all assignments for a site
export const getSiteAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.query.role;

    const assignments = await prisma.siteAssignment.findMany({
      where: {
        siteId: id,
        ...(role && { role: role as string }),
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/assignments - Create new assignment
export const createSiteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const assignedBy = req.user?.id;

    if (!assignedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const assignment = await prisma.siteAssignment.create({
      data: {
        siteId: id,
        userId,
        role,
        assignedBy,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    res.status(201).json({ success: true, message: 'Zuweisung erfolgreich erstellt', data: assignment });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Benutzer ist bereits für dieses Objekt zugewiesen' });
      return;
    }
    next(error);
  }
};

// DELETE /api/sites/:siteId/assignments/:assignmentId - Delete assignment
export const deleteSiteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    await prisma.siteAssignment.delete({ where: { id: assignmentId } });
    res.status(204).send();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Zuweisung nicht gefunden' });
      return;
    }
    next(error);
  }
};

// POST /api/sites/:id/check-qualification - Check user qualification for site
export const checkUserQualification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId ist erforderlich' });
      return;
    }

    // Load site with required qualifications
    const site = await prisma.site.findUnique({
      where: { id },
      select: { id: true, name: true, requiredQualifications: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // Load user with qualifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        qualifications: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
      return;
    }

    const requiredQualifications = site.requiredQualifications as string[] || [];
    const userQualifications = user.qualifications || [];

    // Check which qualifications the user has and which are missing
    const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
    const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

    // Determine status
    let status: 'FULL' | 'PARTIAL' | 'NONE';
    if (requiredQualifications.length === 0) {
      status = 'FULL';
    } else if (missingQualifications.length === 0) {
      status = 'FULL';
    } else if (hasQualifications.length > 0) {
      status = 'PARTIAL';
    } else {
      status = 'NONE';
    }

    res.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        required: requiredQualifications,
        has: hasQualifications,
        missing: missingQualifications,
        status,
        allowOverride: status !== 'FULL',
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:id/assignment-candidates - Get intelligent assignment candidates
export const getAssignmentCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.query.role as string | undefined;

    // Load site
    const site = await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        requiredQualifications: true,
        assignments: { select: { userId: true } },
        clearances: { where: { status: { in: ['ACTIVE', 'TRAINING'] } }, select: { userId: true, status: true } },
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    const requiredQualifications = site.requiredQualifications as string[] || [];
    const assignedUserIds = site.assignments.map((a) => a.userId);

    // Load all active employees (except already assigned)
    const candidates = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: assignedUserIds },
        ...(role && { role }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        qualifications: true,
      },
    });

    // Score each candidate
    const scoredCandidates = candidates.map((user) => {
      const userQualifications = user.qualifications || [];

      const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
      const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

      // Qualification score (0-50%)
      const qualificationScore = requiredQualifications.length > 0
        ? (hasQualifications.length / requiredQualifications.length) * 50
        : 50;

      // Clearance score (0-30%)
      const clearance = site.clearances.find((c) => c.userId === user.id);
      let clearanceScore = 0;
      if (clearance) {
        clearanceScore = clearance.status === 'ACTIVE' ? 30 : 15;
      }

      // Availability score (0-20%) - Placeholder: Always 20%
      const availabilityScore = 20;

      // Total score (0-100%)
      const totalScore = Math.round(qualificationScore + clearanceScore + availabilityScore);

      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        qualifications: {
          required: requiredQualifications,
          has: hasQualifications,
          missing: missingQualifications,
          status: missingQualifications.length === 0 ? 'FULL' : hasQualifications.length > 0 ? 'PARTIAL' : 'NONE',
        },
        clearance: clearance
          ? { status: clearance.status, score: clearanceScore }
          : { status: 'NONE', score: 0 },
        score: totalScore,
      };
    });

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        requiredQualifications,
        candidates: scoredCandidates,
      },
    });
  } catch (error) {
    next(error);
  }
};
