import logger from '../utils/logger';
import { incrEmailSuccess, incrEmailFail } from '../utils/notifyStats';
import {
  queueJobEnqueued,
  queueJobFailed,
  queueJobStarted,
  queueJobSucceeded,
} from '../utils/queueStats';
import { renderEmailTemplate } from './templateService';
import { publishNotificationEvent } from '../utils/notificationEvents';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

function getTransport() {
  try {
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    } as any);
  } catch {
    // Fallback-Transport im Test-/Dev-Kontext, wenn nodemailer nicht installiert ist
    return {
      async sendMail() {
        return { messageId: 'dev-mock' };
      },
    };
  }
}

function isTransientError(err: any): boolean {
  const code = (err && (err.code || err?.cause?.code)) as string | undefined;
  const msg = String(err?.message || '').toLowerCase();
  if (process.env.SMTP_TEST_TRANSIENT === 'true') return true;
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    msg.includes('timeout') ||
    msg.includes('temporarily') ||
    msg.includes('temporary')
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type EmailSendOptions = {
  template?: string;
  context?: Record<string, unknown>;
  reason?: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  text?: string,
  html?: string,
  options: EmailSendOptions = {},
) {
  const transport = getTransport();
  const maxRetries = Math.max(parseInt(String(process.env.SMTP_RETRY_MAX || '1'), 10) || 1, 0);
  const retryDelayMs = Math.max(parseInt(String(process.env.SMTP_RETRY_DELAY_MS || '200'), 10) || 200, 0);
  let attempt = 0;
  const queueName = 'notifications-email';
  queueJobEnqueued(queueName);
  queueJobStarted(queueName);
  // First try + up to maxRetries additional attempts on transient errors
  // attempt counts total tries; retries happen while attempt <= maxRetries
  while (attempt <= maxRetries) {
    try {
      if (process.env.SMTP_TEST_FAIL === 'true') {
        throw new Error('Simulated SMTP failure');
      }
      const info = await transport.sendMail({ from: smtpFrom, to, subject, text, html });
      logger.info('E-Mail erfolgreich gesendet: %o', { to, messageId: info.messageId });
      incrEmailSuccess();
      queueJobSucceeded(queueName);
      publishNotificationEvent({
        channel: 'email',
        status: 'sent',
        template: options.template,
        recipient: to,
        title: subject,
        body: text || html || null,
        metadata: {
          ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
          messageId: info.messageId,
          reason: options.reason || 'custom',
        },
      });
      return info;
    } catch (err) {
      const transient = isTransientError(err);
      if (transient && attempt < maxRetries) {
        attempt += 1;
        logger.warn('E-Mail transienter Fehler, versuche erneut (%d/%d): %o', attempt, maxRetries, err);
        if (retryDelayMs > 0) await sleep(retryDelayMs);
        continue;
      }
      logger.error('E-Mail-Versand fehlgeschlagen: %o', err);
      incrEmailFail(err);
      queueJobFailed(queueName, err);
      publishNotificationEvent({
        channel: 'email',
        status: 'failed',
        template: options.template,
        recipient: to,
        title: subject,
        body: text || html || null,
        metadata: {
          ...((options.context && Object.keys(options.context).length) ? { context: options.context } : {}),
          reason: options.reason || 'custom',
          transient,
          attempt,
        },
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

export async function sendShiftChangedEmail(to: string, shiftTitle: string, change: string) {
  const tpl = renderEmailTemplate('shift-changed', { shiftTitle, change });
  if (tpl?.subject || tpl?.text || tpl?.html) {
    return sendEmail(
      to,
      tpl.subject || `Schichtänderung: ${shiftTitle}`,
      tpl.text,
      tpl.html,
      { template: 'shift-changed', context: { shiftTitle, change }, reason: 'shift-change' },
    );
  }
  const subject = `Schichtänderung: ${shiftTitle}`;
  const text = `Hallo,\n\nDeine Schicht "${shiftTitle}" wurde geändert: ${change}\n\nViele Grüße`;
  return sendEmail(to, subject, text, undefined, {
    template: 'shift-changed',
    context: { shiftTitle, change },
    reason: 'shift-change',
  });
}

export async function sendCriticalIncidentEmail(
  to: string,
  incidentTitle: string,
  siteName: string,
  severity: 'CRITICAL' | 'HIGH',
  reporterName: string,
  occurredAt: Date,
  siteId: string,
) {
  const severityLabel = severity === 'CRITICAL' ? 'KRITISCH' : 'HOCH';
  const context = { incidentTitle, siteName, severity: severityLabel, reporterName, occurredAt: occurredAt.toLocaleString('de-DE'), siteId };

  const tpl = renderEmailTemplate('critical-incident', context);
  if (tpl?.subject || tpl?.text || tpl?.html) {
    return sendEmail(
      to,
      tpl.subject || `🚨 ${severityLabel}: ${incidentTitle} - ${siteName}`,
      tpl.text,
      tpl.html,
      { template: 'critical-incident', context, reason: 'critical-incident' },
    );
  }

  // Fallback ohne Template
  const subject = `🚨 ${severityLabel}: ${incidentTitle} - ${siteName}`;
  const text = `KRITISCHER VORFALL

Schweregrad: ${severityLabel}
Objekt: ${siteName}
Vorfall: ${incidentTitle}

Gemeldet von: ${reporterName}
Zeitpunkt: ${occurredAt.toLocaleString('de-DE')}

Bitte umgehend überprüfen und geeignete Maßnahmen einleiten.

Zum Objekt: ${process.env.FRONTEND_URL || 'https://app.sicherheitsdienst.de'}/sites/${siteId}?tab=incidents

Mit freundlichen Grüßen
Ihr Sicherheitsdienst-System`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: ${severity === 'CRITICAL' ? '#dc2626' : '#ea580c'}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .severity-badge { display: inline-block; padding: 8px 16px; background: ${severity === 'CRITICAL' ? '#dc2626' : '#ea580c'}; color: white; border-radius: 4px; font-weight: bold; margin: 10px 0; }
    .info-table { width: 100%; margin: 20px 0; }
    .info-table td { padding: 8px; border-bottom: 1px solid #ddd; }
    .info-table td:first-child { font-weight: bold; width: 150px; }
    .cta-button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 KRITISCHER VORFALL</h1>
  </div>
  <div class="content">
    <p><span class="severity-badge">SCHWEREGRAD: ${severityLabel}</span></p>

    <table class="info-table">
      <tr>
        <td>Objekt:</td>
        <td><strong>${siteName}</strong></td>
      </tr>
      <tr>
        <td>Vorfall:</td>
        <td><strong>${incidentTitle}</strong></td>
      </tr>
      <tr>
        <td>Gemeldet von:</td>
        <td>${reporterName}</td>
      </tr>
      <tr>
        <td>Zeitpunkt:</td>
        <td>${occurredAt.toLocaleString('de-DE')}</td>
      </tr>
    </table>

    <p><strong>Bitte umgehend überprüfen und geeignete Maßnahmen einleiten.</strong></p>

    <a href="${process.env.FRONTEND_URL || 'https://app.sicherheitsdienst.de'}/sites/${siteId}?tab=incidents" class="cta-button">
      Zum Wachbuch
    </a>
  </div>
  <div class="footer">
    <p>Diese E-Mail wurde automatisch vom Sicherheitsdienst-System generiert.</p>
  </div>
</body>
</html>`;

  return sendEmail(to, subject, text, html, {
    template: 'critical-incident',
    context,
    reason: 'critical-incident',
  });
}
