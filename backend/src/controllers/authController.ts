import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Benutzerkonto ist inaktiv. Bitte kontaktiere den Administrator.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ist nicht definiert in den Umgebungsvariablen.');
      return res.status(500).json({
        success: false,
        message: 'Server-Konfigurationsfehler: JWT Secret fehlt.',
      });
    }

    let expiresInValue: string | number;
    const expiresInFromEnv = process.env.JWT_EXPIRES_IN;

    if (expiresInFromEnv && /^\d+$/.test(expiresInFromEnv)) {
      expiresInValue = parseInt(expiresInFromEnv, 10);
    } else if (expiresInFromEnv && expiresInFromEnv.trim() !== '') {
      expiresInValue = expiresInFromEnv;
    } else {
      expiresInValue = '7d'; // Default
    }

    const payload = {
      userId: user.id,
      role: user.role,
    };

    // WORKAROUND: expiresInValue mit 'as any' versehen, um den Typfehler zu umgehen
    const signOptions: SignOptions = {
      expiresIn: expiresInValue as any,
    };

    const accessToken = jwt.sign(payload, jwtSecret, signOptions);

    const { password: _removedPassword, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login erfolgreich',
      token: accessToken, // Rückwärtskompatibel (bestehende Clients), wird in späterem Schritt vereinheitlicht
      accessToken,
      // refreshToken wird im separaten /auth/refresh-Flow ausgegeben
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token-Fehler: ' + error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Ein interner Serverfehler ist beim Login aufgetreten.',
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  try {
    const refreshSecret = process.env.REFRESH_SECRET;
    const accessSecret = process.env.JWT_SECRET;
    if (!refreshSecret || !accessSecret) {
      console.error('JWT/REFRESH Secrets fehlen in den Umgebungsvariablen.');
      return res.status(500).json({
        success: false,
        message: 'Server-Konfigurationsfehler: Secrets fehlen.',
      });
    }
    if (!refreshToken) {
      return res.status(422).json({
        success: false,
        message: 'Validierungsfehler',
        errors: [{ path: ['refreshToken'], message: 'refreshToken ist erforderlich' }],
      });
    }

    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; role?: string; iat?: number; exp?: number };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Ungültiger oder inaktiver Benutzer.' });
    }

    // Access-Token Gültigkeit
    const accessExpRaw = process.env.JWT_EXPIRES_IN;
    const accessSignOpts: SignOptions = {
      expiresIn: (accessExpRaw && accessExpRaw.trim() !== '' ? (accessExpRaw as any) : ('7d' as any)) as any,
    };
    const accessPayload = { userId: user.id, role: user.role };
    const newAccessToken = jwt.sign(accessPayload, accessSecret, accessSignOpts);

    // Refresh-Token Gültigkeit
    const refreshExpRaw = process.env.REFRESH_EXPIRES_IN;
    const refreshSignOpts: SignOptions = {
      expiresIn: (refreshExpRaw && refreshExpRaw.trim() !== '' ? (refreshExpRaw as any) : ('30d' as any)) as any,
    };
    const refreshPayload = { userId: user.id, role: user.role };
    const newRefreshToken = jwt.sign(refreshPayload, refreshSecret, refreshSignOpts);

    // expiresIn Zahl schätzen (Sekunden), sofern numeric, sonst generischer Default
    const expiresInSeconds =
      accessExpRaw && /^\d+$/.test(accessExpRaw) ? parseInt(accessExpRaw, 10) : 3600;

    return res.json({
      success: true,
      message: 'Tokens erneuert',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Ungültiger oder abgelaufener Refresh-Token.' });
    }
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, message: 'Interner Serverfehler beim Token-Refresh.' });
  }
};
