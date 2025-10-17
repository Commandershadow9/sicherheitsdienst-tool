export type AbsenceStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type AbsenceType = 'VACATION' | 'SICKNESS' | 'SPECIAL_LEAVE' | 'UNPAID'
export type ClearanceStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'

export type ObjectClearance = {
  id: string
  status: ClearanceStatus
  trainedAt: string
  validUntil?: string | null
  site: {
    id: string
    name: string
    address: string
  }
}

export type ReplacementCandidate = {
  id: string
  firstName: string
  lastName: string
  email: string
  clearanceStatus: string
  clearanceTrainedAt: string
  clearanceValidUntil: string | null
}

// v2 API - Intelligent Replacement mit Scoring (v1.8.0)
export type ReplacementCandidateV2 = {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  hasRequiredQualifications: boolean
  missingQualifications: string[]
  siteAccessStatus: 'CLEARED' | 'NOT_CLEARED' | 'EXPIRED'
  isAvailable: boolean
  score: {
    total: number
    recommendation: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED'
    color: 'green' | 'yellow' | 'orange' | 'red'
    workload: number
    compliance: number
    fairness: number
    preference: number
    objectClearance?: number // v1.11.0+ Object-Clearance-Score
  }
  metrics: {
    currentHours: number
    targetHours: number
    utilizationPercent: number
    utilizationAfterAssignment: number
    restHours: number
    weeklyHours: number
    consecutiveDays: number
    nightShiftCount: number
    avgNightShiftCount: number
    replacementCount: number
    avgReplacementCount: number
  }
  warnings: ReplacementCandidateWarning[]
}

export type ReplacementCandidateWarning = {
  type:
    | 'REST_TIME'
    | 'OVERWORKED'
    | 'CONSECUTIVE_DAYS'
    | 'PREFERENCE_MISMATCH'
    | 'PENDING_ABSENCE_REQUEST'
  severity: 'info' | 'warning' | 'error'
  message: string
}

export type AffectedShift = {
  id: string
  title: string
  startTime: string
  endTime: string
  site: {
    id: string
    name: string
  } | null
  requiredEmployees: number
  availableEmployees: number
  hasCapacityWarning: boolean
  needsReplacement?: boolean
}

export type LeaveDaysSaldo = {
  annualLeaveDays: number
  takenDays: number
  requestedDays: number
  remainingDays: number
  remainingAfterApproval: number
}

export type Absence = {
  id: string
  type: AbsenceType
  status: AbsenceStatus
  startsAt: string
  endsAt: string
  reason?: string | null
  decisionNote?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  decidedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
  objectClearances?: ObjectClearance[]
  affectedShifts?: AffectedShift[]
  leaveDaysSaldo?: LeaveDaysSaldo | null
  documents?: Array<{
    id: string
    filename: string
    mimeType: string
    size: number
    createdAt: string
    uploadedBy: string
  }>
}

export type AbsenceListResponse = {
  data: Absence[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type ShiftConflict = {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
}

export type CapacityWarning = {
  shiftId: string
  shiftTitle: string
  siteId: string
  siteName: string
  date: string
  required: number
  available: number
  shortage: number
}
