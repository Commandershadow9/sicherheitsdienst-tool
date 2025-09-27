export type AbsenceStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type AbsenceType = 'VACATION' | 'SICKNESS' | 'SPECIAL_LEAVE' | 'UNPAID'

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
