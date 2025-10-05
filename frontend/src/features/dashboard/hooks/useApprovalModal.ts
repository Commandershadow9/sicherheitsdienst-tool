import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PendingApproval } from '../types'
import type { CapacityWarning } from '@/features/absences/types'
import { approveAbsence, rejectAbsence, previewCapacityWarnings } from '@/features/absences/api'

/**
 * Custom Hook für Approval Modal State & Logik
 * Verwaltet: Modal Open/Close, Mode (approve/reject), Capacity Warnings, Mutations
 */
export function useApprovalModal() {
  const queryClient = useQueryClient()

  // State
  const [open, setOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [mode, setMode] = useState<'approve' | 'reject'>('approve')
  const [warningDetails, setWarningDetails] = useState<CapacityWarning[] | undefined>(undefined)
  const [warningError, setWarningError] = useState<string | null>(null)
  const [warningLoading, setWarningLoading] = useState(false)

  // Helper: Dashboard Queries invalidieren
  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'dashboard',
    })
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'absences',
    })
  }, [queryClient])

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => approveAbsence(id, note || undefined),
    onSuccess: () => {
      toast.success('Abwesenheit genehmigt')
      invalidateDashboard()
      setOpen(false)
      setSelectedApproval(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Genehmigung fehlgeschlagen')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectAbsence(id, note || undefined),
    onSuccess: () => {
      toast.success('Abwesenheit abgelehnt')
      invalidateDashboard()
      setOpen(false)
      setSelectedApproval(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ablehnung fehlgeschlagen')
    },
  })

  // Actions
  const openModal = useCallback(async (approval: PendingApproval, modalMode: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setMode(modalMode)
    setOpen(true)

    if (modalMode === 'approve') {
      setWarningLoading(true)
      setWarningError(null)
      setWarningDetails(undefined)
      try {
        const result = await previewCapacityWarnings(approval.absenceId)
        setWarningDetails(result.warnings as CapacityWarning[])
      } catch (error: any) {
        setWarningError(error?.response?.data?.message || 'Kapazitätsprüfung fehlgeschlagen')
      } finally {
        setWarningLoading(false)
      }
    } else {
      setWarningDetails(undefined)
      setWarningError(null)
      setWarningLoading(false)
    }
  }, [])

  const closeModal = useCallback(() => {
    if (approveMutation.isPending || rejectMutation.isPending) return
    setOpen(false)
    setSelectedApproval(null)
    setWarningDetails(undefined)
    setWarningError(null)
  }, [approveMutation.isPending, rejectMutation.isPending])

  const submitModal = useCallback(
    (note: string) => {
      if (!selectedApproval) return

      if (mode === 'approve') {
        approveMutation.mutate({ id: selectedApproval.absenceId, note })
      } else {
        rejectMutation.mutate({ id: selectedApproval.absenceId, note })
      }
    },
    [selectedApproval, mode, approveMutation, rejectMutation]
  )

  return {
    // State
    open,
    selectedApproval,
    mode,
    warningDetails,
    warningError,
    warningLoading,
    loading: approveMutation.isPending || rejectMutation.isPending,

    // Actions
    openModal,
    closeModal,
    submitModal,
  }
}
