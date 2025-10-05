import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ReplacementCandidate } from '@/features/absences/types'
import { fetchShiftReplacementCandidates } from '../api'

type RecentAssignment = {
  candidate: string
  timestamp: number
}

/**
 * Custom Hook für Replacement Modal State & Logik
 * Verwaltet: Modal Open/Close, Kandidaten-Loading, Recent Assignments
 */
export function useReplacementModal() {
  const queryClient = useQueryClient()

  // State
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([])
  const [shift, setShift] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentAssignments, setRecentAssignments] = useState<Record<string, RecentAssignment>>({})

  // Helper: Dashboard Queries invalidieren
  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'dashboard',
    })
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'absences',
    })
  }, [queryClient])

  // Actions
  const openModal = useCallback(async (shiftId: string, shiftTitle: string) => {
    if (loading) return
    setLoading(true)
    setShift({ id: shiftId, title: shiftTitle })
    try {
      const candidatesList = await fetchShiftReplacementCandidates(shiftId)
      setCandidates(candidatesList)
      setOpen(true)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Ersatzsuche fehlgeschlagen'
      toast.error(message)
      setShift(null)
    } finally {
      setLoading(false)
    }
  }, [loading])

  const closeModal = useCallback(() => {
    if (loading) return
    setOpen(false)
    setCandidates([])
    setShift(null)
  }, [loading])

  const handleAssignmentSuccess = useCallback(
    (info?: { shiftId: string; candidateName: string }) => {
      invalidateDashboard()
      setLoading(false)

      if (info) {
        setRecentAssignments((prev) => ({
          ...prev,
          [info.shiftId]: { candidate: info.candidateName, timestamp: Date.now() },
        }))
        toast.success(`${info.candidateName} übernimmt die Schicht`)
      } else {
        toast.success('Schicht wurde aktualisiert')
      }
    },
    [invalidateDashboard]
  )

  return {
    // State
    open,
    candidates,
    shift,
    loading,
    recentAssignments,

    // Actions
    openModal,
    closeModal,
    handleAssignmentSuccess,
  }
}
