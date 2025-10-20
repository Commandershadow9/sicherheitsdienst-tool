import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

type CriticalIncident = {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH'
  status: string
  occurredAt: string
  site: {
    id: string
    name: string
  }
  reporter: {
    firstName: string
    lastName: string
  }
}

type CriticalIncidentsCardProps = {
  incidents?: CriticalIncident[]
  summary?: {
    total: number
    critical: number
    high: number
    open: number
  }
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
}

export function CriticalIncidentsCard({ incidents, summary, isLoading, isError, onRetry }: CriticalIncidentsCardProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
          <h2 className="text-lg font-semibold">Kritische Vorfälle (7 Tage)</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Lade Vorfälle…</span>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
          <h2 className="text-lg font-semibold">Kritische Vorfälle (7 Tage)</h2>
        </div>
        <div className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span>Vorfälle konnten nicht geladen werden.</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      </section>
    )
  }

  const hasItems = (incidents?.length ?? 0) > 0

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
          <h2 className="text-lg font-semibold">Kritische Vorfälle (7 Tage)</h2>
        </div>
        {summary && (
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
              {summary.critical} CRITICAL
            </span>
            <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 font-medium">
              {summary.high} HIGH
            </span>
          </div>
        )}
      </div>

      {!hasItems ? (
        <div className="text-sm text-muted-foreground">Keine kritischen Vorfälle in den letzten 7 Tagen. 🎉</div>
      ) : (
        <>
          {summary && summary.open > 0 && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-800">
              <strong>{summary.open}</strong> offene{summary.open === 1 ? 'r' : ''} Vorfall
              {summary.open === 1 ? '' : 'e'} erfordert sofortige Aufmerksamkeit!
            </div>
          )}

          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {incidents!.map((incident) => (
              <li key={incident.id} className="rounded border border-border bg-background/60 p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{incident.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {incident.site.name}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Status:</span> {statusLabels[incident.status] || incident.status}
                    </div>
                    <div>
                      {new Date(incident.occurredAt).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <Link
                    to={`/sites/${incident.site.id}?tab=incidents`}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  >
                    <span>Zum Objekt</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
