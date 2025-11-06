/**
 * useSiteQueries Hook
 * Consolidates all data queries for SiteDetail component
 * Extracted from SiteDetail.tsx to reduce component complexity
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Site, TabType } from '../types/site'
import { fetchSiteShifts } from '../api';
import { fetchControlPoints, fetchControlRounds } from '../controlApi';
import { fetchSiteCalculations } from '../calculationApi'

interface Shift {
  id: string
  title: string
  startTime: string
  endTime: string
  requiredEmployees: number
  assignedEmployees: number
  status: string
}

interface UseSiteQueriesParams {
  siteId: string | undefined
  activeTab: TabType
  viewHistoryIncidentId: string | undefined
  createClearanceModalOpen: boolean
  createAssignmentModalOpen: boolean
}

export function useSiteQueries({
  siteId,
  activeTab,
  viewHistoryIncidentId,
  createClearanceModalOpen,
  createAssignmentModalOpen,
}: UseSiteQueriesParams) {
  // Main site query
  const {
    data: site,
    isLoading,
    isError,
    error,
  } = useQuery<Site>({
    queryKey: ['site', siteId],
    queryFn: async () => {
      const res = await api.get<{ data: Site }>(`/sites/${siteId}?include=relations`)
      return res.data.data
    },
    enabled: !!siteId,
  })

  // Control Points Query
  const { data: controlPoints = [] } = useQuery({
    queryKey: ['controlPoints', siteId],
    queryFn: () => fetchControlPoints(siteId!),
    enabled: !!siteId && activeTab === 'control-points',
  })

  // Control Rounds Query
  const { data: controlRoundsData } = useQuery({
    queryKey: ['controlRounds', siteId],
    queryFn: () => fetchControlRounds(siteId!),
    enabled: !!siteId && activeTab === 'control-rounds',
  })

  const controlRounds = controlRoundsData?.data || []

  // Calculations Query
  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations', siteId],
    queryFn: () => fetchSiteCalculations(siteId!),
    enabled: !!siteId && activeTab === 'calculations',
  })

  // Incident History Query
  const { data: incidentHistory } = useQuery({
    queryKey: ['incidentHistory', viewHistoryIncidentId],
    queryFn: async () => {
      const res = await api.get(`/sites/${siteId}/incidents/${viewHistoryIncidentId}/history`)
      return res.data.data
    },
    enabled: !!viewHistoryIncidentId,
  })

  // Shifts Query
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ['shifts', siteId],
    queryFn: () => fetchSiteShifts(siteId!),
    enabled: !!siteId && activeTab === 'shifts',
  })

  // Users Query (for clearance/assignment creation)
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users?pageSize=1000')
      return res.data
    },
    enabled: createClearanceModalOpen || createAssignmentModalOpen,
  })

  return {
    // Site data
    site,
    isLoading,
    isError,
    error,

    // Tab-specific data
    controlPoints,
    controlRounds,
    calculations,
    incidentHistory,
    shifts,
    shiftsLoading,

    // Users data
    usersData,
  }
}
