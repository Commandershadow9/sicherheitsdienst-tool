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
