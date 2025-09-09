import { sendShiftChangedEmail } from '../services/emailService';

// Mock nodemailer to capture sendMail options
const sendMail = jest.fn(async (opts: any) => {
  (global as any).__LAST_MAIL = opts;
  return { messageId: 'msg-tpl' };
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail })),
}), { virtual: true } as any);

describe('email templates', () => {
  it('render shift-changed template for subject/text', async () => {
    await sendShiftChangedEmail('to@example.com', 'Nachtschicht', 'Zeit geändert');
    const last = (global as any).__LAST_MAIL;
    expect(last).toBeDefined();
    expect(String(last.subject)).toContain('Schichtänderung: Nachtschicht');
    expect(String(last.text)).toContain('Nachtschicht');
    expect(String(last.text)).toContain('Zeit geändert');
  });
});

