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
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { toast } from 'sonner'
import { exportFile } from '@/features/common/export'
import { useState } from 'react'
import RbacForbidden from '@/components/RbacForbidden'
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  getIncidentSeverityLabel,
  getIncidentStatusLabel,
} from '@/features/incidents/constants'

type Incident = { id: string; title: string; severity: string; status: string; occurredAt: string }
type ListResp = { data: Incident[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

export default function IncidentsList() {
  const { params, update } = useListParams({ page: 1, pageSize: 25, sortBy: 'occurredAt', sortDir: 'desc' })
  const { user } = useAuth()
  const nav = useNavigate()
  const [downloading, setDownloading] = useState<null | { type: 'csv'|'xlsx'; progress?: number }>(null)
  const { data, isLoading, isError, error } = useQuery<ListResp>({
    queryKey: ['incidents', params],
    queryFn: async () => {
      const sp = toSearchParams(params)
      const res = await api.get<ListResp>(`/incidents?${sp.toString()}`)
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  // Export handled inline below via exportFile helper (sets Authorization header)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vorfälle</h1>
      <div className="flex gap-2 items-end flex-wrap">
        <FormField label="Titel">
          <DebouncedInput value={params.filters.title||''} onChange={(v)=>update({filters:{title:v}})} />
        </FormField>
        <FormField label="Schwere">
          <Select value={params.filters.severity ?? ''} onChange={(e)=>update({filters:{severity: e.target.value || undefined}})}>
            <option value="">Alle</option>
            {INCIDENT_SEVERITIES.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={params.filters.status ?? ''} onChange={(e)=>update({filters:{status: e.target.value || undefined}})}>
            <option value="">Alle</option>
            {INCIDENT_STATUSES.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Datum von">
          <Input type="date" value={params.filters.occurredAtFrom||''} onChange={(e)=>update({filters:{occurredAtFrom:e.target.value||undefined}})} />
        </FormField>
        <FormField label="Datum bis">
          <Input type="date" value={params.filters.occurredAtTo||''} onChange={(e)=>update({filters:{occurredAtTo:e.target.value||undefined}})} />
        </FormField>
        <div className="ml-auto">
          <div className="inline-flex gap-2">
            <Button variant="link" disabled={!!downloading} onClick={async ()=>{
              try {
                setDownloading({ type: 'csv' })
                const sp = toSearchParams(params); sp.delete('page'); sp.delete('pageSize')
                await exportFile({ path: '/incidents', accept: 'text/csv', filenameHint: 'incidents.csv', params: sp, onUnauthorized: () => nav('/login') })
              } catch (e:any) { toast.error(e?.message||'Export fehlgeschlagen') } finally { setDownloading(null) }
            }}>Export CSV</Button>
            <Button variant="link" disabled={!!downloading} onClick={async ()=>{
              try {
                setDownloading({ type: 'xlsx' })
                const sp = toSearchParams(params); sp.delete('page'); sp.delete('pageSize')
                await exportFile({ path: '/incidents', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filenameHint: 'incidents.xlsx', params: sp, onUnauthorized: () => nav('/login') })
              } catch (e:any) { toast.error(e?.message||'Export fehlgeschlagen') } finally { setDownloading(null) }
            }}>Export XLSX</Button>
          </div>
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

      <div className="flex justify-between items-center">
        <div />
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Link to="/incidents/new" className="underline">Neuer Vorfall</Link>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'title', header: 'Titel', sortable: true },
          { key: 'severity', header: 'Schwere', sortable: true, render: (i: Incident) => getIncidentSeverityLabel(i.severity) },
          { key: 'status', header: 'Status', sortable: true, render: (i: Incident) => getIncidentStatusLabel(i.status) },
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
