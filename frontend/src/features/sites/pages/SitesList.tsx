import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import { Link } from 'react-router-dom'

type Site = { id: string; name: string; city?: string; postalCode?: string }
type ListResp = { data: Site[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function SitesList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'name', sortDir: 'asc' })
  const qk = ['sites', params]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const sp = toSearchParams(params)
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
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.name||''} onChange={(v)=>update({filters:{name:v}})} />
        </div>
        <div>
          <label className="text-xs">Stadt</label>
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.city||''} onChange={(v)=>update({filters:{city:v}})} />
        </div>
        <div>
          <label className="text-xs">PLZ</label>
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.postalCode||''} onChange={(v)=>update({filters:{postalCode:v}})} />
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'city', header: 'Stadt', sortable: true },
          { key: 'postalCode', header: 'PLZ', sortable: true },
          { key: 'actions', header: 'Aktionen', render: (r: Site) => <Link className="underline" to={`/sites/${r.id}/shifts`}>Schichten</Link> },
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
