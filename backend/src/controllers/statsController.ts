import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/stats/critical-incidents - Kritische Vorfälle für Dashboard
export const getCriticalIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 7;

    // Zeitfilter: letzte X Tage
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const incidents = await prisma.siteIncident.findMany({
      where: {
        severity: {
          in: ['CRITICAL', 'HIGH'],
        },
        occurredAt: {
          gte: dateThreshold,
        },
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: limit,
    });

    const summary = {
      total: incidents.length,
      critical: incidents.filter((i) => i.severity === 'CRITICAL').length,
      high: incidents.filter((i) => i.severity === 'HIGH').length,
      open: incidents.filter((i) => i.status === 'OPEN').length,
      inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
    };

    res.json({
      success: true,
      data: {
        incidents,
        summary,
        period: { days, from: dateThreshold, to: new Date() },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/incidents-by-site - Vorfälle gruppiert nach Objekten
export const getIncidentsBySite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const incidents = await prisma.siteIncident.groupBy({
      by: ['siteId', 'severity', 'status'],
      where: {
        occurredAt: {
          gte: dateThreshold,
        },
      },
      _count: true,
    });

    // Sites mit Details abrufen
    const siteIds = [...new Set(incidents.map((i) => i.siteId))];
    const sites = await prisma.site.findMany({
      where: {
        id: {
          in: siteIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Gruppiere Ergebnisse nach Site
    const result = sites.map((site) => {
      const siteIncidents = incidents.filter((i) => i.siteId === site.id);
      return {
        site,
        total: siteIncidents.reduce((sum, i) => sum + i._count, 0),
        critical: siteIncidents.filter((i) => i.severity === 'CRITICAL').reduce((sum, i) => sum + i._count, 0),
        high: siteIncidents.filter((i) => i.severity === 'HIGH').reduce((sum, i) => sum + i._count, 0),
        open: siteIncidents.filter((i) => i.status === 'OPEN').reduce((sum, i) => sum + i._count, 0),
        resolved: siteIncidents.filter((i) => i.status === 'RESOLVED').reduce((sum, i) => sum + i._count, 0),
      };
    });

    // Sortiere nach Anzahl (kritischste zuerst)
    result.sort((a, b) => b.critical - a.critical || b.total - a.total);

    res.json({
      success: true,
      data: result,
      period: { days, from: dateThreshold, to: new Date() },
    });
  } catch (error) {
    next(error);
  }
};
