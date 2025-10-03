import { z } from 'zod';
import { DocumentCategory, EmploymentType } from '@prisma/client';

const dateSchema = z.string().datetime({ offset: true }).optional();

export const updateEmployeeProfileSchema = z.object({
  body: z.object({
    address: z
      .object({
        street: z.string().max(200).optional(),
        postalCode: z.string().max(20).optional(),
        city: z.string().max(120).optional(),
        country: z.string().max(120).optional(),
      })
      .partial()
      .optional(),
    birthDate: dateSchema,
    phone: z.string().max(50).optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    employmentStart: dateSchema,
    employmentEnd: dateSchema,
    workSchedule: z.string().max(500).optional(),
    hourlyRate: z.union([z.string(), z.number()]).optional(),
    weeklyTargetHours: z.number().int().min(0).max(168).optional(),
    monthlyTargetHours: z.number().int().min(0).max(744).optional(),
    notes: z.string().max(4000).optional(),
  }),
});

export const createQualificationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    validFrom: dateSchema,
    validUntil: dateSchema,
  }),
});

export const createDocumentSchema = z.object({
  body: z.object({
    category: z.nativeEnum(DocumentCategory),
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120).optional(),
    size: z.number().int().min(0).optional(),
    storedAt: z.string().min(1).max(40_000_000).optional(),
    issuedAt: dateSchema,
    expiresAt: dateSchema,
  }),
});
