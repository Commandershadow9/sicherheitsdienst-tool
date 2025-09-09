import { z } from 'zod';

export const eventListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.enum(['startTime', 'endTime', 'title', 'createdAt', 'updatedAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  'filter[title]': z.string().optional(),
  'filter[siteId]': z.string().uuid().optional(),
  'filter[status]': z.enum(['PLANNED', 'ACTIVE', 'DONE', 'CANCELLED']).optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  siteId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  serviceInstructions: z.string().min(1),
  assignedEmployeeIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  siteId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  serviceInstructions: z.string().optional(),
  assignedEmployeeIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'DONE', 'CANCELLED']).optional(),
});

