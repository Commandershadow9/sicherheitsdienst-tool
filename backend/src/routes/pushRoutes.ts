import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as pushController from '../controllers/pushController';
import prisma from '../utils/prisma';

const router = Router();

router.get('/tokens', authenticate, asyncHandler(pushController.listMyTokens));
router.post('/tokens', authenticate, asyncHandler(pushController.registerToken));
router.put('/tokens/:token', authenticate, asyncHandler(pushController.updateMyToken));
router.delete('/tokens/:token', authenticate, asyncHandler(pushController.deleteMyToken));

// Admin: User Push-Opt-In/Out setzen
router.put('/users/:userId/opt', authenticate, authorize('ADMIN'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string };
    const { pushOptIn } = req.body as { pushOptIn: boolean };
    const updated = await prisma.user.update({ where: { id: userId }, data: { pushOptIn: !!pushOptIn }, select: { id: true, pushOptIn: true } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}));

export default router;
