import logger from '../utils/logger';
import prisma from '../utils/prisma';
import { incrPushSuccess, incrPushFail } from '../utils/notifyStats';
import {
  queueJobEnqueued,
  queueJobFailed,
  queueJobStarted,
  queueJobSucceeded,
} from '../utils/queueStats';
import { publishNotificationEvent } from '../utils/notificationEvents';

let firebase: any | null = null;

function isFCMConfigured(): boolean {
  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY;
  return !!(projectId && clientEmail && privateKey);
}

async function initFCM(): Promise<void> {
  if (firebase || !isFCMConfigured()) return;
  try {
    const adminModule = (await import('firebase-admin')) as { default?: any };
    const admin = adminModule.default ?? adminModule;
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        privateKey: (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
    firebase = admin;
    logger.info('FCM initialisiert (projectId=%s)', process.env.FCM_PROJECT_ID);
  } catch (err) {
    logger.warn('FCM konnte nicht initialisiert werden: %o', err);
  }
}


async function getActiveTokens(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const tokens = (await (prisma as any).deviceToken.findMany({
    where: {
      userId: { in: userIds },
      isActive: true,
      notificationsEnabled: true,
      user: { pushOptIn: true },
    },
    select: { token: true },
  })) || [];
  return (tokens as any[]).map((t: any) => t.token);
}

type PushSendOptions = {
  template?: string;
  context?: Record<string, unknown>;
  reason?: string;
};

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  options: PushSendOptions = {},
) {
  const queueName = 'notifications-push';
  queueJobEnqueued(queueName);
  queueJobStarted(queueName);
  try {
    const tokens = await getActiveTokens(userIds);
    if (!tokens.length) {
      logger.info('PUSH: keine aktiven Tokens gefunden für Nutzer %o', userIds);
      incrPushSuccess(0);
      queueJobSucceeded(queueName);
      publishNotificationEvent({
        channel: 'push',
        status: 'sent',
        template: options.template,
        userIds,
        title,
        body,
        metadata: {
          delivered: 0,
          reason: options.reason || 'custom',
          ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
        },
      });
      return { success: true, count: 0 };
    }

    if (!isFCMConfigured()) {
      logger.info('PUSH (mock, ohne FCM): tokens=%d title=%s body=%s', tokens.length, title, body);
      incrPushSuccess(tokens.length);
      queueJobSucceeded(queueName);
      publishNotificationEvent({
        channel: 'push',
        status: 'sent',
        template: options.template,
        userIds,
        title,
        body,
        metadata: {
          delivered: tokens.length,
          mode: 'mock',
          reason: options.reason || 'custom',
          ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
        },
      });
      return { success: true, count: tokens.length };
    }
    await initFCM();
    if (!firebase) {
      throw new Error('FCM konnte nicht initialisiert werden');
    }

    const resp = await firebase.messaging().sendEachForMulticast({ tokens, notification: { title, body } });
    // Optional: inaktive Tokens gezielt deaktivieren
    if (resp.failureCount > 0 && Array.isArray(resp.responses)) {
      const toDisable: string[] = [];
      resp.responses.forEach((r: any, idx: number) => {
        if (!r.success && r.error && typeof r.error.code === 'string') {
          const code: string = r.error.code;
          if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
            toDisable.push(tokens[idx]);
          }
        }
      });
      if (toDisable.length) {
        await (prisma as any).deviceToken.updateMany({ where: { token: { in: toDisable } }, data: { isActive: false } });
        logger.warn('PUSH: %d ungültige Tokens deaktiviert', toDisable.length);
      }
    }
    const failureCount = Math.max(0, resp.failureCount ?? 0);
    const deliveredCount = Math.max(0, tokens.length - failureCount);
    incrPushSuccess(deliveredCount);
    if (failureCount > 0) incrPushFail(undefined, failureCount);
    queueJobSucceeded(queueName);
    publishNotificationEvent({
      channel: 'push',
      status: 'sent',
      template: options.template,
      userIds,
      title,
      body,
      metadata: {
        delivered: deliveredCount,
        failed: failureCount,
        reason: options.reason || 'custom',
        ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
      },
    });
    return { success: true, count: tokens.length, result: resp };
  } catch (err) {
    logger.error('PUSH Fehler: %o', err);
    incrPushFail(err);
    queueJobFailed(queueName, err);
    publishNotificationEvent({
      channel: 'push',
      status: 'failed',
      template: options.template,
      userIds,
      title,
      body,
      metadata: {
        reason: options.reason || 'custom',
        ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
      },
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, count: 0 };
  }
}
