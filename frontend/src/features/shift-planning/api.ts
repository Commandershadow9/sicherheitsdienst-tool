/**
 * Shift Planning API Client
 * API-Wrapper für alle Shift-Planning v2.0 Endpoints
 */

import { api } from '@/lib/api';

// ===== TYPES =====

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  shiftType: 'REGULAR' | 'NIGHT' | 'WEEKEND' | 'HOLIDAY' | 'EMERGENCY' | 'SPECIAL';
  startTime: string; // "06:00"
  endTime: string; // "14:00"
  duration?: number;
  requiredStaff: number;
  requiredQualifications: string[];
  shiftModelType?: string;
  nightShift: boolean;
  weekendShift: boolean;
  holidayShift: boolean;
  wageMultiplier?: number;
  color?: string;
  applicableDays: number[];
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftConflict {
  type:
    | 'UNDERSTAFFED'
    | 'OVERSTAFFED'
    | 'NO_CLEARANCE'
    | 'MISSING_QUALIFICATIONS'
    | 'REST_TIME_VIOLATION'
    | 'DOUBLE_BOOKING'
    | 'WEEKLY_HOURS_EXCEEDED'
    | 'CONSECUTIVE_DAYS_EXCEEDED'
    | 'UNASSIGNED';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shiftId: string;
  shiftTitle: string;
  userId?: string;
  userName?: string;
  description: string;
  details?: any;
}

export interface AutoFillResult {
  shiftId: string;
  shiftTitle: string;
  status: 'filled' | 'partially_filled' | 'unfilled' | 'already_filled';
  assigned: number;
  required: number;
  suggestions: Array<{
    userId: string;
    userName: string;
    score: number;
    reason: string;
    assigned?: boolean;
  }>;
  errors?: string[];
}

// ===== TEMPLATES =====

/**
 * Listet alle Schicht-Templates
 */
export async function fetchShiftTemplates(options?: {
  isActive?: boolean;
  shiftType?: string;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
  if (options?.shiftType) params.append('shiftType', options.shiftType);
  if (options?.category) params.append('category', options.category);

  const res = await api.get<{ success: boolean; data: ShiftTemplate[] }>(
    `/shift-planning/templates?${params.toString()}`
  );
  return res.data.data;
}

/**
 * Ruft ein einzelnes Template ab
 */
export async function fetchShiftTemplate(id: string) {
  const res = await api.get<{ success: boolean; data: ShiftTemplate }>(
    `/shift-planning/templates/${id}`
  );
  return res.data.data;
}

/**
 * Erstellt ein neues Template
 */
export async function createShiftTemplate(data: Partial<ShiftTemplate>) {
  const res = await api.post<{ success: boolean; data: ShiftTemplate }>(
    '/shift-planning/templates',
    data
  );
  return res.data.data;
}

/**
 * Aktualisiert ein Template
 */
export async function updateShiftTemplate(id: string, data: Partial<ShiftTemplate>) {
  const res = await api.patch<{ success: boolean; data: ShiftTemplate }>(
    `/shift-planning/templates/${id}`,
    data
  );
  return res.data.data;
}

/**
 * Löscht ein Template
 */
export async function deleteShiftTemplate(id: string) {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/shift-planning/templates/${id}`
  );
  return res.data;
}

/**
 * Wendet ein Template auf eine Site an
 */
export async function applyTemplateToSite(templateId: string, siteId: string) {
  const res = await api.post<{ success: boolean; data: any; message: string }>(
    `/shift-planning/templates/${templateId}/apply`,
    { siteId }
  );
  return res.data;
}

// ===== CONFLICTS =====

/**
 * Analysiert Konflikte für einen Zeitraum
 */
export async function analyzeConflicts(options: {
  startDate: string;
  endDate: string;
  siteId?: string;
  userId?: string;
}) {
  const params = new URLSearchParams();
  params.append('startDate', options.startDate);
  params.append('endDate', options.endDate);
  if (options.siteId) params.append('siteId', options.siteId);
  if (options.userId) params.append('userId', options.userId);

  const res = await api.get<{
    success: boolean;
    data: {
      conflicts: ShiftConflict[];
      stats: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
  }>(`/shift-planning/conflicts?${params.toString()}`);

  return res.data.data;
}

/**
 * Ruft Konflikte für eine spezifische Schicht ab
 */
export async function getShiftConflicts(shiftId: string) {
  const res = await api.get<{ success: boolean; data: ShiftConflict[] }>(
    `/shift-planning/conflicts/${shiftId}`
  );
  return res.data.data;
}

// ===== AUTO-FILL =====

/**
 * Füllt Schichten automatisch
 */
export async function autoFillShifts(options: {
  shiftIds: string[];
  autoAssign?: boolean;
  preferenceWeight?: number;
  fairnessWeight?: number;
}) {
  const res = await api.post<{ success: boolean; data: AutoFillResult[] }>(
    '/shift-planning/auto-fill',
    options
  );
  return res.data.data;
}

/**
 * Füllt alle Schichten in einem Zeitraum automatisch
 */
export async function autoFillPeriod(options: {
  startDate: string;
  endDate: string;
  siteId?: string;
  autoAssign?: boolean;
}) {
  const res = await api.post<{ success: boolean; data: AutoFillResult[]; message: string }>(
    '/shift-planning/auto-fill-period',
    options
  );
  return res.data;
}

// ===== DEVELOPMENT =====

/**
 * Erstellt Standard-Templates (nur für Admins)
 */
export async function seedTemplates() {
  const res = await api.post<{ success: boolean; data: ShiftTemplate[]; message: string }>(
    '/shift-planning/seed-templates'
  );
  return res.data;
}
