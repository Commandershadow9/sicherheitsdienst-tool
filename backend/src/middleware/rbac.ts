import type { RequestHandler } from 'express';
import { authorize } from './auth';

// RBAC guard for Notifications: allow only ADMIN and MANAGER
export const notificationsRBAC: RequestHandler = authorize('ADMIN', 'MANAGER');

