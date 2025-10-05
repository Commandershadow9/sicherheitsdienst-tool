import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { UseQueryResult } from '@tanstack/react-query'

/**
 * Custom Hook für manuellen Dashboard Refresh
 * Handelt Refresh-Button Klick mit Loading State
 */
export function useManualRefresh(queries: {
  critical: UseQueryResult
  approvals: UseQueryResult
  warnings: UseQueryResult
  stats: UseQueryResult
}) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        queries.critical.refetch({ throwOnError: true }),
        queries.approvals.refetch({ throwOnError: true }),
        queries.warnings.refetch({ throwOnError: true }),
        queries.stats.refetch({ throwOnError: true }),
      ])
      toast.success('Dashboard aktualisiert')
    } catch (error: any) {
      toast.error(error?.message || 'Aktualisierung fehlgeschlagen')
    } finally {
      setRefreshing(false)
    }
  }, [queries])

  return {
    refreshing,
    handleRefresh,
  }
}
