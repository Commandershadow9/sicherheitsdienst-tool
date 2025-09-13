import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DataTable } from '@/components/table/DataTable'
import React from 'react'
import { exportFile } from '@/features/common/export'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

type Shift = { id: string; title: string; site?: { name: string } | null; startTime: string; endTime: string; status: string }
type ListResp = { data: Shift[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function ShiftList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'startTime', sortDir: 'desc' })
  const { tokens, user } = useAuth()
  const nav = useNavigate()
  const [downloading, setDownloading] = React.useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
  const effectiveParams = React.useMemo(() => {
    if (user?.role === 'EMPLOYEE' && user.id) {
      return { ...params, filters: { ...params.filters, userId: user.id } }
    }
    return params
  }, [params, user?.role, user?.id])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shifts', effectiveParams],
    queryFn: async () => {
      const sp = toSearchParams(effectiveParams)
      const res = await api.get<ListResp>(`/shifts?${sp.toString()}`)
      return res.data
    },
    keepPreviousData: true,
  })

  const currentExportParams = React.useMemo(() => {
    const sp = toSearchParams(effectiveParams)
    sp.delete('page'); sp.delete('pageSize')
    return sp
  }, [effectiveParams])

  const doExport = async (type: 'csv'|'xlsx') => {
    try {
      setDownloading({ type, progress: undefined })
      await exportFile({
        path: '/shifts',
        accept: type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        token: tokens?.accessToken,
        filenameHint: type === 'csv' ? 'shifts.csv' : 'shifts.xlsx',
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
      <h1 className="text-xl font-semibold">Schichten</h1>
      {user && user.role !== 'EMPLOYEE' && (
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-current"
              checked={params.filters.userId === user.id}
              onChange={(e) => update({ filters: { userId: e.target.checked ? user.id : undefined }, page: 1 })}
            />
            Nur eigene Schichten
          </label>
        </div>
      )}
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
