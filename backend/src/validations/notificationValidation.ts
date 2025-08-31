import { z } from 'zod';

export const notificationTestSchema = z.object({
  body: z.object({
    recipient: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    channel: z.string().optional(),
  }),
});

