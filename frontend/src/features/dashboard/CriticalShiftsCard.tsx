import { Button } from '@/components/ui/button'
import type { CriticalShift } from './types'
import { AlertTriangle, Loader2, Search, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'
import { formatShiftWindow } from '@/utils/formatting'

type CriticalShiftsCardProps = {
  shifts?: CriticalShift[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onFindReplacement?: (shift: CriticalShift) => void
  loadingShiftId?: string | null
}

export function CriticalShiftsCard({ shifts, isLoading, isError, onRetry, onFindReplacement, loadingShiftId }: CriticalShiftsCardProps) {
  const hasData = (shifts?.length ?? 0) > 0

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Lade kritische Schichten…</span>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span>Fehler beim Laden der Schichtdaten.</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      )
    }

    if (!hasData) {
      return <div className="text-sm text-muted-foreground">Heute sind keine Schichten kritisch unterbesetzt.</div>
    }

    return (
      <ul className="space-y-4">
        {shifts!.map((shift) => (
          <li key={shift.shiftId} className="rounded border border-border bg-background/60 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {shift.shiftTitle}
                </h3>
                <p className="text-sm text-muted-foreground">{shift.siteName}</p>
                <p className="text-sm text-muted-foreground">{formatShiftWindow(shift.startTime, shift.endTime)}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {shift.availableEmployees} / {shift.requiredEmployees} besetzt
                </div>
                <div className="text-xs text-destructive font-semibold">Fehlen: {shift.shortage}</div>
              </div>
            </div>

            {shift.reasons.length > 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground mb-1">Grund:</div>
                <ul className="list-disc space-y-1 pl-5">
                  {shift.reasons.map((reason) => (
                    <li key={`${shift.shiftId}-${reason.employeeName}`}>
                      {reason.employeeName} · {reason.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {onFindReplacement && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFindReplacement(shift)}
                  disabled={loadingShiftId === shift.shiftId}
                >
                  {loadingShiftId === shift.shiftId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Sucht…
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" aria-hidden />
                      Ersatz suchen
                    </>
                  )}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }, [isLoading, isError, hasData, shifts, onRetry, onFindReplacement])

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" aria-hidden />
        <h2 className="text-lg font-semibold">Heute kritisch ({shifts?.length ?? 0})</h2>
      </div>
      {content}
    </section>
  )
}
