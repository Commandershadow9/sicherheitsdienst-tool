/**
 * useProfileQueries Hook
 * Consolidates all data queries for UserProfile component
 * Extracted from UserProfile.tsx to reduce component complexity
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchUserProfile } from '../api'
import { fetchAbsences } from '@/features/absences/api'

interface UseProfileQueriesParams {
  targetId: string | null
  activeTab: 'overview' | 'details' | 'qualifications' | 'documents' | 'absences'
}

export function useProfileQueries({ targetId, activeTab }: UseProfileQueriesParams) {
  // Main user profile query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-profile', targetId],
    queryFn: () => {
      if (!targetId) {
        throw new Error('Kein Nutzerziel definiert')
      }
      return fetchUserProfile(targetId)
    },
    enabled: Boolean(targetId),
  })

  // User absences query (only when absences tab is active)
  const {
    data: userAbsenceData,
    isLoading: isAbsencesLoading,
    isError: isAbsencesError,
    error: absencesError,
  } = useQuery({
    queryKey: ['user-absences', targetId],
    queryFn: () => fetchAbsences({ userId: targetId, page: 1, pageSize: 25 }),
    enabled: Boolean(targetId) && activeTab === 'absences',
    placeholderData: keepPreviousData,
  })

  return {
    // Profile data
    data,
    isLoading,
    isError,
    error,

    // Absences data
    userAbsenceData,
    isAbsencesLoading,
    isAbsencesError,
    absencesError,
  }
}
