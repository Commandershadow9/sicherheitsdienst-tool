/**
 * ReplacementCandidatesModalV2 - Intelligent Replacement mit Scoring (v1.8.0)
 */
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ScoreRing } from '@/components/ui/score-ring'
import { MetricBadge } from '@/components/ui/metric-badge'
import { WarningBadge } from '@/components/ui/warning-badge'
import type { ReplacementCandidateV2 } from './types'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { BarChart3, Clock, Moon, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

type ReplacementCandidatesModalV2Props = {
  open: boolean
  onClose: () => void
  shiftId: string
  shiftTitle: string
  candidates: ReplacementCandidateV2[]
  onAssignSuccess?: (info: { shiftId: string; shiftTitle: string; candidateId: string }) => void
}

// Mapping Recommendation -> Border/BG Style
const RECOMMENDATION_STYLES = {
  OPTIMAL: 'border-green-300 bg-green-50',
  GOOD: 'border-yellow-300 bg-yellow-50',
  ACCEPTABLE: 'border-orange-300 bg-orange-50',
  NOT_RECOMMENDED: 'border-red-300 bg-red-50',
}

export function ReplacementCandidatesModalV2({
  open,
  onClose,
  shiftId,
  shiftTitle,
  candidates,
  onAssignSuccess,
}: ReplacementCandidatesModalV2Props) {
  const [assigning, setAssigning] = useState(false)
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set())

  const toggleExpanded = (candidateId: string) => {
    setExpandedCandidates((prev) => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
  }

  async function handleAssign(candidate: ReplacementCandidateV2) {
    const confirmed = window.confirm(
      `Mitarbeiter ${candidate.firstName} ${candidate.lastName} (Score: ${Math.round(candidate.score.total)}) zur Schicht "${shiftTitle}" zuweisen?`
    )

    if (!confirmed) return

    setAssigning(true)
    try {
      await api.post(`/shifts/${shiftId}/assign`, { userId: candidate.id })
      toast.success(`${candidate.firstName} ${candidate.lastName} erfolgreich zugewiesen`)
      onClose()
      onAssignSuccess?.({ shiftId, shiftTitle, candidateId: candidate.id })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Zuweisung fehlgeschlagen')
    } finally {
      setAssigning(false)
    }
  }

  // Determine metric badge status based on value
  const getUtilizationStatus = (percent: number) => {
    if (percent >= 70 && percent <= 90) return 'success'
    if (percent >= 50 && percent < 70) return 'warning'
    if (percent > 90 && percent < 110) return 'warning'
    return 'error'
  }

  const getRestHoursStatus = (hours: number) => {
    if (hours >= 11) return 'success'
    if (hours >= 9) return 'warning'
    return 'error'
  }

  return (
    <Modal open={open} onClose={onClose} title={`🤖 Intelligente Ersatz-Suche: "${shiftTitle}"`}>
      <div className="max-w-4xl">
        {candidates.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-gray-700">⚠️ Keine verfügbaren Ersatz-Mitarbeiter gefunden.</p>
            <p className="text-xs text-gray-600 mt-2">
              Alle Mitarbeiter sind entweder bereits eingeteilt, abwesend oder haben unzureichende Qualifikationen.
            </p>
          </div>
        )}

        {candidates.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {candidates.length} Kandidaten gefunden - sortiert nach Eignung (beste zuerst):
            </p>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {candidates.map((candidate) => {
                const isExpanded = expandedCandidates.has(candidate.id)
                return (
                  <div
                    key={candidate.id}
                    className={`rounded-lg border-2 p-4 ${RECOMMENDATION_STYLES[candidate.score.recommendation]}`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Score Ring */}
                      <div className="flex-shrink-0">
                        <ScoreRing score={candidate.score.total} color={candidate.score.color} size="lg" />
                      </div>

                      {/* Name & Employee ID */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold text-lg">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                          <span className="text-xs text-gray-500">#{candidate.employeeId}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 uppercase font-medium">
                          {candidate.score.recommendation.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Assign Button */}
                      <div className="flex-shrink-0">
                        <Button size="sm" onClick={() => handleAssign(candidate)} disabled={assigning}>
                          {assigning ? 'Zuweisen...' : 'Zuweisen'}
                        </Button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <MetricBadge
                        icon={BarChart3}
                        label="Auslastung"
                        value={`${Math.round(candidate.metrics.utilizationPercent)}%`}
                        status={getUtilizationStatus(candidate.metrics.utilizationPercent)}
                        size="sm"
                      />
                      <MetricBadge
                        icon={Clock}
                        label="Ruhezeit"
                        value={`${candidate.metrics.restHours}h`}
                        status={getRestHoursStatus(candidate.metrics.restHours)}
                        size="sm"
                      />
                      <MetricBadge
                        icon={Moon}
                        label="Nachtschichten"
                        value={`${candidate.metrics.nightShiftCount} (Ø ${candidate.metrics.avgNightShiftCount.toFixed(1)})`}
                        status="neutral"
                        size="sm"
                      />
                      <MetricBadge
                        icon={Users}
                        label="Ersätze"
                        value={`${candidate.metrics.replacementCount} (Ø ${candidate.metrics.avgReplacementCount.toFixed(1)})`}
                        status="neutral"
                        size="sm"
                      />
                    </div>

                    {/* Warnings */}
                    {candidate.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {candidate.warnings.map((warning, idx) => (
                          <WarningBadge key={idx} text={warning} severity="warning" size="sm" />
                        ))}
                      </div>
                    )}

                    {/* Detail Scores Toggle */}
                    <button
                      onClick={() => toggleExpanded(candidate.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isExpanded ? 'Weniger anzeigen' : 'Detail-Scores anzeigen'}</span>
                    </button>

                    {/* Expanded Detail Scores */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-300 grid grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Workload</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.workload)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Compliance</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.compliance)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Fairness</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.fairness)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Präferenz</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.preference)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 mt-4 border-t">
          <div className="text-xs text-gray-500">
            <TrendingUp className="inline mr-1" size={12} />
            Scoring basiert auf: Compliance (40%), Präferenz (30%), Fairness (20%), Workload (10%)
          </div>
          <Button onClick={onClose} variant="outline">
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
