import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import React from 'react'
import { exportFile } from '@/features/common/export'
import { useAuth } from '@/features/auth/AuthProvider'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

type Site = { id: string; name: string; city?: string; postalCode?: string }
type ListResp = { data: Site[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function SitesList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'name', sortDir: 'asc' })
  const { tokens } = useAuth()
  const nav = useNavigate()
  const [downloading, setDownloading] = React.useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
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

  const currentExportParams = React.useMemo(() => {
    const sp = toSearchParams(params)
    sp.delete('page'); sp.delete('pageSize')
    return sp
  }, [params])

  const doExport = async (type: 'csv'|'xlsx') => {
    try {
      setDownloading({ type, progress: undefined })
      await exportFile({
        path: '/sites',
        accept: type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        token: tokens?.accessToken,
        filenameHint: type === 'csv' ? 'sites.csv' : 'sites.xlsx',
        params: currentExportParams,
        onProgress: ({ percent }) => setDownloading((s)=> s ? { ...s, progress: percent } : s),
        onUnauthorized: () => nav('/login'),
      })
    } catch (e: any) {
      toast.error(e?.message || 'Export fehlgeschlagen')
    } finally {
      setDownloading(null)
    }
  }

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

      <div className="flex items-center justify-end gap-2">
        <div className="inline-flex gap-2">
          <button disabled={!!downloading} className="underline" onClick={()=>doExport('csv')}>
            Export CSV{downloading?.type==='csv' && (downloading.progress ? ` ${downloading.progress}%` : ' …')}
          </button>
          <button disabled={!!downloading} className="underline" onClick={()=>doExport('xlsx')}>
            Export XLSX{downloading?.type==='xlsx' && (downloading.progress ? ` ${downloading.progress}%` : ' …')}
          </button>
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
