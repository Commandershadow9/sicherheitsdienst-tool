import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    const { platform, token } = req.body as { platform: 'IOS' | 'ANDROID' | 'WEB'; token: string };
    if (!userId) { res.status(401).json({ success: false, message: 'Nicht authentifiziert' }); return; }
    if (!platform || !token) { res.status(400).json({ success: false, message: 'platform und token sind erforderlich' }); return; }

    const existing = await (prisma as any).deviceToken.findUnique({ where: { token } });
    if (existing) {
      const updated = await (prisma as any).deviceToken.update({ where: { token }, data: { userId, platform, isActive: true, notificationsEnabled: true, lastUsedAt: new Date() } });
      res.status(200).json({ success: true, message: 'Token aktualisiert', data: updated });
      return;
    }
    const created = await (prisma as any).deviceToken.create({ data: { userId, platform, token } });
    res.status(201).json({ success: true, message: 'Token registriert', data: created });
    return;
  } catch (err) {
    next(err);
    return;
  }
};

export const listMyTokens = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    const tokens = await (prisma as any).deviceToken.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: tokens });
    return;
  } catch (err) {
    next(err);
    return;
  }
};

export const updateMyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    const { token } = req.params;
    const { isActive, notificationsEnabled } = req.body as { isActive?: boolean; notificationsEnabled?: boolean };
    const updated = await (prisma as any).deviceToken.update({ where: { token }, data: { ...(isActive !== undefined && { isActive }), ...(notificationsEnabled !== undefined && { notificationsEnabled }) } });
    if (updated.userId !== userId) { res.status(403).json({ success: false, message: 'Kein Zugriff auf diesen Token' }); return; }
    res.json({ success: true, data: updated });
    return;
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ success: false, message: 'Token nicht gefunden' }); return; }
    next(err);
    return;
  }
};

export const deleteMyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    const { token } = req.params;
    const existing = await (prisma as any).deviceToken.findUnique({ where: { token } });
    if (!existing) { res.status(404).json({ success: false, message: 'Token nicht gefunden' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ success: false, message: 'Kein Zugriff auf diesen Token' }); return; }
    await (prisma as any).deviceToken.delete({ where: { token } });
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
    return;
  }
};
