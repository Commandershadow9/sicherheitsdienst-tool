import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendCriticalIncidentEmail } from '../services/emailService';
import { sendPushToUsers } from '../services/pushService';
import logger from '../utils/logger';

// Helper: Erstelle History-Eintrag
async function createHistoryEntry(
  incidentId: string,
  userId: string,
  action: 'CREATED' | 'UPDATED' | 'RESOLVED' | 'STATUS_CHANGED',
  changes?: Record<string, { old: any; new: any }>,
  note?: string
) {
  await prisma.incidentHistory.create({
    data: {
      incidentId,
      userId,
      action,
      changes: changes ? JSON.stringify(changes) : undefined,
      note,
    },
  });
}

// GET /api/sites/:siteId/incidents - Alle Incidents eines Objekts
export const getSiteIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const category = req.query.category as any;
    const status = req.query.status as any;
    const severity = req.query.severity as any;

    const incidents = await prisma.siteIncident.findMany({
      where: {
        siteId,
        ...(category && { category }),
        ...(status && { status }),
        ...(severity && { severity }),
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
        shift: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            assignments: {
              select: {
                id: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });

    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/incidents/:id - Ein spezifischer Incident
export const getIncidentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const incident = await prisma.siteIncident.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        site: { select: { id: true, name: true, address: true } },
        shift: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            assignments: {
              select: {
                id: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/incidents - Incident erstellen
export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const { title, description, category, severity, occurredAt, location, involvedPersons } = req.body;
    const reportedBy = req.user?.id;

    if (!reportedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    // Validierung
    if (!title || !category || !severity || !occurredAt) {
      res.status(400).json({ success: false, message: 'Pflichtfelder fehlen: title, category, severity, occurredAt' });
      return;
    }

    // Validierung von involvedPersons (wenn bereitgestellt)
    if (involvedPersons) {
      try {
        const parsed = JSON.parse(involvedPersons);
        if (!Array.isArray(parsed)) {
          res.status(400).json({ success: false, message: 'involvedPersons muss ein JSON-Array sein' });
          return;
        }
        // Prüfe ob jedes Element mindestens ein name-Feld hat
        for (const person of parsed) {
          if (!person.name || typeof person.name !== 'string' || person.name.trim() === '') {
            res.status(400).json({ success: false, message: 'Jede beteiligte Person muss ein name-Feld haben' });
            return;
          }
        }
      } catch (error) {
        res.status(400).json({ success: false, message: 'involvedPersons muss ein gültiger JSON-String sein' });
        return;
      }
    }

    const incident = await prisma.siteIncident.create({
      data: {
        siteId,
        title,
        description,
        category,
        severity,
        occurredAt: new Date(occurredAt),
        location,
        involvedPersons,
        reportedBy,
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    // History-Eintrag erstellen
    await createHistoryEntry(incident.id, reportedBy, 'CREATED');

    // Benachrichtigungen für CRITICAL/HIGH Vorfälle (fire and forget)
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      (async () => {
        try {
          // Hole alle ADMIN und MANAGER mit emailOptIn
          const recipients = await prisma.user.findMany({
            where: {
              role: { in: ['ADMIN', 'MANAGER'] },
              emailOptIn: true,
              isActive: true,
            },
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          });

          // Sende Emails an alle Empfänger
          const reporterName = `${incident.reporter.firstName} ${incident.reporter.lastName}`;
          for (const recipient of recipients) {
            try {
              await sendCriticalIncidentEmail(
                recipient.email,
                title,
                incident.site.name,
                severity as 'CRITICAL' | 'HIGH',
                reporterName,
                new Date(occurredAt),
                siteId
              );
              logger.info('Critical incident email sent to %s', recipient.email);
            } catch (emailErr) {
              logger.error('Failed to send critical incident email to %s: %o', recipient.email, emailErr);
            }
          }

          // Sende Push-Notifications
          if (recipients.length > 0) {
            try {
              // Hole User-IDs für Push
              const userIds = await prisma.user.findMany({
                where: {
                  role: { in: ['ADMIN', 'MANAGER'] },
                  pushOptIn: true,
                  isActive: true,
                },
                select: { id: true },
              });

              const severityLabel = severity === 'CRITICAL' ? 'KRITISCH' : 'HOCH';
              await sendPushToUsers(
                userIds.map((u) => u.id),
                `🚨 ${severityLabel}: ${title}`,
                `${incident.site.name} • ${reporterName}`,
                {
                  template: 'critical-incident',
                  context: { incidentTitle: title, siteName: incident.site.name, severity: severityLabel },
                  reason: 'critical-incident',
                }
              );
              logger.info('Critical incident push notifications sent to %d users', userIds.length);
            } catch (pushErr) {
              logger.error('Failed to send critical incident push notifications: %o', pushErr);
            }
          }
        } catch (notifyErr) {
          logger.error('Failed to send critical incident notifications: %o', notifyErr);
        }
      })();
    }

    res.status(201).json({ success: true, message: 'Vorfall erfolgreich gemeldet', data: incident });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/incidents/:id - Incident aktualisieren
export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, siteId } = req.params;
    const { title, description, category, severity, occurredAt, location, involvedPersons, status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const incident = await prisma.siteIncident.findUnique({
      where: { id },
      include: { site: { include: { assignments: true } } }
    });

    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    // Ownership/RBAC Check
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const isReporter = incident.reportedBy === userId;
    const createdAt = new Date(incident.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const within24Hours = hoursSinceCreation < 24;

    // Prüfe ob User Objektleiter oder Schichtleiter ist
    const isObjectLeader = incident.site.assignments?.some(
      (a: any) => a.userId === userId && (a.role === 'OBJECT_LEADER' || a.role === 'SHIFT_LEADER')
    );

    // Erlaubnis prüfen
    const canEdit = isAdmin || isManager || isObjectLeader || (isReporter && within24Hours);

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: isReporter
          ? 'Sie können diesen Vorfall nur innerhalb von 24 Stunden nach Erstellung bearbeiten'
          : 'Sie haben keine Berechtigung, diesen Vorfall zu bearbeiten'
      });
      return;
    }

    // Validierung von involvedPersons (wenn bereitgestellt)
    if (involvedPersons !== undefined && involvedPersons !== null) {
      try {
        const parsed = JSON.parse(involvedPersons);
        if (!Array.isArray(parsed)) {
          res.status(400).json({ success: false, message: 'involvedPersons muss ein JSON-Array sein' });
          return;
        }
        // Prüfe ob jedes Element mindestens ein name-Feld hat
        for (const person of parsed) {
          if (!person.name || typeof person.name !== 'string' || person.name.trim() === '') {
            res.status(400).json({ success: false, message: 'Jede beteiligte Person muss ein name-Feld haben' });
            return;
          }
        }
      } catch (error) {
        res.status(400).json({ success: false, message: 'involvedPersons muss ein gültiger JSON-String sein' });
        return;
      }
    }

    // Tracke Änderungen für History
    const changes: Record<string, { old: any; new: any }> = {};
    if (title && title !== incident.title) {
      changes.title = { old: incident.title, new: title };
    }
    if (description !== undefined && description !== incident.description) {
      changes.description = { old: incident.description || '', new: description };
    }
    if (category && category !== incident.category) {
      changes.category = { old: incident.category, new: category };
    }
    if (severity && severity !== incident.severity) {
      changes.severity = { old: incident.severity, new: severity };
    }
    if (occurredAt && new Date(occurredAt).toISOString() !== incident.occurredAt.toISOString()) {
      changes.occurredAt = { old: incident.occurredAt, new: new Date(occurredAt) };
    }
    if (location !== undefined && location !== incident.location) {
      changes.location = { old: incident.location || '', new: location };
    }
    if (involvedPersons !== undefined && involvedPersons !== incident.involvedPersons) {
      changes.involvedPersons = { old: incident.involvedPersons || '', new: involvedPersons };
    }
    if (status && status !== incident.status) {
      changes.status = { old: incident.status, new: status };
    }

    const updated = await prisma.siteIncident.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(severity && { severity }),
        ...(occurredAt && { occurredAt: new Date(occurredAt) }),
        ...(location !== undefined && { location }),
        ...(involvedPersons !== undefined && { involvedPersons }),
        ...(status && { status }),
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    // History-Eintrag erstellen (nur wenn es Änderungen gab)
    if (Object.keys(changes).length > 0) {
      await createHistoryEntry(
        incident.id,
        userId,
        status && status !== incident.status ? 'STATUS_CHANGED' : 'UPDATED',
        changes
      );
    }

    res.json({ success: true, message: 'Vorfall erfolgreich aktualisiert', data: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/incidents/:id/resolve - Incident auflösen
export const resolveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const incident = await prisma.siteIncident.findUnique({
      where: { id },
      include: { site: { include: { assignments: true } } }
    });

    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
      res.status(400).json({ success: false, message: 'Vorfall ist bereits aufgelöst' });
      return;
    }

    // RBAC Check: Nur ADMIN, MANAGER oder Objektleiter/Schichtleiter
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const isObjectLeader = incident.site.assignments?.some(
      (a: any) => a.userId === userId && (a.role === 'OBJECT_LEADER' || a.role === 'SHIFT_LEADER')
    );

    if (!isAdmin && !isManager && !isObjectLeader) {
      res.status(403).json({
        success: false,
        message: 'Nur Administratoren, Manager und Objektleiter können Vorfälle auflösen'
      });
      return;
    }

    const updated = await prisma.siteIncident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution,
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    // History-Eintrag erstellen
    await createHistoryEntry(
      incident.id,
      userId,
      'RESOLVED',
      {
        status: { old: incident.status, new: 'RESOLVED' },
        resolution: { old: null, new: resolution },
      },
      resolution
    );

    res.json({ success: true, message: 'Vorfall erfolgreich aufgelöst', data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/incidents/:id - Incident löschen
export const deleteIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const incident = await prisma.siteIncident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    // RBAC Check: Nur ADMIN oder MANAGER
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';

    if (!isAdmin && !isManager) {
      res.status(403).json({
        success: false,
        message: 'Nur Administratoren und Manager können Vorfälle löschen'
      });
      return;
    }

    await prisma.siteIncident.delete({ where: { id } });

    res.json({ success: true, message: 'Vorfall erfolgreich gelöscht' });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/incidents/:id/history - Historie eines Incidents
export const getIncidentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const history = await prisma.incidentHistory.findMany({
      where: { incidentId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
