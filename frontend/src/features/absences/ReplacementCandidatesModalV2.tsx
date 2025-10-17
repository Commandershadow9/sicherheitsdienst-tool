/**
 * ReplacementCandidatesModalV2 - Intelligent Replacement mit Scoring (v1.8.0)
 */
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ScoreRing } from '@/components/ui/score-ring'
import { MetricBadge } from '@/components/ui/metric-badge'
import { WarningBadge } from '@/components/ui/warning-badge'
import type { ReplacementCandidateV2, ReplacementCandidateWarning } from './types'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import {
  BarChart3,
  Clock,
  Moon,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Flame,
  CalendarRange,
  Ban,
  CheckCircle2,
  AlertCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

type ReplacementCandidatesModalV2Props = {
  open: boolean
  onClose: () => void
  shiftId: string
  shiftTitle: string
  shiftStartTime?: string // Optional: Für Nachtschicht-Erkennung
  candidates: ReplacementCandidateV2[]
  onAssignSuccess?: (info: { shiftId: string; shiftTitle: string; candidateId: string; candidateName: string }) => void
}

// Mapping Recommendation -> Border/BG Style
const RECOMMENDATION_STYLES = {
  OPTIMAL: 'border-green-300 bg-green-50',
  GOOD: 'border-yellow-300 bg-yellow-50',
  ACCEPTABLE: 'border-orange-300 bg-orange-50',
  NOT_RECOMMENDED: 'border-red-300 bg-red-50',
}

const WARNING_ICON_MAP: Record<ReplacementCandidateWarning['type'], LucideIcon> = {
  REST_TIME: Clock,
  OVERWORKED: Flame,
  CONSECUTIVE_DAYS: CalendarRange,
  PREFERENCE_MISMATCH: Ban,
  PENDING_ABSENCE_REQUEST: CalendarDays,
}

export function ReplacementCandidatesModalV2({
  open,
  onClose,
  shiftId,
  shiftTitle,
  shiftStartTime,
  candidates,
  onAssignSuccess,
}: ReplacementCandidatesModalV2Props) {
  const [assigning, setAssigning] = useState(false)
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set())
  const [confirmingCandidateId, setConfirmingCandidateId] = useState<string | null>(null)

  // Prüfe, ob es eine Nachtschicht ist (22:00 - 06:00)
  const isNightShift = shiftStartTime ? (() => {
    const shiftDate = new Date(shiftStartTime)
    const hour = shiftDate.getHours()
    return hour >= 22 || hour < 6
  })() : false

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

  async function handleConfirmAssign(candidate: ReplacementCandidateV2) {
    setAssigning(true)
    try {
      await api.post(`/shifts/${shiftId}/assign`, { userId: candidate.id })
      toast.success(`${candidate.firstName} ${candidate.lastName} erfolgreich zugewiesen`, {
        description: `Score: ${Math.round(candidate.score.total)} - Auslastung wird ${Math.round(candidate.metrics.utilizationAfterAssignment)}%`,
        duration: 4000,
      })
      onClose()
      onAssignSuccess?.({
        shiftId,
        shiftTitle,
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
      })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Zuweisung fehlgeschlagen')
    } finally {
      setAssigning(false)
      setConfirmingCandidateId(null)
    }
  }

  function handleCancelConfirm() {
    setConfirmingCandidateId(null)
  }

  // Determine metric badge status based on value
  // Niedrige Auslastung = GUT für Zuweisung (grün)
  // Hohe Auslastung = SCHLECHT für Zuweisung (rot)
  const getUtilizationStatus = (percent: number) => {
    if (percent < 30) return 'success'        // Wenig ausgelastet → GUT
    if (percent < 70) return 'success'        // Normal → GUT
    if (percent < 90) return 'warning'        // Hoch → VORSICHT
    if (percent < 100) return 'warning'       // Sehr hoch → VORSICHT
    return 'error'                            // Überlastet → SCHLECHT
  }

  const getRestHoursStatus = (hours: number) => {
    if (hours >= 11) return 'success'
    if (hours >= 9) return 'warning'
    return 'error'
  }

  const getClearanceStatus = (score?: number): 'success' | 'warning' | 'error' | 'neutral' => {
    if (score === undefined || score === null) return 'error' // Keine Clearance
    if (score >= 100) return 'success' // ACTIVE + Training abgeschlossen
    if (score >= 50) return 'warning' // TRAINING
    return 'error' // EXPIRED/REVOKED
  }

  const getClearanceIcon = (score?: number): LucideIcon => {
    if (score === undefined || score === null) return XCircle
    if (score >= 100) return CheckCircle2
    if (score >= 50) return AlertCircle
    return XCircle
  }

  const getClearanceLabel = (score?: number): string => {
    if (score === undefined || score === null) return 'Keine Einarbeitung'
    if (score >= 100) return 'Eingearbeitet ✓'
    if (score >= 50) return 'In Einarbeitung'
    return 'Nicht eingearbeitet'
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

                      {/* Assign Button / Confirmation */}
                      <div className="flex-shrink-0">
                        {confirmingCandidateId === candidate.id ? (
                          <div className="flex gap-2 items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelConfirm}
                              disabled={assigning}
                            >
                              Abbrechen
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleConfirmAssign(candidate)}
                              disabled={assigning}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {assigning ? 'Zuweisen...' : '✓ Bestätigen'}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setConfirmingCandidateId(candidate.id)}
                            disabled={assigning || confirmingCandidateId !== null}
                          >
                            Zuweisen
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {/* Object-Clearance-Score Badge (v1.11.0+) - nur anzeigen wenn Schicht mit Objekt verknüpft */}
                      {candidate.score.objectClearance !== undefined && (
                        <MetricBadge
                          icon={getClearanceIcon(candidate.score.objectClearance)}
                          label="Objekt-Clearance"
                          value={getClearanceLabel(candidate.score.objectClearance)}
                          status={getClearanceStatus(candidate.score.objectClearance)}
                          size="sm"
                        />
                      )}
                      <MetricBadge
                        icon={BarChart3}
                        label="Auslastung"
                        value={`${Math.round(candidate.metrics.utilizationPercent)}% → ${Math.round(candidate.metrics.utilizationAfterAssignment)}%`}
                        status={getUtilizationStatus(candidate.metrics.utilizationAfterAssignment)}
                        size="sm"
                      />
                      <MetricBadge
                        icon={Clock}
                        label="Ruhezeit"
                        value={
                          candidate.metrics.restHours >= 24
                            ? `${Math.floor(candidate.metrics.restHours)}h ${Math.round((candidate.metrics.restHours % 1) * 60)}m`
                            : `${candidate.metrics.restHours.toFixed(1)}h`
                        }
                        status={getRestHoursStatus(candidate.metrics.restHours)}
                        size="sm"
                      />
                      {/* Nachtschicht-Badge nur bei Nachtschichten anzeigen */}
                      {isNightShift && (
                        <MetricBadge
                          icon={Moon}
                          label="Nachtschichten"
                          value={`${candidate.metrics.nightShiftCount} (Ø ${candidate.metrics.avgNightShiftCount.toFixed(1)})`}
                          status="neutral"
                          size="sm"
                        />
                      )}
                      <MetricBadge
                        icon={Users}
                        label="Ersätze"
                        value={`${candidate.metrics.replacementCount} (Ø ${candidate.metrics.avgReplacementCount.toFixed(1)})`}
                        status="neutral"
                        size="sm"
                      />
                    </div>

                    {/* Objekt-Clearance Warnung (v1.11.0+) */}
                    {candidate.score.objectClearance !== undefined && candidate.score.objectClearance === 0 && (
                      <div className="mt-3">
                        <WarningBadge
                          message="⚠️ Keine Objekt-Einarbeitung vorhanden - Training erforderlich!"
                          severity="error"
                          size="sm"
                          icon={AlertCircle}
                        />
                      </div>
                    )}

                    {/* Warnings */}
                    {candidate.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {candidate.warnings.map((warning, idx) => (
                          <WarningBadge
                            key={`${candidate.id}-${warning.type}-${idx}`}
                            message={warning.message}
                            severity={warning.severity}
                            size="sm"
                            icon={WARNING_ICON_MAP[warning.type]}
                          />
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
                      <div className={`mt-3 pt-3 border-t border-gray-300 grid ${candidate.score.objectClearance !== undefined ? 'grid-cols-5' : 'grid-cols-4'} gap-3`}>
                        {candidate.score.objectClearance !== undefined && (
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Clearance</div>
                            <div className="font-semibold text-sm">{Math.round(candidate.score.objectClearance)}</div>
                            <div className="text-xs text-gray-500">20%</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Workload</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.workload)}</div>
                          <div className="text-xs text-gray-500">{candidate.score.objectClearance !== undefined ? '5%' : '10%'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Compliance</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.compliance)}</div>
                          <div className="text-xs text-gray-500">{candidate.score.objectClearance !== undefined ? '35%' : '40%'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Fairness</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.fairness)}</div>
                          <div className="text-xs text-gray-500">{candidate.score.objectClearance !== undefined ? '15%' : '20%'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Präferenz</div>
                          <div className="font-semibold text-sm">{Math.round(candidate.score.preference)}</div>
                          <div className="text-xs text-gray-500">{candidate.score.objectClearance !== undefined ? '25%' : '30%'}</div>
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
