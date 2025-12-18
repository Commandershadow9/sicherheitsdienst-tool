import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ShiftBase } from '@/types/shift';
import { toast } from '@/lib/utils';
import { WizardData } from '../../types/wizard';

// Clearance Types
export type SiteStatus = 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST';
export type ClearanceStatus = 'ACTIVE' | 'TRAINING' | 'EXPIRED' | 'REVOKED';

export type Clearance = {
  id: string;
  userId: string;
  siteId: string;
  status: ClearanceStatus;
  trainedAt: string;
  validUntil?: string;
  notes?: string;
  trainingCompletedAt?: string;
  trainingHours?: number;
  approvedBy?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export interface CreateSitePayload {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  customerId?: string;
  customerName?: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  buildingType?: string;
  floorCount?: number;
  squareMeters?: number;
  emergencyContacts?: any[];
  status?: string;
  requiredStaff?: number;
  requiredQualifications?: string[];
  securityConcept?: any;
  description?: string;
  notes?: string;
}

/**
 * Transform WizardData to CreateSitePayload
 */
export function transformWizardDataToSitePayload(data: WizardData): CreateSitePayload {
  const payload: CreateSitePayload = {
    name: data.siteName || '',
    address: data.address || '',
    city: data.city || '',
    postalCode: data.postalCode || '',
  };

  // Customer Info
  if (data.customerId) {
    payload.customerId = data.customerId;
  }
  if (data.customer) {
    payload.customerName = data.customer.primaryContact?.name || '';
    payload.customerCompany = data.customer.companyName;
    payload.customerEmail = data.customer.primaryContact?.email || '';
    payload.customerPhone = data.customer.primaryContact?.phone || '';
  }

  // Building Info
  if (data.buildingType) {
    payload.buildingType = data.buildingType;
  }
  if (data.floorCount) {
    payload.floorCount = data.floorCount;
  }
  if (data.squareMeters) {
    payload.squareMeters = data.squareMeters;
  }

  // Emergency Contacts from Step 7
  if (data.documents?.emergencyContacts && data.documents.emergencyContacts.length > 0) {
    payload.emergencyContacts = data.documents.emergencyContacts;
  }

  // Security Concept
  if (data.securityConcept) {
    payload.requiredStaff = data.securityConcept.requiredStaff;
    payload.requiredQualifications = data.securityConcept.requiredQualifications;
    payload.securityConcept = {
      tasks: data.securityConcept.tasks,
      shiftModel: data.securityConcept.shiftModel,
      hoursPerWeek: data.securityConcept.hoursPerWeek,
      templateId: data.securityConcept.templateId,
      templateName: data.securityConcept.templateName,
    };
  }

  // Description
  if (data.description) {
    payload.description = data.description;
  }

  // Combine all notes
  const allNotes: string[] = [];
  if (data.calculation?.notes) {
    allNotes.push('Kalkulation: ' + data.calculation.notes);
  }
  if (data.documents?.notes) {
    allNotes.push('Hinweise: ' + data.documents.notes);
  }
  if (allNotes.length > 0) {
    payload.notes = allNotes.join('\n\n');
  }

  payload.status = 'ACTIVE';

  return payload;
}

/**
 * POST /api/sites
 * Create new site from wizard
 */
export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, WizardData>({
    mutationFn: async (wizardData) => {
      const payload = transformWizardDataToSitePayload(wizardData);
      const response = await api.post('/sites', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Auftrag erfolgreich erstellt');
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Erstellen des Auftrags';
      toast.error(message);
    },
  });
};

// ============================================================================
// Clearance API Functions
// ============================================================================

/**
 * Complete clearance training for a user
 */
export async function completeClearanceTraining(clearanceId: string, data: { trainingHours?: number }) {
  const res = await api.post(`/clearances/${clearanceId}/complete-training`, data);
  return res.data;
}

/**
 * Revoke a clearance
 */
export async function revokeClearance(clearanceId: string, notes?: string) {
  const res = await api.post(`/clearances/${clearanceId}/revoke`, { notes });
  return res.data;
}

/**
 * Update a clearance
 */
export async function updateClearance(clearanceId: string, data: Partial<Clearance>) {
  const res = await api.put(`/clearances/${clearanceId}`, data);
  return res.data;
}

/**
 * Fetch single clearance by ID
 */
export async function fetchClearance(clearanceId: string) {
  const res = await api.get<{ data: Clearance }>(`/clearances/${clearanceId}`);
  return res.data.data;
}

/**
 * Fetch clearances with optional filters
 */
export async function fetchClearances(filters?: { userId?: string; siteId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.siteId) params.append('siteId', filters.siteId);
  if (filters?.status) params.append('status', filters.status);

  const res = await api.get<{ data: Clearance[] }>(`/clearances?${params.toString()}`);
  return res.data.data;
}

// ============================================================================
// Coverage & Qualification API Functions
// ============================================================================

export interface CoverageStats {
  siteId: string;
  siteName: string;
  requiredStaff: number;
  assignedStaff: number;
  coveragePercentage: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  breakdown: {
    role: string;
    required: number;
    assigned: number;
    percentage: number;
  }[];
  activeClearances: number;
}

export interface QualificationCheck {
  siteId: string;
  siteName: string;
  userId: string;
  userName: string;
  required: string[];
  has: string[];
  missing: string[];
  status: 'FULL' | 'PARTIAL' | 'NONE';
  allowOverride: boolean;
}

export interface AssignmentCandidate {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  qualifications: {
    required: string[];
    has: string[];
    missing: string[];
    status: 'FULL' | 'PARTIAL' | 'NONE';
  };
  clearance: {
    status: string;
    score: number;
  };
  score: number;
}

/**
 * GET /api/sites/:id/coverage-stats
 * Fetch coverage statistics for a site
 */
export async function fetchCoverageStats(siteId: string) {
  const res = await api.get<{ success: boolean; data: CoverageStats }>(`/sites/${siteId}/coverage-stats`);
  return res.data.data;
}

/**
 * POST /api/sites/:id/check-qualification
 * Check if a user has required qualifications for a site
 */
export async function checkUserQualification(siteId: string, userId: string) {
  const res = await api.post<{ success: boolean; data: QualificationCheck }>(
    `/sites/${siteId}/check-qualification`,
    { userId }
  );
  return res.data.data;
}

/**
 * GET /api/sites/:id/assignment-candidates
 * Get smart MA suggestions for site assignment
 */
export async function fetchAssignmentCandidates(siteId: string, role?: string) {
  const params = role ? `?role=${role}` : '';
  const res = await api.get<{
    success: boolean;
    data: {
      siteId: string;
      siteName: string;
      requiredQualifications: string[];
      candidates: AssignmentCandidate[];
    };
  }>(`/sites/${siteId}/assignment-candidates${params}`);
  return res.data.data;
}

// ============================================================================
// Shift API Functions
// ============================================================================

export type Shift = ShiftBase;

export interface GenerateShiftsPayload {
  startDate: string; // ISO 8601
  daysAhead?: number; // default: 30
}

export interface GenerateShiftsResponse {
  success: boolean;
  message: string;
  data: {
    created: number;
    stats: {
      totalShifts: number;
      totalRequiredEmployees: number;
      shiftsByName: Record<string, number>;
      averageEmployeesPerShift: number;
    };
    template: string;
  };
}

/**
 * GET /api/sites/:id/shifts
 * Fetch all shifts for a site (with optional filters)
 */
export async function fetchSiteShifts(
  siteId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  const url = `/sites/${siteId}/shifts${queryString ? `?${queryString}` : ''}`;

  const res = await api.get<{ success: boolean; data: Shift[] }>(url);
  return res.data.data;
}

/**
 * POST /api/sites/:id/generate-shifts
 * Generate shifts for a site based on security concept
 */
export async function generateShiftsForSite(siteId: string, payload: GenerateShiftsPayload) {
  const res = await api.post<GenerateShiftsResponse>(`/sites/${siteId}/generate-shifts`, payload);
  return res.data;
}

// ============================================================================
// Control Round Suggestions Types
// ============================================================================

export interface ControlPointSuggestion {
  id: string;
  name: string;
  location: string;
  order: number;
  hasNfcTag: boolean;
  hasQrCode: boolean;
  latitude?: number | null;
  longitude?: number | null;
  estimatedDuration: number; // Sekunden
  instructions?: string | null;
}

export interface RouteSegment {
  from: string; // Control Point ID
  to: string; // Control Point ID
  distance: number; // Meter
  duration: number; // Sekunden
}

export interface ControlRoundSuggestion {
  templateName: string;
  description: string;
  frequency: string;
  estimatedDuration: number; // Minuten
  controlPoints: ControlPointSuggestion[];
  optimizedRoute: string[]; // Array von Control Point IDs
  routeSegments: RouteSegment[];
  requiredTags: {
    totalPoints: number;
    withNfc: number;
    withQr: number;
    needsTag: number;
  };
}

export interface ControlRoundSuggestionsResult {
  siteId: string;
  siteName: string;
  securityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestions: ControlRoundSuggestion[];
  stats: {
    totalControlPoints: number;
    activeControlPoints: number;
    taggedPoints: number;
    untaggedPoints: number;
    averagePointsPerRound: number;
  };
}

/**
 * GET /api/sites/:id/control-round-suggestions
 * Get intelligent control round suggestions for a site
 */
export async function fetchControlRoundSuggestions(siteId: string) {
  const res = await api.get<{ success: boolean; data: ControlRoundSuggestionsResult }>(
    `/sites/${siteId}/control-round-suggestions`
  );
  return res.data.data;
}
