import { z } from 'zod'

// Hinweis zu 400 vs 422:
// - Dieses Schema ist bewusst „formtolerant“ und coerct nur einfache Typen.
// - Domain-Validierung (z. B. unbekanntes sortBy) erfolgt im Controller und liefert 400 entsprechend bestehender Semantik.

const boolFromString = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'string' ? v === 'true' : v))

export const userListQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      // Akzeptiere pageSize und pagesize (Alias)
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
      pagesize: z.coerce.number().int().min(1).max(100).optional(),
      sortBy: z.string().optional(),
      sortDir: z.enum(['asc', 'desc']).optional(),
      // Freitextsuche über mehrere Felder
      query: z.string().optional(),
      // Direkte Top-Level-Filter (zusätzlich zu filter[...])
      role: z.enum(['ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE']).optional(),
      isActive: boolFromString.optional(),
      // Kompatibel zu bestehendem Pattern
      filter: z.record(z.string()).optional(),
    })
})

export default { userListQuerySchema }
