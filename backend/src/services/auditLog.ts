import { PrismaClient } from '@prisma/client';
import type { Request } from 'express';

const prisma = new PrismaClient();

/**
 * Audit-Log Service
 * Protokolliert sicherheitsrelevante Aktionen für Compliance und Forensik
 */

export enum AuditAction {
  // Authentifizierung
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password.reset.complete',
  TOKEN_REFRESH = 'auth.token.refresh',

  // User Management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_ACTIVATE = 'user.activate',
  USER_DEACTIVATE = 'user.deactivate',
  USER_ROLE_CHANGE = 'user.role.change',

  // Sensible Daten
  EMPLOYEE_DATA_ACCESS = 'employee.data.access',
  EMPLOYEE_DATA_EXPORT = 'employee.data.export',
  PAYROLL_ACCESS = 'payroll.access',
  DOCUMENT_UPLOAD = 'document.upload',
  DOCUMENT_DELETE = 'document.delete',

  // Shift Management
  SHIFT_CREATE = 'shift.create',
  SHIFT_UPDATE = 'shift.update',
  SHIFT_DELETE = 'shift.delete',
  SHIFT_ASSIGN = 'shift.assign',

  // Critical Operations
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',
  SITE_CREATE = 'site.create',
  SITE_UPDATE = 'site.update',
  SITE_DELETE = 'site.delete',

  // DSGVO
  DATA_EXPORT_REQUESTED = 'dsgvo.export.requested',
  DATA_DELETE_REQUESTED = 'dsgvo.delete.requested',

  // System
  SYSTEM_CONFIG_CHANGE = 'system.config.change',
  SYSTEM_ERROR = 'system.error',
}

export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

interface AuditLogParams {
  action: AuditAction | string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  actorRole?: string;
  actorIp?: string;
  data?: any;
  outcome?: AuditOutcome;
  requestId?: string;
  userAgent?: string;
}

interface AuditLogFromRequestParams {
  req: Request;
  action: AuditAction | string;
  resourceType: string;
  resourceId?: string;
  data?: any;
  outcome?: AuditOutcome;
}

/**
 * Erstellt einen Audit-Log-Eintrag
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        actorId: params.actorId,
        actorRole: params.actorRole,
        actorIp: params.actorIp,
        data: params.data || {},
        outcome: params.outcome || AuditOutcome.SUCCESS,
        requestId: params.requestId,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Fehler beim Audit-Logging sollten nicht die Hauptoperation blockieren
    console.error('[AUDIT-LOG] Failed to create audit log:', error);
  }
}

/**
 * Extrahiert IP-Adresse aus Request
 */
function extractIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const firstForwarded = xff.split(',')[0]?.trim();
  return firstForwarded || (req.ip as string) || 'unknown';
}

/**
 * Erstellt Audit-Log aus Express Request
 */
export async function logFromRequest(params: AuditLogFromRequestParams) {
  const { req, action, resourceType, resourceId, data, outcome } = params;

  // Extrahiere User-Info aus req.user (falls vorhanden durch auth-Middleware)
  const user = (req as any).user;

  await createAuditLog({
    action,
    resourceType,
    resourceId,
    actorId: user?.userId,
    actorRole: user?.role,
    actorIp: extractIp(req),
    data,
    outcome,
    requestId: (req as any).id, // Falls request-ID-Middleware vorhanden
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log Login-Versuch (Erfolg oder Fehler)
 */
export async function logLogin(params: {
  email: string;
  userId?: string;
  success: boolean;
  ip: string;
  userAgent?: string;
  reason?: string;
}) {
  await createAuditLog({
    action: params.success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
    resourceType: 'User',
    resourceId: params.userId,
    actorId: params.userId,
    actorIp: params.ip,
    userAgent: params.userAgent,
    data: {
      email: params.email,
      reason: params.reason,
    },
    outcome: params.success ? AuditOutcome.SUCCESS : AuditOutcome.FAILURE,
  });
}

/**
 * Log Logout
 */
export async function logLogout(params: {
  userId: string;
  ip: string;
  userAgent?: string;
}) {
  await createAuditLog({
    action: AuditAction.LOGOUT,
    resourceType: 'User',
    resourceId: params.userId,
    actorId: params.userId,
    actorIp: params.ip,
    userAgent: params.userAgent,
    outcome: AuditOutcome.SUCCESS,
  });
}

/**
 * Log Datenänderung mit Diff
 */
export async function logDataChange(params: {
  req: Request;
  action: AuditAction | string;
  resourceType: string;
  resourceId: string;
  oldData?: any;
  newData?: any;
}) {
  const { req, action, resourceType, resourceId, oldData, newData } = params;

  // Erstelle Diff
  const changes: any = {};
  if (oldData && newData) {
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }
  }

  await logFromRequest({
    req,
    action,
    resourceType,
    resourceId,
    data: {
      changes,
      oldData: oldData ? sanitizeData(oldData) : undefined,
      newData: newData ? sanitizeData(newData) : undefined,
    },
  });
}

/**
 * Entfernt sensible Daten aus Log-Einträgen (Passwörter, Tokens, etc.)
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'apiKey',
    'privateKey',
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Query Audit Logs (für Admin-Dashboard)
 */
export async function queryAuditLogs(params: {
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    actorId,
    resourceType,
    resourceId,
    action,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = params;

  const where: any = {};

  if (actorId) where.actorId = actorId;
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;
  if (action) where.action = action;

  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) where.occurredAt.gte = startDate;
    if (endDate) where.occurredAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export default {
  createAuditLog,
  logFromRequest,
  logLogin,
  logLogout,
  logDataChange,
  queryAuditLogs,
  AuditAction,
  AuditOutcome,
};
