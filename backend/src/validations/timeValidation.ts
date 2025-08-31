import { z } from 'zod';

export const clockInSchema = z.object({
  body: z.object({
    at: z.string().min(1),
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const clockOutSchema = z.object({
  body: z.object({
    at: z.string().min(1),
    breakTime: z.number().int().min(0).optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

