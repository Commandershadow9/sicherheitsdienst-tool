import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DataTable } from '@/components/table/DataTable'

type Shift = { id: string; title: string; site?: { name: string } | null; startTime: string; endTime: string; status: string }
type ListResp = { data: Shift[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function ShiftList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'startTime', sortDir: 'desc' })
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shifts', params],
    queryFn: async () => {
      const sp = toSearchParams(params)
      const res = await api.get<ListResp>(`/shifts?${sp.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Schichten</h1>

      <DataTable
        columns={[
          { key: 'title', header: 'Titel', sortable: true },
          { key: 'site', header: 'Site', render: (s: Shift) => s.site?.name || '-' },
          { key: 'startTime', header: 'Start', sortable: true, render: (s: Shift) => new Date(s.startTime).toLocaleString() },
          { key: 'endTime', header: 'Ende', sortable: true, render: (s: Shift) => new Date(s.endTime).toLocaleString() },
          { key: 'status', header: 'Status', sortable: true },
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
