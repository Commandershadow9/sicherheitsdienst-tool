import { api } from '@/lib/api';

// ============================================================================
// Shift Types
// ============================================================================

export interface Shift {
  id: string;
  siteId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  requiredEmployees: number;
  assignedEmployees?: number;
  requiredQualifications: string[];
  status: 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
  assignments?: ShiftAssignment[];
  site?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
  };
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  shiftId: string;
  status: 'ASSIGNED' | 'CONFIRMED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  assignedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface AssignmentCandidate {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  hasRequiredQualifications: boolean;
  missingQualifications: string[];
  siteAccessStatus: 'CLEARED' | 'NOT_CLEARED' | 'EXPIRED';
  isAvailable: boolean;
  score: {
    total: number;
    recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
    color: 'green' | 'yellow' | 'orange' | 'red';
    workload: number;
    compliance: number;
    fairness: number;
    preference: number;
  };
  metrics: {
    currentHours: number;
    targetHours: number;
    utilizationPercent: number;
    restHours: number;
    weeklyHours: number;
    consecutiveDays: number;
    nightShiftCount: number;
    avgNightShiftCount: number;
    replacementCount: number;
    avgReplacementCount: number;
  };
  warnings: Array<{
    type: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

// ============================================================================
// Shift API Functions
// ============================================================================

/**
 * GET /api/shifts/:id
 * Fetch a single shift by ID
 */
export async function fetchShift(shiftId: string) {
  const res = await api.get<{ data: Shift }>(`/shifts/${shiftId}`);
  return res.data.data;
}

/**
 * GET /api/shifts
 * Fetch all shifts with optional filters
 */
export async function fetchShifts(filters?: {
  siteId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.siteId) params.append('siteId', filters.siteId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  const url = `/shifts${queryString ? `?${queryString}` : ''}`;

  const res = await api.get<Shift[]>(url);
  return res.data;
}

/**
 * GET /api/shifts/:id/assignment-candidates
 * Get smart assignment candidates for a shift
 */
export async function fetchAssignmentCandidates(
  shiftId: string,
  options?: {
    role?: string;
    limit?: number;
  }
) {
  const params = new URLSearchParams();
  if (options?.role) params.append('role', options.role);
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `/shifts/${shiftId}/assignment-candidates${queryString ? `?${queryString}` : ''}`;

  const res = await api.get<{
    success: boolean;
    data: {
      shiftId: string;
      candidates: AssignmentCandidate[];
      stats: {
        total: number;
        optimal: number;
        good: number;
        acceptable: number;
        notRecommended: number;
      };
    };
  }>(url);

  return res.data.data;
}

/**
 * POST /api/shifts/:id/assign
 * Assign a user to a shift
 */
export async function assignUserToShift(shiftId: string, userId: string) {
  const res = await api.post(`/shifts/${shiftId}/assign`, { userId });
  return res.data;
}

/**
 * DELETE /api/shifts/assignments/:assignmentId
 * Remove a user assignment from a shift
 */
export async function removeShiftAssignment(assignmentId: string) {
  const res = await api.delete(`/shifts/assignments/${assignmentId}`);
  return res.data;
}

/**
 * POST /api/shifts/bulk-assign
 * Assign a user to multiple shifts at once (Bulk Assignment)
 */
export async function bulkAssignUserToShifts(userId: string, shiftIds: string[]) {
  const res = await api.post('/shifts/bulk-assign', { userId, shiftIds });
  return res.data;
}
