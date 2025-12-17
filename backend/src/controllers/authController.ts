import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { submitAuditEvent } from '../utils/audit';


export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await submitAuditEvent(req, {
        action: 'AUTH.LOGIN.FAIL',
        resourceType: 'AUTH',
        resourceId: user?.id ?? null,
        actorId: user?.id ?? null,
        actorRole: user?.role ?? null,
        outcome: 'FAIL',
        data: { email },
      });
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Ungültige Anmeldedaten' });
    }

    if (!user.isActive) {
      await submitAuditEvent(req, {
        action: 'AUTH.LOGIN.DENIED',
        resourceType: 'AUTH',
        resourceId: user.id,
        actorId: user.id,
        actorRole: user.role,
        outcome: 'DENIED',
        data: { email, reason: 'ACCOUNT_INACTIVE' },
      });
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Benutzerkonto ist inaktiv. Bitte kontaktiere den Administrator.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ist nicht definiert in den Umgebungsvariablen.');
      await submitAuditEvent(req, {
        action: 'AUTH.LOGIN.ERROR',
        resourceType: 'AUTH',
        resourceId: user.id,
        actorId: user.id,
        actorRole: user.role,
        outcome: 'ERROR',
        data: { email, reason: 'JWT_SECRET_MISSING' },
      });
      return res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Server-Konfigurationsfehler: JWT Secret fehlt.' });
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

    // 🔐 MULTI-TENANCY: customerId im JWT-Token (KRITISCH!)
    const payload = {
      userId: user.id,
      role: user.role,
      customerId: user.customerId, // 🔐 Multi-Tenancy
    };

    // WORKAROUND: expiresInValue mit 'as any' versehen, um den Typfehler zu umgehen
    const signOptions: SignOptions = {
      expiresIn: expiresInValue as any,
    };
    if (process.env.JWT_ISSUER) signOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) signOptions.audience = process.env.JWT_AUDIENCE;

    const accessToken = jwt.sign(payload, jwtSecret, signOptions);

    const refreshSecret = process.env.REFRESH_SECRET;
    if (!refreshSecret) {
      console.error('REFRESH_SECRET ist nicht definiert in den Umgebungsvariablen.');
      await submitAuditEvent(req, {
        action: 'AUTH.LOGIN.ERROR',
        resourceType: 'AUTH',
        resourceId: user.id,
        actorId: user.id,
        actorRole: user.role,
        outcome: 'ERROR',
        data: { email, reason: 'REFRESH_SECRET_MISSING' },
      });
      return res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Server-Konfigurationsfehler: Refresh Secret fehlt.' });
    }

    const refreshExpRaw = process.env.REFRESH_EXPIRES_IN;
    const refreshSignOpts: SignOptions = {
      expiresIn: (refreshExpRaw && refreshExpRaw.trim() !== '' ? (refreshExpRaw as any) : ('30d' as any)),
    };
    if (process.env.JWT_ISSUER) refreshSignOpts.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) refreshSignOpts.audience = process.env.JWT_AUDIENCE;
    // 🔐 MULTI-TENANCY: customerId im Refresh-Token für Tenant-Binding
    const refreshPayload = { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      customerId: user.customerId 
    };
    const refreshToken = jwt.sign(refreshPayload, refreshSecret, refreshSignOpts);

    // Set HttpOnly Cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // 'strict' might block redirect-flows or initial loads if coming from external, 'lax' is safer default
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d (match JWT_EXPIRES_IN default)
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth/refresh', // Restrict refresh token to refresh endpoint
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
    });

    const { password: _removedPassword, ...userWithoutPassword } = user;

    await submitAuditEvent(req, {
      action: 'AUTH.LOGIN.SUCCESS',
      resourceType: 'AUTH',
      resourceId: user.id,
      actorId: user.id,
      actorRole: user.role,
      outcome: 'SUCCESS',
      data: { email },
    });

    return res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        // Tokens are now strictly HttpOnly cookies
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    await submitAuditEvent(req, {
      action: 'AUTH.LOGIN.ERROR',
      resourceType: 'AUTH',
      resourceId: null,
      outcome: 'ERROR',
      data: { email, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' },
    });
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Token-Fehler: ' + error.message });
    }
    return res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Ein interner Serverfehler ist beim Login aufgetreten.' });
  }
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  // req.user kommt aus authenticate-Middleware
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
  }
  const { password: _pw, ...sanitized } = user;
  return res.json({ success: true, data: sanitized });
};

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken: bodyToken } = req.body as { refreshToken?: string };
  const refreshToken = req.cookies?.refreshToken || bodyToken;

  let tokenClaims: { userId?: string; role?: string; customerId?: string } | null = null;
  try {
    const refreshSecret = process.env.REFRESH_SECRET;
    const accessSecret = process.env.JWT_SECRET;
    if (!refreshSecret || !accessSecret) {
      console.error('JWT/REFRESH Secrets fehlen in den Umgebungsvariablen.');
      await submitAuditEvent(req, {
        action: 'AUTH.REFRESH.ERROR',
        resourceType: 'AUTH',
        resourceId: null,
        outcome: 'ERROR',
        data: { reason: 'TOKEN_SECRETS_MISSING' },
      });
      return res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Server-Konfigurationsfehler: Secrets fehlen.' });
    }
    if (!refreshToken) {
      await submitAuditEvent(req, {
        action: 'AUTH.REFRESH.FAIL',
        resourceType: 'AUTH',
        resourceId: null,
        outcome: 'FAIL',
        data: { reason: 'MISSING_REFRESH_TOKEN' },
      });
      return res.status(422).json({ success: false, code: 'VALIDATION_ERROR', message: 'Validierungsfehler.', errors: [{ path: ['refreshToken'], message: 'refreshToken ist erforderlich' }] });
    }

    const verifyOptions: jwt.VerifyOptions = {};
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;
    
    // 🔐 MULTI-TENANCY: Verify customerId binding
    tokenClaims = jwt.verify(refreshToken, refreshSecret, verifyOptions) as { userId: string; role?: string; customerId?: string; iat?: number; exp?: number };
    
    const user = await prisma.user.findUnique({ where: { id: tokenClaims.userId } });
    if (!user || !user.isActive) {
      await submitAuditEvent(req, {
        action: 'AUTH.REFRESH.DENIED',
        resourceType: 'AUTH',
        resourceId: user?.id ?? tokenClaims.userId ?? null,
        actorId: user?.id ?? tokenClaims.userId ?? null,
        actorRole: user?.role ?? tokenClaims.role ?? null,
        outcome: 'DENIED',
        data: { reason: user ? 'ACCOUNT_INACTIVE' : 'USER_NOT_FOUND' },
      });
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Ungültiger oder inaktiver Benutzer.' });
    }

    // 🔐 MULTI-TENANCY: Strict Tenant Check
    // Prevent Cross-Tenant Access via potentially manipulated or stale tokens
    if (tokenClaims.customerId && user.customerId !== tokenClaims.customerId) {
        console.error(`Security Alert: Tenant Mismatch during Refresh. Token: ${tokenClaims.customerId}, User: ${user.customerId}`);
        await submitAuditEvent(req, {
            action: 'AUTH.REFRESH.DENIED',
            resourceType: 'AUTH',
            resourceId: user.id,
            actorId: user.id,
            actorRole: user.role,
            outcome: 'DENIED',
            data: { reason: 'TENANT_MISMATCH', expected: user.customerId, received: tokenClaims.customerId },
        });
        return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Sicherheitsverstoß: Ungültige Mandanten-Zuordnung.' });
    }

    // Access-Token Gültigkeit
    const accessExpRaw = process.env.JWT_EXPIRES_IN;
    const accessSignOpts: SignOptions = {
      expiresIn: (accessExpRaw && accessExpRaw.trim() !== '' ? (accessExpRaw as any) : ('7d' as any)) as any,
    };
    if (process.env.JWT_ISSUER) accessSignOpts.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) accessSignOpts.audience = process.env.JWT_AUDIENCE;
    
    // 🔐 MULTI-TENANCY: Include customerId in new tokens
    const accessPayload = { 
      userId: user.id, 
      role: user.role,
      customerId: user.customerId 
    };
    const newAccessToken = jwt.sign(accessPayload, accessSecret, accessSignOpts);

    // Refresh-Token Gültigkeit
    const refreshExpRaw = process.env.REFRESH_EXPIRES_IN;
    const refreshSignOpts: SignOptions = {
      expiresIn: (refreshExpRaw && refreshExpRaw.trim() !== '' ? (refreshExpRaw as any) : ('30d' as any)) as any,
    };
    if (process.env.JWT_ISSUER) refreshSignOpts.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) refreshSignOpts.audience = process.env.JWT_AUDIENCE;
    
    const refreshPayload = { 
      userId: user.id, 
      role: user.role,
      customerId: user.customerId 
    };
    const newRefreshToken = jwt.sign(refreshPayload, refreshSecret, refreshSignOpts);

    // expiresIn Zahl schätzen (Sekunden), sofern numeric, sonst generischer Default
    const expiresInSeconds =
      accessExpRaw && /^\d+$/.test(accessExpRaw) ? parseInt(accessExpRaw, 10) : 3600;

    // Set new Cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    await submitAuditEvent(req, {
      action: 'AUTH.REFRESH.SUCCESS',
      resourceType: 'AUTH',
      resourceId: user.id,
      actorId: user.id,
      actorRole: user.role,
      outcome: 'SUCCESS',
      data: { userId: user.id },
    });

    return res.json({
      success: true,
      message: 'Tokens erneuert',
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    const actorOverrides = {
      actorId: tokenClaims?.userId ?? null,
      actorRole: tokenClaims?.role ?? null,
    };
    const outcome = error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError ? 'DENIED' : 'ERROR';
    await submitAuditEvent(req, {
      action: outcome === 'DENIED' ? 'AUTH.REFRESH.FAIL' : 'AUTH.REFRESH.ERROR',
      resourceType: 'AUTH',
      resourceId: tokenClaims?.userId ?? null,
      actorId: actorOverrides.actorId ?? null,
      actorRole: actorOverrides.actorRole ?? null,
      outcome,
      data: { reason: outcome === 'DENIED' ? 'INVALID_TOKEN' : 'INTERNAL_ERROR', error: error instanceof Error ? error.message : String(error) },
    });
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Ungültiger oder abgelaufener Refresh-Token.' });
    }
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Interner Serverfehler beim Token-Refresh.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
  };

  res.clearCookie('accessToken', {
    ...cookieOptions,
    path: '/', // Default path
  });

  res.clearCookie('refreshToken', {
    ...cookieOptions,
    path: '/api/auth/refresh',
  });

  return res.json({
    success: true,
    message: 'Erfolgreich ausgeloggt.',
  });
};
