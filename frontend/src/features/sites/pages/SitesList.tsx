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

type Site = {
  id: string
  name: string
  city?: string
  postalCode?: string
  status?: 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST'
  customerName?: string
  customerCompany?: string
}
type ListResp = { data: Site[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

const STATUS_LABELS: Record<string, string> = {
  INQUIRY: 'Anfrage',
  IN_REVIEW: 'In Prüfung',
  CALCULATING: 'Kalkulation',
  OFFER_SENT: 'Angebot versendet',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  LOST: 'Verloren',
}

const STATUS_COLORS: Record<string, string> = {
  INQUIRY: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  CALCULATING: 'bg-orange-100 text-orange-800',
  OFFER_SENT: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
}

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Objekte</h1>
        <Button onClick={() => nav('/sites/new')}>Neues Objekt</Button>
      </div>

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
        <FormField label="Status">
          <Select
            value={params.filters.status || ''}
            onChange={(e) => update({ filters: { status: e.target.value || undefined } })}
          >
            <option value="">Alle</option>
            <option value="INQUIRY">Anfrage</option>
            <option value="IN_REVIEW">In Prüfung</option>
            <option value="CALCULATING">Kalkulation</option>
            <option value="OFFER_SENT">Angebot versendet</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
            <option value="LOST">Verloren</option>
          </Select>
        </FormField>
        <FormField label="Kunde">
          <DebouncedInput value={params.filters.customerName||''} onChange={(v)=>update({filters:{customerName:v}})} />
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
          {
            key: 'status',
            header: 'Status',
            render: (r: Site) => {
              if (!r.status) return <span className="text-gray-400">—</span>
              return (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              )
            },
          },
          {
            key: 'customer',
            header: 'Kunde',
            render: (r: Site) => {
              if (r.customerCompany) return r.customerCompany
              if (r.customerName) return r.customerName
              return <span className="text-gray-400">—</span>
            },
          },
          {
            key: 'actions',
            header: 'Aktionen',
            render: (r: Site) => (
              <div className="flex gap-2">
                <Link className="underline text-blue-600 hover:text-blue-800" to={`/sites/${r.id}`}>
                  Details
                </Link>
                <Link className="underline text-blue-600 hover:text-blue-800" to={`/sites/${r.id}/shifts`}>
                  Schichten
                </Link>
              </div>
            ),
          },
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
