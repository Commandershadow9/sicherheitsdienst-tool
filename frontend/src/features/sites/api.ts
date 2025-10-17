import { api } from '@/lib/api'

// Types
export type SiteStatus = 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST'
export type ClearanceStatus = 'ACTIVE' | 'TRAINING' | 'EXPIRED' | 'REVOKED'

export type Clearance = {
  id: string
  userId: string
  siteId: string
  status: ClearanceStatus
  trainedAt: string
  validUntil?: string
  notes?: string
  trainingCompletedAt?: string
  trainingHours?: number
  approvedBy?: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  trainer?: {
    id: string
    firstName: string
    lastName: string
  }
  approver?: {
    id: string
    firstName: string
    lastName: string
  }
}

// Clearance API
export async function completeClearanceTraining(clearanceId: string, data: { trainingHours?: number }) {
  const res = await api.post(`/clearances/${clearanceId}/complete-training`, data)
  return res.data
}

export async function revokeClearance(clearanceId: string, notes?: string) {
  const res = await api.post(`/clearances/${clearanceId}/revoke`, { notes })
  return res.data
}

export async function updateClearance(clearanceId: string, data: Partial<Clearance>) {
  const res = await api.put(`/clearances/${clearanceId}`, data)
  return res.data
}

export async function fetchClearance(clearanceId: string) {
  const res = await api.get<{ data: Clearance }>(`/clearances/${clearanceId}`)
  return res.data.data
}

export async function fetchClearances(filters?: { userId?: string; siteId?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.userId) params.append('userId', filters.userId)
  if (filters?.siteId) params.append('siteId', filters.siteId)
  if (filters?.status) params.append('status', filters.status)

  const res = await api.get<{ data: Clearance[] }>(`/clearances?${params.toString()}`)
  return res.data.data
}
