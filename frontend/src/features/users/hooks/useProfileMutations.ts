/**
 * useProfileMutations Hook
 * Consolidates all data mutations for UserProfile component
 * Extracted from UserProfile.tsx to reduce component complexity
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  updateUserProfile,
  addQualification,
  deleteQualification,
  addDocument,
  deleteDocument,
  type DocumentCategory,
} from '../api'
import { createAbsence } from '@/features/absences/api'
import type { AbsenceType } from '@/features/absences/types'

interface UseProfileMutationsParams {
  targetId: string | null
  setAbsenceModalOpen: (open: boolean) => void
  setDocumentFile: (file: File | null) => void
  documentFileInputRef: React.RefObject<HTMLInputElement | null>
  absenceForm: any // react-hook-form form instance
  documentForm: any // react-hook-form form instance
  qualificationForm: any // react-hook-form form instance
  todayIso: string
}

interface ProfileUpdateValues {
  addressStreet?: string
  addressPostalCode?: string
  addressCity?: string
  addressCountry?: string
  birthDate?: string
  phone?: string
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'TEMPORARY' | 'CONTRACTOR'
  employmentStart?: string
  employmentEnd?: string
  workSchedule?: string
  hourlyRate?: string
  weeklyTargetHours?: string
  monthlyTargetHours?: string
  notes?: string
}

interface QualificationValues {
  title: string
  description?: string
  validFrom?: string
  validUntil?: string
}

interface DocumentValues {
  category: DocumentCategory
  filename: string
  issuedAt?: string
  expiresAt?: string
}

interface AbsenceValues {
  type: AbsenceType
  startsAt: string
  endsAt: string
  reason?: string
}

function readFileAsDataUrl(file: File) {
  return new Promise<{ dataUrl: string; size: number; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve({ dataUrl: result, size: file.size, mimeType: file.type || 'application/octet-stream' })
    }
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

export function useProfileMutations({
  targetId,
  setAbsenceModalOpen,
  setDocumentFile,
  documentFileInputRef,
  absenceForm,
  documentForm,
  qualificationForm,
  todayIso,
}: UseProfileMutationsParams) {
  const queryClient = useQueryClient()

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: (values: ProfileUpdateValues) =>
      updateUserProfile(targetId!, {
        address: {
          street: values.addressStreet || undefined,
          postalCode: values.addressPostalCode || undefined,
          city: values.addressCity || undefined,
          country: values.addressCountry || undefined,
        },
        birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : undefined,
        phone: values.phone || undefined,
        employmentType: values.employmentType,
        employmentStart: values.employmentStart ? new Date(values.employmentStart).toISOString() : undefined,
        employmentEnd: values.employmentEnd ? new Date(values.employmentEnd).toISOString() : undefined,
        workSchedule: values.workSchedule || undefined,
        hourlyRate: values.hourlyRate || undefined,
        weeklyTargetHours: values.weeklyTargetHours ? Number(values.weeklyTargetHours) : undefined,
        monthlyTargetHours: values.monthlyTargetHours ? Number(values.monthlyTargetHours) : undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Profil aktualisiert')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Aktualisierung fehlgeschlagen')
    },
  })

  // Qualification add mutation
  const qualificationMutation = useMutation({
    mutationFn: (values: QualificationValues) =>
      addQualification(targetId!, {
        title: values.title,
        description: values.description || undefined,
        validFrom: values.validFrom ? new Date(values.validFrom).toISOString() : undefined,
        validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Qualifikation gespeichert')
      qualificationForm.reset()
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Qualifikation konnte nicht gespeichert werden')
    },
  })

  // Qualification delete mutation
  const qualificationDeleteMutation = useMutation({
    mutationFn: (qualificationId: string) => deleteQualification(targetId!, qualificationId),
    onSuccess: () => {
      toast.success('Qualifikation entfernt')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Qualifikation konnte nicht entfernt werden')
    },
  })

  // Document add mutation
  const documentMutation = useMutation({
    mutationFn: async ({ values, file }: { values: DocumentValues; file: File | null }) => {
      const payload: {
        category: DocumentCategory
        filename: string
        issuedAt?: string
        expiresAt?: string
        mimeType?: string
        size?: number
        storedAt?: string
      } = {
        category: values.category,
        filename: values.filename,
      }
      if (values.issuedAt) {
        payload.issuedAt = new Date(values.issuedAt).toISOString()
      }
      if (values.expiresAt) {
        payload.expiresAt = new Date(values.expiresAt).toISOString()
      }
      if (file) {
        const maxBytes = 20 * 1024 * 1024
        if (file.size > maxBytes) {
          throw new Error('Datei darf maximal 20 MB groß sein')
        }
        const { dataUrl, size, mimeType } = await readFileAsDataUrl(file)
        payload.mimeType = mimeType
        payload.size = size
        payload.storedAt = dataUrl
      }
      return addDocument(targetId!, payload)
    },
    onSuccess: () => {
      toast.success('Dokument erfasst')
      documentForm.reset({ category: 'OTHER', filename: '', issuedAt: '', expiresAt: '' })
      setDocumentFile(null)
      if (documentFileInputRef.current) {
        documentFileInputRef.current.value = ''
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Dokument konnte nicht erfasst werden'
      toast.error(message)
    },
  })

  // Document delete mutation
  const documentDeleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(targetId!, documentId),
    onSuccess: () => {
      toast.success('Dokument entfernt')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Dokument konnte nicht entfernt werden')
    },
  })

  // Absence create mutation
  const absenceMutation = useMutation({
    mutationFn: (values: AbsenceValues) =>
      createAbsence({
        userId: targetId!,
        type: values.type as AbsenceType,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        reason: values.reason?.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success('Abwesenheit erfasst')
      absenceForm.reset({ type: 'VACATION', startsAt: todayIso, endsAt: todayIso, reason: '' })
      setAbsenceModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
      queryClient.invalidateQueries({ queryKey: ['user-absences', targetId] })
      if (result.conflicts && result.conflicts.length > 0) {
        toast.warning(`Es bestehen ${result.conflicts.length} Schichtkonflikte.`)
      }
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Abwesenheit konnte nicht gespeichert werden'
      toast.error(message)
    },
  })

  return {
    // Profile mutation
    updateMutation,

    // Qualification mutations
    qualificationMutation,
    qualificationDeleteMutation,

    // Document mutations
    documentMutation,
    documentDeleteMutation,

    // Absence mutation
    absenceMutation,
  }
}
