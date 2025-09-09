import { z } from 'zod';

// Align with validate() middleware contract: { body, query, params }
export const eventListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['startTime', 'endTime', 'title', 'createdAt', 'updatedAt']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    'filter[title]': z.string().optional(),
    'filter[siteId]': z.string().uuid().optional(),
    'filter[status]': z.enum(['PLANNED', 'ACTIVE', 'DONE', 'CANCELLED']).optional(),
  }).passthrough(),
});

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    siteId: z.string().uuid().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    serviceInstructions: z.string().min(1),
    assignedEmployeeIds: z.array(z.string().uuid()).optional().default([]),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    siteId: z.string().uuid().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    serviceInstructions: z.string().optional(),
    assignedEmployeeIds: z.array(z.string().uuid()).optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'DONE', 'CANCELLED']).optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'Mindestens ein Feld muss angegeben werden' }),
});
