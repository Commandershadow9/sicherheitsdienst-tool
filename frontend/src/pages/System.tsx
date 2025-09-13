import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import React from 'react'

type Stats = {
  success: boolean
  data: any
  timestamp: string
}

export default function SystemPage() {
  const [auto, setAuto] = React.useState<number>(0) // Sekunden: 0=aus, 15/30/60
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => (await api.get<Stats>('/stats')).data,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: auto ? auto * 1000 : false,
    refetchIntervalInBackground: true,
  })

  React.useEffect(() => {
    const saved = localStorage.getItem('system:autoRefresh')
    if (saved !== null) {
      const n = Number(saved)
      if (!Number.isNaN(n)) setAuto(n)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem('system:autoRefresh', String(auto))
  }, [auto])

  const env = data?.data?.env || {}
  const users = data?.data?.users || {}
  const shifts = data?.data?.shifts || {}
  const incidents = data?.data?.incidents || {}
  const requests = data?.data?.requests || {}
  const notifications = data?.data?.notifications || {}

  const copySha = async () => {
    const sha = env.buildSha || ''
    if (!sha) { toast.error('Kein Build SHA vorhanden'); return }
    try {
      await navigator.clipboard.writeText(sha)
      toast.success('Build SHA kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">System</h1>
        <div className="inline-flex gap-2">
          <a href="/api-docs" className="underline" target="_blank" rel="noreferrer">API‑Docs</a>
          <button className="underline" onClick={()=>refetch()} disabled={isFetching}>{isFetching ? 'Aktualisiere…' : 'Aktualisieren'}</button>
          <label className="inline-flex items-center gap-2 text-sm">
            Auto‑Refresh:
            <select className="border rounded px-2 py-1"
              value={auto}
              onChange={(e)=> setAuto(Number(e.target.value))}
            >
              <option value={0}>Aus</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </label>
        </div>
      </div>

      {auto > 0 && (
        <div className="text-xs text-muted-foreground">Aktualisierung alle {auto}s</div>
      )}

      {isLoading && <div>Lade…</div>}
      {isError && (
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-1">Fehler beim Laden der Systemdaten.</div>
          <div className="text-muted-foreground">Bitte neu laden. Falls der Fehler bleibt, API unter /api/health prüfen.</div>
        </div>
      )}

      {!!data && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Environment">
            <K label="Node Env" value={env.nodeEnv} />
            <K label="App Version" value={env.version} />
            <K label="Spec Version" value={env.specVersion} />
            <div className="flex items-center gap-2">
              <K label="Build SHA" value={env.buildSha || '–'} />
              <button className="underline text-xs" onClick={copySha}>Copy</button>
            </div>
          </Card>

          <Card title="Users">
            <K label="Total" value={users.total} />
            <K label="Active" value={users.active} />
            <K label="Inactive" value={users.inactive} />
          </Card>

          <Card title="Shifts">
            <K label="Total" value={shifts.total} />
            <K label="Upcoming" value={shifts.upcoming} />
          </Card>

          <Card title="Incidents">
            <K label="Open" value={incidents.open} />
          </Card>

          <Card title="Requests (since start)">
            <K label="Total" value={requests.total} />
            <K label="2xx" value={requests.status2xx} />
            <K label="4xx" value={requests.status4xx} />
            <K label="5xx" value={requests.status5xx} />
          </Card>

          <Card title="Notifications">
            <K label="SMTP configured" value={String(notifications.smtpConfigured)} />
            <K label="Push configured" value={String(notifications.pushConfigured)} />
            <K label="RateLimit/min" value={notifications.testRateLimit?.perMin} />
          </Card>
        </div>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border rounded p-3 bg-card">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  )
}

function K({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value ?? '–'}</span>
    </div>
  )
}
