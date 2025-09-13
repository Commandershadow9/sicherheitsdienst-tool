import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { toast } from 'sonner'
import { exportFile } from '@/features/common/export'
import { useAuth } from '@/features/auth/AuthProvider'

type Incident = { id: string; title: string; severity: string; status: string; occurredAt: string }
type ListResp = { data: Incident[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function IncidentsList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'occurredAt', sortDir: 'desc' })
  const { tokens, user } = useAuth()
  const nav = useNavigate()
  const [downloading, setDownloading] = useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['incidents', params],
    queryFn: async () => {
      const sp = toSearchParams(params)
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
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.title||''} onChange={(v)=>update({filters:{title:v}})} />
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
        <div>
          <label className="text-xs">Datum von</label>
          <input type="date" className="border rounded px-2 py-1 block" value={params.filters.occurredAtFrom||''} onChange={(e)=>update({filters:{occurredAtFrom:e.target.value||undefined}})} />
        </div>
        <div>
          <label className="text-xs">Datum bis</label>
          <input type="date" className="border rounded px-2 py-1 block" value={params.filters.occurredAtTo||''} onChange={(e)=>update({filters:{occurredAtTo:e.target.value||undefined}})} />
        </div>
        <div className="ml-auto">
          <div className="inline-flex gap-2">
            <button disabled={!!downloading} className="underline" onClick={async ()=>{
              try {
                setDownloading({ type: 'csv' })
                const sp = toSearchParams(params); sp.delete('page'); sp.delete('pageSize')
                await exportFile({ path: '/incidents', accept: 'text/csv', token: tokens?.accessToken, filenameHint: 'incidents.csv', params: sp, onUnauthorized: () => nav('/login') })
              } catch (e:any) { toast.error(e?.message||'Export fehlgeschlagen') } finally { setDownloading(null) }
            }}>Export CSV</button>
            <button disabled={!!downloading} className="underline" onClick={async ()=>{
              try {
                setDownloading({ type: 'xlsx' })
                const sp = toSearchParams(params); sp.delete('page'); sp.delete('pageSize')
                await exportFile({ path: '/incidents', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', token: tokens?.accessToken, filenameHint: 'incidents.xlsx', params: sp, onUnauthorized: () => nav('/login') })
              } catch (e:any) { toast.error(e?.message||'Export fehlgeschlagen') } finally { setDownloading(null) }
            }}>Export XLSX</button>
          </div>
        </div>
      </div>

      {(Object.keys(params.filters).length > 0 || !!params.sortBy) && (
        <div className="flex justify-end gap-4">
          {Object.keys(params.filters).length > 0 && (
            <button
              className="underline text-sm"
              onClick={() => update({ filters: Object.fromEntries(Object.keys(params.filters).map(k => [k, undefined])), page: 1 })}
            >
              Filter zurücksetzen
            </button>
          )}
          {!!params.sortBy && (
            <button className="underline text-sm" onClick={()=>update({ sortBy: '', page: 1 })}>
              Sortierung zurücksetzen
            </button>
          )}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div />
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Link to="/incidents/new" className="underline">Neuer Vorfall</Link>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'title', header: 'Titel', sortable: true },
          { key: 'severity', header: 'Schwere', sortable: true },
          { key: 'status', header: 'Status', sortable: true },
          { key: 'occurredAt', header: 'Zeit', sortable: true, render: (i: Incident) => new Date(i.occurredAt).toLocaleString() },
          { key: 'actions', header: 'Aktionen', render: (i: Incident) => (
            <div className="inline-flex gap-2">
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <Link className="underline" to={`/incidents/${i.id}/edit`}>Bearbeiten</Link>}
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <button className="underline text-red-600" onClick={async ()=>{
                if (!confirm('Diesen Vorfall wirklich löschen?')) return
                try { await api.delete(`/incidents/${i.id}`); toast.success('Vorfall gelöscht'); }
                catch(e:any){ toast.error(e?.response?.data?.message||'Löschen fehlgeschlagen') }
              }}>Löschen</button>}
              {user?.role === 'ADMIN' && (
                <button className="underline" onClick={async ()=>{
                  const recipient = prompt('Empfänger E-Mail für Test?')
                  if (!recipient) return
                  try {
                    await api.post('/notifications/test', { recipient, title: `Vorfall: ${i.title}`, body: `Testbenachrichtigung zum Vorfall ${i.title}` })
                    toast.success('Test-Benachrichtigung gesendet')
                  } catch(e:any) { toast.error(e?.response?.data?.message||'Senden fehlgeschlagen') }
                }}>Test Notification</button>
              )}
            </div>
          ) },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        error={isError}
        sortBy={params.sortBy}
        sortDir={params.sortDir}
        onSort={(key) => {
          if (params.sortBy !== key) return update({ sortBy: key, sortDir: 'asc', page: 1 })
          if (params.sortDir === 'asc') return update({ sortDir: 'desc', page: 1 })
          return update({ sortBy: '', page: 1 })
        }}
        pagination={{ page: data?.pagination.page ?? params.page, pageSize: data?.pagination.pageSize ?? params.pageSize, totalPages: data?.pagination.totalPages ?? 1 }}
        onPageChange={(p)=>update({page: p})}
        onPageSizeChange={(s)=>update({pageSize: s, page: 1})}
      />
    </div>
  )
}
