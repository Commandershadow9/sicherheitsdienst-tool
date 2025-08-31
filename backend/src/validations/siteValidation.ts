import { z } from 'zod';

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
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Mindestens ein Feld muss angegeben werden',
    }),
});

