import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { useAuth } from '@/features/auth/AuthProvider'

type Incident = { id: string; title: string; severity: string; status: string; occurredAt: string }
type ListResp = { data: Incident[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function IncidentsList() {
  const { params, update } = useListParams({ page: 1, pageSize: 10, sortBy: 'occurredAt', sortDir: 'desc' })
  const { tokens } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['incidents', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      if (params.sortBy) sp.set('sortBy', params.sortBy)
      if (params.sortDir) sp.set('sortDir', params.sortDir)
      for (const [k,v] of Object.entries(params.filters)) sp.set(`filter[${k}]`, v)
      const res = await api.get<ListResp>(`/incidents?${sp.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  const exportCsv = async () => {
    const url = `${api.defaults.baseURL}/incidents`
    const res = await fetch(url!, {
      headers: {
        'Accept': 'text/csv',
        ...(tokens?.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {}),
      },
      credentials: 'include',
    })
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `incidents.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vorfälle</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs">Titel</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.title||''} onBlur={(e)=>update({filters:{title:e.target.value}})} />
        </div>
        <div>
          <label className="text-xs">Schwere</label>
          <select className="border rounded px-2 py-1 block" defaultValue={params.filters.severity||''} onChange={(e)=>update({filters:{severity: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
          </select>
        </div>
        <div>
          <label className="text-xs">Status</label>
          <select className="border rounded px-2 py-1 block" defaultValue={params.filters.status||''} onChange={(e)=>update({filters:{status: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option>OPEN</option>
            <option>IN_PROGRESS</option>
            <option>CLOSED</option>
          </select>
        </div>
        <div className="ml-auto">
          <button className="underline" onClick={exportCsv}>CSV Export</button>
        </div>
      </div>
      {isLoading && <div>Lade…</div>}
      {isError && <div className="text-red-600">Fehler beim Laden</div>}
      {data && (
        <div className="border rounded">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'title', sortDir: params.sortBy==='title' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Titel {params.sortBy==='title' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'severity', sortDir: params.sortBy==='severity' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Schwere {params.sortBy==='severity' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'status', sortDir: params.sortBy==='status' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Status {params.sortBy==='status' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'occurredAt', sortDir: params.sortBy==='occurredAt' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Zeit {params.sortBy==='occurredAt' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan={4} className="p-3 text-muted-foreground">Keine Einträge</td></tr>}
              {data.data.map((i)=> (
                <tr key={i.id} className="border-t">
                  <td className="p-2">{i.title}</td>
                  <td className="p-2">{i.severity}</td>
                  <td className="p-2">{i.status}</td>
                  <td className="p-2">{new Date(i.occurredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-2">
            <button disabled={params.page<=1} onClick={()=>update({page: params.page-1})}>Zurück</button>
            <div>Seite {data.pagination.page} / {data.pagination.totalPages}</div>
            <button disabled={data.pagination.page>=data.pagination.totalPages} onClick={()=>update({page: params.page+1})}>Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
