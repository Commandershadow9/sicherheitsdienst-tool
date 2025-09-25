import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table'

type NotificationCounter = {
  success?: number
  fail?: number
  attempts?: number
  lastAttemptAt?: string
  lastSuccessAt?: string
  lastFailAt?: string
  lastError?: string
}

type QueueState = {
  name: string
  pending: number
  inFlight: number
  processed: number
  failed: number
  lastEnqueuedAt?: string
  lastStartedAt?: string
  lastProcessedAt?: string
  lastFailedAt?: string
  lastSettledAt?: string
  lastError?: string
}

type NotificationStats = {
  testRateLimit?: { enabled?: boolean; perMin?: number; windowMs?: number }
  smtpConfigured?: boolean
  pushConfigured?: boolean
  counters?: { email: NotificationCounter; push: NotificationCounter }
  successRate?: { email?: number | null; push?: number | null }
  queue?: { email: QueueState; push: QueueState }
  streams?: {
    subscribers?: number
    lastEventAt?: string | null
    lastEventType?: string | null
    lastEventChannel?: string | null
    channelSubscriptions?: Record<string, number>
  }
}

type AuditTrailStats = {
  total?: number
  last24h?: number
  outcomes?: Record<string, number>
  latest?: {
    id?: string
    occurredAt?: string
    action?: string
    outcome?: string
  } | null
  queue?: {
    queueSize?: number
    flushIntervalMs?: number
    batchSize?: number
    maxQueueSize?: number
    isFlushing?: boolean
    hasScheduledFlush?: boolean
  }
}

type RuntimeStats = {
  uptimeSeconds?: number
  nodeVersion?: string
  platform?: string
  logLevel?: string
  memory?: {
    rss?: number
    heapUsed?: number
    heapTotal?: number
    external?: number
  }
  resourceUsage?: {
    userCPUSeconds?: number
    systemCPUSeconds?: number
    maxRSS?: number
    voluntaryContextSwitches?: number
    involuntaryContextSwitches?: number
  }
  eventLoop?: {
    delay?: {
      minMs?: number
      maxMs?: number
      meanMs?: number
      stddevMs?: number
      p50Ms?: number
      p90Ms?: number
      p99Ms?: number
    }
    utilization?: {
      idle?: number
      active?: number
      utilization?: number
    }
  }
}

type SystemStatsResponse = {
  success: boolean
  data: {
    env?: {
      nodeEnv?: string
      version?: string
      specVersion?: string | null
      buildSha?: string | null
    }
    users?: { total?: number; active?: number; inactive?: number }
    shifts?: { total?: number; upcoming?: number }
    incidents?: { open?: number }
    timeEntries?: { total?: number }
    requests?: { requestsTotal?: number; responses4xx?: number; responses5xx?: number }
    rateLimitAuth?: { ip429?: number; user429?: number; loginAttempts?: number; loginBlocked?: number }
    authRateLimit?: { enabled?: boolean; perMin?: number; windowMs?: number }
    auth?: { jwtExpiresIn?: string; refreshExpiresIn?: string }
    features?: Record<string, boolean>
    notifications?: NotificationStats
    queues?: Record<string, QueueState>
    auditTrail?: AuditTrailStats
    system?: RuntimeStats
  }
  timestamp: string
}

const numberFormatter = new Intl.NumberFormat('de-DE')
const percentFormatter = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 })
const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'medium' })

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  return numberFormatter.format(value)
}

function formatDecimal(value?: number | null, fractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  return value.toLocaleString('de-DE', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(2, fractionDigits),
  })
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  return percentFormatter.format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '–'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '–'
  return dateTimeFormatter.format(date)
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '–'
  const totalSeconds = Math.floor(seconds)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
}

function formatBytes(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const digits = size >= 10 || unitIndex === 0 ? 0 : 1
  return `${size.toFixed(digits)} ${units[unitIndex]}`
}

