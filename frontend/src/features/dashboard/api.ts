import { api } from '@/lib/api'
import type {
  CriticalShift,
  CriticalShiftsResponse,
  PendingApproval,
  PendingApprovalsResponse,
  UpcomingWarning,
  WarningsResponse,
  DashboardStats,
  StatsResponse,
} from './types'
import type { ReplacementCandidate, ReplacementCandidateV2 } from '@/features/absences/types'

export async function fetchCriticalShifts() {
  const res = await api.get<CriticalShiftsResponse>('/dashboard/critical')
  return res.data.data
}

export async function fetchPendingApprovals() {
  const res = await api.get<PendingApprovalsResponse>('/dashboard/pending-approvals')
  return res.data.data
}

export async function fetchWarnings(days = 7) {
  const res = await api.get<WarningsResponse>('/dashboard/warnings', { params: { days } })
  return res.data.data
}

export async function fetchDashboardStats() {
  const res = await api.get<StatsResponse>('/dashboard/stats')
  return res.data.data
}

export async function fetchCriticalIncidents(days = 7, limit = 10) {
  const res = await api.get('/stats/critical-incidents', { params: { days, limit } })
  return res.data.data
}

export async function fetchShiftReplacementCandidates(shiftId: string, absentUserId?: string) {
  const params = absentUserId ? { absentUserId } : undefined
  const res = await api.get<{ data: ReplacementCandidate[] }>(`/shifts/${shiftId}/replacement-candidates`, {
    params,
  })
  return res.data.data
}

export async function fetchShiftReplacementCandidatesV2(shiftId: string, absentUserId?: string) {
  const params = absentUserId ? { absentUserId } : undefined
  const res = await api.get<{ data: ReplacementCandidateV2[] }>(`/shifts/${shiftId}/replacement-candidates/v2`, {
    params,
  })
  return res.data.data
}
