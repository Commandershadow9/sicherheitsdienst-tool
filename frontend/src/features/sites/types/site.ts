/**
 * Site-related type definitions
 * Extracted from SiteDetail.tsx for better maintainability
 */

export type SiteStatus = 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST'

export type Site = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  customerName?: string
  customerCompany?: string
  customerEmail?: string
  customerPhone?: string
  emergencyContacts?: Array<{ name: string; phone: string; role?: string }>
  status?: SiteStatus
  requiredStaff?: number
  requiredQualifications?: string[]
  description?: string
  notes?: string
  images?: Array<{
    id: string
    filename: string
    category: string
    uploadedAt: string
    uploader: { firstName: string; lastName: string }
  }>
  assignments?: Array<{
    id: string
    role: string
    user: { id: string; firstName: string; lastName: string; email: string }
  }>
  clearances?: Array<{
    id: string
    status: string
    user: { id: string; firstName: string; lastName: string }
    trainingCompletedAt?: string
  }>
  documents?: Array<{
    id: string
    title: string
    description?: string
    category: string
    filename: string
    fileSize: number
    mimeType: string
    version: number
    isLatest: boolean
    uploadedAt: string
    uploader: { id: string; firstName: string; lastName: string }
  }>
  incidents?: Array<{
    id: string
    title: string
    description?: string
    category: string
    severity: string
    status: string
    occurredAt: string
    reportedAt: string
    location?: string
    involvedPersons?: string
    resolvedAt?: string
    resolution?: string
    reporter: { id: string; firstName: string; lastName: string }
  }>
  securityConcept?: {
    tasks?: string[]
    shiftModel?: string
    hoursPerWeek?: number
    templateId?: string
    templateName?: string
  }
  securityConcepts?: Array<{
    id: string
    status: string
    staffRequirements?: {
      anzahlMA?: number
      qualifikationen?: string[]
    }
    taskProfiles?: {
      objektleiter?: {
        required: boolean
        qualifikationen?: string[]
      }
      schichtleiter?: {
        required: boolean
        qualifikationen?: string[]
      }
    }
    shiftModel?: unknown
  }>
}

export type TabType = 'overview' | 'clearances' | 'shifts' | 'images' | 'documents' | 'incidents' | 'control-points' | 'control-rounds' | 'calculations' | 'security-concept'
