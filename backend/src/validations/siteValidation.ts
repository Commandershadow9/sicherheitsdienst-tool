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
    // Neue Felder (optional)
    customerName: z.string().optional(),
    customerCompany: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerPhone: z.string().optional(),
    emergencyContacts: z.any().optional(), // JSON-Array
    status: z.enum(['INQUIRY', 'IN_REVIEW', 'CALCULATING', 'OFFER_SENT', 'ACTIVE', 'INACTIVE', 'LOST']).optional(),
    requiredStaff: z.number().int().min(0).optional(),
    requiredQualifications: z.array(z.string()).optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSiteSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      // Neue Felder (optional)
      customerName: z.string().optional(),
      customerCompany: z.string().optional(),
      customerEmail: z.string().email().optional().or(z.literal('')),
      customerPhone: z.string().optional(),
      emergencyContacts: z.any().optional(), // JSON-Array
      status: z.enum(['INQUIRY', 'IN_REVIEW', 'CALCULATING', 'OFFER_SENT', 'ACTIVE', 'INACTIVE', 'LOST']).optional(),
      requiredStaff: z.number().int().min(0).optional(),
      requiredQualifications: z.array(z.string()).optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Mindestens ein Feld muss angegeben werden',
    }),
});
