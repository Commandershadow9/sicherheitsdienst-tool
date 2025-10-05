import { z } from 'zod';
import { AbsenceStatus, AbsenceType } from '@prisma/client';

const absenceTypeEnum = z.nativeEnum(AbsenceType);

export const createAbsenceSchema = z.object({
  body: z.object({
    userId: z.string().cuid().optional(),
    type: absenceTypeEnum,
    startsAt: z.string().datetime({ offset: true, message: 'startsAt muss ein ISO-Zeitstempel sein.' }),
    endsAt: z.string().datetime({ offset: true, message: 'endsAt muss ein ISO-Zeitstempel sein.' }),
    reason: z.string().max(2000).optional(),
  }),
});

export const absenceDecisionSchema = z.object({
  body: z.object({
    decisionNote: z.string().max(2000).optional(),
  }),
});

export const listAbsenceQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    type: z.nativeEnum(AbsenceType).optional(),
    status: z.nativeEnum(AbsenceStatus).optional(),
    userId: z.string().cuid().optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }).partial(),
});
