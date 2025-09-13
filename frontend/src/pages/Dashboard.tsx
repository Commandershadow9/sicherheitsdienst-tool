import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type Stats = { data: { env: { specVersion: string | null; buildSha: string | null } } }

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.get<Stats>('/stats')
      return res.data
    },
  })

  const spec = data?.data?.env?.specVersion || 'n/a'
  const sha = data?.data?.env?.buildSha || 'n/a'
  return (
    <div className="text-sm">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {isLoading && <div>Lade…</div>}
      {isError && <div className="text-red-600">Fehler beim Laden der Stats</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded p-4 bg-card">
            <div className="text-xs text-muted-foreground">Spec Version</div>
            <div className="text-lg font-medium">{spec}</div>
          </div>
          <div className="border rounded p-4 bg-card">
            <div className="text-xs text-muted-foreground">Build SHA</div>
            <div className="text-lg font-mono">{sha}</div>
          </div>
          <div className="border rounded p-4 bg-card">
            <div className="text-xs text-muted-foreground">Health</div>
            <div className="text-sm">Siehe /healthz und /readyz im Backend</div>
          </div>
        </div>
      )}
    </div>
  )
}
