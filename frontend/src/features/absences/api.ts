import { api } from '@/lib/api'
import type { Absence, AbsenceListResponse, AbsenceStatus, AbsenceType, ShiftConflict } from './types'

export async function fetchAbsences(params: Record<string, unknown>) {
  const res = await api.get<AbsenceListResponse>('/absences', { params })
  return res.data
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

export async function approveAbsence(id: string, decisionNote?: string) {
  const res = await api.post<{ success: boolean; data: Absence }>(`/absences/${id}/approve`, {
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
