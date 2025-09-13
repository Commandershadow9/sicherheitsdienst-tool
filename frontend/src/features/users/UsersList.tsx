import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { DebouncedInput } from '@/components/inputs/DebouncedInput'
import { DataTable } from '@/components/table/DataTable'
import { useAuth } from '@/features/auth/AuthProvider'

type User = { id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean }
type ListResp = { data: User[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function UsersList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'firstName', sortDir: 'asc' })
  const qk = ['users', params]
  const { tokens } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const sp = toSearchParams(params)
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
        <div className="ml-auto">
          <button className="underline" onClick={exportCsv}>CSV Export</button>
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
