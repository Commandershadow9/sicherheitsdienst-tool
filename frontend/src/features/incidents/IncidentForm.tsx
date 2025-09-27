import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { FormField } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '@/features/incidents/constants'
import { api } from '@/lib/api'

const schema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { required_error: 'Schwere ist erforderlich' }),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  location: z.string().min(1, 'Ort ist erforderlich').max(500),
  occurredAt: z.string().min(1, 'Datum/Uhrzeit ist erforderlich'),
})

type FormValues = z.infer<typeof schema>

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export default function IncidentForm({ mode }: { mode: 'create' | 'edit' }) {
  const nav = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(mode === 'edit')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'LOW',
      status: 'OPEN',
      location: '',
      occurredAt: '',
    },
  })

  useEffect(() => {
    if (mode === 'edit' && id) {
      ;(async () => {
        try {
          const res = await api.get(`/incidents/${id}`)
          const i = res.data
          reset({
            title: i.title || '',
            description: i.description || '',
            severity: i.severity,
            status: i.status,
            location: i.location || '',
            occurredAt: toLocalDateTimeInput(i.occurredAt),
          })
        } catch (e: any) {
          toast.error('Vorfall konnte nicht geladen werden')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [mode, id, reset])

  const onSubmit = async (values: FormValues) => {
    const occurredAtIso = toIsoDateTime(values.occurredAt)
    if (!occurredAtIso) {
      toast.error('Datum/Uhrzeit konnte nicht verarbeitet werden')
      return
    }

    const basePayload = {
      title: values.title.trim(),
      description: (values.description || '').trim(),
      severity: values.severity,
      location: values.location.trim(),
      occurredAt: occurredAtIso,
    }

    try {
      if (mode === 'create') {
        await api.post('/incidents', basePayload)
        toast.success('Vorfall erstellt')
      } else if (id) {
        const updatePayload: Record<string, unknown> = { ...basePayload }
        if (values.status) {
          updatePayload.status = values.status
        }
        await api.put(`/incidents/${id}`, updatePayload)
        toast.success('Vorfall aktualisiert')
      }
      nav('/incidents', { replace: true })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Speichern fehlgeschlagen'
      toast.error(msg)
    }
  }

  const onDelete = async () => {
    if (!id) return
    if (!confirm('Diesen Vorfall wirklich löschen?')) return
    try {
      await api.delete(`/incidents/${id}`)
      toast.success('Vorfall gelöscht')
      nav('/incidents', { replace: true })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Löschen fehlgeschlagen'
      toast.error(msg)
    }
  }

  if (loading) return <div className="p-4">Lade…</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <FormField label="Titel" htmlFor="incident-title">
        <Input id="incident-title" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </FormField>

      <FormField label="Beschreibung" htmlFor="incident-description">
        <Textarea id="incident-description" rows={4} {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FormField label="Schwere" htmlFor="incident-severity">
          <Select id="incident-severity" {...register('severity')}>
            {INCIDENT_SEVERITIES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.severity && <p className="text-xs text-destructive">{errors.severity.message}</p>}
        </FormField>

        {mode === 'edit' && (
          <FormField label="Status" htmlFor="incident-status">
            <Select id="incident-status" {...register('status')}>
              {INCIDENT_STATUSES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </FormField>
        )}

        <FormField label="Ort" htmlFor="incident-location">
          <Input id="incident-location" {...register('location')} />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </FormField>
      </div>

      <FormField label="Zeitpunkt" htmlFor="incident-occurred-at">
        <Input id="incident-occurred-at" type="datetime-local" {...register('occurredAt')} />
        {errors.occurredAt && <p className="text-xs text-destructive">{errors.occurredAt.message}</p>}
      </FormField>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Erstellen' : 'Speichern'}
        </Button>
        {mode === 'edit' && (
          <Button type="button" variant="link" className="text-destructive" onClick={onDelete}>
            Löschen
          </Button>
        )}
      </div>
    </form>
  )
}
