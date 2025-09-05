import { z } from 'zod';

export const siteListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    filter: z.record(z.string()).optional(),
  }),
});

export const createSiteSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name ist erforderlich' }),
    address: z.string().min(1, { message: 'Adresse ist erforderlich' }),
    city: z.string().min(1, { message: 'Stadt ist erforderlich' }),
    postalCode: z.string().min(1, { message: 'Postleitzahl ist erforderlich' }),
  }),
});

export const updateSiteSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Mindestens ein Feld muss angegeben werden',
    }),
});
