import { sendEmail, sendShiftChangedEmail } from '../services/emailService';
import logger from '../utils/logger';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(async () => ({ messageId: 'msg-1' })),
  })),
}), { virtual: true } as any);

describe('emailService', () => {
  it('sendEmail logs success', async () => {
    const spy = jest.spyOn(logger, 'info').mockImplementation(() => logger as any);
    const info = await sendEmail('to@example.com', 'Subject', 'Body');
    expect((info as any).messageId).toBe('msg-1');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('sendEmail logs failure', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => logger as any);
    process.env.SMTP_TEST_FAIL = 'true';
    await expect(sendEmail('to@example.com', 'Subject', 'Body')).rejects.toBeTruthy();
    delete process.env.SMTP_TEST_FAIL;
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('sendShiftChangedEmail uses sendEmail', async () => {
    const res = await sendShiftChangedEmail('to@example.com', 'Nachtschicht', 'Zeit geändert');
    expect((res as any).messageId).toBe('msg-1');
  });
});
