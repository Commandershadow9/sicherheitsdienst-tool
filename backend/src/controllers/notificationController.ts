import { Request, Response, NextFunction } from 'express';
import { sendEmail } from '../services/emailService';

export const sendTestNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient, title, body, channel = 'email' } = req.body;
    if (channel !== 'email') {
      return res.status(400).json({ success: false, message: 'Nur channel=email wird unterstützt' });
    }
    await sendEmail(recipient, title, body);
    return res.json({ success: true, message: 'Test-Benachrichtigung gesendet', data: { recipient, channel } });
  } catch (err) {
    return next(err);
  }
};

