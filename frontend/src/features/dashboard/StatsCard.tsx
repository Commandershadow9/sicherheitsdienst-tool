import { Button } from '@/components/ui/button'
import type { DashboardStats } from './types'
import { Loader2, BarChart3, ChevronRight } from 'lucide-react'

type StatsCardProps = {
  stats?: DashboardStats
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onStatClick?: (statKey: keyof DashboardStats) => void
}

type StatConfig = {
  key: keyof DashboardStats
  label: string
  clickable: boolean
  description?: string
}

const STAT_LABELS: StatConfig[] = [
  { key: 'totalEmployees', label: 'Mitarbeiter gesamt', clickable: true, description: 'Alle Mitarbeiter anzeigen' },
  { key: 'availableToday', label: 'Heute verfügbar', clickable: true, description: 'Verfügbare Mitarbeiter anzeigen' },
  { key: 'onVacation', label: 'Im Urlaub', clickable: true, description: 'Liste der Mitarbeiter im Urlaub' },
  { key: 'onSickLeave', label: 'Krank', clickable: true, description: 'Liste der kranken Mitarbeiter' },
  { key: 'pendingApprovals', label: 'Offene Genehmigungen', clickable: true, description: 'Zu Genehmigungen scrollen' },
  { key: 'criticalShiftsToday', label: 'Kritische Schichten heute', clickable: true, description: 'Zu kritischen Schichten scrollen' },
  { key: 'upcomingWarnings', label: 'Warnungen (7 Tage)', clickable: true, description: 'Zu Warnungen scrollen' },
]

export function StatsCard({ stats, isLoading, isError, onRetry, onStatClick }: StatsCardProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden />
          <h2 className="text-lg font-semibold">Übersicht (heute)</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Lade Kennzahlen…</span>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden />
          <h2 className="text-lg font-semibold">Übersicht (heute)</h2>
        </div>
        <div className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span>Statistiken konnten nicht geladen werden.</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  const handleClick = (statConfig: StatConfig) => {
    if (statConfig.clickable && onStatClick) {
      onStatClick(statConfig.key)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden />
        <h2 className="text-lg font-semibold">Übersicht (heute)</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_LABELS.map((statConfig) => {
          const value = stats[statConfig.key]
          const isClickable = statConfig.clickable && onStatClick && value > 0

          return (
            <button
              key={statConfig.key}
              onClick={() => handleClick(statConfig)}
              disabled={!isClickable}
              className={`rounded border border-border bg-background/60 p-4 shadow-sm text-left transition-all
                ${isClickable
                  ? 'cursor-pointer hover:bg-accent hover:shadow-md hover:border-primary/50 group'
                  : 'cursor-default'
                }`}
              title={isClickable ? statConfig.description : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {statConfig.label}
                  </div>
                  <div className="text-2xl font-semibold mt-1">{value}</div>
                </div>
                {isClickable && (
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1"
                    aria-hidden
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
