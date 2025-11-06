/**
 * Site Analytics Controller
 * Handles coverage statistics, shift generation, and control round suggestions
 * Extracted from siteController.ts (lines 402-923)
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export const getSiteCoverageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        clearances: { where: { status: 'ACTIVE' } },
        assignments: { include: { user: true } },
        securityConcepts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // SINGLE SOURCE OF TRUTH: SecurityConcept
    const securityConcept = site.securityConcepts?.[0];

    // Personal-Anforderungen aus SecurityConcept (mit Fallback)
    let requiredStaff = site.requiredStaff || 1; // Fallback
    if (securityConcept?.staffRequirements) {
      const staffReqs = securityConcept.staffRequirements as any;
      if (staffReqs?.anzahlMA) {
        requiredStaff = staffReqs.anzahlMA;
      }
    }

    // Berechnung basierend auf assignments (nicht clearances!)
    const assignedStaff = site.assignments.length;
    const coveragePercentage = Math.min(100, Math.round((assignedStaff / requiredStaff) * 100));

    // Status-Logik: OK (>80%), WARNING (50-80%), CRITICAL (<50%)
    let status: 'OK' | 'WARNING' | 'CRITICAL';
    if (coveragePercentage >= 80) {
      status = 'OK';
    } else if (coveragePercentage >= 50) {
      status = 'WARNING';
    } else {
      status = 'CRITICAL';
    }

    // Breakdown nach Rollen - nutze taskProfiles aus SecurityConcept falls vorhanden
    const taskProfiles = securityConcept?.taskProfiles ? (securityConcept.taskProfiles as any) : null;
    let requiredObjektleiter = 1; // Default
    let requiredSchichtleiter = Math.max(1, Math.ceil(requiredStaff * 0.3)); // Default: ~30%
    let requiredMitarbeiter = Math.max(0, requiredStaff - requiredObjektleiter - requiredSchichtleiter);

    // Override mit taskProfiles wenn definiert
    if (taskProfiles) {
      if (taskProfiles.objektleiter?.required !== undefined) {
        requiredObjektleiter = taskProfiles.objektleiter.required ? 1 : 0;
      }
      if (taskProfiles.schichtleiter?.required !== undefined) {
        requiredSchichtleiter = taskProfiles.schichtleiter.required ? Math.max(1, Math.ceil(requiredStaff * 0.3)) : 0;
      }
      requiredMitarbeiter = Math.max(0, requiredStaff - requiredObjektleiter - requiredSchichtleiter);
    }

    const assignedObjektleiter = site.assignments.filter((a) => a.role === 'OBJEKTLEITER').length;
    const assignedSchichtleiter = site.assignments.filter((a) => a.role === 'SCHICHTLEITER').length;
    const assignedMitarbeiter = site.assignments.filter((a) => a.role === 'MITARBEITER').length;

    const breakdown = [
      {
        role: 'OBJEKTLEITER',
        required: requiredObjektleiter,
        assigned: assignedObjektleiter,
        percentage: Math.min(100, Math.round((assignedObjektleiter / requiredObjektleiter) * 100)),
      },
      {
        role: 'SCHICHTLEITER',
        required: requiredSchichtleiter,
        assigned: assignedSchichtleiter,
        percentage: requiredSchichtleiter > 0
          ? Math.min(100, Math.round((assignedSchichtleiter / requiredSchichtleiter) * 100))
          : 0,
      },
      {
        role: 'MITARBEITER',
        required: requiredMitarbeiter,
        assigned: assignedMitarbeiter,
        percentage: requiredMitarbeiter > 0
          ? Math.min(100, Math.round((assignedMitarbeiter / requiredMitarbeiter) * 100))
          : 0,
      },
    ];

    res.json({
      success: true,
      data: {
        siteId: id,
        siteName: site.name,
        requiredStaff,
        assignedStaff,
        coveragePercentage,
        status,
        breakdown,
        // Legacy-Felder für Abwärtskompatibilität
        activeClearances: site.clearances.length,
        coveragePercent: coveragePercentage, // Deprecated: Nutze coveragePercentage
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/check-qualification - Qualifikations-Abgleich für User
export const checkUserQualification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId ist erforderlich' });
      return;
    }

    // Site mit erforderlichen Qualifikationen laden
    const site = await prisma.site.findUnique({
      where: { id },
      select: { id: true, name: true, requiredQualifications: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // User mit Qualifikationen laden
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

    // Abgleich: Welche Qualifikationen hat der User, welche fehlen?
    const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
    const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

    // Status bestimmen
    let status: 'FULL' | 'PARTIAL' | 'NONE';
    if (requiredQualifications.length === 0) {
      // Keine Qualifikationen erforderlich
      status = 'FULL';
    } else if (missingQualifications.length === 0) {
      // Alle Qualifikationen vorhanden
      status = 'FULL';
    } else if (hasQualifications.length > 0) {
      // Teilweise Qualifikationen vorhanden
      status = 'PARTIAL';
    } else {
      // Keine der erforderlichen Qualifikationen vorhanden
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
        allowOverride: status !== 'FULL', // Override möglich wenn nicht alle Qualifikationen vorhanden
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:id/assignment-candidates - Intelligente MA-Vorschläge für Zuweisung
export const getAssignmentCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.query.role as string | undefined;

    // Site laden
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

    // Alle aktiven Mitarbeiter laden (außer bereits zugewiesene)
    const candidates = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: assignedUserIds },
        ...(role && { role: role as any }),
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

    // Scoring für jeden Kandidaten
    const scoredCandidates = candidates.map((user) => {
      const userQualifications = user.qualifications || [];

      const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
      const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

      // Qualifikations-Score (0-50%)
      const qualificationScore = requiredQualifications.length > 0
        ? (hasQualifications.length / requiredQualifications.length) * 50
        : 50;

      // Clearance-Score (0-30%)
      const clearance = site.clearances.find((c) => c.userId === user.id);
      let clearanceScore = 0;
      if (clearance) {
        clearanceScore = clearance.status === 'ACTIVE' ? 30 : 15; // ACTIVE = 30%, TRAINING = 15%
      }

      // Verfügbarkeits-Score (0-20%) - Placeholder: Immer 20%
      const availabilityScore = 20;

      // Gesamt-Score (0-100%)
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

    // Sortieren nach Score (höchste zuerst)
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

// POST /api/sites/:id/generate-shifts - Schichten generieren
export const generateShiftsForSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, daysAhead = 30 } = req.body;

    // Site laden
    const site = await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        requiredStaff: true,
        requiredQualifications: true,
        securityConcept: true, // Legacy JSON-Feld
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // Versuche zuerst das neueste aktive Sicherheitskonzept aus der Tabelle zu laden
    let securityConceptData: any = null;
    const activeConceptFromDB = await prisma.securityConcept.findFirst({
      where: {
        siteId: id,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeConceptFromDB && activeConceptFromDB.shiftModel) {
      // Neues System: Nutze SecurityConcept aus Tabelle
      securityConceptData = {
        shiftModel: activeConceptFromDB.shiftModel,
      };
    } else if (site.securityConcept) {
      // Fallback: Legacy JSON-Feld (für Abwärtskompatibilität)
      securityConceptData = site.securityConcept as any;
    }

    // Sicherheitskonzept prüfen
    if (!securityConceptData || !securityConceptData.shiftModel) {
      res.status(400).json({
        success: false,
        message: 'Kein aktives Sicherheitskonzept mit Schichtmodell vorhanden. Bitte erstellen Sie zuerst ein Sicherheitskonzept.',
      });
      return;
    }

    // Dynamischer Import von shiftGenerator
    const { generateShifts, getShiftGenerationStats } = await import('../utils/shiftGenerator');

    // Start-Datum validieren und parsen (immer auf Mitternacht setzen)
    let start: Date;
    if (startDate) {
      start = new Date(startDate);
    } else {
      // Kein Start-Datum angegeben → Heute um Mitternacht
      start = new Date();
      start.setHours(0, 0, 0, 0);
    }

    if (isNaN(start.getTime())) {
      res.status(400).json({ success: false, message: 'Ungültiges Start-Datum' });
      return;
    }

    // Stelle sicher dass Start-Zeit immer Mitternacht ist für konsistente Duplikat-Prüfung
    start.setHours(0, 0, 0, 0);

    // Schichtmodell extrahieren (neues Format: { model: "3-SHIFT", ... } oder legacy: "3-SHIFT")
    let shiftModelId: string;
    let shiftModelData: any = null;

    if (typeof securityConceptData.shiftModel === 'object' && securityConceptData.shiftModel !== null) {
      // Neues Format: { model: "3-SHIFT", hoursPerWeek: 168, shifts: [...] }
      shiftModelData = securityConceptData.shiftModel;
      shiftModelId = shiftModelData.model || '3-SHIFT';
    } else if (typeof securityConceptData.shiftModel === 'string') {
      // Legacy Format: "3-SHIFT"
      shiftModelId = securityConceptData.shiftModel;
    } else {
      // Fallback
      shiftModelId = '3-SHIFT';
    }

    // Personal-Anforderungen aus SecurityConcept (SINGLE SOURCE OF TRUTH)
    let requiredStaffTotal = site.requiredStaff || 1; // Fallback
    let requiredQualifications = site.requiredQualifications || [];

    if (securityConceptData.staffRequirements) {
      // staffRequirements: { anzahlMA, qualifikationen }
      requiredStaffTotal = securityConceptData.staffRequirements.anzahlMA || requiredStaffTotal;
      requiredQualifications = securityConceptData.staffRequirements.qualifikationen || requiredQualifications;
    }

    // Schichten generieren
    const shiftsData = generateShifts({
      siteId: site.id,
      siteName: site.name,
      shiftModel: shiftModelId,
      requiredStaff: requiredStaffTotal,
      requiredQualifications: requiredQualifications,
      startDate: start,
      daysAhead: Math.min(Math.max(daysAhead, 1), 90), // Max 90 Tage
      shiftModelData: shiftModelData, // Übergebe die kompletten Shift-Definitionen
    });

    // Prüfe welche Schichten bereits existieren (manuelle Duplikat-Prüfung)
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + Math.min(Math.max(daysAhead, 1), 90));

    const existingShifts = await prisma.shift.findMany({
      where: {
        siteId: site.id,
        startTime: {
          gte: start,
          lt: endDate,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true,
      },
    });

    // Erstelle Set für schnelle Duplikat-Prüfung
    // Duplikat = gleiche siteId + startTime + endTime + title
    const existingShiftKeys = new Set(
      existingShifts.map((shift) =>
        `${shift.startTime.toISOString()}_${shift.endTime.toISOString()}_${shift.title}`
      )
    );

    // Filtere nur neue Schichten (keine Duplikate)
    const newShifts = shiftsData.filter((shift) => {
      const key = `${shift.startTime.toISOString()}_${shift.endTime.toISOString()}_${shift.title}`;
      return !existingShiftKeys.has(key);
    });

    // Nur erstellen wenn es neue Schichten gibt
    let createdCount = 0;
    if (newShifts.length > 0) {
      const result = await prisma.shift.createMany({
        data: newShifts,
      });
      createdCount = result.count;
    }

    // Statistiken
    const stats = getShiftGenerationStats(shiftsData);
    const duplicateCount = shiftsData.length - newShifts.length;

    // Intelligente Nachricht basierend auf Ergebnis
    let message: string;
    let status: number;

    if (createdCount === 0 && existingShifts.length > 0) {
      message = `Keine neuen Schichten erstellt. Für diesen Zeitraum existieren bereits ${existingShifts.length} Schichten. Alle ${shiftsData.length} generierten Schichten sind Duplikate.`;
      status = 200;
    } else if (createdCount === 0) {
      message = 'Keine Schichten erstellt. Bitte überprüfen Sie das Schichtmodell.';
      status = 200;
    } else if (duplicateCount > 0) {
      message = `${createdCount} neue Schichten erstellt. ${duplicateCount} Duplikate wurden übersprungen (bereits vorhanden).`;
      status = 201;
    } else {
      message = `${createdCount} Schichten erfolgreich generiert (basierend auf ${activeConceptFromDB ? 'aktivem Sicherheitskonzept' : 'Legacy-Konzept'})`;
      status = 201;
    }

    res.status(status).json({
      success: true,
      message,
      data: {
        created: createdCount,
        existing: existingShifts.length,
        duplicates: duplicateCount,
        attempted: shiftsData.length,
        stats,
        template: securityConceptData.shiftModel,
        source: activeConceptFromDB ? 'security_concept_table' : 'legacy_json',
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unbekanntes Schichtmodell')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

// GET /api/sites/:id/control-round-suggestions - Intelligente Kontrollgang-Vorschläge
export const getControlRoundSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Service dynamisch importieren
    const { generateControlRoundSuggestions } = await import('../services/controlRoundSuggestionService');

    const suggestions = await generateControlRoundSuggestions(id);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    if (error.message?.includes('nicht gefunden')) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    logger.error('Error in getControlRoundSuggestions:', error);
    next(error);
  }
};
