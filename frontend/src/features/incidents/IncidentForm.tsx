import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  severity: z.enum(['LOW','MEDIUM','HIGH','CRITICAL'], { required_error: 'Schwere ist erforderlich' }),
  status: z.enum(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']).optional(),
  location: z.string().min(1, 'Ort ist erforderlich').max(500),
  occurredAt: z.string().min(1, 'Datum/Uhrzeit ist erforderlich'),
})
type FormValues = z.infer<typeof schema>

export default function IncidentForm({ mode }: { mode: 'create'|'edit' }) {
  const nav = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(mode === 'edit')
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', severity: 'LOW', status: 'OPEN', location: '', occurredAt: '' },
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
            occurredAt: new Date(i.occurredAt).toISOString().slice(0,16),
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
    try {
      if (mode === 'create') {
        await api.post('/incidents', values)
        toast.success('Vorfall erstellt')
      } else if (id) {
        await api.put(`/incidents/${id}`, values)
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm">Titel</label>
        <input className="border rounded px-3 py-2 w-full" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm">Beschreibung</label>
        <textarea className="border rounded px-3 py-2 w-full" rows={4} {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">Schwere</label>
          <select className="border rounded px-3 py-2 w-full" {...register('severity')}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          {errors.severity && <p className="text-xs text-destructive">{errors.severity.message}</p>}
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select className="border rounded px-3 py-2 w-full" {...register('status')}>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
        <div>
          <label className="block text-sm">Ort</label>
          <input className="border rounded px-3 py-2 w-full" {...register('location')} />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm">Zeitpunkt</label>
        <input type="datetime-local" className="border rounded px-3 py-2" {...register('occurredAt')} />
        {errors.occurredAt && <p className="text-xs text-destructive">{errors.occurredAt.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="underline" disabled={isSubmitting}>{mode==='create' ? 'Erstellen' : 'Speichern'}</button>
        {mode==='edit' && (
          <button type="button" className="underline text-red-600" onClick={onDelete}>Löschen</button>
        )}
      </div>
    </form>
  )
}

