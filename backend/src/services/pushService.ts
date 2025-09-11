import logger from '../utils/logger';
import prisma from '../utils/prisma';
import { incrPushSuccess, incrPushFail } from '../utils/notifyStats';

let firebase: any | null = null;

function isFCMConfigured(): boolean {
  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY;
  return !!(projectId && clientEmail && privateKey);
}

function initFCM() {
  if (firebase || !isFCMConfigured()) return;
  try {
    // Lazy import to avoid dependency in tests if not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
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

export async function sendPushToUsers(userIds: string[], title: string, body: string) {
  const tokens = await getActiveTokens(userIds);
  if (!tokens.length) {
    logger.info('PUSH: keine aktiven Tokens gefunden für Nutzer %o', userIds);
    return { success: true, count: 0 };
  }

  if (!isFCMConfigured()) {
    logger.info('PUSH (mock, ohne FCM): tokens=%d title=%s body=%s', tokens.length, title, body);
    incrPushSuccess(tokens.length);
    return { success: true, count: tokens.length };
  }
  initFCM();
  if (!firebase) return { success: false, count: 0 };

  try {
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
    incrPushSuccess(tokens.length - (resp.failureCount || 0));
    if ((resp.failureCount || 0) > 0) incrPushFail();
    return { success: true, count: tokens.length, result: resp }; 
  } catch (err) {
    logger.error('PUSH Fehler: %o', err);
    incrPushFail();
    return { success: false, count: 0 };
  }
}
