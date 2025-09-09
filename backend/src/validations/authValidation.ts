import { z } from 'zod';

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'refreshToken ist erforderlich' }),
  }),
});

