import { Button } from '@/components/ui/button'
import type { PendingApproval } from './types'
import { Loader2, AlertCircle, CheckCircle2, Clock, Eye, X, Check } from 'lucide-react'
import { getAbsenceTypeLabel, formatPeriod } from '@/features/absences/utils'
import { formatDate, formatShiftWindow } from '@/utils/formatting'
import { useState, useCallback } from 'react'

type PendingApprovalsCardProps = {
  approvals?: PendingApproval[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onApprove: (approval: PendingApproval) => void
  onReject: (approval: PendingApproval) => void
  onOpenDetails: (approval: PendingApproval) => void
  recentAssignments?: Record<string, { candidate: string; timestamp: number }>
}

function getCriticalBadgeClass(hasCritical: boolean): string {
  return hasCritical
    ? 'inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700'
    : 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'
}

function getLeaveBadgeClass(exceeded: boolean): string {
  return exceeded
    ? 'inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700'
    : 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700'
}

export function PendingApprovalsCard({
  approvals,
  isLoading,
  isError,
  onRetry,
  onApprove,
  onReject,
  onOpenDetails,
  recentAssignments,
}: PendingApprovalsCardProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleExpanded = useCallback((absenceId: string, expand: boolean) => {
    setExpandedCards((prev) => ({ ...prev, [absenceId]: expand }))
  }, [])
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">🟡 Ausstehende Genehmigungen</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Lade Anträge…</span>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">🟡 Ausstehende Genehmigungen</h2>
        </div>
        <div className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span>Genehmigungen konnten nicht geladen werden.</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      </section>
    )
  }

  const hasItems = (approvals?.length ?? 0) > 0
  const MAX_SHIFT_PREVIEW = 3

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-yellow-600" aria-hidden />
        <h2 className="text-lg font-semibold">Ausstehende Genehmigungen ({approvals?.length ?? 0})</h2>
      </div>

      {!hasItems ? (
        <div className="text-sm text-muted-foreground">Keine offenen Genehmigungen. Alles im grünen Bereich.</div>
      ) : (
        <ul className="space-y-4">
          {approvals!.map((approval) => {
            const shiftDetails = approval.warnings.shiftDetails ?? []
            const isExpanded = expandedCards[approval.absenceId] ?? false
            const visibleShiftDetails = isExpanded ? shiftDetails : shiftDetails.slice(0, MAX_SHIFT_PREVIEW)
            const remainingShifts = Math.max(0, shiftDetails.length - visibleShiftDetails.length)

            const criticalBadge = approval.warnings.criticalShifts > 0
            const criticalBadgeClass = getCriticalBadgeClass(criticalBadge)
            const leaveBadgeClass = getLeaveBadgeClass(approval.warnings.leaveDaysExceeded)

            return (
              <li key={approval.absenceId} className="space-y-3 rounded border border-border bg-background/60 p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {approval.employee.firstName} {approval.employee.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getAbsenceTypeLabel(approval.type)} · {formatPeriod(approval.startsAt, approval.endsAt)}
                    </p>
                    {approval.reason && <p className="text-sm text-muted-foreground">Grund: {approval.reason}</p>}
                    <p className="text-xs text-muted-foreground">Eingegangen am {formatDate(approval.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <span className={criticalBadgeClass}>
                      {criticalBadge ? (
                        <>
                          <AlertCircle className="h-3 w-3" aria-hidden />
                          {approval.warnings.criticalShifts} kritische Schicht(en)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          Keine Unterdeckungen
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {shiftDetails.length} Schicht(en)
                    </span>
                    <span className={leaveBadgeClass}>
                      Urlaubskonto {approval.warnings.leaveDaysExceeded ? 'überschritten' : 'ok'}
                    </span>
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-muted/40 p-3">
                  {shiftDetails.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Keine geplanten Schichten innerhalb des beantragten Zeitraums.</p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {visibleShiftDetails.map((shift) => {
                        const statusLabel = shift.hasCapacityWarning ? 'Unterbesetzt' : 'Abgedeckt'
                        const statusClasses = shift.hasCapacityWarning
                          ? 'text-xs font-semibold text-red-600'
                          : 'text-xs font-semibold text-emerald-600'
                        const lastAssignment = recentAssignments?.[shift.id]

                        return (
                          <li key={`${approval.absenceId}-${shift.id}`} className="space-y-1 border-b border-border/60 pb-2 last:border-b-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-foreground">
                              <span>
                                {shift.title} · {shift.site?.name ?? 'Unbekannt'}
                              </span>
                              <span className={statusClasses}>{statusLabel}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span>{formatShiftWindow(shift.startTime, shift.endTime)}</span>
                              <span>
                                Besetzt {shift.availableEmployees}/{shift.requiredEmployees}
                              </span>
                            </div>
                            {!shift.hasCapacityWarning && lastAssignment ? (
                              <div className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" aria-hidden />
                                {lastAssignment.candidate} übernimmt diese Schicht
                              </div>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {remainingShifts > 0 && !isExpanded && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                      onClick={() => toggleExpanded(approval.absenceId, true)}
                    >
                      +{remainingShifts} weitere Schicht(en) anzeigen
                    </button>
                  )}
                  {isExpanded && shiftDetails.length > MAX_SHIFT_PREVIEW && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                      onClick={() => toggleExpanded(approval.absenceId, false)}
                    >
                      Liste einklappen
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => onOpenDetails(approval)}>
                    <Eye className="mr-2 h-4 w-4" aria-hidden />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onReject(approval)}>
                    <X className="mr-2 h-4 w-4" aria-hidden />
                    Ablehnen
                  </Button>
                  <Button size="sm" onClick={() => onApprove(approval)}>
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                    Genehmigen
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
