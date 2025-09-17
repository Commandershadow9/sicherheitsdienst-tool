import type { RequestHandler } from 'express';
import { authorize } from './auth';

// Allgemeiner Helper: requireRole([...])
export function requireRole(roles: string[]): RequestHandler {
  return authorize(...roles);
}

// RBAC guard for Notifications: allow only ADMIN and MANAGER
export const notificationsRBAC: RequestHandler = requireRole(['ADMIN', 'MANAGER']);

// Notification event stream: allow ADMIN, MANAGER, DISPATCHER
export const notificationStreamRBAC: RequestHandler = requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']);
