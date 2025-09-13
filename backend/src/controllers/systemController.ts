import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { getCounters } from '../utils/stats';
import { getAuthLimitCounters } from '../utils/rateLimitStats';
import { getSpecVersion } from '../utils/specVersion';
import { getNotifyCounters } from '../utils/notifyStats';

// Lightweight health endpoint (no deps)
export const healthz = async (_req: Request, res: Response): Promise<void> => {
  res.json({ status: 'ok' });
};

// Readiness with dependency checks (DB mandatory, SMTP optional)
export const readyz = async (_req: Request, res: Response): Promise<void> => {
  const deps: { db: 'ok' | 'fail'; smtp: 'ok' | 'fail' | 'skip' } = { db: 'ok', smtp: 'skip' };
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    deps.db = 'fail';
    res.status(503).json({ status: 'not-ready', deps });
    return;
  }

  // Optional SMTP check: if enabled and configured, perform a lightweight verify with timeout
  const checkSmtp = String(process.env.READINESS_CHECK_SMTP || 'false').toLowerCase();
  const wantSmtp = !['false','0','off','no'].includes(checkSmtp);
  const smtpConfigured = Boolean(process.env.SMTP_HOST);
  if (wantSmtp && smtpConfigured) {
    const host = process.env.SMTP_HOST as string;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const timeoutMs = Math.max(parseInt(String(process.env.READINESS_SMTP_TIMEOUT_MS || '1500'), 10) || 1500, 0);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
      const verify = async () => {
        await transport.verify();
      };
      await Promise.race([
        verify(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('SMTP readiness timeout')), timeoutMs)),
      ]);
      deps.smtp = 'ok';
    } catch (_e) {
      deps.smtp = 'fail';
    }
  } else {
    deps.smtp = 'skip';
  }
  res.json({ status: 'ready', deps });
};

// GET /api/health - System Health Check
export const healthCheck = async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    // Im Testkontext keine DB-Verbindung erzwingen
    if (process.env.NODE_ENV === 'test') {
      res.json({
        status: 'OK',
        message: 'Sicherheitsdienst-Tool Backend is running (test mode)',
        timestamp: new Date().toISOString(),
        database: 'Skipped',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
      return;
    }
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
      enabled: true,
      perMin: Number(process.env.RATE_LIMIT_MAX || 10),
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
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
        rateLimitAuth: getAuthLimitCounters(),
        features: featureFlags,
        notifications: {
          testRateLimit: rateLimit,
          smtpConfigured: Boolean(process.env.SMTP_HOST),
          pushConfigured,
          counters: getNotifyCounters(),
        },
        authRateLimit,
        auth: authCfg,
        env: {
          nodeEnv: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          specVersion: getSpecVersion(),
          buildSha: process.env.BUILD_SHA || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    next(error);
  }
};
