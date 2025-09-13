import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import { useAuth } from '@/features/auth/AuthProvider'

type Incident = { id: string; title: string; severity: string; status: string; occurredAt: string }
type ListResp = { data: Incident[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function IncidentsList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'occurredAt', sortDir: 'desc' })
  const { tokens } = useAuth()
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
        <div className="ml-auto">
          <button className="underline" onClick={exportCsv}>CSV Export</button>
        </div>
      </div>

      {!!params.sortBy && (
        <div className="flex justify-end">
          <button className="underline text-sm" onClick={()=>update({ sortBy: '', page: 1 })}>
            Sortierung zurücksetzen
          </button>
        </div>
      )}
      <DataTable
        columns={[
          { key: 'title', header: 'Titel', sortable: true },
          { key: 'severity', header: 'Schwere', sortable: true },
          { key: 'status', header: 'Status', sortable: true },
          { key: 'occurredAt', header: 'Zeit', sortable: true, render: (i: Incident) => new Date(i.occurredAt).toLocaleString() },
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
