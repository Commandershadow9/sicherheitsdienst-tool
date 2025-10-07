import { useCallback, useState } from 'react'
import { getReplacementCandidatesV2 } from '../api'
import type { ReplacementCandidateV2 } from '../types'

type LoaderState = {
  candidates: ReplacementCandidateV2[]
  loading: boolean
  error: string | null
}

export function useReplacementCandidates() {
  const [{ candidates, loading, error }, setState] = useState<LoaderState>({
    candidates: [],
    loading: false,
    error: null,
  })

  const reset = useCallback(() => {
    setState((prev) => (prev.candidates.length || prev.error ? { candidates: [], loading: false, error: null } : prev))
  }, [])

  const fetchCandidates = useCallback(async (shiftId: string, absentUserId?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await getReplacementCandidatesV2(shiftId, absentUserId)
      setState({ candidates: response.data, loading: false, error: null })
      return response.data
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Laden fehlgeschlagen'
      setState({ candidates: [], loading: false, error: message })
      throw err
    }
  }, [])

  return {
    candidates,
    loading,
    error,
    fetchCandidates,
    reset,
  }
}
