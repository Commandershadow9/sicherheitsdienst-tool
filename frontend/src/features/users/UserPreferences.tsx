import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { EmployeePreferences } from './api'
import { fetchEmployeePreferences, updateEmployeePreferences } from './api'

type SiteOption = { id: string; name: string; city?: string | null }

const preferencesSchema = z.object({
  prefersNightShifts: z.boolean().default(false),
  prefersDayShifts: z.boolean().default(true),
  prefersWeekends: z.boolean().default(false),
  targetMonthlyHours: z.coerce.number().min(40).max(300),
  minMonthlyHours: z.coerce.number().min(0).max(300),
  maxMonthlyHours: z.coerce.number().min(0).max(400),
  flexibleHours: z.boolean().default(true),
  prefersLongShifts: z.boolean().default(false),
  prefersShortShifts: z.boolean().default(false),
  prefersConsecutiveDays: z.coerce.number().min(1).max(14).nullable(),
  minRestDaysPerWeek: z.coerce.number().min(0).max(7),
  preferredSiteIds: z.array(z.string()).default([]),
  avoidedSiteIds: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional().nullable(),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>

const DEFAULT_VALUES: PreferencesFormValues = {
  prefersNightShifts: false,
  prefersDayShifts: true,
  prefersWeekends: false,
  targetMonthlyHours: 160,
  minMonthlyHours: 120,
  maxMonthlyHours: 200,
  flexibleHours: true,
  prefersLongShifts: false,
  prefersShortShifts: false,
  prefersConsecutiveDays: 5,
  minRestDaysPerWeek: 2,
  preferredSiteIds: [],
  avoidedSiteIds: [],
  notes: null,
}

async function fetchSiteOptions(): Promise<SiteOption[]> {
  const res = await api.get<{ data: SiteOption[] }>(`/sites?page=1&pageSize=100&sortBy=name&sortDir=asc`)
  return res.data.data
}

export default function UserPreferences() {
  const params = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const targetUserId = useMemo(() => {
    if (!params.id || params.id === 'me') {
      return user?.id ?? ''
    }
    return params.id
  }, [params.id, user?.id])

  const isSelf = params.id === 'me' || targetUserId === user?.id

  const { data: preferences, isLoading, error } = useQuery<EmployeePreferences>({
    enabled: targetUserId.length > 0,
    queryKey: ['user-preferences', targetUserId],
    queryFn: () => fetchEmployeePreferences(targetUserId),
  })

  const { data: siteOptions } = useQuery<SiteOption[]>({
    queryKey: ['site-options'],
    queryFn: fetchSiteOptions,
    staleTime: 1000 * 60 * 10,
  })

  const form = useForm<PreferencesFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(preferencesSchema),
  })

  useEffect(() => {
    if (preferences) {
      form.reset({
        prefersNightShifts: preferences.prefersNightShifts,
        prefersDayShifts: preferences.prefersDayShifts,
        prefersWeekends: preferences.prefersWeekends,
        targetMonthlyHours: preferences.targetMonthlyHours,
        minMonthlyHours: preferences.minMonthlyHours,
        maxMonthlyHours: preferences.maxMonthlyHours,
        flexibleHours: preferences.flexibleHours,
        prefersLongShifts: preferences.prefersLongShifts,
        prefersShortShifts: preferences.prefersShortShifts,
        prefersConsecutiveDays: preferences.prefersConsecutiveDays,
        minRestDaysPerWeek: preferences.minRestDaysPerWeek,
        preferredSiteIds: preferences.preferredSiteIds ?? [],
        avoidedSiteIds: preferences.avoidedSiteIds ?? [],
        notes: preferences.notes ?? null,
      })
    }
  }, [preferences, form])

  const mutation = useMutation({
    mutationFn: async (values: PreferencesFormValues) => {
      const payload: Partial<EmployeePreferences> = {
        prefersNightShifts: values.prefersNightShifts,
        prefersDayShifts: values.prefersDayShifts,
        prefersWeekends: values.prefersWeekends,
        targetMonthlyHours: values.targetMonthlyHours,
        minMonthlyHours: values.minMonthlyHours,
        maxMonthlyHours: values.maxMonthlyHours,
        flexibleHours: values.flexibleHours,
        prefersLongShifts: values.prefersLongShifts,
        prefersShortShifts: values.prefersShortShifts,
        prefersConsecutiveDays: values.prefersConsecutiveDays,
        minRestDaysPerWeek: values.minRestDaysPerWeek,
        preferredSiteIds: values.preferredSiteIds,
        avoidedSiteIds: values.avoidedSiteIds,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      }
      const updated = await updateEmployeePreferences(targetUserId, payload)
      return updated
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences', targetUserId], data)
      toast.success('Präferenzen gespeichert')
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Speichern fehlgeschlagen'
      toast.error(message)
    },
  })

  const preferredSites = form.watch('preferredSiteIds')
  const avoidedSites = form.watch('avoidedSiteIds')

  const togglePreferred = (siteId: string) => {
    const next = preferredSites.includes(siteId)
      ? preferredSites.filter((id) => id !== siteId)
      : [...preferredSites, siteId]
    form.setValue('preferredSiteIds', next, { shouldDirty: true })
    if (avoidedSites.includes(siteId)) {
      form.setValue(
        'avoidedSiteIds',
        avoidedSites.filter((id) => id !== siteId),
        { shouldDirty: true },
      )
    }
  }

  const toggleAvoided = (siteId: string) => {
    const next = avoidedSites.includes(siteId)
      ? avoidedSites.filter((id) => id !== siteId)
      : [...avoidedSites, siteId]
    form.setValue('avoidedSiteIds', next, { shouldDirty: true })
    if (preferredSites.includes(siteId)) {
      form.setValue(
        'preferredSiteIds',
        preferredSites.filter((id) => id !== siteId),
        { shouldDirty: true },
      )
    }
  }

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate(values)
  })

  if (!targetUserId) {
    return <div className="p-4">Kein Benutzer ausgewählt.</div>
  }

  if (isLoading) {
    return <div className="p-4">Lade Präferenzen…</div>
  }

  if (error) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-sm text-red-600">Präferenzen konnten nicht geladen werden.</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['user-preferences', targetUserId] })}>
          Erneut versuchen
        </Button>
      </div>
    )
  }

  const onReset = () => {
    if (preferences) {
      form.reset({
        prefersNightShifts: preferences.prefersNightShifts,
        prefersDayShifts: preferences.prefersDayShifts,
        prefersWeekends: preferences.prefersWeekends,
        targetMonthlyHours: preferences.targetMonthlyHours,
        minMonthlyHours: preferences.minMonthlyHours,
        maxMonthlyHours: preferences.maxMonthlyHours,
        flexibleHours: preferences.flexibleHours,
        prefersLongShifts: preferences.prefersLongShifts,
        prefersShortShifts: preferences.prefersShortShifts,
        prefersConsecutiveDays: preferences.prefersConsecutiveDays,
        minRestDaysPerWeek: preferences.minRestDaysPerWeek,
        preferredSiteIds: preferences.preferredSiteIds ?? [],
        avoidedSiteIds: preferences.avoidedSiteIds ?? [],
        notes: preferences.notes ?? null,
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mitarbeiter-Präferenzen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSelf ? 'Deine persönlichen Einsatz-Präferenzen' : 'Präferenzen für den ausgewählten Mitarbeiter'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Zurück
          </Button>
          <Link to={isSelf ? '/users/me/profile' : `/users/${targetUserId}/profile`} className="text-sm underline self-center">
            Profil öffnen
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Schicht-Präferenzen</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('prefersDayShifts')} /> Tagschichten bevorzugt
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('prefersNightShifts')} /> Nachtschichten bevorzugt
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('prefersWeekends')} /> Wochenenden bevorzugt
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('flexibleHours')} /> Flexibel bei Überstunden
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('prefersLongShifts')} /> Lange Schichten (10h+) ok
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('prefersShortShifts')} /> Kurze Schichten (≤6h) bevorzugt
            </label>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Stunden & Rhythmus</h2>
            <FormField label="Zielstunden / Monat">
              <Input type="number" step="1" {...form.register('targetMonthlyHours', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Minimum Stunden / Monat">
              <Input type="number" step="1" {...form.register('minMonthlyHours', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Maximum Stunden / Monat">
              <Input type="number" step="1" {...form.register('maxMonthlyHours', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Bevorzugte Tage in Folge">
              <Input type="number" step="1" {...form.register('prefersConsecutiveDays', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Minimale Ruhetage je Woche">
              <Input type="number" step="1" {...form.register('minRestDaysPerWeek', { valueAsNumber: true })} />
            </FormField>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Standort-Präferenzen</h2>
          {siteOptions?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Bevorzugt</h3>
                <div className="space-y-2 max-h-56 overflow-auto border rounded-md p-2">
                  {siteOptions.map((site) => (
                    <label key={`preferred-${site.id}`} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={preferredSites.includes(site.id)}
                        onChange={() => togglePreferred(site.id)}
                      />
                      <span>{site.name}{site.city ? ` (${site.city})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase text-muted-foreground mb-2">Vermeiden</h3>
                <div className="space-y-2 max-h-56 overflow-auto border rounded-md p-2">
                  {siteOptions.map((site) => (
                    <label key={`avoided-${site.id}`} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={avoidedSites.includes(site.id)}
                        onChange={() => toggleAvoided(site.id)}
                      />
                      <span>{site.name}{site.city ? ` (${site.city})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Standorte gefunden oder fehlende Berechtigung.</p>
          )}
        </section>

        <section className="space-y-2">
          <FormField label="Notizen">
            <Textarea rows={4} {...form.register('notes')} placeholder="Besondere Hinweise, z. B. Betreuungspflichten" />
          </FormField>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onReset} disabled={mutation.isPending}>
            Zurücksetzen
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