function formatKiB(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  const mb = value / 1024
  const digits = mb >= 10 ? 0 : 1
  return `${mb.toFixed(digits)} MB`
}

function formatBoolean(value?: boolean | null) {
  if (value === null || value === undefined) return '–'
  return value ? 'Ja' : 'Nein'
}

function formatMs(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  return `${value.toFixed(value >= 10 ? 0 : 2)} ms`
}

function truncate(value?: string | null, max = 80) {
  if (!value) return '–'
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

const AUTO_REFRESH_KEY = 'system:autoRefresh'

export default function SystemPage() {
  const [auto, setAuto] = React.useState<number>(0)
  const { data, isLoading, isError, refetch, isFetching } = useQuery<SystemStatsResponse>({
    queryKey: ['system-stats'],
    queryFn: async () => (await api.get<SystemStatsResponse>('/stats')).data,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: auto ? auto * 1000 : false,
    refetchIntervalInBackground: true,
  })

  React.useEffect(() => {
    const saved = localStorage.getItem(AUTO_REFRESH_KEY)
    if (saved !== null) {
      const n = Number(saved)
      if (!Number.isNaN(n)) setAuto(n)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem(AUTO_REFRESH_KEY, String(auto))
  }, [auto])

  const stats = data?.data
  const env = stats?.env ?? {}
  const users = stats?.users ?? {}
  const shifts = stats?.shifts ?? {}
  const incidents = stats?.incidents ?? {}
  const requests = stats?.requests ?? {}
  const notifications = stats?.notifications
  const notificationCounters = notifications?.counters
  const notificationQueues = notifications?.queue
  const notificationStreams = notifications?.streams
  const audit = stats?.auditTrail ?? {}
  const features = stats?.features ?? {}
  const authLimitCounters = stats?.rateLimitAuth ?? {}
  const authLimiterConfig = stats?.authRateLimit ?? {}
  const authTokenConfig = stats?.auth ?? {}
  const runtime = stats?.system ?? {}

  const totalRequests = requests.requestsTotal ?? 0
  const responses4xx = requests.responses4xx ?? 0
  const responses5xx = requests.responses5xx ?? 0
  const responses2xx = Math.max(0, totalRequests - responses4xx - responses5xx)

  const copySha = async () => {
    const sha = env.buildSha || ''
    if (!sha) {
      toast.error('Kein Build SHA vorhanden')
      return
    }
    try {
      await navigator.clipboard.writeText(sha)
      toast.success('Build SHA kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  const queueRows = [
    { key: 'email', label: 'E-Mail', data: notificationQueues?.email },
    { key: 'push', label: 'Push', data: notificationQueues?.push },
  ].filter((row) => Boolean(row.data)) as Array<{ key: string; label: string; data: QueueState }>

  const outcomeEntries = Object.entries(audit.outcomes ?? {})
  const featureEntries = Object.entries(features)
  const subscriptionEntries = Object.entries(notificationStreams?.channelSubscriptions ?? {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">System</h1>
        <div className="inline-flex flex-wrap items-end gap-3">
          <Button variant="link" asChild>
            <a href="/api-docs" target="_blank" rel="noreferrer">API‑Docs</a>
          </Button>
          <Button variant="link" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Aktualisiere…' : 'Aktualisieren'}
          </Button>
          <FormField label="Auto‑Refresh" className="text-sm">
            <Select value={String(auto)} onChange={(e) => setAuto(Number(e.target.value))}>
              <option value={0}>Aus</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </Select>
          </FormField>
        </div>
      </div>

      {auto > 0 && (
        <div className="text-xs text-muted-foreground">Aktualisierung alle {auto}s</div>
      )}
      {data?.timestamp && (
        <div className="text-xs text-muted-foreground">
          Letzte Aktualisierung: {formatDate(data.timestamp)}
        </div>
      )}

      {isLoading && <div>Lade…</div>}
      {isError && (
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-1">Fehler beim Laden der Systemdaten.</div>
          <div className="text-muted-foreground">Bitte neu laden. Falls der Fehler bleibt, API unter /api/health prüfen.</div>
        </div>
      )}

      {!!stats && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Environment">
              <K label="Node Env" value={env.nodeEnv} />
              <K label="App Version" value={env.version} />
              <K label="Spec Version" value={env.specVersion ?? 'n/a'} />
              <div className="flex items-center gap-2">
                <K label="Build SHA" value={env.buildSha || '–'} />
                <button className="underline text-xs" onClick={copySha}>Copy</button>
              </div>
              {featureEntries.length > 0 && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Feature Flags</div>
                  <div className="space-y-1 text-xs">
                    {featureEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span>{key}</span>
                        <span className="font-mono">{formatBoolean(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Users">
              <K label="Total" value={formatNumber(users.total)} />
              <K label="Active" value={formatNumber(users.active)} />
              <K label="Inactive" value={formatNumber(users.inactive)} />
            </Card>

            <Card title="Shifts & Incidents">
              <K label="Schichten gesamt" value={formatNumber(shifts.total)} />
              <K label="Bevorstehende Schichten" value={formatNumber(shifts.upcoming)} />
              <K label="Offene Incidents" value={formatNumber(incidents.open)} />
              <K label="Zeiteinträge" value={formatNumber(stats.timeEntries?.total)} />
            </Card>

            <Card title="Requests (seit Start)">
              <K label="Total" value={formatNumber(totalRequests)} />
              <K label="2xx" value={formatNumber(responses2xx)} />
              <K label="4xx" value={formatNumber(responses4xx)} />
              <K label="5xx" value={formatNumber(responses5xx)} />
            </Card>

            <Card title="Auth Rate Limit">
              <K label="Aktiv" value={formatBoolean(authLimiterConfig.enabled ?? true)} />
              <K label="Max / Minute" value={formatNumber(authLimiterConfig.perMin)} />
              <K label="Fenster" value={authLimiterConfig.windowMs ? `${formatDuration(authLimiterConfig.windowMs / 1000)} (${formatNumber(authLimiterConfig.windowMs)} ms)` : '–'} />
              <div className="pt-2 mt-2 border-t border-border text-xs uppercase text-muted-foreground">Zähler</div>
              <K label="IP 429" value={formatNumber(authLimitCounters.ip429)} />
              <K label="User 429" value={formatNumber(authLimitCounters.user429)} />
              <K label="Login Attempts" value={formatNumber(authLimitCounters.loginAttempts)} />
              <K label="Login Blocked" value={formatNumber(authLimitCounters.loginBlocked)} />
              <div className="pt-2 mt-2 border-t border-border text-xs uppercase text-muted-foreground">Token Config</div>
              <K label="JWT Expires In" value={authTokenConfig.jwtExpiresIn} />
              <K label="Refresh Expires In" value={authTokenConfig.refreshExpiresIn} />
            </Card>

            <Card title="Runtime">
              <K label="Uptime" value={formatDuration(runtime.uptimeSeconds)} />
              <K label="Node-Version" value={runtime.nodeVersion} />
              <K label="Platform" value={runtime.platform} />
              <K label="Log Level" value={runtime.logLevel} />
              <div className="pt-2 mt-2 border-t border-border text-xs uppercase text-muted-foreground">Speicher</div>
              <K label="RSS" value={formatBytes(runtime.memory?.rss)} />
              <K label="Heap benutzt" value={formatBytes(runtime.memory?.heapUsed)} />
              <K label="Heap gesamt" value={formatBytes(runtime.memory?.heapTotal)} />
              <div className="pt-2 mt-2 border-t border-border text-xs uppercase text-muted-foreground">CPU / Ressourcen</div>
              <K label="CPU User" value={`${formatDecimal(runtime.resourceUsage?.userCPUSeconds, 3)} s`} />
              <K label="CPU System" value={`${formatDecimal(runtime.resourceUsage?.systemCPUSeconds, 3)} s`} />
              <K label="Max RSS" value={formatKiB(runtime.resourceUsage?.maxRSS)} />
              <K label="Voluntary CS" value={formatNumber(runtime.resourceUsage?.voluntaryContextSwitches)} />
              <K label="Involuntary CS" value={formatNumber(runtime.resourceUsage?.involuntaryContextSwitches)} />
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Notifications (Konfiguration)">
              <K label="SMTP aktiv" value={formatBoolean(notifications?.smtpConfigured)} />
              <K label="Push aktiv" value={formatBoolean(notifications?.pushConfigured)} />
              <K label="Test-Limit aktiviert" value={formatBoolean(notifications?.testRateLimit?.enabled)} />
              <K label="Limit / Minute" value={formatNumber(notifications?.testRateLimit?.perMin)} />
              <K label="Fenster" value={notifications?.testRateLimit?.windowMs ? `${formatDuration((notifications.testRateLimit.windowMs ?? 0) / 1000)} (${formatNumber(notifications.testRateLimit.windowMs)} ms)` : '–'} />
            </Card>

            <Card title="Notification Delivery">
              <ChannelSection label="E-Mail" counter={notificationCounters?.email} rate={notifications?.successRate?.email} />
              <div className="pt-2 mt-2 border-t border-border" />
              <ChannelSection label="Push" counter={notificationCounters?.push} rate={notifications?.successRate?.push} />
            </Card>

            <Card title="Notification Streams">
              <K label="Abonnenten" value={formatNumber(notificationStreams?.subscribers)} />
              <K label="Letztes Event" value={formatDate(notificationStreams?.lastEventAt || undefined)} />
              <K label="Event-Typ" value={notificationStreams?.lastEventType ?? '–'} />
              <K label="Event-Kanal" value={notificationStreams?.lastEventChannel ?? '–'} />
              {subscriptionEntries.length > 0 && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Channel Subscriptions</div>
                  <div className="space-y-1 text-xs">
                    {subscriptionEntries.map(([channel, count]) => (
                      <div key={channel} className="flex items-center justify-between gap-4">
                        <span>{channel === '*' ? 'Alle' : channel}</span>
                        <span className="font-mono">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card title="Notification Queues">
            {queueRows.length > 0 ? (
              <Table className="text-xs">
                <THead>
                  <Tr>
                    <Th>Name</Th>
                    <Th className="text-right">Pending</Th>
                    <Th className="text-right">In Flight</Th>
                    <Th className="text-right">Processed</Th>
                    <Th className="text-right">Failed</Th>
                    <Th>Zuletzt</Th>
                    <Th>Letzter Fehler</Th>
                  </Tr>
                </THead>
                <TBody>
                  {queueRows.map(({ key, label, data: queue }) => (
                    <Tr key={key}>
                      <Td>{label}</Td>
                      <Td className="text-right font-mono">{formatNumber(queue.pending)}</Td>
                      <Td className="text-right font-mono">{formatNumber(queue.inFlight)}</Td>
                      <Td className="text-right font-mono">{formatNumber(queue.processed)}</Td>
                      <Td className="text-right font-mono">{formatNumber(queue.failed)}</Td>
                      <Td className="text-xs text-muted-foreground">{formatDate(queue.lastSettledAt || queue.lastProcessedAt || queue.lastFailedAt || queue.lastStartedAt)}</Td>
                      <Td className="text-xs font-mono">{truncate(queue.lastError)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground">Keine Queue-Daten verfügbar.</div>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Audit Trail">
              <K label="Total" value={formatNumber(audit.total)} />
              <K label="Letzte 24h" value={formatNumber(audit.last24h)} />
              {audit.latest ? (
                <div className="pt-2 mt-2 border-t border-border space-y-1 text-xs">
                  <div className="uppercase text-muted-foreground">Letztes Event</div>
                  <div className="font-mono">{audit.latest.action ?? '–'} ({audit.latest.outcome ?? '–'})</div>
                  <div className="text-muted-foreground">{formatDate(audit.latest.occurredAt)}</div>
                </div>
              ) : null}
              {audit.queue && (
                <div className="pt-2 mt-2 border-t border-border space-y-1 text-xs">
                  <div className="uppercase text-muted-foreground">Queue</div>
                  <div className="flex items-center justify-between"><span>Size</span><span className="font-mono">{formatNumber(audit.queue.queueSize)}</span></div>
                  <div className="flex items-center justify-between"><span>Flush Interval</span><span className="font-mono">{audit.queue.flushIntervalMs ? `${formatDuration(audit.queue.flushIntervalMs / 1000)} (${formatNumber(audit.queue.flushIntervalMs)} ms)` : '–'}</span></div>
                  <div className="flex items-center justify-between"><span>Batch Size</span><span className="font-mono">{formatNumber(audit.queue.batchSize)}</span></div>
                  <div className="flex items-center justify-between"><span>Max Queue</span><span className="font-mono">{formatNumber(audit.queue.maxQueueSize)}</span></div>
                  <div className="flex items-center justify-between"><span>Flushing</span><span className="font-mono">{formatBoolean(audit.queue.isFlushing)}</span></div>
                  <div className="flex items-center justify-between"><span>Geplant</span><span className="font-mono">{formatBoolean(audit.queue.hasScheduledFlush)}</span></div>
                </div>
              )}
            </Card>

            <Card title="Event Loop">
              <K label="p50" value={formatMs(runtime.eventLoop?.delay?.p50Ms)} />
              <K label="p90" value={formatMs(runtime.eventLoop?.delay?.p90Ms)} />
              <K label="p99" value={formatMs(runtime.eventLoop?.delay?.p99Ms)} />
              <K label="Max" value={formatMs(runtime.eventLoop?.delay?.maxMs)} />
              <div className="pt-2 mt-2 border-t border-border text-xs uppercase text-muted-foreground">Utilization</div>
              <K label="Auslastung" value={formatPercent(runtime.eventLoop?.utilization?.utilization)} />
              <K label="Aktiv" value={formatPercent(runtime.eventLoop?.utilization?.active)} />
              <K label="Idle" value={formatPercent(runtime.eventLoop?.utilization?.idle)} />
            </Card>

            <Card title="Audit Outcomes">
              {outcomeEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">Keine Einträge vorhanden.</div>
              ) : (
                <div className="space-y-1 text-sm">
                  {outcomeEntries.map(([outcome, count]) => (
                    <div key={outcome} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{outcome}</span>
                      <span className="font-mono">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-3 bg-card">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  )
}

function K({ label, value }: { label: string; value?: React.ReactNode }) {
  const display = value === undefined || value === null || value === '' ? '–' : value
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-right">{display}</span>
    </div>
  )
}

function ChannelSection({ label, counter, rate }: { label: string; counter?: NotificationCounter; rate?: number | null }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <K label="Erfolgreich" value={formatNumber(counter?.success)} />
      <K label="Fehlgeschlagen" value={formatNumber(counter?.fail)} />
      <K label="Versuche" value={formatNumber(counter?.attempts)} />
      <K label="Letzter Erfolg" value={formatDate(counter?.lastSuccessAt)} />
      <K label="Letzter Fehler" value={formatDate(counter?.lastFailAt)} />
      <K label="Letzter Versuch" value={formatDate(counter?.lastAttemptAt)} />
      <K label="Erfolgsrate" value={formatPercent(rate)} />
      <K label="Letzte Fehlermeldung" value={truncate(counter?.lastError, 60)} />
    </div>
  )
}
