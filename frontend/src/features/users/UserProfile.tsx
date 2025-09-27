import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  EmployeeDocument,
  EmployeeQualification,
  EmploymentType,
  addDocument,
  addQualification,
  deleteDocument,
  deleteQualification,
  fetchUserProfile,
  updateUserProfile,
  DocumentCategory,
  UserProfileResponse,
} from './api'
import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
  addressStreet: z.string().max(200).optional(),
  addressPostalCode: z.string().max(20).optional(),
  addressCity: z.string().max(120).optional(),
  addressCountry: z.string().max(120).optional(),
  birthDate: z.string().optional(),
  phone: z.string().max(50).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'MINI_JOB', 'TEMPORARY', 'CONTRACTOR']).optional(),
  employmentStart: z.string().optional(),
  employmentEnd: z.string().optional(),
  workSchedule: z.string().max(500).optional(),
  hourlyRate: z.string().optional(),
  weeklyTargetHours: z.string().optional(),
  monthlyTargetHours: z.string().optional(),
  notes: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const qualificationSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
})

type QualificationFormValues = z.infer<typeof qualificationSchema>

const documentSchema = z.object({
  category: z.enum([
    'FIREARM_LICENSE',
    'WARNING_LETTER',
    'CONTRACT',
    'TRAINING_CERTIFICATE',
    'MEDICAL_CERTIFICATE',
    'OTHER',
  ]),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  size: z.string().min(1),
  storedAt: z.string().min(1).max(500),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof documentSchema>

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Vollzeit' },
  { value: 'PART_TIME', label: 'Teilzeit' },
  { value: 'MINI_JOB', label: 'Minijob' },
  { value: 'TEMPORARY', label: 'Befristet' },
  { value: 'CONTRACTOR', label: 'Freelancer' },
]

const DOCUMENT_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'FIREARM_LICENSE', label: 'Waffenschein' },
  { value: 'WARNING_LETTER', label: 'Abmahnung' },
  { value: 'CONTRACT', label: 'Vertrag' },
  { value: 'TRAINING_CERTIFICATE', label: 'Schulung' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Attest' },
  { value: 'OTHER', label: 'Sonstiges' },
]

function formatDate(value?: string | null) {
  if (!value) return '–'
  return new Date(value).toLocaleDateString()
}

export default function UserProfile() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, hydrated } = useAuth()
  const queryClient = useQueryClient()
  const routeId = params.id ?? (location.pathname.includes('/users/me/profile') ? 'me' : undefined)
  const targetId = routeId === 'me' ? user?.id : routeId

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-profile', targetId],
    queryFn: () => fetchUserProfile(targetId!),
    enabled: Boolean(targetId),
  })

const form = useForm<ProfileFormValues>({
  resolver: zodResolver(profileSchema),
  defaultValues: {
    addressStreet: '',
    addressPostalCode: '',
    addressCity: '',
    addressCountry: '',
    birthDate: '',
    phone: '',
    employmentType: 'FULL_TIME',
    employmentStart: '',
    employmentEnd: '',
    workSchedule: '',
    hourlyRate: '',
    weeklyTargetHours: '',
    monthlyTargetHours: '',
    notes: '',
  },
})

