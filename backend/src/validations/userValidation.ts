import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Ungültige E-Mail-Adresse' }),
    password: z.string().min(6, { message: 'Passwort muss mindestens 6 Zeichen lang sein' }),
    firstName: z.string().min(1, { message: 'Vorname ist erforderlich' }),
    lastName: z.string().min(1, { message: 'Nachname ist erforderlich' }),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE']).optional(),
    employeeId: z.string().optional(),
    hireDate: z.string().datetime().optional(),
    qualifications: z.array(z.string()).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(['ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE']).optional(),
      employeeId: z.string().optional(),
      hireDate: z.string().datetime().optional(),
      qualifications: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Mindestens ein Feld muss angegeben werden',
    }),
});
