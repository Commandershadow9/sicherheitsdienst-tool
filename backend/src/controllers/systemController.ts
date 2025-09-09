import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { getCounters } from '../utils/stats';

// GET /api/health - System Health Check
export const healthCheck = async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    // Datenbankverbindung testen
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      message: 'Sicherheitsdienst-Tool Backend is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
    });
  }
};

// GET /api/stats - System Statistics
export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parallele Datenbankabfragen für bessere Performance
    const [totalUsers, activeUsers, totalShifts, upcomingShifts, openIncidents, totalTimeEntries] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.shift.count(),
        prisma.shift.count({
          where: {
            startTime: { gte: new Date() },
            status: { in: ['PLANNED', 'ACTIVE'] },
          },
        }),
        prisma.incident.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        }),
        prisma.timeEntry.count(),
      ]);

    // Feature-/Env-Status ableiten
    const featureFlags = {
      emailNotifyShifts: String(process.env.EMAIL_NOTIFY_SHIFTS || 'false').toLowerCase() === 'true',
      pushNotifyEvents: String(process.env.PUSH_NOTIFY_EVENTS || 'false').toLowerCase() === 'true',
    };
    const rateLimit = {
      enabled: String(process.env.NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED || 'true').toLowerCase() !== 'false',
      perMin: Number(process.env.NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN || 10),
      windowMs: Number(process.env.NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS || 60000),
    };
    const authRateLimit = {
      enabled: String(process.env.AUTH_RATE_LIMIT_ENABLED || 'true').toLowerCase() !== 'false',
      perMin: Number(process.env.AUTH_RATE_LIMIT_PER_MIN || 10),
      windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60000),
    };
    const pushConfigured = Boolean(process.env.FCM_PROJECT_ID && process.env.FCM_CLIENT_EMAIL && process.env.FCM_PRIVATE_KEY);
    const authCfg = {
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '30d',
    };

    res.json({
      success: true,
      message: 'System-Statistiken erfolgreich abgerufen',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        shifts: {
          total: totalShifts,
          upcoming: upcomingShifts,
        },
        incidents: {
          open: openIncidents,
        },
        timeEntries: {
          total: totalTimeEntries,
        },
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
        },
        requests: getCounters(),
        features: featureFlags,
        notifications: {
          testRateLimit: rateLimit,
          smtpConfigured: Boolean(process.env.SMTP_HOST),
          pushConfigured,
        },
        authRateLimit,
        auth: authCfg,
        env: {
          nodeEnv: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    next(error);
  }
};
