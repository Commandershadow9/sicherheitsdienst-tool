import { z } from 'zod';

export const employeePreferencesSchema = z
  .object({
    prefersNightShifts: z.boolean().optional(),
    prefersDayShifts: z.boolean().optional(),
    prefersWeekends: z.boolean().optional(),
    targetMonthlyHours: z.number().int().min(40).max(300).optional(),
    minMonthlyHours: z.number().int().min(0).max(300).optional(),
    maxMonthlyHours: z.number().int().min(0).max(400).optional(),
    flexibleHours: z.boolean().optional(),
    prefersLongShifts: z.boolean().optional(),
    prefersShortShifts: z.boolean().optional(),
    prefersConsecutiveDays: z.number().int().min(1).max(14).nullable().optional(),
    minRestDaysPerWeek: z.number().int().min(0).max(7).optional(),
    preferredSiteIds: z.array(z.string()).optional(),
    avoidedSiteIds: z.array(z.string()).optional(),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Mindestens ein Feld ist erforderlich.',
  });

export const updateEmployeePreferencesSchema = z.object({
  body: employeePreferencesSchema,
});
