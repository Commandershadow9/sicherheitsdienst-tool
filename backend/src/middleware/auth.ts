/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client'; // User wird hier für req.user benötigt
import createError from 'http-errors';
import prisma from '../utils/prisma';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  // Fallback: Read from Cookie
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : req.cookies?.accessToken;

  if (!token) {
    next(createError(401, 'Kein Authentifizierungstoken vorhanden. Zugriff verweigert.'));
    return;
  }

  try {
    // Stelle sicher, dass JWT_SECRET ein String ist, bevor jwt.verify aufgerufen wird
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ist nicht definiert in den Umgebungsvariablen für authenticate.');
      next(createError(500, 'Server-Konfigurationsfehler: JWT Secret fehlt.'));
      return;
    }

    const verifyOptions: jwt.VerifyOptions = {};
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;

    const decoded = jwt.verify(token, jwtSecret, verifyOptions) as { userId: string; role: string; customerId?: string }; // customerId für Multi-Tenancy

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      next(createError(401, 'Ungültiger Token oder Benutzer nicht aktiv.'));
      return;
    }

    (req as any).user = user;
    (req as any).customerId = decoded.customerId || user.customerId; // 🔐 Multi-Tenancy Kontext setzen

    next();
  } catch (error) {
    next(createError(401, 'Ungültiger Token.'));
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError(401, 'Authentifizierung erforderlich.'));
    }
    // Stelle sicher, dass req.user.role existiert (sollte durch 'authenticate' der Fall sein)
    const userRole = (req.user as User)?.role; // Expliziter Cast zu User, um auf 'role' zuzugreifen
    if (typeof userRole !== 'string' || !roles.includes(userRole)) {
      return next(createError(403, 'Keine Berechtigung für diese Aktion.'));
    }
    next();
  };
};

// Erlaubt Zugriff, wenn Benutzer selbst betroffen ist (z. B. /users/:id) oder eine der Rollen passt
export const authorizeSelfOr = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError(401, 'Authentifizierung erforderlich.'));
    }
    const user = req.user as User;
    const isRoleAllowed = roles.includes(user.role);
    const targetId = req.params.id;
    const isSelf = !!targetId && user.id === targetId;
    if (isRoleAllowed || isSelf) {
      return next();
    }
    return next(createError(403, 'Keine Berechtigung für diese Aktion.'));
  };
};
