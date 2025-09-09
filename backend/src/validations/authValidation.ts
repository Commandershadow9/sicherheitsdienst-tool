import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Gültige E-Mail erforderlich' }),
    password: z.string().min(6, { message: 'Passwort mindestens 6 Zeichen' }),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'refreshToken ist erforderlich' }),
  }),
});
