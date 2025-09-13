import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { Link } from 'react-router-dom'

type Site = { id: string; name: string; city?: string; postalCode?: string }
type ListResp = { data: Site[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function SitesList() {
  const { params, update } = useListParams({ page: 1, pageSize: 10, sortBy: 'name', sortDir: 'asc' })
  const qk = ['sites', params]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      if (params.sortBy) sp.set('sortBy', params.sortBy)
      if (params.sortDir) sp.set('sortDir', params.sortDir)
      for (const [k,v] of Object.entries(params.filters)) sp.set(`filter[${k}]`, v)
      const res = await api.get<ListResp>(`/sites?${sp.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Standorte</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs">Name</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.name||''} onBlur={(e)=>update({filters:{name:e.target.value}})} />
        </div>
        <div>
          <label className="text-xs">Stadt</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.city||''} onBlur={(e)=>update({filters:{city:e.target.value}})} />
        </div>
        <div>
          <label className="text-xs">PLZ</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.postalCode||''} onBlur={(e)=>update({filters:{postalCode:e.target.value}})} />
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
                  <button className="underline" onClick={()=>update({sortBy:'name', sortDir: params.sortBy==='name' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Name {params.sortBy==='name' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'city', sortDir: params.sortBy==='city' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Stadt {params.sortBy==='city' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'postalCode', sortDir: params.sortBy==='postalCode' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>PLZ {params.sortBy==='postalCode' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr><td colSpan={4} className="p-3 text-muted-foreground">Keine Einträge</td></tr>
              )}
              {data.data.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.city || '-'}</td>
                  <td className="p-2">{s.postalCode || '-'}</td>
                  <td className="p-2">
                    <Link className="underline" to={`/sites/${s.id}/shifts`}>Schichten</Link>
                  </td>
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
