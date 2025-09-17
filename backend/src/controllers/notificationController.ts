import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendEmail } from '../services/emailService';
import { sendPushToUsers } from '../services/pushService';
import { renderEmailTemplate, renderPushTemplate } from '../services/templateService';
import {
  getNotificationTemplate,
  listNotificationTemplates as listNotificationTemplateMeta,
} from '../config/notificationTemplates';
import {
  NotificationChannel,
  registerNotificationStream,
  unregisterNotificationStream,
} from '../utils/notificationEvents';
import { recordAuditEvent } from '../utils/auditTrail';

function parseChannel(input?: string): NotificationChannel {
  if (input && input.toLowerCase() === 'push') return 'push';
  return 'email';
}

function parseListParam(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(',')).map((entry) => entry.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return undefined;
}

export const sendTestNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      recipient,
      title,
      body,
      channel: rawChannel = 'email',
      templateKey,
      variables = {},
      userIds,
    } = req.body;
    const channel = parseChannel(rawChannel);

    if (templateKey) {
      const templateMeta = getNotificationTemplate(channel, templateKey);
      if (!templateMeta) {
        return res.status(404).json({ success: false, message: 'Unbekanntes Template.' });
      }
      if (!templateMeta.enabled) {
        return res
          .status(409)
          .json({ success: false, message: `Template ${templateKey} ist durch Feature-Flag deaktiviert.` });
      }
    }

    if (channel === 'email') {
      if (!recipient || typeof recipient !== 'string') {
        return res.status(422).json({ success: false, message: 'E-Mail-Empfänger wird benötigt.' });
      }
      let subject: string | undefined = typeof title === 'string' ? title : undefined;
      let textContent: string | undefined = typeof body === 'string' ? body : undefined;
      let htmlContent: string | undefined;
      if (templateKey) {
        const template = renderEmailTemplate(templateKey, variables || {});
        if (!template) {
          return res
            .status(409)
            .json({ success: false, message: `Template ${templateKey} konnte nicht gerendert werden.` });
        }
        subject = template.subject || subject || `Benachrichtigung (${templateKey})`;
        textContent = template.text || textContent;
        htmlContent = template.html;
      }
      if (!subject || (!textContent && !htmlContent)) {
        return res
          .status(422)
          .json({ success: false, message: 'Betreff und Inhalt werden für E-Mail-Benachrichtigungen benötigt.' });
      }
      await sendEmail(recipient, subject, textContent, htmlContent, {
        template: templateKey,
        context: variables || {},
        reason: 'test',
      });
      return res.json({ success: true, message: 'Test-Benachrichtigung gesendet', data: { channel, template: templateKey } });
    }

    // Push-Test
    const ids = Array.isArray(userIds) ? userIds.filter((id: unknown) => typeof id === 'string' && id) : [];
    if (!ids.length) {
      return res.status(422).json({ success: false, message: 'Für Push-Benachrichtigungen wird eine userIds-Liste benötigt.' });
    }
    let pushTitle: string | undefined = typeof title === 'string' ? title : undefined;
    let pushBody: string | undefined = typeof body === 'string' ? body : undefined;
    if (templateKey) {
      const template = renderPushTemplate(templateKey, variables || {});
      if (!template) {
        return res
          .status(409)
          .json({ success: false, message: `Template ${templateKey} konnte nicht gerendert werden.` });
      }
      pushTitle = template.title || pushTitle;
      pushBody = template.body || pushBody;
    }
    if (!pushTitle || !pushBody) {
      return res
        .status(422)
        .json({ success: false, message: 'Titel und Text werden für Push-Benachrichtigungen benötigt.' });
    }
    await sendPushToUsers(ids, pushTitle, pushBody, {
      template: templateKey,
      context: variables || {},
      reason: 'test',
    });
    return res.json({ success: true, message: 'Test-Benachrichtigung gesendet', data: { channel, template: templateKey } });
  } catch (err) {
    return next(err);
  }
};

export const listNotificationTemplates = (req: Request, res: Response) => {
  const channelParam = parseChannel(typeof req.query.channel === 'string' ? req.query.channel : undefined);
  const templates =
    typeof req.query.channel === 'string'
      ? listNotificationTemplateMeta(channelParam)
      : listNotificationTemplateMeta();
  res.json({ success: true, data: templates });
};

export const getMyNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentifizierung erforderlich.' });
    }
    const data = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailOptIn: true, pushOptIn: true },
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

export const updateMyNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      await recordAuditEvent(req, {
        action: 'NOTIFICATION.PREFERENCES.UPDATE',
        resourceType: 'NOTIFICATION_PREFERENCE',
        resourceId: null,
        outcome: 'DENIED',
        data: { reason: 'UNAUTHENTICATED' },
      });
      return res.status(401).json({ success: false, message: 'Authentifizierung erforderlich.' });
    }
    const updates: Record<string, boolean> = {};
    if (typeof req.body.emailOptIn === 'boolean') updates.emailOptIn = req.body.emailOptIn;
    if (typeof req.body.pushOptIn === 'boolean') updates.pushOptIn = req.body.pushOptIn;
    if (!Object.keys(updates).length) {
      await recordAuditEvent(req, {
        action: 'NOTIFICATION.PREFERENCES.UPDATE',
        resourceType: 'NOTIFICATION_PREFERENCE',
        resourceId: req.user.id,
        outcome: 'DENIED',
        data: { reason: 'NO_VALID_FIELDS' },
      });
      return res.status(400).json({ success: false, message: 'Keine gültigen Felder zum Aktualisieren gefunden.' });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: { emailOptIn: true, pushOptIn: true },
    });
    await recordAuditEvent(req, {
      action: 'NOTIFICATION.PREFERENCES.UPDATE',
      resourceType: 'NOTIFICATION_PREFERENCE',
      resourceId: req.user.id,
      outcome: 'SUCCESS',
      data: updates,
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    await recordAuditEvent(req, {
      action: 'NOTIFICATION.PREFERENCES.UPDATE',
      resourceType: 'NOTIFICATION_PREFERENCE',
      resourceId: req.user?.id ?? null,
      outcome: 'ERROR',
      data: { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' },
    });
    return next(err);
  }
};

export const streamNotificationEvents = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentifizierung erforderlich.' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const channelFilter = parseListParam(req.query.channel ?? req.query.channels);
    const statusFilter = parseListParam(req.query.status ?? req.query.statuses);
    const templateFilter = parseListParam(req.query.template ?? req.query.templates);

    const client = registerNotificationStream(res, {
      userId: req.user.id,
      roles: [req.user.role],
      channels: channelFilter,
      statuses: statusFilter,
      templates: templateFilter,
    });

    res.write(`event: connected\n`);
    res.write(
      `data: ${JSON.stringify({ clientId: client.id, connectedAt: new Date().toISOString(), filters: {
        channels: channelFilter,
        statuses: statusFilter,
        templates: templateFilter,
      } })}\n\n`,
    );

    const heartbeatMs = Math.max(parseInt(String(process.env.NOTIFY_EVENTS_HEARTBEAT_MS || '15000'), 10) || 15000, 5000);
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': ping\n\n');
      }
    }, heartbeatMs);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregisterNotificationStream(client.id);
    });
  } catch (err) {
    next(err);
  }
};
