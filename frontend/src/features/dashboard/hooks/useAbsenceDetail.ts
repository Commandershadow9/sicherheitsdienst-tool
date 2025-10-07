import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PendingApproval } from '../types'
import type { Absence } from '@/features/absences/types'
import { fetchAbsenceById } from '@/features/absences/api'

/**
 * Custom Hook für Absence Detail Modal State & Logik
 * Verwaltet: Modal Open/Close, Absence Loading
 */
export function useAbsenceDetail() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [absence, setAbsence] = useState<Absence | null>(null)

  const openDetail = useCallback(async (approval: PendingApproval) => {
    try {
      const fetchedAbsence = await fetchAbsenceById(approval.absenceId)
      setAbsence(fetchedAbsence)
      setOpen(true)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Details konnten nicht geladen werden')
    }
  }, [])

  const closeDetail = useCallback(() => {
    setOpen(false)
    setAbsence(null)

    // BUG-FIX: Dashboard aktualisieren wenn Modal geschlossen wird
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-critical'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-approvals'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-warnings'] })
  }, [queryClient])

  return {
    open,
    absence,
    openDetail,
    closeDetail,
  }
}