useEffect(() => {
  if (!data) return
  form.reset({
    addressStreet: data.profile?.address?.street ?? '',
    addressPostalCode: data.profile?.address?.postalCode ?? '',
    addressCity: data.profile?.address?.city ?? '',
    addressCountry: data.profile?.address?.country ?? '',
    birthDate: data.profile?.birthDate ? data.profile.birthDate.substring(0, 10) : '',
    phone: data.profile?.phone ?? '',
    employmentType: data.profile?.employmentType ?? 'FULL_TIME',
    employmentStart: data.profile?.employmentStart ? data.profile.employmentStart.substring(0, 10) : '',
    employmentEnd: data.profile?.employmentEnd ? data.profile.employmentEnd.substring(0, 10) : '',
    workSchedule: data.profile?.workSchedule ?? '',
    hourlyRate: data.profile?.hourlyRate ?? '',
    weeklyTargetHours: data.profile?.weeklyTargetHours?.toString() ?? '',
    monthlyTargetHours: data.profile?.monthlyTargetHours?.toString() ?? '',
    notes: data.profile?.notes ?? '',
  })
}, [data, form])

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateUserProfile(targetId!, {
        address: {
          street: values.addressStreet || undefined,
          postalCode: values.addressPostalCode || undefined,
          city: values.addressCity || undefined,
          country: values.addressCountry || undefined,
        },
        birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : undefined,
        phone: values.phone || undefined,
        employmentType: values.employmentType,
        employmentStart: values.employmentStart ? new Date(values.employmentStart).toISOString() : undefined,
        employmentEnd: values.employmentEnd ? new Date(values.employmentEnd).toISOString() : undefined,
        workSchedule: values.workSchedule || undefined,
        hourlyRate: values.hourlyRate || undefined,
        weeklyTargetHours: values.weeklyTargetHours ? Number(values.weeklyTargetHours) : undefined,
        monthlyTargetHours: values.monthlyTargetHours ? Number(values.monthlyTargetHours) : undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Profil aktualisiert')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Aktualisierung fehlgeschlagen')
    },
  })

  const qualificationForm = useForm<QualificationFormValues>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: { title: '', description: '', validFrom: '', validUntil: '' },
  })

  const qualificationMutation = useMutation({
    mutationFn: (values: QualificationFormValues) =>
      addQualification(targetId!, {
        title: values.title,
        description: values.description || undefined,
        validFrom: values.validFrom ? new Date(values.validFrom).toISOString() : undefined,
        validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Qualifikation gespeichert')
      qualificationForm.reset()
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Qualifikation konnte nicht gespeichert werden')
    },
  })

  const qualificationDeleteMutation = useMutation({
    mutationFn: (qualificationId: string) => deleteQualification(targetId!, qualificationId),
    onSuccess: () => {
      toast.success('Qualifikation entfernt')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Qualifikation konnte nicht entfernt werden')
    },
  })

  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      category: 'OTHER',
      filename: '',
      mimeType: 'application/pdf',
      size: '0',
      storedAt: '',
      issuedAt: '',
      expiresAt: '',
    },
  })

  const documentMutation = useMutation({
    mutationFn: (values: DocumentFormValues) =>
      addDocument(targetId!, {
        category: values.category,
        filename: values.filename,
        mimeType: values.mimeType,
        size: Number(values.size),
        storedAt: values.storedAt,
        issuedAt: values.issuedAt ? new Date(values.issuedAt).toISOString() : undefined,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Dokument erfasst')
      documentForm.reset({ category: 'OTHER', filename: '', mimeType: 'application/pdf', size: '0', storedAt: '', issuedAt: '', expiresAt: '' })
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Dokument konnte nicht erfasst werden')
    },
  })

  const documentDeleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(targetId!, documentId),
    onSuccess: () => {
      toast.success('Dokument entfernt')
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Dokument konnte nicht entfernt werden')
    },
  })

  const canEdit = user && (user.role === 'ADMIN' || user.role === 'MANAGER' || user.id === targetId)
  const canManageSensitive = user && (user.role === 'ADMIN' || user.role === 'MANAGER')

  const handleNavigateBack = () => navigate(-1)

  if (!targetId) {
    if (!hydrated) {
      return <div>Lade Profil…</div>
    }
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Mitarbeiterprofil</h1>
        <p>Kein Nutzer angegeben.</p>
      </div>
    )
  }

  if (isLoading) {
    return <div>Lade Profil…</div>
  }

  if (isError) {
    const message = (error as any)?.response?.data?.message || 'Profil konnte nicht geladen werden'
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Mitarbeiterprofil</h1>
        <p className="text-destructive">{message}</p>
        <Button variant="secondary" onClick={handleNavigateBack}>
          Zurück
        </Button>
      </div>
    )
  }

  const profile = data as UserProfileResponse

  const submitProfile = form.handleSubmit((values) => updateMutation.mutate(values))

  const qualities = profile.qualifications ?? []
  const documents = profile.documents ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">
            {profile.user.firstName} {profile.user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{profile.user.email}</p>
        </div>
        <Button variant="secondary" onClick={handleNavigateBack}>
          Zurück
        </Button>
      </div>

      <section className="border rounded p-4 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stammdaten & Arbeitszeiten</h2>
          {canEdit && (
            <Button size="sm" onClick={submitProfile} disabled={updateMutation.isPending}>
              Speichern
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Straße">
            <Input disabled={!canEdit} {...form.register('addressStreet')} />
          </FormField>
          <FormField label="PLZ">
            <Input disabled={!canEdit} {...form.register('addressPostalCode')} />
          </FormField>
          <FormField label="Ort">
            <Input disabled={!canEdit} {...form.register('addressCity')} />
          </FormField>
          <FormField label="Land">
            <Input disabled={!canEdit} {...form.register('addressCountry')} />
          </FormField>
          <FormField label="Geburtsdatum">
            <Input type="date" disabled={!canEdit} {...form.register('birthDate')} />
          </FormField>
          <FormField label="Telefon">
            <Input disabled={!canEdit} {...form.register('phone')} />
          </FormField>
          <FormField label="Beschäftigungsart">
            <Select disabled={!canManageSensitive} value={form.watch('employmentType')} onChange={(e) => form.setValue('employmentType', e.target.value as EmploymentType)}>
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Eintritt">
            <Input type="date" disabled={!canManageSensitive} {...form.register('employmentStart')} />
          </FormField>
          <FormField label="Austritt">
            <Input type="date" disabled={!canManageSensitive} {...form.register('employmentEnd')} />
          </FormField>
          <FormField className="lg:col-span-3" label="Arbeitszeitmodell / Notiz">
            <Input disabled={!canManageSensitive} {...form.register('workSchedule')} />
          </FormField>
          <FormField label="Stundensatz (€)">
            <Input disabled={!canManageSensitive} {...form.register('hourlyRate')} />
          </FormField>
          <FormField label="Wochen-Sollstunden">
            <Input disabled={!canManageSensitive} {...form.register('weeklyTargetHours')} />
          </FormField>
          <FormField label="Monats-Sollstunden">
            <Input disabled={!canManageSensitive} {...form.register('monthlyTargetHours')} />
          </FormField>
          <FormField className="lg:col-span-3" label="Notizen">
            <textarea
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2"
              disabled={!canManageSensitive}
              {...form.register('notes')}
            />
          </FormField>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Arbeitsstunden laut Zeiterfassung:</p>
          <ul className="list-disc list-inside">
            <li>Letzte 7 Tage: {profile.timeSummary.last7Days.toFixed(2)} h</li>
            <li>Letzte 30 Tage: {profile.timeSummary.last30Days.toFixed(2)} h</li>
            <li>Jahr (YTD): {profile.timeSummary.yearToDate.toFixed(2)} h</li>
          </ul>
        </div>
      </section>

      <section className="border rounded p-4 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Qualifikationen</h2>
        </div>
        {canManageSensitive && (
          <form
            onSubmit={qualificationForm.handleSubmit((values) => qualificationMutation.mutate(values))}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            <FormField label="Titel">
              <Input {...qualificationForm.register('title')} />
            </FormField>
            <FormField label="Beschreibung">
              <Input {...qualificationForm.register('description')} />
            </FormField>
            <FormField label="Gültig ab">
              <Input type="date" {...qualificationForm.register('validFrom')} />
            </FormField>
            <FormField label="Gültig bis">
              <Input type="date" {...qualificationForm.register('validUntil')} />
            </FormField>
            <div className="lg:col-span-4">
              <Button type="submit" disabled={qualificationMutation.isPending}>
                Qualifikation hinzufügen
              </Button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-3 py-2">Titel</th>
                <th className="px-3 py-2">Gültig von</th>
                <th className="px-3 py-2">Gültig bis</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {qualities.length === 0 && (
                <tr>
                  <td className="px-3 py-2" colSpan={4}>
                    Keine Qualifikationen erfasst.
                  </td>
                </tr>
              )}
              {qualities.map((qual) => (
                <tr key={qual.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{qual.title}</div>
                    {qual.description && <div className="text-xs text-muted-foreground">{qual.description}</div>}
                  </td>
                  <td className="px-3 py-2">{formatDate(qual.validFrom)}</td>
                  <td className="px-3 py-2">{formatDate(qual.validUntil)}</td>
                  <td className="px-3 py-2">
                    {canManageSensitive ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => qualificationDeleteMutation.mutate(qual.id)}
                      >
                        Entfernen
                      </Button>
                    ) : (
                      '–'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-4 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dokumente</h2>
        </div>
        {canManageSensitive && (
          <form
            onSubmit={documentForm.handleSubmit((values) => documentMutation.mutate(values))}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            <FormField label="Kategorie">
              <Select
                value={documentForm.watch('category')}
                onChange={(e) => documentForm.setValue('category', e.target.value as DocumentCategory)}
              >
                {DOCUMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Dateiname">
              <Input {...documentForm.register('filename')} />
            </FormField>
            <FormField label="MIME-Type">
              <Input {...documentForm.register('mimeType')} />
            </FormField>
            <FormField label="Dateigröße (Byte)">
              <Input type="number" {...documentForm.register('size')} />
            </FormField>
            <FormField label="Speicherort (z. B. S3-Key)" className="lg:col-span-4">
              <Input {...documentForm.register('storedAt')} />
            </FormField>
            <FormField label="Ausgestellt am">
              <Input type="date" {...documentForm.register('issuedAt')} />
            </FormField>
            <FormField label="Gültig bis">
              <Input type="date" {...documentForm.register('expiresAt')} />
            </FormField>
            <div className="lg:col-span-4">
              <Button type="submit" disabled={documentMutation.isPending}>
                Dokument erfassen
              </Button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-3 py-2">Kategorie</th>
                <th className="px-3 py-2">Datei</th>
                <th className="px-3 py-2">Gültig von/bis</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td className="px-3 py-2" colSpan={4}>
                    Keine Dokumente hinterlegt.
                  </td>
                </tr>
              )}
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t border-border">
                  <td className="px-3 py-2">{DOCUMENT_OPTIONS.find((o) => o.value === doc.category)?.label ?? doc.category}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{doc.filename}</div>
                    <div className="text-xs text-muted-foreground">{doc.mimeType} · {(doc.size / 1024).toFixed(1)} KB</div>
                  </td>
                  <td className="px-3 py-2">
                    {formatDate(doc.issuedAt)} – {formatDate(doc.expiresAt)}
                  </td>
                  <td className="px-3 py-2">
                    {canManageSensitive ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => documentDeleteMutation.mutate(doc.id)}
                      >
                        Entfernen
                      </Button>
                    ) : (
                      '–'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-4 space-y-3 bg-card">
        <h2 className="text-lg font-semibold">Bevorstehende Abwesenheiten</h2>
        <ul className="space-y-2 text-sm">
          {profile.upcomingAbsences.length === 0 && <li>Keine geplanten Abwesenheiten.</li>}
          {profile.upcomingAbsences.map((absence) => (
            <li key={absence.id} className="flex items-center justify-between">
              <span>{absence.type} ({absence.status})</span>
              <span className="text-muted-foreground">
                {new Date(absence.startsAt).toLocaleDateString()} – {new Date(absence.endsAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
