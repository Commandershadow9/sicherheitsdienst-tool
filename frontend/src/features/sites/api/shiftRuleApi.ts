/**
 * API client for ShiftRule operations
 *
 * Provides typed functions for all CRUD operations on shift planning rules.
 * Uses the central axios instance from @/lib/api for authentication and error handling.
 */

import { api } from '@/lib/api'
import type {
  ShiftRule,
  CreateShiftRuleInput,
  UpdateShiftRuleInput,
  GenerateShiftsInput,
  GenerateShiftsResponse,
} from '../types/shiftRule'

/**
 * Get all shift rules for a site
 * Returns rules ordered by priority (highest first)
 *
 * @param siteId - The site ID
 * @returns Promise with array of shift rules
 */
export async function getShiftRules(siteId: string): Promise<ShiftRule[]> {
  const res = await api.get<ShiftRule[]>(`/sites/${siteId}/shift-rules`)
  return res.data
}

/**
 * Get a single shift rule by ID
 *
 * @param siteId - The site ID
 * @param ruleId - The shift rule ID
 * @returns Promise with the shift rule
 * @throws 404 if rule not found
 */
export async function getShiftRule(siteId: string, ruleId: string): Promise<ShiftRule> {
  const res = await api.get<ShiftRule>(`/sites/${siteId}/shift-rules/${ruleId}`)
  return res.data
}

/**
 * Create a new shift rule
 *
 * @param siteId - The site ID
 * @param input - The shift rule data (without id, timestamps)
 * @returns Promise with the created shift rule
 * @throws 400 if validation fails (e.g., invalid time format, missing pattern-specific fields)
 */
export async function createShiftRule(
  siteId: string,
  input: CreateShiftRuleInput
): Promise<ShiftRule> {
  const res = await api.post<ShiftRule>(`/sites/${siteId}/shift-rules`, input)
  return res.data
}

/**
 * Update an existing shift rule
 * Supports partial updates - only provided fields will be updated
 *
 * @param siteId - The site ID
 * @param ruleId - The shift rule ID to update
 * @param input - Partial shift rule data
 * @returns Promise with the updated shift rule
 * @throws 404 if rule not found
 * @throws 400 if validation fails
 */
export async function updateShiftRule(
  siteId: string,
  ruleId: string,
  input: UpdateShiftRuleInput
): Promise<ShiftRule> {
  const res = await api.put<ShiftRule>(`/sites/${siteId}/shift-rules/${ruleId}`, input)
  return res.data
}

/**
 * Delete a shift rule
 *
 * @param siteId - The site ID
 * @param ruleId - The shift rule ID to delete
 * @throws 404 if rule not found
 */
export async function deleteShiftRule(siteId: string, ruleId: string): Promise<void> {
  await api.delete(`/sites/${siteId}/shift-rules/${ruleId}`)
}

/**
 * Generate shifts from all active rules for a date range
 * Uses priority-based rule matching - higher priority rules override lower ones
 *
 * @param siteId - The site ID
 * @param input - Generation parameters (startDate, endDate, preview flag)
 * @returns Promise with generation results (count + shift details)
 *
 * @example
 * // Generate shifts for next month
 * const result = await generateShiftsFromRules(siteId, {
 *   startDate: '2024-02-01',
 *   endDate: '2024-02-29',
 *   preview: false
 * })
 * console.log(`Generated ${result.generated} shifts`)
 *
 * @example
 * // Preview shifts without creating them
 * const preview = await generateShiftsFromRules(siteId, {
 *   startDate: '2024-02-01',
 *   endDate: '2024-02-29',
 *   preview: true
 * })
 * console.log('Preview:', preview.shifts)
 */
export async function generateShiftsFromRules(
  siteId: string,
  input: GenerateShiftsInput
): Promise<GenerateShiftsResponse> {
  const res = await api.post<GenerateShiftsResponse>(
    `/sites/${siteId}/shift-rules/generate-shifts`,
    input
  )
  return res.data
}
