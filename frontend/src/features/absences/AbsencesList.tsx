import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { useListParams } from '@/features/common/useQueryParams'
import { toSearchParams } from '@/features/common/listParams'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table/DataTable'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { createAbsence, fetchAbsences, fetchAbsenceById, approveAbsence, rejectAbsence, cancelAbsence, previewCapacityWarnings } from './api'
import type { Absence, AbsenceStatus, AbsenceType, ShiftConflict } from './types'
import { api } from '@/lib/api'
import { ABSENCE_TYPES, ABSENCE_STATUSES, getAbsenceStatusLabel, getAbsenceTypeLabel, formatPeriod } from './utils'
import { AbsencesCalendar } from './AbsencesCalendar'
import { AbsenceDetailModal } from './AbsenceDetailModal'
import { Calendar, List } from 'lucide-react'

const createSchema = z.object({
  userId: z.string().cuid().optional(),
  type: z.enum(['VACATION', 'SICKNESS', 'SPECIAL_LEAVE', 'UNPAID']),
  startsAt: z.string().min(1, 'Startzeit wählen'),
  endsAt: z.string().min(1, 'Endzeit wählen'),
  reason: z.string().max(2000).optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

type MinimalUser = { id: string; firstName: string; lastName: string }

export default function AbsencesList() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const paramsState = useListParams({ page: 1, pageSize: 25 })
  const { params, update } = paramsState
  const [conflicts, setConflicts] = useState<ShiftConflict[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['absences', params],
    queryFn: () => fetchAbsences(Object.fromEntries(toSearchParams(params).entries())),
    placeholderData: keepPreviousData,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'for-absences'],
    queryFn: async () => {
      if (!isManager) return [] as MinimalUser[]
      const res = await api.get<{ data: MinimalUser[] }>('users', {
        params: { page: 1, pageSize: 100, sortBy: 'firstName' },
      })
      return (res.data?.data ?? []).map((u) => ({ id: u.id, firstName: (u as any).firstName, lastName: (u as any).lastName }))
    },
    enabled: isManager,
    placeholderData: [] as MinimalUser[],
  })

  const [creating, setCreating] = useState(false)

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      type: 'VACATION',
      startsAt: '',
      endsAt: '',
      reason: '',
      userId: user?.role === 'ADMIN' || user?.role === 'MANAGER' ? undefined : user?.id,
    },
  })

  const createMutation = useMutation({
    mutationFn: createAbsence,
    onSuccess: (payload) => {
      toast.success('Abwesenheit erfasst')
      queryClient.invalidateQueries({ queryKey: ['absences'] })
      setCreating(false)
      setConflicts(payload.conflicts ?? [])
      form.reset({
        type: 'VACATION',
        startsAt: '',
        endsAt: '',
        reason: '',
        userId: user?.role === 'ADMIN' || user?.role === 'MANAGER' ? undefined : user?.id,
      })
      if (payload.conflicts && payload.conflicts.length > 0) {
        toast.warning(`Es bestehen ${payload.conflicts.length} Schichtkonflikte.`)
      }
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Abwesenheit konnte nicht erstellt werden'
      toast.error(message)
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => approveAbsence(id, note),
    onSuccess: () => {
      toast.success('Abwesenheit genehmigt')
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Genehmigung fehlgeschlagen')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => rejectAbsence(id, note),
    onSuccess: () => {
      toast.success('Abwesenheit abgelehnt')
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Ablehnung fehlgeschlagen')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAbsence(id),
    onSuccess: () => {
      toast.success('Abwesenheit storniert')
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Stornierung fehlgeschlagen')
    },
  })

  const rows = data?.data ?? []
  const pendingCount = rows.filter((r) => r.status === 'REQUESTED').length

  // Handler: Genehmigen mit Warnungs-Check
  const handleApprove = async (absence: Absence) => {
    try {
      // 1. Preview: Warnungen abrufen
      const { warnings } = await previewCapacityWarnings(absence.id)

      // 2. Wenn Warnungen existieren → Bestätigung einholen
      if (warnings && warnings.length > 0) {
        const warningText = warnings
          .map((w) => `• ${w.shiftTitle} (${w.siteName}): Benötigt ${w.required}, nur ${w.available} verfügbar → ${w.shortage} fehlen`)
          .join('\n')

        const confirmed = window.confirm(
          `⚠️ WARNUNG: Unterbesetzung erkannt!\n\n${warningText}\n\nTrotzdem genehmigen?`
        )

        if (!confirmed) {
          return // Abbruch
        }
      }

      // 3. Genehmigen (mit oder ohne Warnung)
      approveMutation.mutate({ id: absence.id })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Prüfung fehlgeschlagen')
    }
  }

  // Handler: Detailansicht öffnen mit API-Call für vollständige Daten
  const handleOpenDetail = async (absence: Absence) => {
    try {
      const fullAbsence = await fetchAbsenceById(absence.id)
      setSelectedAbsence(fullAbsence)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Laden fehlgeschlagen')
    }
  }

  const columns = useMemo(() => [
    {
      key: 'employee',
      header: 'Mitarbeiter',
      render: (absence: Absence) => (
        <button
          onClick={() => handleOpenDetail(absence)}
          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {absence.user.firstName} {absence.user.lastName}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Art',
      render: (absence: Absence) => getAbsenceTypeLabel(absence.type),
    },
    {
      key: 'status',
      header: 'Status',
      render: (absence: Absence) => getAbsenceStatusLabel(absence.status),
    },
    {
      key: 'period',
      header: 'Zeitraum',
      render: (absence: Absence) => formatPeriod(absence.startsAt, absence.endsAt),
    },
    {
      key: 'reason',
      header: 'Grund',
      render: (absence: Absence) => absence.reason || '–',
    },
    {
      key: 'actions',
      header: 'Aktionen',
      render: (absence: Absence) => {
        const actions: JSX.Element[] = []
        if (absence.status === 'REQUESTED' && isManager) {
          actions.push(
            <Button
              key="approve"
              size="sm"
              variant="secondary"
              onClick={() => handleApprove(absence)}
            >
              Genehmigen
            </Button>,
          )
          actions.push(
            <Button
              key="reject"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                const note = window.prompt('Ablehnungsgrund (optional)') || undefined
                rejectMutation.mutate({ id: absence.id, note })
              }}
            >
              Ablehnen
            </Button>,
          )
        }
        if (
          absence.status === 'REQUESTED' &&
          (absence.user.id === user?.id || isManager)
        ) {
          actions.push(
            <Button
              key="cancel"
              size="sm"
              variant="ghost"
              onClick={() => cancelMutation.mutate(absence.id)}
            >
              Stornieren
            </Button>,
          )
        }
        if (actions.length === 0) return '–'
        return <div className="flex gap-2 flex-wrap">{actions}</div>
      },
    },
  ], [approveMutation, cancelMutation, isManager, rejectMutation, user?.id])

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      ...values,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      reason: values.reason?.trim() || undefined,
      userId: isManager ? values.userId || undefined : undefined,
    }
    createMutation.mutate(payload)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Abwesenheiten</h1>
          {isManager && pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {pendingCount} ausstehend
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isManager && pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => update({ filters: { status: 'REQUESTED' }, page: 1 })}
            >
              Ausstehende anzeigen ({pendingCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          >
            {viewMode === 'list' ? <Calendar className="h-4 w-4 mr-1" /> : <List className="h-4 w-4 mr-1" />}
            {viewMode === 'list' ? 'Kalender' : 'Liste'}
          </Button>
          <Button onClick={() => setCreating((prev) => !prev)}>{creating ? 'Formular schließen' : 'Neue Abwesenheit'}</Button>
        </div>
      </div>

      {creating && (
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 border rounded bg-card">
          {isManager && (
            <FormField label="Mitarbeiter">
              <Select
                value={form.watch('userId') ?? ''}
                onChange={(event) => form.setValue('userId', event.target.value || undefined)}
              >
                <option value="">(Selbst wählen)</option>
                {usersData?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          <FormField label="Art">
            <Select value={form.watch('type')} onChange={(e) => form.setValue('type', e.target.value as AbsenceType)}>
              {ABSENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Start">
            <Input type="datetime-local" {...form.register('startsAt')} />
            {form.formState.errors.startsAt && (
              <p className="text-xs text-destructive">{form.formState.errors.startsAt.message}</p>
            )}
          </FormField>
          <FormField label="Ende">
            <Input type="datetime-local" {...form.register('endsAt')} />
            {form.formState.errors.endsAt && (
              <p className="text-xs text-destructive">{form.formState.errors.endsAt.message}</p>
            )}
          </FormField>
          <FormField className="md:col-span-2 lg:col-span-3" label="Bemerkung">
            <textarea
              className="w-full rounded border border-border bg-background px-3 py-2"
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </FormField>
        <div className="md:col-span-2 lg:col-span-3 flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              Speichern
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {conflicts.length > 0 && (
        <div className="border border-orange-300 bg-orange-50 text-sm text-orange-900 rounded p-4 space-y-2">
          <div className="font-semibold">Konflikte mit bestehenden Schichten</div>
          <ul className="space-y-1">
            {conflicts.map((shift) => (
              <li key={shift.id}>
                <span className="font-medium">{shift.title}</span> · {formatPeriod(shift.startTime, shift.endTime)} ({shift.status})
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConflicts([])}>
              Hinweise ausblenden
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <FormField label="Status">
              <Select
                value={params.filters.status ?? ''}
                onChange={(e) => update({ filters: { status: e.target.value || undefined }, page: 1 })}
              >
                <option value="">Alle</option>
                {ABSENCE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Art">
              <Select
                value={params.filters.type ?? ''}
                onChange={(e) => update({ filters: { type: e.target.value || undefined }, page: 1 })}
              >
                <option value="">Alle</option>
                {ABSENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Von">
              <Input
                type="date"
                value={params.filters.from || ''}
                onChange={(e) => update({ filters: { from: e.target.value || undefined }, page: 1 })}
              />
            </FormField>
            <FormField label="Bis">
              <Input
                type="date"
                value={params.filters.to || ''}
                onChange={(e) => update({ filters: { to: e.target.value || undefined }, page: 1 })}
              />
            </FormField>
            {isManager && (
              <FormField label="Mitarbeiter-ID">
                <Input
                  value={params.filters.userId || ''}
                  onChange={(e) => update({ filters: { userId: e.target.value || undefined }, page: 1 })}
                  placeholder="optional"
                />
              </FormField>
            )}
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            error={isError}
            pagination={{
              page: data?.pagination.page ?? params.page,
              pageSize: data?.pagination.pageSize ?? params.pageSize,
              totalPages: data?.pagination.totalPages ?? 1,
            }}
            onPageChange={(page) => update({ page })}
            onPageSizeChange={(pageSize) => update({ pageSize, page: 1 })}
          />
        </>
      )}

      {viewMode === 'calendar' && <AbsencesCalendar absences={rows} />}

      <AbsenceDetailModal
        absence={selectedAbsence}
        open={!!selectedAbsence}
        onClose={() => setSelectedAbsence(null)}
      />
    </div>
  )
}
