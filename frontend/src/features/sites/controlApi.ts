import { api } from '@/lib/api'

// ===== TYPES =====

export type ScanMethod = 'NFC' | 'QR_CODE' | 'MANUAL'
export type ControlRoundStatus = 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE' | 'CANCELLED'

export type ControlPoint = {
  id: string
  siteId: string
  name: string
  location: string
  instructions?: string
  nfcTagId?: string
  qrCode?: string
  order: number
  latitude?: number
  longitude?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    scans: number
  }
}

export type ControlScan = {
  id: string
  roundId: string
  pointId: string
  scannedBy: string
  scannedAt: string
  scanMethod: ScanMethod
  tagIdentifier: string
  latitude?: number
  longitude?: number
  accuracy?: number
  notes?: string
  hasIssue: boolean
  isValid: boolean
  validationError?: string
  point?: {
    id: string
    name: string
    location: string
    order: number
  }
  scanner?: {
    id: string
    firstName: string
    lastName: string
  }
}

export type ControlRound = {
  id: string
  siteId: string
  shiftId?: string
  performedBy: string
  startedAt: string
  completedAt?: string
  status: ControlRoundStatus
  totalPoints: number
  scannedPoints: number
  missedPoints: number
  notes?: string
  createdAt: string
  updatedAt: string
  site?: {
    id: string
    name: string
  }
  performer?: {
    id: string
    firstName: string
    lastName: string
    employeeId?: string
  }
  shift?: {
    id: string
    title: string
    startTime: string
    endTime: string
  }
  scans?: ControlScan[]
  _count?: {
    scans: number
  }
}

export type ControlStats = {
  totalPoints: number
  totalRounds: number
  completedRounds: number
  inProgressRounds: number
  avgScannedPoints: number
  completionRate: number
  period: {
    days: number
    from: string
    to: string
  }
}

// ===== CONTROL POINTS API =====

export async function fetchControlPoints(siteId: string, activeOnly?: boolean) {
  const params = new URLSearchParams()
  if (activeOnly) params.append('activeOnly', 'true')

  const res = await api.get<{ data: ControlPoint[] }>(
    `/sites/${siteId}/control-points?${params.toString()}`
  )
  return res.data.data
}

export async function fetchControlPoint(siteId: string, pointId: string) {
  const res = await api.get<{ data: ControlPoint }>(
    `/sites/${siteId}/control-points/${pointId}`
  )
  return res.data.data
}

export async function createControlPoint(
  siteId: string,
  data: {
    name: string
    location: string
    instructions?: string
    nfcTagId?: string
    qrCode?: string
    order?: number
    latitude?: number
    longitude?: number
  }
) {
  const res = await api.post<{ data: ControlPoint }>(
    `/sites/${siteId}/control-points`,
    data
  )
  return res.data.data
}

export async function updateControlPoint(
  siteId: string,
  pointId: string,
  data: Partial<{
    name: string
    location: string
    instructions: string
    nfcTagId: string
    qrCode: string
    order: number
    latitude: number
    longitude: number
    isActive: boolean
  }>
) {
  const res = await api.put<{ data: ControlPoint }>(
    `/sites/${siteId}/control-points/${pointId}`,
    data
  )
  return res.data.data
}

export async function deleteControlPoint(siteId: string, pointId: string) {
  const res = await api.delete<{ message: string }>(
    `/sites/${siteId}/control-points/${pointId}`
  )
  return res.data
}

export async function generateQRCode(siteId: string, pointId: string) {
  const res = await api.post<{ data: ControlPoint }>(
    `/sites/${siteId}/control-points/${pointId}/generate-qr`
  )
  return res.data.data
}

export async function fetchControlPointHistory(
  pointId: string,
  options?: { limit?: number; offset?: number }
) {
  const params = new URLSearchParams()
  if (options?.limit) params.append('limit', String(options.limit))
  if (options?.offset) params.append('offset', String(options.offset))

  const res = await api.get<{
    data: ControlScan[]
    pagination: { total: number; limit: number; offset: number }
  }>(`/control-points/${pointId}/history?${params.toString()}`)
  return res.data
}

// ===== CONTROL ROUNDS API =====

export async function fetchControlRounds(
  siteId: string,
  filters?: {
    status?: ControlRoundStatus
    performedBy?: string
    limit?: number
    offset?: number
  }
) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.performedBy) params.append('performedBy', filters.performedBy)
  if (filters?.limit) params.append('limit', String(filters.limit))
  if (filters?.offset) params.append('offset', String(filters.offset))

  const res = await api.get<{
    data: ControlRound[]
    pagination: { total: number; limit: number; offset: number }
  }>(`/sites/${siteId}/control-rounds?${params.toString()}`)
  return res.data
}

export async function fetchControlRound(roundId: string) {
  const res = await api.get<{ data: ControlRound }>(`/control-rounds/${roundId}`)
  return res.data.data
}

export async function startControlRound(
  siteId: string,
  data: { shiftId?: string; notes?: string }
) {
  const res = await api.post<{ data: ControlRound }>(
    `/sites/${siteId}/control-rounds`,
    data
  )
  return res.data.data
}

export async function completeControlRound(
  roundId: string,
  data: { notes?: string; status?: ControlRoundStatus }
) {
  const res = await api.put<{ data: ControlRound }>(
    `/control-rounds/${roundId}/complete`,
    data
  )
  return res.data.data
}

export async function fetchControlStats(siteId: string, days?: number) {
  const params = new URLSearchParams()
  if (days) params.append('days', String(days))

  const res = await api.get<{ data: ControlStats }>(
    `/sites/${siteId}/control-stats?${params.toString()}`
  )
  return res.data.data
}
