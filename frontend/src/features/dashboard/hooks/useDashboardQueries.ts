import { useQuery } from '@tanstack/react-query'
import {
  fetchCriticalShifts,
  fetchPendingApprovals,
  fetchWarnings,
  fetchDashboardStats,
} from '../api'

const REFRESH_INTERVAL_MS = 60_000

/**
 * Custom Hook für alle Dashboard React Query Calls
 * Zentralisiert Data Fetching und Refresh-Logik
 */
export function useDashboardQueries() {
  const criticalQuery = useQuery({
    queryKey: ['dashboard', 'critical'],
    queryFn: fetchCriticalShifts,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  const approvalsQuery = useQuery({
    queryKey: ['dashboard', 'pending-approvals'],
    queryFn: fetchPendingApprovals,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  const warningsQuery = useQuery({
    queryKey: ['dashboard', 'warnings', { days: 7 }],
    queryFn: () => fetchWarnings(7),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  return {
    critical: criticalQuery,
    approvals: approvalsQuery,
    warnings: warningsQuery,
    stats: statsQuery,
  }
}
