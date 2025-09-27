import { useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { createAbsence, fetchAbsences } from '@/features/absences/api'
import type { Absence, AbsenceType } from '@/features/absences/types'
import { ABSENCE_TYPES, getAbsenceStatusLabel, getAbsenceTypeLabel, formatPeriod } from '@/features/absences/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
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
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof documentSchema>

const absenceRequestSchema = z
  .object({
    type: z.enum(['VACATION', 'SICKNESS', 'SPECIAL_LEAVE', 'UNPAID']),
    startsAt: z.string().min(1, 'Startdatum wählen'),
    endsAt: z.string().min(1, 'Enddatum wählen'),
    reason: z.string().max(2000).optional(),
  })
  .refine((values) => {
    if (!values.startsAt || !values.endsAt) return true
    return values.endsAt >= values.startsAt
  }, {
    message: 'Enddatum muss nach dem Startdatum liegen',
    path: ['endsAt'],
  })

type AbsenceFormValues = z.infer<typeof absenceRequestSchema>

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

const QUALIFICATION_TEMPLATES: Array<{ title: string; description?: string }> = [
  { title: 'Sachkunde §34a GewO', description: 'IHK-Zertifikat vorhanden' },
  { title: 'Unterrichtung §34a GewO', description: '80-Stunden-Unterrichtung (IHK)' },
  { title: 'Brandschutzhelfer', description: 'Schulung inkl. Löschübung' },
  { title: 'Brandschutzbeauftragter', description: 'Ausbildung gemäß DGUV-I 205-003' },
  { title: 'Erste-Hilfe-Kurs (9 UE)', description: 'gültig innerhalb der letzten 2 Jahre' },
  { title: 'Dienstwaffenträger §28 WaffG', description: 'Waffensachkunde & Schießnachweise' },
  { title: 'Waffensachkunde §7 WaffG', description: 'Sachkundeprüfung inkl. Schießnachweis' },
  { title: 'Deeskalations- & Konflikttraining', description: 'jährliche Auffrischung empfohlen' },
  { title: 'Werkschutzfachkraft (IHK)', description: 'Fortgeschrittene Werkschutzqualifikation' },
  { title: 'Führerschein Klasse B', description: 'Aktiver Führerschein' },
  { title: 'Ersthelfer im Betrieb (BG)', description: 'Auffrischung alle 24 Monate' },
]

function formatDate(value?: string | null) {
  if (!value) return '–'
  return new Date(value).toLocaleDateString()
}

function formatHours(value: number | null | undefined) {
  if (!value) return '0.00 h'
  return `${value.toFixed(2)} h`
}

export default function UserProfile() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, hydrated } = useAuth()
  const queryClient = useQueryClient()
  const routeId = params.id ?? (location.pathname.includes('/users/me/profile') ? 'me' : undefined)
  const targetId = routeId === 'me' ? user?.id : routeId
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'qualifications' | 'documents' | 'absences'>('overview')
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false)

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
      issuedAt: '',
      expiresAt: '',
    },
  })

  const documentMutation = useMutation({
    mutationFn: (values: DocumentFormValues) => {
      const payload: {
        category: DocumentCategory
        filename: string
        issuedAt?: string
        expiresAt?: string
      } = {
        category: values.category,
        filename: values.filename,
      }
      if (values.issuedAt) {
        payload.issuedAt = new Date(values.issuedAt).toISOString()
      }
      if (values.expiresAt) {
        payload.expiresAt = new Date(values.expiresAt).toISOString()
      }
      return addDocument(targetId!, payload)
    },
    onSuccess: () => {
      toast.success('Dokument erfasst')
      documentForm.reset({ category: 'OTHER', filename: '', issuedAt: '', expiresAt: '' })
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

  const absenceForm = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceRequestSchema),
    defaultValues: {
      type: 'VACATION',
      startsAt: todayIso,
      endsAt: todayIso,
      reason: '',
    },
  })

  const absenceMutation = useMutation({
    mutationFn: (values: AbsenceFormValues) =>
      createAbsence({
        userId: targetId!,
        type: values.type as AbsenceType,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        reason: values.reason?.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success('Abwesenheit erfasst')
      absenceForm.reset({ type: 'VACATION', startsAt: todayIso, endsAt: todayIso, reason: '' })
      setAbsenceModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] })
      queryClient.invalidateQueries({ queryKey: ['user-absences', targetId] })
      if (result.conflicts && result.conflicts.length > 0) {
        toast.warning(`Es bestehen ${result.conflicts.length} Schichtkonflikte.`)
      }
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Abwesenheit konnte nicht gespeichert werden'
      toast.error(message)
    },
  })

  const applyQuickAbsence = (type: AbsenceType, durationDays: number) => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + Math.max(durationDays - 1, 0))
    const startIso = start.toISOString().substring(0, 10)
    const endIso = end.toISOString().substring(0, 10)
    absenceForm.setValue('type', type)
    absenceForm.setValue('startsAt', startIso)
    absenceForm.setValue('endsAt', endIso)
    absenceForm.setValue('reason', '')
  }

  const submitAbsence = absenceForm.handleSubmit((values) => absenceMutation.mutate(values))

  const handleCloseAbsenceModal = () => {
    setAbsenceModalOpen(false)
    absenceForm.reset({ type: 'VACATION', startsAt: todayIso, endsAt: todayIso, reason: '' })
  }

  const canEdit = user && (user.role === 'ADMIN' || user.role === 'MANAGER' || user.id === targetId)
  const canManageSensitive = user && (user.role === 'ADMIN' || user.role === 'MANAGER')
  const canReportAbsence = Boolean(user) && (user!.role === 'ADMIN' || user!.role === 'MANAGER' || user!.id === targetId)

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

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'details', label: 'Stammdaten' },
    { id: 'qualifications', label: 'Qualifikationen' },
    { id: 'absences', label: 'Abwesenheiten' },
    { id: 'documents', label: 'Dokumente' },
  ] as const

  const submitProfile = form.handleSubmit((values) => updateMutation.mutate(values))
  const qualities = profile.qualifications ?? []
  const documents = profile.documents ?? []
  const employmentLabel = useMemo(() => {
    if (!profile.profile?.employmentType) return '—'
    const option = EMPLOYMENT_OPTIONS.find((opt) => opt.value === profile.profile?.employmentType)
    return option?.label ?? profile.profile?.employmentType
  }, [profile.profile?.employmentType])
  const addressSummary = useMemo(() => {
    const address = profile.profile?.address
    if (!address) return '—'
    const parts = [address.street, address.postalCode, address.city].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : '—'
  }, [profile.profile?.address])
  const topQualifications = useMemo(() => qualities.slice(0, 3), [qualities])
  const latestDocuments = useMemo(() => documents.slice(0, 3), [documents])
  const upcomingAbsences = profile.upcomingAbsences ?? []
  const absenceListLink = targetId ? `/absences?userId=${targetId}` : '/absences'
  const todayIso = useMemo(() => new Date().toISOString().substring(0, 10), [])

  const {
    data: userAbsenceData,
    isLoading: isAbsencesLoading,
    isError: isAbsencesError,
    error: absencesError,
  } = useQuery({
    queryKey: ['user-absences', targetId],
    queryFn: () => fetchAbsences({ userId: targetId, page: 1, pageSize: 25 }),
    enabled: Boolean(targetId) && activeTab === 'absences',
    placeholderData: keepPreviousData,
  })

  const userAbsences = (userAbsenceData?.data as Absence[]) ?? []

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

      {/* Übersicht */}
      <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Kontakt &amp; Stammdaten</h3>
                {canEdit && (
                  <Button size="sm" variant="link" onClick={() => setActiveTab('details')}>
                    Stammdaten
                  </Button>
                )}
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">E-Mail</dt>
                  <dd className="font-medium break-words">{profile.user.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd className="font-medium">{profile.profile?.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Adresse</dt>
                  <dd className="font-medium">{addressSummary}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Personalnummer</dt>
                  <dd className="font-medium">{profile.user.employeeId ?? '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Beschäftigung</h3>
                {canManageSensitive && (
                  <Button size="sm" variant="link" onClick={() => setActiveTab('details')}>
                    Details
                  </Button>
                )}
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Rolle</dt>
                  <dd className="font-medium">{profile.user.role}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Beschäftigungsart</dt>
                  <dd className="font-medium">{employmentLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Eintritt</dt>
                  <dd className="font-medium">
                    {profile.profile?.employmentStart
                      ? new Date(profile.profile.employmentStart).toLocaleDateString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Austritt</dt>
                  <dd className="font-medium">
                    {profile.profile?.employmentEnd
                      ? new Date(profile.profile.employmentEnd).toLocaleDateString()
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Arbeitszeiten</h3>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Letzte 7 Tage</dt>
                  <dd className="font-medium">{formatHours(profile.timeSummary.last7Days)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Letzte 30 Tage</dt>
                  <dd className="font-medium">{formatHours(profile.timeSummary.last30Days)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Jahr bisher</dt>
                  <dd className="font-medium">{formatHours(profile.timeSummary.yearToDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Soll Woche / Monat</dt>
                  <dd className="font-medium">
                    {(profile.profile?.weeklyTargetHours ?? '—')} h / {(profile.profile?.monthlyTargetHours ?? '—')} h
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Qualifikationen (Top 3)</h3>
              <Button size="sm" variant="link" onClick={() => setActiveTab('qualifications')}>
                Zur Liste
              </Button>
            </div>
            {topQualifications.length === 0 ? (
              <p className="text-sm">Keine Qualifikationen hinterlegt.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topQualifications.map((qual) => (
                  <li key={qual.id}>
                    <div className="font-medium">{qual.title}</div>
                    {qual.validUntil && (
                      <div className="text-xs text-muted-foreground">
                        gültig bis {new Date(qual.validUntil).toLocaleDateString()}
                      </div>
                    )}
                    {!qual.validUntil && qual.validFrom && (
                      <div className="text-xs text-muted-foreground">
                        seit {new Date(qual.validFrom).toLocaleDateString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Schnellzugriff</h3>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('details')}>
                Stammdaten öffnen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('qualifications')}>
                {canManageSensitive ? 'Qualifikationen verwalten' : 'Qualifikationen ansehen'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('documents')}>
                {canManageSensitive ? 'Dokumente verwalten' : 'Dokumente ansehen'}
              </Button>
              <Button variant="default" size="sm" onClick={() => setAbsenceModalOpen(true)} disabled={!canReportAbsence}>
                Abwesenheit melden
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={absenceListLink}>Zur Abwesenheitsübersicht</Link>
              </Button>
            </div>
          </div>

          <div className="rounded border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Bevorstehende Abwesenheiten</h3>
              <Button size="sm" variant="link" onClick={() => setActiveTab('absences')}>
                Verlauf
              </Button>
            </div>
            {upcomingAbsences.length === 0 ? (
              <p className="text-sm">Keine geplanten Abwesenheiten.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingAbsences.map((absence) => (
                  <li key={absence.id}>
                    <div className="font-medium">{absence.type} ({absence.status})</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(absence.startsAt).toLocaleDateString()} – {new Date(absence.endsAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Zuletzt hinzugefügt</h3>
              <Button size="sm" variant="link" onClick={() => setActiveTab('documents')}>
                Alle Dokumente
              </Button>
            </div>
            {latestDocuments.length === 0 ? (
              <p className="text-sm">Keine Dokumente hinterlegt.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latestDocuments.map((doc) => (
                  <li key={doc.id}>
                    <div className="font-medium">{doc.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {DOCUMENT_OPTIONS.find((opt) => opt.value === doc.category)?.label ?? doc.category} ·{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:text-primary',
              activeTab === tab.id ? 'border-primary text-primary' : 'text-muted-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <section className="border rounded p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Stammdaten bearbeiten</h2>
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
            <FormField className="lg:col-span-3" label="Arbeitszeitmodell">
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
        </section>
      )}

      {activeTab === 'qualifications' && (
        <section className="border rounded p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Qualifikationen</h2>
          </div>
          {canManageSensitive && (
            <div className="flex flex-wrap gap-2">
              {QUALIFICATION_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.title}
                  size="sm"
                  variant="secondary"
                  onClick={() => qualificationForm.reset({
                    title: tpl.title,
                    description: tpl.description ?? '',
                    validFrom: '',
                    validUntil: '',
                  })}
                >
                  {tpl.title}
                </Button>
              ))}
            </div>
          )}
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
      )}

      {activeTab === 'absences' && (
        <section className="border rounded p-4 space-y-4 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Abwesenheiten</h2>
              <p className="text-sm text-muted-foreground">Urlaub, Krankmeldungen und Sonderurlaub</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAbsenceModalOpen(true)} disabled={!canReportAbsence}>
                Neue Abwesenheit
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to={absenceListLink}>Zur Gesamtliste</Link>
              </Button>
            </div>
          </div>

          <div className="rounded border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong className="font-semibold">Hinweis:</strong> Krankmeldungen werden automatisch genehmigt. Urlaub und andere Abwesenheiten
            benötigen eine Freigabe durch eine Führungskraft.
          </div>

          {isAbsencesLoading && <p className="text-sm">Lade Abwesenheiten…</p>}
          {isAbsencesError && (
            <p className="text-sm text-destructive">
              {((absencesError as any)?.response?.data?.message as string) || 'Abwesenheiten konnten nicht geladen werden'}
            </p>
          )}

          {!isAbsencesLoading && !isAbsencesError && (
            userAbsences.length === 0 ? (
              <p className="text-sm">Bisher wurden keine Abwesenheiten erfasst.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-left">
                      <th className="px-3 py-2">Art</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Zeitraum</th>
                      <th className="px-3 py-2">Grund / Notiz</th>
                      <th className="px-3 py-2">Angelegt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAbsences.map((absence) => (
                      <tr key={absence.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium">{getAbsenceTypeLabel(absence.type)}</div>
                          <div className="text-xs text-muted-foreground">#{absence.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                              absence.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : absence.status === 'REQUESTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : absence.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-800',
                            )}
                          >
                            {getAbsenceStatusLabel(absence.status)}
                          </span>
                          {absence.decisionNote && (
                            <div className="mt-1 text-xs text-muted-foreground">{absence.decisionNote}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {formatPeriod(absence.startsAt, absence.endsAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div>{absence.reason || '—'}</div>
                          {absence.createdBy && absence.createdBy.id !== absence.user.id && (
                            <div className="text-xs text-muted-foreground">
                              eingereicht durch {absence.createdBy.firstName} {absence.createdBy.lastName}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(absence.createdAt).toLocaleDateString()}
                          {absence.decidedBy && (
                            <div>entschieden von {absence.decidedBy.firstName} {absence.decidedBy.lastName}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      )}

      {activeTab === 'documents' && (
        <section className="border rounded p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dokumente</h2>
          </div>
          {canManageSensitive && (
            <form onSubmit={documentForm.handleSubmit((values) => documentMutation.mutate(values))} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
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
                <FormField label="Dokumentname">
                  <Input {...documentForm.register('filename')} placeholder="z. B. Sachkunde-Nachweis.pdf" />
                </FormField>
                <FormField label="Ausgestellt am">
                  <Input type="date" {...documentForm.register('issuedAt')} />
                </FormField>
                <FormField label="Gültig bis">
                  <Input type="date" {...documentForm.register('expiresAt')} />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Ablagepfade und technische Details werden automatisch vom System gepflegt.
              </p>
              <div className="flex justify-end">
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
                      <div className="text-xs text-muted-foreground">
                        {
                          [doc.mimeType || null, doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : null]
                            .filter(Boolean)
                            .join(' · ') || 'Keine Zusatzdaten'
                        }
                      </div>
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
      )}

      <Modal open={absenceModalOpen && canReportAbsence} onClose={handleCloseAbsenceModal} title="Abwesenheit melden">
        <form onSubmit={submitAbsence} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Wähle eine Vorlage oder passe den Zeitraum individuell an.</p>
            <div className="grid gap-2 md:grid-cols-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => applyQuickAbsence('SICKNESS', 1)}>
                Krankmeldung (heute)
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => applyQuickAbsence('VACATION', 5)}>
                Urlaub (5 Tage)
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Art">
                <Select
                  value={absenceForm.watch('type')}
                  onChange={(event) => absenceForm.setValue('type', event.target.value as AbsenceType)}
                >
                  {ABSENCE_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {absenceForm.formState.errors.type && (
                  <p className="text-xs text-destructive">{absenceForm.formState.errors.type.message}</p>
                )}
              </FormField>
              <FormField label="Von">
                <Input type="date" {...absenceForm.register('startsAt')} />
                {absenceForm.formState.errors.startsAt && (
                  <p className="text-xs text-destructive">{absenceForm.formState.errors.startsAt.message}</p>
                )}
              </FormField>
              <FormField label="Bis">
                <Input type="date" {...absenceForm.register('endsAt')} />
                {absenceForm.formState.errors.endsAt && (
                  <p className="text-xs text-destructive">{absenceForm.formState.errors.endsAt.message}</p>
                )}
              </FormField>
            </div>

            {absenceForm.watch('type') === 'SICKNESS' && (
              <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Krankmeldungen werden automatisch genehmigt. Bitte reiche ärztliche Bescheinigungen separat ein.
              </div>
            )}

            <FormField label="Begründung (optional)">
              <Textarea rows={3} placeholder="z.B. Erholungsurlaub" {...absenceForm.register('reason')} />
              {absenceForm.formState.errors.reason && (
                <p className="text-xs text-destructive">{absenceForm.formState.errors.reason.message}</p>
              )}
            </FormField>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleCloseAbsenceModal}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={absenceMutation.isPending}>
              {absenceMutation.isPending ? 'Speichern…' : 'Abwesenheit speichern'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
