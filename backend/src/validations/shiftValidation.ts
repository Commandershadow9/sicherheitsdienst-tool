import { z } from 'zod';

export const shiftListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    filter: z.record(z.string()).optional(),
  }),
});

export const createShiftSchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: 'Titel ist erforderlich' }),
    description: z.string().optional(),
    location: z.string().min(1, { message: 'Ort ist erforderlich' }),
    startTime: z.string().datetime({ message: 'Ungültiges Startdatum' }),
    endTime: z.string().datetime({ message: 'Ungültiges Enddatum' }),
    requiredEmployees: z.number().int().positive().optional(),
    requiredQualifications: z.array(z.string()).optional(),
  }),
});

export const updateShiftSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      requiredEmployees: z.number().int().positive().optional(),
      requiredQualifications: z.array(z.string()).optional(),
      status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Mindestens ein Feld muss angegeben werden',
    }),
});
