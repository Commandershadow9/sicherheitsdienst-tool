import { sendEmail, sendShiftChangedEmail } from '../services/emailService';
import logger from '../utils/logger';

// Singleton-Transport, damit Test die Instanz manipulieren kann, die auch der Code nutzt
jest.mock('nodemailer', () => {
  const transport = { sendMail: jest.fn(async () => ({ messageId: 'msg-1' })) };
  return {
    createTransport: jest.fn(() => transport),
  };
}, { virtual: true } as any);

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

  it('sendEmail retries once on transient failure and succeeds', async () => {
    // Arrange: get mock transport and make it fail once with ETIMEDOUT, then succeed
    const nm = require('nodemailer');
    const transport = nm.createTransport();
    (transport.sendMail as jest.Mock).mockImplementationOnce(async () => {
      const e: any = new Error('ETIMEDOUT');
      e.code = 'ETIMEDOUT';
      throw e;
    });
    (transport.sendMail as jest.Mock).mockResolvedValueOnce({ messageId: 'msg-2' });
    const info = await sendEmail('to@example.com', 'Subject', 'Body');
    expect((info as any).messageId).toBe('msg-2');
  });
});
