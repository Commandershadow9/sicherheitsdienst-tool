import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { useAuth } from '@/features/auth/AuthProvider'

type User = { id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean }
type ListResp = { data: User[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function UsersList() {
  const { params, update } = useListParams({ page: 1, pageSize: 10, sortBy: 'firstName', sortDir: 'asc' })
  const qk = ['users', params]
  const { tokens } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      if (params.sortBy) sp.set('sortBy', params.sortBy)
      if (params.sortDir) sp.set('sortDir', params.sortDir)
      for (const [k,v] of Object.entries(params.filters)) sp.set(`filter[${k}]`, v)
      const res = await api.get<ListResp>(`/users?${sp.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  const exportCsv = async () => {
    const url = `${api.defaults.baseURL}/users`
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
    a.download = `users.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Benutzer</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="text-xs">E-Mail</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.email||''} onBlur={(e)=>update({filters:{email:e.target.value}})} />
        </div>
        <div>
          <label className="text-xs">Vorname</label>
          <input className="border rounded px-2 py-1 block" defaultValue={params.filters.firstName||''} onBlur={(e)=>update({filters:{firstName:e.target.value}})} />
        </div>
        <div>
          <label className="text-xs">Rolle</label>
          <select className="border rounded px-2 py-1 block" defaultValue={params.filters.role||''} onChange={(e)=>update({filters:{role: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option>ADMIN</option>
            <option>MANAGER</option>
            <option>EMPLOYEE</option>
          </select>
        </div>
        <div>
          <label className="text-xs">Aktiv</label>
          <select className="border rounded px-2 py-1 block" defaultValue={params.filters.isActive||''} onChange={(e)=>update({filters:{isActive: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
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
                  <button className="underline" onClick={()=>update({sortBy:'firstName', sortDir: params.sortBy==='firstName' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Name {params.sortBy==='firstName' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'email', sortDir: params.sortBy==='email' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>E-Mail {params.sortBy==='email' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'role', sortDir: params.sortBy==='role' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Rolle {params.sortBy==='role' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
                <th className="text-left p-2">
                  <button className="underline" onClick={()=>update({sortBy:'isActive', sortDir: params.sortBy==='isActive' && params.sortDir==='asc' ? 'desc' : 'asc', page:1})}>Aktiv {params.sortBy==='isActive' ? (params.sortDir==='asc'?'▲':'▼') : ''}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && <tr><td colSpan={4} className="p-3 text-muted-foreground">Keine Einträge</td></tr>}
              {data.data.map((u)=> (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.firstName} {u.lastName}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.isActive ? 'Ja' : 'Nein'}</td>
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
