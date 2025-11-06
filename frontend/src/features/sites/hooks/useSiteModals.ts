/**
 * useSiteModals Hook
 * Manages all modal states for SiteDetail component
 * Extracted from SiteDetail.tsx to reduce component complexity
 */

import { useState } from 'react'
import type { Clearance } from '../api'

export interface SiteModals {
  // Clearance Modals
  trainingModal: { clearance: Clearance; hours: number } | null
  setTrainingModal: (modal: { clearance: Clearance; hours: number } | null) => void
  revokeModal: { clearance: Clearance; notes: string } | null
  setRevokeModal: (modal: { clearance: Clearance; notes: string } | null) => void
  createClearanceModal: { userId: string; notes: string } | null
  setCreateClearanceModal: (modal: { userId: string; notes: string } | null) => void

  // Assignment Modals
  createAssignmentModal: { userId: string; role: string } | null
  setCreateAssignmentModal: (modal: { userId: string; role: string } | null) => void
  deleteAssignmentId: string | null
  setDeleteAssignmentId: (id: string | null) => void
  smartAssignmentModal: boolean
  setSmartAssignmentModal: (open: boolean) => void

  // Image Modals
  uploadModal: { file: File | null; category: string } | null
  setUploadModal: (modal: { file: File | null; category: string } | null) => void
  deleteImageId: string | null
  setDeleteImageId: (id: string | null) => void

  // Document Modals
  uploadDocumentModal: {
    title: string
    description: string
    category: string
    file: File | null
  } | null
  setUploadDocumentModal: (modal: {
    title: string
    description: string
    category: string
    file: File | null
  } | null) => void
  deleteDocumentId: string | null
  setDeleteDocumentId: (id: string | null) => void
  viewDocument: {
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  } | null
  setViewDocument: (doc: {
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  } | null) => void

  // Incident Modals
  createIncidentModal: {
    title: string
    description: string
    category: string
    severity: string
    occurredAt: string
    location: string
    involvedPersons: Array<{ name: string; role?: string; isWitness?: boolean }>
  } | null
  setCreateIncidentModal: (modal: {
    title: string
    description: string
    category: string
    severity: string
    occurredAt: string
    location: string
    involvedPersons: Array<{ name: string; role?: string; isWitness?: boolean }>
  } | null) => void
  deleteIncidentId: string | null
  setDeleteIncidentId: (id: string | null) => void
  editIncident: unknown | null
  setEditIncident: (incident: unknown | null) => void
  resolveIncident: { id: string; title: string; resolution?: string } | null
  setResolveIncident: (incident: { id: string; title: string; resolution?: string } | null) => void
  viewHistory: { incidentId: string; incidentTitle: string } | null
  setViewHistory: (history: { incidentId: string; incidentTitle: string } | null) => void

  // Calculation Modals
  rejectCalculationModal: { calculationId: string; notes: string } | null
  setRejectCalculationModal: (modal: { calculationId: string; notes: string } | null) => void
  emailCalculationModal: { calculationId: string; email: string } | null
  setEmailCalculationModal: (modal: { calculationId: string; email: string } | null) => void

  // Other Modals
  deleteSiteConfirm: boolean
  setDeleteSiteConfirm: (confirm: boolean) => void
  controlRoundSuggestionsModal: boolean
  setControlRoundSuggestionsModal: (open: boolean) => void
}

export function useSiteModals(): SiteModals {
  // Clearance States
  const [trainingModal, setTrainingModal] = useState<{ clearance: Clearance; hours: number } | null>(null)
  const [revokeModal, setRevokeModal] = useState<{ clearance: Clearance; notes: string } | null>(null)
  const [createClearanceModal, setCreateClearanceModal] = useState<{ userId: string; notes: string } | null>(null)

  // Assignment States
  const [createAssignmentModal, setCreateAssignmentModal] = useState<{ userId: string; role: string } | null>(null)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null)
  const [smartAssignmentModal, setSmartAssignmentModal] = useState<boolean>(false)

  // Image States
  const [uploadModal, setUploadModal] = useState<{ file: File | null; category: string } | null>(null)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)

  // Document States
  const [uploadDocumentModal, setUploadDocumentModal] = useState<{
    title: string
    description: string
    category: string
    file: File | null
  } | null>(null)
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null)
  const [viewDocument, setViewDocument] = useState<{
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  } | null>(null)

  // Incident States
  const [createIncidentModal, setCreateIncidentModal] = useState<{
    title: string
    description: string
    category: string
    severity: string
    occurredAt: string
    location: string
    involvedPersons: Array<{ name: string; role?: string; isWitness?: boolean }>
  } | null>(null)
  const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null)
  const [editIncident, setEditIncident] = useState<unknown | null>(null)
  const [resolveIncident, setResolveIncident] = useState<{ id: string; title: string; resolution?: string } | null>(null)
  const [viewHistory, setViewHistory] = useState<{ incidentId: string; incidentTitle: string } | null>(null)

  // Calculation States
  const [rejectCalculationModal, setRejectCalculationModal] = useState<{ calculationId: string; notes: string } | null>(null)
  const [emailCalculationModal, setEmailCalculationModal] = useState<{ calculationId: string; email: string } | null>(null)

  // Other States
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState(false)
  const [controlRoundSuggestionsModal, setControlRoundSuggestionsModal] = useState<boolean>(false)

  return {
    // Clearance
    trainingModal,
    setTrainingModal,
    revokeModal,
    setRevokeModal,
    createClearanceModal,
    setCreateClearanceModal,

    // Assignment
    createAssignmentModal,
    setCreateAssignmentModal,
    deleteAssignmentId,
    setDeleteAssignmentId,
    smartAssignmentModal,
    setSmartAssignmentModal,

    // Images
    uploadModal,
    setUploadModal,
    deleteImageId,
    setDeleteImageId,

    // Documents
    uploadDocumentModal,
    setUploadDocumentModal,
    deleteDocumentId,
    setDeleteDocumentId,
    viewDocument,
    setViewDocument,

    // Incidents
    createIncidentModal,
    setCreateIncidentModal,
    deleteIncidentId,
    setDeleteIncidentId,
    editIncident,
    setEditIncident,
    resolveIncident,
    setResolveIncident,
    viewHistory,
    setViewHistory,

    // Calculations
    rejectCalculationModal,
    setRejectCalculationModal,
    emailCalculationModal,
    setEmailCalculationModal,

    // Other
    deleteSiteConfirm,
    setDeleteSiteConfirm,
    controlRoundSuggestionsModal,
    setControlRoundSuggestionsModal,
  }
}
