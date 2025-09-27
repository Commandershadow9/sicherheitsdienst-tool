import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
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

  const handleSearchChange = React.useCallback((v: string) => {
    if (import.meta.env.DEV) {
      console.debug('Users search query', v)
    }
    update({ query: v, page: 1 })
  }, [update])

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
        <FormField className="min-w-[220px]" label="Suche" htmlFor="search">
          <DebouncedInput id="search" value={params.query || ''} onChange={handleSearchChange} placeholder="Name oder E-Mail" />
        </FormField>
        <FormField label="E-Mail">
          <DebouncedInput value={params.filters.email||''} onChange={(v)=>update({filters:{email:v}})} />
        </FormField>
        <FormField label="Vorname">
          <DebouncedInput value={params.filters.firstName||''} onChange={(v)=>update({filters:{firstName:v}})} />
        </FormField>
        <FormField label="Rolle">
          <Select defaultValue={params.filters.role||''} onChange={(e)=>update({filters:{role: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option>ADMIN</option>
            <option>MANAGER</option>
            <option>EMPLOYEE</option>
          </Select>
        </FormField>
        <FormField label="Aktiv">
          <Select defaultValue={params.filters.isActive||''} onChange={(e)=>update({filters:{isActive: e.target.value || undefined}})}>
            <option value="">Alle</option>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </Select>
        </FormField>
        <div className="ml-auto inline-flex gap-2">
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
