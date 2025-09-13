import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import useDebounce from '@/features/common/useDebounce'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import { useAuth } from '@/features/auth/AuthProvider'
import RbacForbidden from '@/components/RbacForbidden'
import { exportFile } from '@/features/common/export'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

type User = { id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean }
type ListResp = { data: User[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function UsersList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'firstName', sortDir: 'asc', query: '' })
  const qk = ['users', params]
  const { tokens } = useAuth()
  const nav = useNavigate()
  const [search, setSearch] = React.useState<string>(params.query || '')
  const debounced = useDebounce(search, 300)
  const [downloading, setDownloading] = React.useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const sp = toSearchParams(params)
      const res = await api.get<ListResp>(`/users`, { params: Object.fromEntries(sp.entries()) })
      return res.data
    },
    keepPreviousData: true,
  })

  // apply debounced search to query param
  React.useEffect(() => {
    if ((params.query || '') !== debounced) {
      update({ query: debounced, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // keep local input in sync with URL (Back/Forward)
  React.useEffect(() => {
    const q = params.query || ''
    if (q !== search) setSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.query])

  const currentExportParams = React.useMemo(() => {
    const sp = toSearchParams(params)
    sp.delete('page'); sp.delete('pageSize')
    return sp
  }, [params])

  const doExport = async (type: 'csv'|'xlsx') => {
    try {
      setDownloading({ type, progress: undefined })
      await exportFile({
        path: '/users',
        accept: type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filenameHint: type === 'csv' ? 'users.csv' : 'users.xlsx',
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
      <h1 className="text-xl font-semibold">Benutzer</h1>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="min-w-[220px]">
          <label className="text-xs" htmlFor="search">Suche</label>
          <input id="search" className="border rounded px-2 py-1 block w-full" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Name oder E-Mail" />
        </div>
        <div>
          <label className="text-xs">E-Mail</label>
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.email||''} onChange={(v)=>update({filters:{email:v}})} />
        </div>
        <div>
          <label className="text-xs">Vorname</label>
          <DebouncedInput className="border rounded px-2 py-1 block" value={params.filters.firstName||''} onChange={(v)=>update({filters:{firstName:v}})} />
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
        <div className="ml-auto inline-flex gap-2">
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
      {isError && (error as any)?.response?.status === 403 && (
        <RbacForbidden />
      )}

      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true, render: (u: User) => `${u.firstName} ${u.lastName}` },
          { key: 'email', header: 'E-Mail', sortable: true },
          { key: 'role', header: 'Rolle', sortable: true },
          { key: 'isActive', header: 'Aktiv', sortable: true, render: (u: User) => (u.isActive ? 'Ja' : 'Nein') },
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
