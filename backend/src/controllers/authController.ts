import { Request, Response } from 'express';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Benutzerkonto ist inaktiv. Bitte kontaktiere den Administrator.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET ist nicht definiert in den Umgebungsvariablen.');
        return res.status(500).json({
            success: false,
            message: 'Server-Konfigurationsfehler: JWT Secret fehlt.'
        });
    }

    let expiresInValue: string | number;
    const expiresInFromEnv = process.env.JWT_EXPIRES_IN;

    if (expiresInFromEnv && /^\d+$/.test(expiresInFromEnv)) {
        expiresInValue = parseInt(expiresInFromEnv, 10);
    } else if (expiresInFromEnv && expiresInFromEnv.trim() !== "") {
        expiresInValue = expiresInFromEnv;
    } else {
        expiresInValue = '7d'; // Default
    }

    const payload = {
        userId: user.id,
        role: user.role
    };

    // WORKAROUND: expiresInValue mit 'as any' versehen, um den Typfehler zu umgehen
    const signOptions: SignOptions = {
        expiresIn: expiresInValue as any
    };

    const token = jwt.sign(
      payload,
      jwtSecret,
      signOptions
    );

    const { password: _removedPassword, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login erfolgreich',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
            success: false,
            message: 'Token-Fehler: ' + error.message
        });
    }
    return res.status(500).json({
      success: false,
      message: 'Ein interner Serverfehler ist beim Login aufgetreten.'
    });
  }};
