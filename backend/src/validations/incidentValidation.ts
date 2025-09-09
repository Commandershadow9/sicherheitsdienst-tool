import { z } from 'zod';

export const incidentCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    location: z.string().min(1),
    occurredAt: z.string().datetime(),
  }),
});

export const incidentUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    location: z.string().min(1).optional(),
    occurredAt: z.string().datetime().optional(),
  }),
});

export const incidentListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    sortBy: z.enum(['occurredAt', 'createdAt', 'updatedAt', 'severity', 'status', 'title']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    // filters via filter[...]
  }).passthrough(),
});

