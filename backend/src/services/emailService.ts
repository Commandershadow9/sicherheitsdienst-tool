import logger from '../utils/logger';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

function getTransport() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    } as any);
  } catch (_e) {
    // Fallback-Transport im Test-/Dev-Kontext, wenn nodemailer nicht installiert ist
    return {
      async sendMail() {
        return { messageId: 'dev-mock' };
      },
    };
  }
}

export async function sendEmail(to: string, subject: string, text?: string, html?: string) {
  const transport = getTransport();
  try {
    if (process.env.SMTP_TEST_FAIL === 'true') {
      throw new Error('Simulated SMTP failure');
    }
    const info = await transport.sendMail({ from: smtpFrom, to, subject, text, html });
    logger.info('E-Mail erfolgreich gesendet: %o', { to, messageId: info.messageId });
    return info;
  } catch (err) {
    logger.error('E-Mail-Versand fehlgeschlagen: %o', err);
    throw err;
  }
}

export async function sendShiftChangedEmail(to: string, shiftTitle: string, change: string) {
  const subject = `Schichtänderung: ${shiftTitle}`;
  const text = `Hallo,\n\nDeine Schicht "${shiftTitle}" wurde geändert: ${change}\n\nViele Grüße`;
  return sendEmail(to, subject, text);
}
