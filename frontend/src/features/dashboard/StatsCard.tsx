import { Button } from '@/components/ui/button'
import type { DashboardStats } from './types'
import { Loader2, BarChart3 } from 'lucide-react'

type StatsCardProps = {
  stats?: DashboardStats
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const STAT_LABELS: Array<{ key: keyof DashboardStats; label: string }> = [
  { key: 'totalEmployees', label: 'Mitarbeiter gesamt' },
  { key: 'availableToday', label: 'Heute verfügbar' },
  { key: 'onVacation', label: 'Im Urlaub' },
  { key: 'onSickLeave', label: 'Krank' },
  { key: 'pendingApprovals', label: 'Offene Genehmigungen' },
  { key: 'criticalShiftsToday', label: 'Kritische Schichten heute' },
  { key: 'upcomingWarnings', label: 'Warnungen (7 Tage)' },
]

export function StatsCard({ stats, isLoading, isError, onRetry }: StatsCardProps) {
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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden />
        <h2 className="text-lg font-semibold">Übersicht (heute)</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key} className="rounded border border-border bg-background/60 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold mt-1">{stats[key]}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
