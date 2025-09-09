import logger from '../utils/logger';
import { incrEmailSuccess, incrEmailFail } from '../utils/notifyStats';
import { renderEmailTemplate } from './templateService';

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

export async function sendEmail(to: string, subject: string, text?: string, html?: string) {
  const transport = getTransport();
  const maxRetries = Math.max(parseInt(String(process.env.SMTP_RETRY_MAX || '1'), 10) || 1, 0);
  const retryDelayMs = Math.max(parseInt(String(process.env.SMTP_RETRY_DELAY_MS || '200'), 10) || 200, 0);
  let attempt = 0;
  // First try + up to maxRetries additional attempts on transient errors
  // attempt counts total tries; retries happen while attempt <= maxRetries
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      if (process.env.SMTP_TEST_FAIL === 'true') {
        throw new Error('Simulated SMTP failure');
      }
      const info = await transport.sendMail({ from: smtpFrom, to, subject, text, html });
      logger.info('E-Mail erfolgreich gesendet: %o', { to, messageId: info.messageId });
      incrEmailSuccess();
      return info;
    } catch (err) {
      const transient = isTransientError(err);
      if (transient && attempt < maxRetries) {
        attempt++;
        logger.warn('E-Mail transienter Fehler, versuche erneut (%d/%d): %o', attempt, maxRetries, err);
        if (retryDelayMs > 0) await sleep(retryDelayMs);
        continue;
      }
      logger.error('E-Mail-Versand fehlgeschlagen: %o', err);
      incrEmailFail();
      throw err;
    }
  }
}

export async function sendShiftChangedEmail(to: string, shiftTitle: string, change: string) {
  const tpl = renderEmailTemplate('shift-changed', { shiftTitle, change });
  if (tpl?.subject || tpl?.text || tpl?.html) {
    return sendEmail(to, tpl.subject || `Schichtänderung: ${shiftTitle}`, tpl.text, tpl.html);
  }
  const subject = `Schichtänderung: ${shiftTitle}`;
  const text = `Hallo,\n\nDeine Schicht "${shiftTitle}" wurde geändert: ${change}\n\nViele Grüße`;
  return sendEmail(to, subject, text);
}
