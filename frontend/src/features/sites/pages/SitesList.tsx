import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { DataTable } from '@/components/table/DataTable'
import React from 'react'
import { exportFile } from '@/features/common/export'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import RbacForbidden from '@/components/RbacForbidden'

type Site = { id: string; name: string; city?: string; postalCode?: string }
type ListResp = { data: Site[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function SitesList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'name', sortDir: 'asc' })
  const nav = useNavigate()
  const [downloading, setDownloading] = React.useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
  const qk = ['sites', params]
  const { data, isLoading, isError, error } = useQuery<ListResp>({
    queryKey: qk,
    queryFn: async () => {
      const sp = toSearchParams(params)
      const res = await api.get<ListResp>(`/sites?${sp.toString()}`)
      return res.data
    },
    placeholderData: keepPreviousData,
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
      <div className="flex gap-2 items-end flex-wrap">
        <FormField label="Name">
          <DebouncedInput value={params.filters.name||''} onChange={(v)=>update({filters:{name:v}})} />
        </FormField>
        <FormField label="Stadt">
          <DebouncedInput value={params.filters.city||''} onChange={(v)=>update({filters:{city:v}})} />
        </FormField>
        <FormField label="PLZ">
          <DebouncedInput value={params.filters.postalCode||''} onChange={(v)=>update({filters:{postalCode:v}})} />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="inline-flex gap-2">
          <Button variant="link" disabled={!!downloading} onClick={()=>doExport('csv')}>
            Export CSV{downloading?.type==='csv' && (downloading.progress ? ` ${downloading.progress}%` : ' …')}
          </Button>
          <Button variant="link" disabled={!!downloading} onClick={()=>doExport('xlsx')}>
            Export XLSX{downloading?.type==='xlsx' && (downloading.progress ? ` ${downloading.progress}%` : ' …')}
          </Button>
        </div>
      </div>

      {(Object.keys(params.filters).length > 0 || !!params.sortBy) && (
        <div className="flex justify-end gap-4">
          {Object.keys(params.filters).length > 0 && (
            <Button variant="link" onClick={() => update({ filters: Object.fromEntries(Object.keys(params.filters).map(k => [k, undefined])), page: 1 })}>
              Filter zurücksetzen
            </Button>
          )}
          {!!params.sortBy && (
            <Button variant="link" onClick={()=>update({ sortBy: '', page: 1 })}>
              Sortierung zurücksetzen
            </Button>
          )}
        </div>
      )}

      {isError && (error as any)?.response?.status === 403 && (
        <RbacForbidden />
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
