/**
 * useSiteMutations Hook
 * Consolidates all data mutations for SiteDetail component
 * Extracted from SiteDetail.tsx to reduce component complexity
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { toastSuccess, toastError } from '@/lib/toast-helpers'
import {
  completeClearanceTraining,
  revokeClearance,
  generateShiftsForSite,
  type GenerateShiftsPayload,
  type Clearance,
} from '../api'
import {
  sendSiteCalculation,
  acceptSiteCalculation,
  rejectSiteCalculation,
  archiveSiteCalculation,
  duplicateSiteCalculation,
  sendCalculationEmailAPI,
} from '../calculationApi'
import type { Site } from '../types/site'

interface UseSiteMutationsParams {
  siteId: string | undefined
  site: Site | undefined
  trainingModal: { clearance: Clearance; hours: number } | null
  setTrainingModal: (modal: { clearance: Clearance; hours: number } | null) => void
  revokeModal: { clearance: Clearance } | null
  setRevokeModal: (modal: { clearance: Clearance } | null) => void
  setUploadModal: (open: boolean) => void
  setDeleteImageId: (id: string | null) => void
  setUploadDocumentModal: (open: boolean) => void
  setDeleteDocumentId: (id: string | null) => void
  setCreateClearanceModal: (open: boolean) => void
  setCreateAssignmentModal: (open: boolean) => void
  setDeleteAssignmentId: (id: string | null) => void
  setCreateIncidentModal: (open: boolean) => void
  setEditIncident: (incident: any) => void
  setResolveIncident: (incident: any) => void
  setDeleteIncidentId: (id: string | null) => void
  setRejectCalculationModal: (calc: any) => void
  setEmailCalculationModal: (calc: any) => void
}

export function useSiteMutations({
  siteId,
  site,
  trainingModal,
  setTrainingModal,
  revokeModal,
  setRevokeModal,
  setUploadModal,
  setDeleteImageId,
  setUploadDocumentModal,
  setDeleteDocumentId,
  setCreateClearanceModal,
  setCreateAssignmentModal,
  setDeleteAssignmentId,
  setCreateIncidentModal,
  setEditIncident,
  setResolveIncident,
  setDeleteIncidentId,
  setRejectCalculationModal,
  setEmailCalculationModal,
}: UseSiteMutationsParams) {
  const queryClient = useQueryClient()
  const nav = useNavigate()

  // Clearance Mutations
  const completeTrainingMutation = useMutation({
    mutationFn: (data: { id: string; hours: number }) =>
      completeClearanceTraining(data.id, { trainingHours: data.hours }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      if (trainingModal && site) {
        const userName = `${trainingModal.clearance.user.firstName} ${trainingModal.clearance.user.lastName}`
        toastSuccess.clearanceCompleted(userName, site.name)
      } else {
        toast.success('Training erfolgreich abgeschlossen')
      }
      setTrainingModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Abschließen des Trainings', error?.response?.data?.message)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => revokeClearance(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      if (revokeModal && site) {
        const userName = `${revokeModal.clearance.user.firstName} ${revokeModal.clearance.user.lastName}`
        toastSuccess.clearanceRevoked(userName, site.name)
      } else {
        toast.success('Clearance erfolgreich widerrufen')
      }
      setRevokeModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Widerrufen der Clearance', error?.response?.data?.message)
    },
  })

  const createClearanceMutation = useMutation({
    mutationFn: async (data: { userId: string; notes: string }) => {
      const res = await api.post('/clearances', {
        userId: data.userId,
        siteId,
        status: 'TRAINING',
        notes: data.notes,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Clearance erfolgreich angelegt')
      setCreateClearanceModal(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Anlegen')
    },
  })

  // Image Mutations
  const uploadImageMutation = useMutation({
    mutationFn: async (data: { file: File; category: string }) => {
      const formData = new FormData()
      formData.append('image', data.file)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${siteId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.imageUploaded(variables.category)
      setUploadModal(false)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Bild', error?.response?.data?.message)
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/sites/${siteId}/images/${imageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.imageDeleted()
      setDeleteImageId(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Löschen', error?.response?.data?.message)
    },
  })

  // Document Mutations
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; file: File }) => {
      const formData = new FormData()
      formData.append('document', data.file)
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${siteId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.documentUploaded(variables.title, variables.category)
      setUploadDocumentModal(false)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Dokument', error?.response?.data?.message)
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/sites/${siteId}/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toastSuccess.generic('Dokument gelöscht', 'Das Dokument wurde erfolgreich entfernt')
      setDeleteDocumentId(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Löschen', error?.response?.data?.message)
    },
  })

  // Assignment Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const res = await api.post(`/sites/${siteId}/assignments`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Zuweisung erfolgreich erstellt')
      setCreateAssignmentModal(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Zuweisung')
    },
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/sites/${siteId}/assignments/${assignmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Zuweisung erfolgreich entfernt')
      setDeleteAssignmentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Entfernen der Zuweisung')
    },
  })

  // Site Mutation
  const deleteSiteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/sites/${siteId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Objekt erfolgreich gelöscht')
      nav('/sites')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen des Objekts')
    },
  })

  // Incident Mutations
  const createIncidentMutation = useMutation({
    mutationFn: async (data: {
      title: string
      description: string
      category: string
      severity: string
      occurredAt: string
      location?: string
      involvedPersons?: string
    }) => {
      const res = await api.post(`/sites/${siteId}/incidents`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall erfolgreich gemeldet')
      setCreateIncidentModal(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Melden des Vorfalls')
    },
  })

  const updateIncidentMutation = useMutation({
    mutationFn: async ({
      incidentId,
      data,
    }: {
      incidentId: string
      data: Partial<{
        title: string
        description: string
        category: string
        severity: string
        location?: string
        involvedPersons?: string
      }>
    }) => {
      const res = await api.put(`/sites/${siteId}/incidents/${incidentId}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall erfolgreich aktualisiert')
      setEditIncident(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren des Vorfalls')
    },
  })

  const resolveIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, resolution }: { incidentId: string; resolution: string }) => {
      const res = await api.put(`/sites/${siteId}/incidents/${incidentId}/resolve`, { resolution })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall als gelöst markiert')
      setResolveIncident(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Auflösen des Vorfalls')
    },
  })

  const deleteIncidentMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      await api.delete(`/sites/${siteId}/incidents/${incidentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      toast.success('Vorfall erfolgreich gelöscht')
      setDeleteIncidentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen des Vorfalls')
    },
  })

  // Calculation Mutations
  const sendCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => sendSiteCalculation(siteId!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      toast.success('Kalkulation erfolgreich versendet')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Versenden der Kalkulation')
    },
  })

  const acceptCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => acceptSiteCalculation(siteId!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      toast.success('Kalkulation erfolgreich angenommen')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Annehmen der Kalkulation')
    },
  })

  const rejectCalculationMutation = useMutation({
    mutationFn: ({ calculationId, notes }: { calculationId: string; notes?: string }) =>
      rejectSiteCalculation(siteId!, calculationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      toast.success('Kalkulation erfolgreich abgelehnt')
      setRejectCalculationModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Ablehnen der Kalkulation')
    },
  })

  const archiveCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => archiveSiteCalculation(siteId!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      toast.success('Kalkulation erfolgreich archiviert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Archivieren der Kalkulation')
    },
  })

  const duplicateCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => duplicateSiteCalculation(siteId!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', siteId] })
      toast.success('Kalkulation erfolgreich dupliziert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Duplizieren der Kalkulation')
    },
  })

  const sendEmailCalculationMutation = useMutation({
    mutationFn: ({ calculationId, email }: { calculationId: string; email: string }) =>
      sendCalculationEmailAPI(siteId!, calculationId, email),
    onSuccess: () => {
      toast.success('E-Mail wird versendet')
      setEmailCalculationModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Versenden der E-Mail')
    },
  })

  // Shifts Mutation
  const generateShiftsMutation = useMutation({
    mutationFn: (payload: GenerateShiftsPayload) => generateShiftsForSite(siteId!, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', siteId] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren der Schichten')
    },
  })

  return {
    // Clearance mutations
    completeTrainingMutation,
    revokeMutation,
    createClearanceMutation,

    // Image mutations
    uploadImageMutation,
    deleteImageMutation,

    // Document mutations
    uploadDocumentMutation,
    deleteDocumentMutation,

    // Assignment mutations
    createAssignmentMutation,
    deleteAssignmentMutation,

    // Site mutation
    deleteSiteMutation,

    // Incident mutations
    createIncidentMutation,
    updateIncidentMutation,
    resolveIncidentMutation,
    deleteIncidentMutation,

    // Calculation mutations
    sendCalculationMutation,
    acceptCalculationMutation,
    rejectCalculationMutation,
    archiveCalculationMutation,
    duplicateCalculationMutation,
    sendEmailCalculationMutation,

    // Shifts mutation
    generateShiftsMutation,
  }
}
