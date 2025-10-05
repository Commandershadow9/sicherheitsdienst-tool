import type { AbsenceType, AffectedShift } from '@/features/absences/types'

export type CriticalShift = {
  shiftId: string
  shiftTitle: string
  siteName: string
  startTime: string
  endTime: string
  requiredEmployees: number
  availableEmployees: number
  shortage: number
  reasons: Array<{
    employeeName: string
    reason: string
  }>
}

export type PendingApproval = {
  absenceId: string
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  type: AbsenceType
  startsAt: string
  endsAt: string
  requestedDays: number
  reason: string | null
  createdAt: string
  warnings: {
    affectedShifts: number
    criticalShifts: number
    leaveDaysExceeded: boolean
    shiftDetails: PendingShiftDetail[]
  }
}

export type PendingShiftDetail = AffectedShift & {
  needsReplacement: boolean
}

export type UpcomingWarning = {
  date: string
  shiftId: string
  shiftTitle: string
  siteName: string
  startTime: string
  endTime: string
  requiredEmployees: number
  availableEmployees: number
  shortage: number
}

export type DashboardStats = {
  totalEmployees: number
  availableToday: number
  onVacation: number
  onSickLeave: number
  pendingApprovals: number
  criticalShiftsToday: number
  upcomingWarnings: number
}

export type CriticalShiftsResponse = { data: CriticalShift[] }
export type PendingApprovalsResponse = { data: PendingApproval[] }
export type WarningsResponse = { data: UpcomingWarning[] }
export type StatsResponse = { data: DashboardStats }
