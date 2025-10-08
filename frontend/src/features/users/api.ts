import { api } from '@/lib/api'

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'TEMPORARY' | 'CONTRACTOR'
export type DocumentCategory =
  | 'FIREARM_LICENSE'
  | 'WARNING_LETTER'
  | 'CONTRACT'
  | 'TRAINING_CERTIFICATE'
  | 'MEDICAL_CERTIFICATE'
  | 'OTHER'

export type EmployeeQualification = {
  id: string
  title: string
  description?: string | null
  validFrom?: string | null
  validUntil?: string | null
}

export type EmployeeDocument = {
  id: string
  category: DocumentCategory
  filename: string
  mimeType: string
  size: number
  storedAt: string | null
  issuedAt?: string | null
  expiresAt?: string | null
  createdAt: string
  uploadedBy: string
}

export type EmployeeProfile = {
  id: string
  address?: {
    street?: string
    postalCode?: string
    city?: string
    country?: string
  } | null
  birthDate?: string | null
  phone?: string | null
  employmentType: EmploymentType
  employmentStart?: string | null
  employmentEnd?: string | null
  workSchedule?: string | null
  hourlyRate?: string | null
  weeklyTargetHours?: number | null
  monthlyTargetHours?: number | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type EmployeePreferences = {
  userId: string
  prefersNightShifts: boolean
  prefersDayShifts: boolean
  prefersWeekends: boolean
  targetMonthlyHours: number
  minMonthlyHours: number
  maxMonthlyHours: number
  flexibleHours: boolean
  prefersLongShifts: boolean
  prefersShortShifts: boolean
  prefersConsecutiveDays: number | null
  minRestDaysPerWeek: number
  preferredSiteIds: string[]
  avoidedSiteIds: string[]
  notes: string | null
}

export type UserProfileResponse = {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    employeeId?: string | null
    hireDate?: string | null
    qualifications: string[]
  }
  profile: EmployeeProfile | null
  qualifications: EmployeeQualification[]
  documents: EmployeeDocument[]
  timeSummary: {
    last7Days: number
    last30Days: number
    yearToDate: number
  }
  upcomingAbsences: Array<{
    id: string
    type: string
    status: string
    startsAt: string
    endsAt: string
  }>
}

export async function fetchUserProfile(userId: string) {
  const res = await api.get<{ data: UserProfileResponse }>(`/users/${userId}/profile`)
  return res.data.data
}

export async function updateUserProfile(userId: string, payload: Partial<EmployeeProfile>) {
  const res = await api.put<{ success: boolean; data: UserProfileResponse }>(`/users/${userId}/profile`, payload)
  return res.data.data
}

export async function addQualification(userId: string, payload: { title: string; description?: string; validFrom?: string; validUntil?: string }) {
  const res = await api.post<{ success: boolean; data: UserProfileResponse }>(`/users/${userId}/profile/qualifications`, payload)
  return res.data.data
}

export async function deleteQualification(userId: string, qualificationId: string) {
  const res = await api.delete<{ success: boolean; data: UserProfileResponse }>(
    `/users/${userId}/profile/qualifications/${qualificationId}`,
  )
  return res.data.data
}

export async function addDocument(
  userId: string,
  payload: {
    category: DocumentCategory
    filename: string
    mimeType?: string
    size?: number
    storedAt?: string
    issuedAt?: string
    expiresAt?: string
  },
) {
  const res = await api.post<{ success: boolean; data: UserProfileResponse }>(`/users/${userId}/profile/documents`, payload)
  return res.data.data
}

export async function deleteDocument(userId: string, documentId: string) {
  const res = await api.delete<{ success: boolean; data: UserProfileResponse }>(
    `/users/${userId}/profile/documents/${documentId}`,
  )
  return res.data.data
}

export async function fetchEmployeePreferences(userId: string) {
  const res = await api.get<{ success: boolean; data: EmployeePreferences }>(`/users/${userId}/preferences`)
  return res.data.data
}

export async function updateEmployeePreferences(userId: string, payload: Partial<EmployeePreferences>) {
  const res = await api.put<{ success: boolean; data: EmployeePreferences }>(`/users/${userId}/preferences`, payload)
  return res.data.data
}
