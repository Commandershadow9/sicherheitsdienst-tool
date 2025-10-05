import { Button } from '@/components/ui/button'
import type { UpcomingWarning } from './types'
import { Loader2, AlertTriangle, Search } from 'lucide-react'
import { formatDate, formatTime } from '@/utils/formatting'

type WarningsCardProps = {
  warnings?: UpcomingWarning[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onFindReplacement?: (warning: UpcomingWarning) => void
  loadingShiftId?: string | null
}

function formatShiftWindow(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return `${formatTime(start)} – ${formatTime(end)} Uhr`
}

export function WarningsCard({ warnings, isLoading, isError, onRetry, onFindReplacement, loadingShiftId }: WarningsCardProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden />
          <h2 className="text-lg font-semibold">Nächste 7 Tage</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Lade Kapazitätswarnungen…</span>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden />
          <h2 className="text-lg font-semibold">Nächste 7 Tage</h2>
        </div>
        <div className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span>Warnungen konnten nicht geladen werden.</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      </section>
    )
  }

  const hasItems = (warnings?.length ?? 0) > 0

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden />
        <h2 className="text-lg font-semibold">Nächste 7 Tage ({warnings?.length ?? 0})</h2>
      </div>
      {!hasItems ? (
        <div className="text-sm text-muted-foreground">Keine Kapazitätswarnungen in den nächsten sieben Tagen.</div>
      ) : (
        <ul className="space-y-4">
          {warnings!.map((warning) => (
            <li key={warning.shiftId} className="rounded border border-border bg-background/60 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold">{formatDate(warning.startTime)}</div>
                  <p className="text-sm text-muted-foreground">
                    {warning.shiftTitle} · {warning.siteName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatShiftWindow(warning.startTime, warning.endTime)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="text-sm font-medium">
                    {warning.availableEmployees} / {warning.requiredEmployees} besetzt
                  </div>
                  <div className="text-xs text-destructive font-semibold">Fehlen: {warning.shortage}</div>
                  {onFindReplacement && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFindReplacement(warning)}
                      disabled={loadingShiftId === warning.shiftId}
                    >
                      {loadingShiftId === warning.shiftId ? (
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
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
