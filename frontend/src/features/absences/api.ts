import { api } from '@/lib/api'
import type {
  Absence,
  AbsenceListResponse,
  AbsenceStatus,
  AbsenceType,
  ShiftConflict,
  CapacityWarning,
  ReplacementCandidateV2,
} from './types'

export async function fetchAbsences(params: Record<string, unknown>) {
  const res = await api.get<AbsenceListResponse>('/absences', { params })
  return res.data
}

export async function fetchAbsenceById(id: string) {
  const res = await api.get<{ data: Absence }>(`/absences/${id}`)
  return res.data.data
}

export async function createAbsence(payload: {
  userId?: string
  type: AbsenceType
  startsAt: string
  endsAt: string
  reason?: string
}) {
  const res = await api.post<{ success: boolean; data: Absence; conflicts?: ShiftConflict[] }>('/absences', payload)
  return res.data
}

export async function previewCapacityWarnings(id: string) {
  const res = await api.get<{ warnings: CapacityWarning[] }>(`/absences/${id}/preview-warnings`)
  return res.data
}

export async function approveAbsence(id: string, decisionNote?: string) {
  const res = await api.post<{ success: boolean; data: Absence; capacityWarnings?: CapacityWarning[] }>(`/absences/${id}/approve`, {
    decisionNote: decisionNote || undefined,
  })
  return res.data
}

export async function rejectAbsence(id: string, decisionNote?: string) {
  const res = await api.post<{ success: boolean; data: Absence }>(`/absences/${id}/reject`, {
    decisionNote: decisionNote || undefined,
  })
  return res.data
}

export async function cancelAbsence(id: string) {
  const res = await api.post<{ success: boolean; data: Absence }>(`/absences/${id}/cancel`, {})
  return res.data
}

export async function getReplacementCandidates(absenceId: string, shiftId?: string) {
  const params = shiftId ? { shiftId } : {}
  const res = await api.get<{
    data:
      | { shiftId: string; candidates: any[] }
      | Array<{ shiftId: string; shiftTitle: string; candidates: any[] }>
  }>(`/absences/${absenceId}/replacement-candidates`, { params })
  return res.data.data
}

/**
 * v2 API - Intelligent Replacement mit Scoring (v1.8.0)
 * Holt Ersatz-Kandidaten mit detailliertem Scoring
 */
export async function getReplacementCandidatesV2(shiftId: string, absentUserId?: string) {
  const params = absentUserId ? { absentUserId } : {}
  const res = await api.get<{
    success: boolean
    data: ReplacementCandidateV2[]
    meta: {
      shift: { id: string; title: string; startTime: string; endTime: string; siteId: string }
      totalCandidates: number
      optimalCandidates: number
      goodCandidates: number
    }
  }>(`/shifts/${shiftId}/replacement-candidates-v2`, { params })
  return res.data
}
