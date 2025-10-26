import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { UserSelect } from '@/components/ui/user-select'
import { SkeletonDetailPage } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import RbacForbidden from '@/components/RbacForbidden'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form'
import { toast } from 'sonner'
import { toastSuccess, toastError } from '@/lib/toast-helpers'
import { completeClearanceTraining, revokeClearance, type Clearance, fetchSiteShifts, generateShiftsForSite, type Shift, type GenerateShiftsPayload } from '../api'
import { fetchControlPoints, fetchControlRounds, type ControlPoint, type ControlRound } from '../controlApi'
import {
  fetchSiteCalculations,
  sendSiteCalculation,
  acceptSiteCalculation,
  rejectSiteCalculation,
  archiveSiteCalculation,
  duplicateSiteCalculation,
  sendCalculationEmailAPI,
  type SiteCalculation
} from '../calculationApi'
import { Building2, Phone, Shield, Calendar, Image as ImageIcon, UserCheck, FileText, Upload, Download, Trash2, Eye, AlertTriangle, Plus, X, Pencil, CheckCircle, Clock, MapPin, QrCode, Smartphone, Calculator, DollarSign, Send, Check, Copy, Archive, Mail, Lightbulb, Route } from 'lucide-react'
import DocumentViewerModal from '../components/DocumentViewerModal'
import CoverageStats from '../components/CoverageStats'
import SmartAssignmentModal from '../components/SmartAssignmentModal'
import ControlRoundSuggestionsModal from '../components/ControlRoundSuggestionsModal'

type Site = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  customerName?: string
  customerCompany?: string
  customerEmail?: string
  customerPhone?: string
  emergencyContacts?: Array<{ name: string; phone: string; role?: string }>
  status?: 'INQUIRY' | 'IN_REVIEW' | 'CALCULATING' | 'OFFER_SENT' | 'ACTIVE' | 'INACTIVE' | 'LOST'
  requiredStaff?: number
  requiredQualifications?: string[]
  description?: string
  notes?: string
  images?: Array<{
    id: string
    filename: string
    category: string
    uploadedAt: string
    uploader: { firstName: string; lastName: string }
  }>
  assignments?: Array<{
    id: string
    role: string
    user: { id: string; firstName: string; lastName: string; email: string }
  }>
  clearances?: Array<{
    id: string
    status: string
    user: { id: string; firstName: string; lastName: string }
    trainingCompletedAt?: string
  }>
  documents?: Array<{
    id: string
    title: string
    description?: string
    category: string
    filename: string
    fileSize: number
    mimeType: string
    version: number
    isLatest: boolean
    uploadedAt: string
    uploader: { id: string; firstName: string; lastName: string }
  }>
  incidents?: Array<{
    id: string
    title: string
    description?: string
    category: string
    severity: string
    status: string
    occurredAt: string
    reportedAt: string
    location?: string
    involvedPersons?: string
    resolvedAt?: string
    resolution?: string
    reporter: { id: string; firstName: string; lastName: string }
  }>
  securityConcept?: {
    tasks?: string[]
    shiftModel?: string
    hoursPerWeek?: number
    templateId?: string
    templateName?: string
  }
}

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

const ROLE_LABELS: Record<string, string> = {
  OBJEKTLEITER: 'Objektleiter',
  SCHICHTLEITER: 'Schichtleiter',
  MITARBEITER: 'Mitarbeiter',
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'clearances' | 'shifts' | 'images' | 'documents' | 'incidents' | 'control-points' | 'control-rounds' | 'calculations'>('overview')
  const [trainingModal, setTrainingModal] = useState<{ clearance: Clearance; hours: number } | null>(null)
  const [revokeModal, setRevokeModal] = useState<{ clearance: Clearance; notes: string } | null>(null)
  const [uploadModal, setUploadModal] = useState<{ file: File | null; category: string } | null>(null)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)
  const [createClearanceModal, setCreateClearanceModal] = useState<{ userId: string; notes: string } | null>(null)
  const [createAssignmentModal, setCreateAssignmentModal] = useState<{ userId: string; role: string } | null>(null)
  const [smartAssignmentModal, setSmartAssignmentModal] = useState<boolean>(false)
  const [controlRoundSuggestionsModal, setControlRoundSuggestionsModal] = useState<boolean>(false)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null)
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState(false)
  const [uploadDocumentModal, setUploadDocumentModal] = useState<{
    title: string
    description: string
    category: string
    file: File | null
  } | null>(null)
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null)
  const [viewDocument, setViewDocument] = useState<{
    id: string
    title: string
    filename: string
    mimeType: string
    fileSize: number
  } | null>(null)
  const [createIncidentModal, setCreateIncidentModal] = useState<{
    title: string
    description: string
    category: string
    severity: string
    occurredAt: string
    location: string
    involvedPersons: Array<{ name: string; role?: string; isWitness?: boolean }>
  } | null>(null)
  const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null)
  const [editIncident, setEditIncident] = useState<any>(null)
  const [resolveIncident, setResolveIncident] = useState<{ id: string; title: string; resolution?: string } | null>(null)
  const [viewHistory, setViewHistory] = useState<{ incidentId: string; incidentTitle: string } | null>(null)
  const [rejectCalculationModal, setRejectCalculationModal] = useState<{ calculationId: string; notes: string } | null>(null)
  const [emailCalculationModal, setEmailCalculationModal] = useState<{ calculationId: string; email: string } | null>(null)
  const [incidentFilters, setIncidentFilters] = useState<{
    status: string
    severity: string
    category: string
  }>({
    status: 'ALL',
    severity: 'ALL',
    category: 'ALL',
  })

  const { data: site, isLoading, isError, error } = useQuery<Site>({
    queryKey: ['site', id],
    queryFn: async () => {
      const res = await api.get<{ data: Site }>(`/sites/${id}?include=relations`)
      return res.data.data
    },
    enabled: !!id,
  })

  // Control Points Query
  const { data: controlPoints = [] } = useQuery({
    queryKey: ['controlPoints', id],
    queryFn: () => fetchControlPoints(id!),
    enabled: !!id && activeTab === 'control-points',
  })

  // Control Rounds Query
  const { data: controlRoundsData } = useQuery({
    queryKey: ['controlRounds', id],
    queryFn: () => fetchControlRounds(id!),
    enabled: !!id && activeTab === 'control-rounds',
  })

  const controlRounds = controlRoundsData?.data || []

  // Calculations Query
  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations', id],
    queryFn: () => fetchSiteCalculations(id!),
    enabled: !!id && activeTab === 'calculations',
  })

  // History Query
  const { data: incidentHistory } = useQuery({
    queryKey: ['incidentHistory', viewHistory?.incidentId],
    queryFn: async () => {
      const res = await api.get(`/sites/${id}/incidents/${viewHistory?.incidentId}/history`)
      return res.data.data
    },
    enabled: !!viewHistory?.incidentId,
  })

  // Shifts Query
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ['shifts', id],
    queryFn: () => fetchSiteShifts(id!),
    enabled: !!id && activeTab === 'shifts',
  })

  const completeTrainingMutation = useMutation({
    mutationFn: (data: { id: string; hours: number }) => completeClearanceTraining(data.id, { trainingHours: data.hours }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      if (trainingModal && site) {
        const userName = `${trainingModal.clearance.user.firstName} ${trainingModal.clearance.user.lastName}`
        toastSuccess.clearanceCompleted(userName, site.name)
      } else {
        toast.success('Training erfolgreich abgeschlossen')
      }
      setTrainingModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Abschließen des Trainings', error?.response?.data?.message)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => revokeClearance(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      if (revokeModal && site) {
        const userName = `${revokeModal.clearance.user.firstName} ${revokeModal.clearance.user.lastName}`
        toastSuccess.clearanceRevoked(userName, site.name)
      } else {
        toast.success('Clearance erfolgreich widerrufen')
      }
      setRevokeModal(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Widerrufen der Clearance', error?.response?.data?.message)
    },
  })

  const uploadImageMutation = useMutation({
    mutationFn: async (data: { file: File; category: string }) => {
      const formData = new FormData()
      formData.append('image', data.file)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toastSuccess.imageUploaded(variables.category)
      setUploadModal(null)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Bild', error?.response?.data?.message)
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/sites/${id}/images/${imageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toastSuccess.imageDeleted()
      setDeleteImageId(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Löschen', error?.response?.data?.message)
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; file: File }) => {
      const formData = new FormData()
      formData.append('document', data.file)
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      const res = await api.post(`/sites/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toastSuccess.documentUploaded(variables.title, variables.category)
      setUploadDocumentModal(null)
    },
    onError: (error: any) => {
      toastError.uploadFailed('Dokument', error?.response?.data?.message)
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/sites/${id}/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toastSuccess.generic('Dokument gelöscht', 'Das Dokument wurde erfolgreich entfernt')
      setDeleteDocumentId(null)
    },
    onError: (error: any) => {
      toastError.generic('Fehler beim Löschen', error?.response?.data?.message)
    },
  })

  const createClearanceMutation = useMutation({
    mutationFn: async (data: { userId: string; notes: string }) => {
      const res = await api.post('/clearances', {
        userId: data.userId,
        siteId: id,
        status: 'TRAINING',
        notes: data.notes,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Clearance erfolgreich angelegt')
      setCreateClearanceModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Anlegen')
    },
  })

  // Fetch all users for clearance creation
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users?pageSize=1000')
      return res.data
    },
    enabled: !!createClearanceModal || !!createAssignmentModal,
  })

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const res = await api.post(`/sites/${id}/assignments`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Zuweisung erfolgreich erstellt')
      setCreateAssignmentModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Zuweisung')
    },
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/sites/${id}/assignments/${assignmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Zuweisung erfolgreich entfernt')
      setDeleteAssignmentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Entfernen der Zuweisung')
    },
  })

  const deleteSiteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/sites/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Objekt erfolgreich gelöscht')
      nav('/sites')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen des Objekts')
    },
  })

  const createIncidentMutation = useMutation({
    mutationFn: async (data: {
      title: string
      description: string
      category: string
      severity: string
      occurredAt: string
      location?: string
      involvedPersons?: string
    }) => {
      const res = await api.post(`/sites/${id}/incidents`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Vorfall erfolgreich gemeldet')
      setCreateIncidentModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Melden des Vorfalls')
    },
  })

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, data }: { incidentId: string; data: Partial<{
      title: string
      description: string
      category: string
      severity: string
      location?: string
      involvedPersons?: string
    }> }) => {
      const res = await api.put(`/sites/${id}/incidents/${incidentId}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Vorfall erfolgreich aktualisiert')
      setEditIncident(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren des Vorfalls')
    },
  })

  const resolveIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, resolution }: { incidentId: string; resolution: string }) => {
      const res = await api.put(`/sites/${id}/incidents/${incidentId}/resolve`, { resolution })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Vorfall als gelöst markiert')
      setResolveIncident(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Auflösen des Vorfalls')
    },
  })

  const deleteIncidentMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      await api.delete(`/sites/${id}/incidents/${incidentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Vorfall erfolgreich gelöscht')
      setDeleteIncidentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen des Vorfalls')
    },
  })

  // Calculation Mutations
  const sendCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => sendSiteCalculation(id!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', id] })
      toast.success('Kalkulation erfolgreich versendet')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Versenden der Kalkulation')
    },
  })

  const acceptCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => acceptSiteCalculation(id!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', id] })
      toast.success('Kalkulation erfolgreich angenommen')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Annehmen der Kalkulation')
    },
  })

  const rejectCalculationMutation = useMutation({
    mutationFn: ({ calculationId, notes }: { calculationId: string; notes?: string }) =>
      rejectSiteCalculation(id!, calculationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', id] })
      toast.success('Kalkulation erfolgreich abgelehnt')
      setRejectCalculationModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Ablehnen der Kalkulation')
    },
  })

  const archiveCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => archiveSiteCalculation(id!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', id] })
      toast.success('Kalkulation erfolgreich archiviert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Archivieren der Kalkulation')
    },
  })

  const duplicateCalculationMutation = useMutation({
    mutationFn: (calculationId: string) => duplicateSiteCalculation(id!, calculationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations', id] })
      toast.success('Kalkulation erfolgreich dupliziert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Duplizieren der Kalkulation')
    },
  })

  const sendEmailCalculationMutation = useMutation({
    mutationFn: ({ calculationId, email }: { calculationId: string; email: string }) =>
      sendCalculationEmailAPI(id!, calculationId, email),
    onSuccess: () => {
      toast.success('E-Mail wird versendet')
      setEmailCalculationModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Versenden der E-Mail')
    },
  })

  // Generate Shifts Mutation
  const generateShiftsMutation = useMutation({
    mutationFn: (payload: GenerateShiftsPayload) => generateShiftsForSite(id!, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', id] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren der Schichten')
    },
  })

  if (isLoading) {
    return <SkeletonDetailPage />
  }

  if (isError && (error as any)?.response?.status === 403) {
    return <RbacForbidden />
  }

  if (isError || !site) {
    return <div className="p-4 text-red-600">Objekt nicht gefunden</div>
  }

  const tabs = [
    { key: 'overview', label: 'Übersicht' },
    { key: 'clearances', label: `Clearances (${site.clearances?.length || 0})` },
    { key: 'shifts', label: 'Schichten' },
    { key: 'control-points', label: `Kontrollpunkte (${controlPoints.length})` },
    { key: 'control-rounds', label: `Kontrollgänge (${controlRounds.length})` },
    { key: 'calculations', label: `Kalkulationen (${calculations.length})` },
    { key: 'images', label: `Bilder (${site.images?.length || 0})` },
    { key: 'documents', label: `Dokumente (${site.documents?.length || 0})` },
    { key: 'incidents', label: `Vorfälle (${site.incidents?.length || 0})` },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="link" onClick={() => nav('/sites')} className="px-0">
              ← Zurück zur Liste
            </Button>
          </div>
          <h1 className="text-2xl font-bold mt-2">{site.name}</h1>
          <p className="text-gray-600">
            {site.address}, {site.postalCode} {site.city}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {site.status && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[site.status]}`}>
              {STATUS_LABELS[site.status]}
            </span>
          )}
          <Button onClick={() => nav(`/sites/${id}/edit`)}>Bearbeiten</Button>
          <Button variant="outline" onClick={() => setDeleteSiteConfirm(true)} className="text-red-600 hover:text-red-700">
            Löschen
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 min-w-max sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Kunden-Informationen */}
            {(site.customerName || site.customerCompany) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Kunden-Informationen
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {site.customerCompany && (
                    <>
                      <dt className="text-sm font-medium text-gray-600">Firma</dt>
                      <dd className="text-sm">{site.customerCompany}</dd>
                    </>
                  )}
                  {site.customerName && (
                    <>
                      <dt className="text-sm font-medium text-gray-600">Ansprechpartner</dt>
                      <dd className="text-sm">{site.customerName}</dd>
                    </>
                  )}
                  {site.customerEmail && (
                    <>
                      <dt className="text-sm font-medium text-gray-600">E-Mail</dt>
                      <dd className="text-sm">
                        <a href={`mailto:${site.customerEmail}`} className="text-blue-600 hover:underline">
                          {site.customerEmail}
                        </a>
                      </dd>
                    </>
                  )}
                  {site.customerPhone && (
                    <>
                      <dt className="text-sm font-medium text-gray-600">Telefon</dt>
                      <dd className="text-sm">
                        <a href={`tel:${site.customerPhone}`} className="text-blue-600 hover:underline">
                          {site.customerPhone}
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {/* Notfallkontakte */}
            {site.emergencyContacts && site.emergencyContacts.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-5 border border-red-100">
                <h3 className="text-lg font-semibold mb-4 text-red-900 flex items-center gap-2">
                  <Phone size={20} className="text-red-600" />
                  Notfallkontakte
                </h3>
                <div className="space-y-2">
                  {site.emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="border rounded p-3 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                      <div className="font-medium">{contact.name}</div>
                      {contact.role && <div className="text-sm text-gray-600">{contact.role}</div>}
                      <div className="text-sm">
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anforderungen */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Anforderungen</h3>
              <dl className="grid grid-cols-2 gap-4">
                <dt className="text-sm font-medium text-gray-600">Benötigte Mitarbeiter</dt>
                <dd className="text-sm">{site.requiredStaff || 1}</dd>
                {site.requiredQualifications && site.requiredQualifications.length > 0 && (
                  <>
                    <dt className="text-sm font-medium text-gray-600">Benötigte Qualifikationen</dt>
                    <dd className="text-sm">
                      <div className="flex flex-wrap gap-1">
                        {site.requiredQualifications.map((q, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                            {q}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {/* Coverage Stats */}
            <CoverageStats siteId={site.id} />

            {/* Zuweisungen */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-5 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                  <UserCheck size={20} className="text-purple-600" />
                  Zuweisungen ({site.assignments?.length || 0})
                </h3>
                <Button size="sm" onClick={() => setSmartAssignmentModal(true)}>
                  Neue Zuweisung
                </Button>
              </div>
              {!site.assignments || site.assignments.length === 0 ? (
                <p className="text-gray-500">Keine Zuweisungen vorhanden</p>
              ) : (
                <div className="space-y-2">
                  {site.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between border rounded p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                      <div>
                        <div className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{ROLE_LABELS[assignment.role] || assignment.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/users/${assignment.user.id}/profile`} className="text-blue-600 hover:underline text-sm">
                          Profil →
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteAssignmentId(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Entfernen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Beschreibung */}
            {site.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Beschreibung</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{site.description}</p>
              </div>
            )}

            {/* Notizen */}
            {site.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Notizen</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{site.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clearances' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} className="text-green-600" />
                Clearances ({site.clearances?.length || 0})
              </h3>
              <Button size="sm" onClick={() => setCreateClearanceModal({ userId: '', notes: '' })}>
                Neue Clearance
              </Button>
            </div>
            {!site.clearances || site.clearances.length === 0 ? (
              <p className="text-gray-500">Keine Clearances vorhanden</p>
            ) : (
              <div className="space-y-2">
                {site.clearances.map((clearance) => (
                  <div key={clearance.id} className="border rounded p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {clearance.user.firstName} {clearance.user.lastName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              clearance.status === 'ACTIVE' && 'bg-green-100 text-green-800',
                              clearance.status === 'TRAINING' && 'bg-yellow-100 text-yellow-800',
                              clearance.status === 'EXPIRED' && 'bg-gray-100 text-gray-800',
                              clearance.status === 'REVOKED' && 'bg-red-100 text-red-800'
                            )}
                          >
                            {clearance.status}
                          </span>
                        </div>
                        {clearance.trainingCompletedAt && (
                          <div className="text-sm text-gray-600 mt-1">
                            Training abgeschlossen: {new Date(clearance.trainingCompletedAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {clearance.status === 'TRAINING' && (
                          <Button
                            size="sm"
                            onClick={() => setTrainingModal({ clearance: clearance as any, hours: 0 })}
                          >
                            Training abschließen
                          </Button>
                        )}
                        {clearance.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRevokeModal({ clearance: clearance as any, notes: '' })}
                          >
                            Widerrufen
                          </Button>
                        )}
                        <Link to={`/users/${clearance.user.id}/profile`} className="text-blue-600 hover:underline text-sm self-center">
                          Profil →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Schichten ({shifts.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const startDate = new Date().toISOString()
                    generateShiftsMutation.mutate({ startDate, daysAhead: 30 })
                  }}
                  disabled={generateShiftsMutation.isPending || !site.securityConcept?.shiftModel}
                >
                  {generateShiftsMutation.isPending ? 'Generiere...' : 'Schichten generieren'}
                </Button>
                <Button size="sm" onClick={() => nav(`/sites/${id}/shifts`)}>
                  Alle anzeigen →
                </Button>
              </div>
            </div>

            {!site.securityConcept?.shiftModel && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-900">
                  ⚠️ <strong>Hinweis:</strong> Für dieses Objekt ist noch kein Sicherheitskonzept mit Schichtmodell hinterlegt. Bitte bearbeiten Sie das Objekt und fügen Sie ein Schichtmodell hinzu.
                </p>
              </div>
            )}

            {shiftsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 animate-pulse h-20 rounded-lg" />
                ))}
              </div>
            ) : shifts.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Calendar size={48} className="text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Noch keine Schichten vorhanden</p>
                <p className="text-sm text-gray-500 mb-4">
                  Klicken Sie auf "Schichten generieren", um automatisch Schichten basierend auf dem Sicherheitskonzept zu erstellen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.slice(0, 10).map((shift) => {
                  const startDate = new Date(shift.startTime)
                  const endDate = new Date(shift.endTime)
                  const isToday = new Date().toDateString() === startDate.toDateString()
                  const isPast = startDate < new Date()

                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'border rounded-lg p-4 hover:shadow-md transition-all duration-200',
                        isToday && 'border-blue-500 bg-blue-50',
                        !isToday && 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{shift.title}</h4>
                            {isToday && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
                                Heute
                              </span>
                            )}
                            {shift.status === 'PLANNED' && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                Geplant
                              </span>
                            )}
                            {shift.status === 'CONFIRMED' && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                Bestätigt
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>
                                {startDate.toLocaleDateString('de-DE', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                                , {startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserCheck size={14} />
                              <span>
                                {shift.assignedEmployees || 0} / {shift.requiredEmployees} Mitarbeiter
                              </span>
                            </div>
                          </div>
                          {shift.description && (
                            <p className="text-sm text-gray-500 mt-2">{shift.description}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => nav(`/shifts/${shift.id}`)}
                          >
                            Details →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {shifts.length > 10 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" onClick={() => nav(`/sites/${id}/shifts`)}>
                      Alle {shifts.length} Schichten anzeigen →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon size={20} className="text-purple-600" />
                Bilder ({site.images?.length || 0})
              </h3>
              <Button size="sm" onClick={() => setUploadModal({ file: null, category: 'ALLGEMEIN' })}>
                Bild hochladen
              </Button>
            </div>
            {!site.images || site.images.length === 0 ? (
              <p className="text-gray-500">Keine Bilder vorhanden</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {site.images.map((image) => (
                  <div key={image.id} className="border rounded p-2 relative group hover:shadow-lg transition-all duration-200">
                    <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">📷</span>
                    </div>
                    <p className="text-sm font-medium truncate">{image.filename}</p>
                    <p className="text-xs text-gray-600">{image.category}</p>
                    <p className="text-xs text-gray-500">
                      {image.uploader.firstName} {image.uploader.lastName}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteImageId(image.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                    >
                      Löschen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Dokumente ({site.documents?.length || 0})
              </h3>
              <Button
                size="sm"
                onClick={() =>
                  setUploadDocumentModal({ title: '', description: '', category: 'DIENSTANWEISUNG', file: null })
                }
              >
                <Upload size={16} className="mr-2" />
                Dokument hochladen
              </Button>
            </div>
            {!site.documents || site.documents.length === 0 ? (
              <p className="text-gray-500">Keine Dokumente vorhanden</p>
            ) : (
              <div className="space-y-3">
                {site.documents.map((document) => (
                  <div
                    key={document.id}
                    className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={18} className="text-indigo-600" />
                          <h4 className="font-semibold">{document.title}</h4>
                          {document.version > 1 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              v{document.version}
                            </span>
                          )}
                          {document.isLatest && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Aktuell</span>
                          )}
                        </div>
                        {document.description && <p className="text-sm text-gray-600 mb-2">{document.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Kategorie:</span> {document.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Datei:</span> {document.filename}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Größe:</span> {(document.fileSize / 1024).toFixed(2)} KB
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Hochgeladen:</span>{' '}
                            {new Date(document.uploadedAt).toLocaleDateString('de-DE')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Von:</span> {document.uploader.firstName}{' '}
                            {document.uploader.lastName}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setViewDocument({
                              id: document.id,
                              title: document.title,
                              filename: document.filename,
                              mimeType: document.mimeType,
                              fileSize: document.fileSize,
                            })
                          }
                        >
                          <Eye size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/sites/${id}/documents/${document.id}/download`, '_blank')}>
                          <Download size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteDocumentId(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training abschließen Modal */}
      {trainingModal && (
        <Modal
          title="Training abschließen"
          open={!!trainingModal}
          onClose={() => setTrainingModal(null)}
        >
          <div className="space-y-4">
            <p>
              Training für <strong>{trainingModal.clearance.user.firstName} {trainingModal.clearance.user.lastName}</strong> abschließen?
            </p>
            <FormField label="Anzahl Trainingsstunden">
              <Input
                type="number"
                min="0"
                value={trainingModal.hours}
                onChange={(e) => setTrainingModal({ ...trainingModal, hours: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTrainingModal(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  completeTrainingMutation.mutate({ id: trainingModal.clearance.id, hours: trainingModal.hours })
                }
                loading={completeTrainingMutation.isPending}
                loadingText="Wird gespeichert..."
              >
                Abschließen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Widerrufen Modal */}
      {revokeModal && (
        <Modal
          title="Clearance widerrufen"
          open={!!revokeModal}
          onClose={() => setRevokeModal(null)}
        >
          <div className="space-y-4">
            <p className="text-red-600">
              Clearance für <strong>{revokeModal.clearance.user.firstName} {revokeModal.clearance.user.lastName}</strong> widerrufen?
            </p>
            <FormField label="Grund (optional)">
              <Textarea
                value={revokeModal.notes}
                onChange={(e) => setRevokeModal({ ...revokeModal, notes: e.target.value })}
                placeholder="Geben Sie einen Grund an..."
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRevokeModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() =>
                  revokeMutation.mutate({ id: revokeModal.clearance.id, notes: revokeModal.notes })
                }
                loading={revokeMutation.isPending}
                loadingText="Wird widerrufen..."
              >
                Widerrufen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bild hochladen Modal */}
      {uploadModal && (
        <Modal title="Bild hochladen" open={!!uploadModal} onClose={() => setUploadModal(null)}>
          <div className="space-y-4">
            <FormField label="Kategorie">
              <Select
                value={uploadModal.category}
                onChange={(e: any) => setUploadModal({ ...uploadModal, category: e.target.value })}
              >
                <option value="ALLGEMEIN">Allgemein</option>
                <option value="AUSSEN">Außenansicht</option>
                <option value="INNEN">Innenansicht</option>
                <option value="ZUGANG">Zugang</option>
                <option value="NOTAUSGANG">Notausgang</option>
                <option value="SONSTIGES">Sonstiges</option>
              </Select>
            </FormField>
            <FormField label="Datei auswählen *">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadModal({ ...uploadModal, file })
                }}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadModal(null)} disabled={uploadImageMutation.isPending}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (uploadModal.file) {
                    uploadImageMutation.mutate({ file: uploadModal.file, category: uploadModal.category })
                  } else {
                    toast.error('Bitte wählen Sie eine Datei aus')
                  }
                }}
                disabled={!uploadModal.file}
                loading={uploadImageMutation.isPending}
                loadingText="Wird hochgeladen..."
              >
                Hochladen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bild löschen Bestätigung */}
      {deleteImageId && (
        <Modal title="Bild löschen" open={!!deleteImageId} onClose={() => setDeleteImageId(null)}>
          <div className="space-y-4">
            <p className="text-red-600">Möchten Sie dieses Bild wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteImageId(null)} disabled={deleteImageMutation.isPending}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteImageMutation.mutate(deleteImageId)}
                loading={deleteImageMutation.isPending}
                loadingText="Wird gelöscht..."
              >
                Löschen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Neue Clearance anlegen */}
      {createClearanceModal && (
        <Modal title="Neue Clearance anlegen" open={!!createClearanceModal} onClose={() => setCreateClearanceModal(null)}>
          <div className="space-y-4">
            <FormField label="Mitarbeiter auswählen *">
              <UserSelect
                users={usersData?.data || []}
                value={createClearanceModal.userId}
                onChange={(userId) => setCreateClearanceModal({ ...createClearanceModal, userId })}
                placeholder="Suche nach Name oder Email..."
              />
            </FormField>
            <FormField label="Notizen (optional)">
              <Textarea
                value={createClearanceModal.notes}
                onChange={(e) => setCreateClearanceModal({ ...createClearanceModal, notes: e.target.value })}
                placeholder="Zusätzliche Informationen zur Clearance..."
                rows={3}
              />
            </FormField>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                💡 <strong>Hinweis:</strong> Die Clearance wird mit Status <strong>TRAINING</strong> angelegt. Nach Abschluss des Trainings kann der Status auf ACTIVE gesetzt werden.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreateClearanceModal(null)}
                disabled={createClearanceMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!createClearanceModal.userId) {
                    toast.error('Bitte wählen Sie einen Mitarbeiter aus')
                    return
                  }
                  // Check if clearance already exists
                  const exists = site.clearances?.some((c) => c.user.id === createClearanceModal.userId)
                  if (exists) {
                    toast.error('Dieser Mitarbeiter hat bereits eine Clearance für dieses Objekt')
                    return
                  }
                  createClearanceMutation.mutate({
                    userId: createClearanceModal.userId,
                    notes: createClearanceModal.notes,
                  })
                }}
                disabled={createClearanceMutation.isPending || !createClearanceModal.userId}
              >
                {createClearanceMutation.isPending ? 'Wird angelegt...' : 'Clearance anlegen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Neue Zuweisung anlegen */}
      {createAssignmentModal && (
        <Modal title="Neue Zuweisung erstellen" open={!!createAssignmentModal} onClose={() => setCreateAssignmentModal(null)}>
          <div className="space-y-4">
            <FormField label="Mitarbeiter auswählen *">
              <UserSelect
                users={usersData?.data || []}
                value={createAssignmentModal.userId}
                onChange={(userId) => setCreateAssignmentModal({ ...createAssignmentModal, userId })}
                placeholder="Suche nach Name oder Email..."
              />
            </FormField>
            <FormField label="Rolle *">
              <Select
                value={createAssignmentModal.role}
                onChange={(e: any) => setCreateAssignmentModal({ ...createAssignmentModal, role: e.target.value })}
              >
                <option value="OBJEKTLEITER">Objektleiter</option>
                <option value="SCHICHTLEITER">Schichtleiter</option>
                <option value="MITARBEITER">Mitarbeiter</option>
              </Select>
            </FormField>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-900">
                💡 <strong>Hinweis:</strong> Objektleiter und Schichtleiter haben erweiterte Berechtigungen für dieses Objekt.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreateAssignmentModal(null)}
                disabled={createAssignmentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!createAssignmentModal.userId || !createAssignmentModal.role) {
                    toast.error('Bitte füllen Sie alle Felder aus')
                    return
                  }
                  // Check if assignment already exists
                  const exists = site.assignments?.some((a) => a.user.id === createAssignmentModal.userId)
                  if (exists) {
                    toast.error('Dieser Mitarbeiter ist bereits diesem Objekt zugewiesen')
                    return
                  }
                  createAssignmentMutation.mutate({
                    userId: createAssignmentModal.userId,
                    role: createAssignmentModal.role,
                  })
                }}
                disabled={createAssignmentMutation.isPending || !createAssignmentModal.userId}
              >
                {createAssignmentMutation.isPending ? 'Wird erstellt...' : 'Zuweisung erstellen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Smart Assignment Modal */}
      <SmartAssignmentModal
        siteId={id!}
        siteName={site.name}
        open={smartAssignmentModal}
        onClose={() => setSmartAssignmentModal(false)}
        onAssign={(userId, role) => {
          // Check if assignment already exists
          const exists = site.assignments?.some((a) => a.user.id === userId);
          if (exists) {
            toast.error('Dieser Mitarbeiter ist bereits diesem Objekt zugewiesen');
            return;
          }
          createAssignmentMutation.mutate(
            { userId, role },
            {
              onSuccess: () => {
                setSmartAssignmentModal(false);
              },
            }
          );
        }}
        isLoading={createAssignmentMutation.isPending}
      />

      {/* Control Round Suggestions Modal */}
      {controlRoundSuggestionsModal && id && (
        <ControlRoundSuggestionsModal
          siteId={id}
          onClose={() => setControlRoundSuggestionsModal(false)}
        />
      )}

      {/* Zuweisung entfernen Bestätigung */}
      {deleteAssignmentId && (
        <Modal title="Zuweisung entfernen" open={!!deleteAssignmentId} onClose={() => setDeleteAssignmentId(null)}>
          <div className="space-y-4">
            <p className="text-red-600">
              Möchten Sie diese Zuweisung wirklich entfernen? Der Mitarbeiter verliert damit seine erweiterten Berechtigungen für dieses Objekt.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteAssignmentId(null)}
                disabled={deleteAssignmentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteAssignmentMutation.mutate(deleteAssignmentId)}
                disabled={deleteAssignmentMutation.isPending}
              >
                {deleteAssignmentMutation.isPending ? 'Wird entfernt...' : 'Entfernen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Objekt löschen Bestätigung */}
      {deleteSiteConfirm && (
        <Modal title="Objekt löschen" open={deleteSiteConfirm} onClose={() => setDeleteSiteConfirm(false)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-900 font-semibold mb-2">⚠️ Achtung: Diese Aktion kann nicht rückgängig gemacht werden!</p>
              <p className="text-red-800 text-sm">
                Das Löschen des Objekts "<strong>{site.name}</strong>" führt zu folgenden Konsequenzen:
              </p>
              <ul className="list-disc list-inside text-red-800 text-sm mt-2 space-y-1">
                <li>Alle Clearances werden gelöscht</li>
                <li>Alle Zuweisungen werden entfernt</li>
                <li>Alle hochgeladenen Bilder werden gelöscht</li>
                <li>Schichten werden vom Objekt getrennt (bleiben aber erhalten)</li>
              </ul>
            </div>
            <p className="text-gray-700">
              Sind Sie sicher, dass Sie dieses Objekt endgültig löschen möchten?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteSiteConfirm(false)}
                disabled={deleteSiteMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteSiteMutation.mutate()}
                disabled={deleteSiteMutation.isPending}
              >
                {deleteSiteMutation.isPending ? 'Wird gelöscht...' : 'Objekt endgültig löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dokument hochladen Modal */}
      {uploadDocumentModal && (
        <Modal
          title="Dokument hochladen"
          open={!!uploadDocumentModal}
          onClose={() => setUploadDocumentModal(null)}
        >
          <div className="space-y-4">
            <FormField label="Titel *">
              <Input
                value={uploadDocumentModal.title}
                onChange={(e) => setUploadDocumentModal({ ...uploadDocumentModal, title: e.target.value })}
                placeholder="z.B. Dienstanweisung Zutrittskontrolle"
              />
            </FormField>
            <FormField label="Beschreibung">
              <Textarea
                value={uploadDocumentModal.description}
                onChange={(e) => setUploadDocumentModal({ ...uploadDocumentModal, description: e.target.value })}
                placeholder="Optionale Beschreibung des Dokuments..."
                rows={3}
              />
            </FormField>
            <FormField label="Kategorie *">
              <Select
                value={uploadDocumentModal.category}
                onChange={(e: any) => setUploadDocumentModal({ ...uploadDocumentModal, category: e.target.value })}
              >
                <option value="DIENSTANWEISUNG">Dienstanweisung</option>
                <option value="NOTFALLPLAN">Notfallplan</option>
                <option value="VERTRAG">Vertrag</option>
                <option value="BRANDSCHUTZORDNUNG">Brandschutzordnung</option>
                <option value="HAUSORDNUNG">Hausordnung</option>
                <option value="GRUNDRISS">Grundriss</option>
                <option value="SONSTIGES">Sonstiges</option>
              </Select>
            </FormField>
            <FormField label="Datei *">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadDocumentModal({ ...uploadDocumentModal, file })
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unterstützt: PDF, Word, Text, Markdown (max. 10MB)
              </p>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setUploadDocumentModal(null)}
                disabled={uploadDocumentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (!uploadDocumentModal.title || !uploadDocumentModal.file) {
                    toast.error('Bitte Titel und Datei auswählen')
                    return
                  }
                  uploadDocumentMutation.mutate({
                    title: uploadDocumentModal.title,
                    description: uploadDocumentModal.description,
                    category: uploadDocumentModal.category,
                    file: uploadDocumentModal.file,
                  })
                }}
                loading={uploadDocumentMutation.isPending}
                loadingText="Wird hochgeladen..."
              >
                Hochladen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dokument löschen Bestätigung */}
      {deleteDocumentId && (
        <Modal title="Dokument löschen" open={!!deleteDocumentId} onClose={() => setDeleteDocumentId(null)}>
          <div className="space-y-4">
            <p className="text-red-600">
              Möchten Sie dieses Dokument wirklich löschen?
            </p>
            <p className="text-sm text-gray-600">
              Hinweis: Falls eine ältere Version existiert, wird diese automatisch als "aktuell" markiert.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDocumentId(null)}
                disabled={deleteDocumentMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteDocumentMutation.mutate(deleteDocumentId)}
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfälle/Wachbuch Tab */}
      {activeTab === 'incidents' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-600" />
              Vorfälle ({site.incidents?.filter((inc: any) => {
                if (incidentFilters.status !== 'ALL' && inc.status !== incidentFilters.status) return false
                if (incidentFilters.severity !== 'ALL' && inc.severity !== incidentFilters.severity) return false
                if (incidentFilters.category !== 'ALL' && inc.category !== incidentFilters.category) return false
                return true
              }).length || 0} / {site.incidents?.length || 0})
            </h3>
            <Button
              size="sm"
              onClick={() =>
                setCreateIncidentModal({
                  title: '',
                  description: '',
                  category: 'OTHER',
                  severity: 'MEDIUM',
                  occurredAt: new Date().toISOString().slice(0, 16),
                  location: '',
                  involvedPersons: [],
                })
              }
            >
              <Plus size={16} className="mr-2" />
              Vorfall melden
            </Button>
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 text-sm border rounded-lg"
                value={incidentFilters.status}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, status: e.target.value })}
              >
                <option value="ALL">Alle Status</option>
                <option value="OPEN">Offen</option>
                <option value="IN_PROGRESS">In Bearbeitung</option>
                <option value="RESOLVED">Gelöst</option>
                <option value="CLOSED">Geschlossen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Schweregrad</label>
              <select
                className="w-full px-3 py-2 text-sm border rounded-lg"
                value={incidentFilters.severity}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, severity: e.target.value })}
              >
                <option value="ALL">Alle</option>
                <option value="CRITICAL">Kritisch</option>
                <option value="HIGH">Hoch</option>
                <option value="MEDIUM">Mittel</option>
                <option value="LOW">Niedrig</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                className="w-full px-3 py-2 text-sm border rounded-lg"
                value={incidentFilters.category}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, category: e.target.value })}
              >
                <option value="ALL">Alle</option>
                <option value="FIRE">Brand</option>
                <option value="BREAK_IN">Einbruch</option>
                <option value="THEFT">Diebstahl</option>
                <option value="VANDALISM">Vandalismus</option>
                <option value="ACCIDENT">Unfall</option>
                <option value="MEDICAL_EMERGENCY">Medizinischer Notfall</option>
                <option value="DISTURBANCE">Ruhestörung</option>
                <option value="PROPERTY_DAMAGE">Sachbeschädigung</option>
                <option value="SUSPICIOUS_PERSON">Verdächtige Person</option>
                <option value="TECHNICAL_FAILURE">Technischer Ausfall</option>
                <option value="OTHER">Sonstiges</option>
              </select>
            </div>
          </div>

          {!site.incidents || site.incidents.length === 0 ? (
            <p className="text-gray-500">Keine Vorfälle gemeldet</p>
          ) : (
            <div className="space-y-4">
              {site.incidents
                .filter((inc: any) => {
                  if (incidentFilters.status !== 'ALL' && inc.status !== incidentFilters.status) return false
                  if (incidentFilters.severity !== 'ALL' && inc.severity !== incidentFilters.severity) return false
                  if (incidentFilters.category !== 'ALL' && inc.category !== incidentFilters.category) return false
                  return true
                })
                .map((incident) => (
                <div
                  key={incident.id}
                  className="border-l-4 border-l-orange-500 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={18} className="text-orange-600" />
                        <h4 className="font-semibold">{incident.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {incident.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${incident.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : incident.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                          {incident.status}
                        </span>
                      </div>
                      {incident.description && <p className="text-sm text-gray-600 mb-2">{incident.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Kategorie:</span> {incident.category}
                        </span>
                        {incident.location && (
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Ort:</span> {incident.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Vorfallzeit:</span>{' '}
                          {new Date(incident.occurredAt).toLocaleString('de-DE')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Gemeldet von:</span> {incident.reporter.firstName}{' '}
                          {incident.reporter.lastName}
                        </span>
                      </div>
                      {incident.resolution && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <span className="font-medium text-green-800">Lösung:</span> {incident.resolution}
                        </div>
                      )}
                      {incident.involvedPersons && (() => {
                        try {
                          const persons = JSON.parse(incident.involvedPersons)
                          if (persons.length > 0) {
                            return (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="font-medium text-gray-800">Beteiligte Personen:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {persons.map((person: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 bg-white border border-gray-300 rounded text-xs"
                                    >
                                      {person.name}
                                      {person.role && <span className="text-gray-500"> ({person.role})</span>}
                                      {person.isWitness && <span className="ml-1 text-blue-600">👁</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                        } catch {
                          // Fallback für alte String-Einträge
                          return (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium text-gray-800">Beteiligte Personen:</span> {incident.involvedPersons}
                            </div>
                          )
                        }
                        return null
                      })()}
                      {(incident as any).shift && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="font-medium text-blue-900">Schicht-Kontext</span>
                          </div>
                          <div className="space-y-1 text-gray-700">
                            <div>
                              <span className="font-medium">Schicht:</span> {(incident as any).shift.title}
                            </div>
                            <div>
                              <span className="font-medium">Zeit:</span>{' '}
                              {new Date((incident as any).shift.startTime).toLocaleString('de-DE')} -{' '}
                              {new Date((incident as any).shift.endTime).toLocaleString('de-DE')}
                            </div>
                            {(incident as any).shift.assignments && (incident as any).shift.assignments.length > 0 && (
                              <div>
                                <span className="font-medium">Mitarbeiter im Dienst ({(incident as any).shift.assignments.length}):</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(incident as any).shift.assignments.map((assignment: any) => (
                                    <span
                                      key={assignment.id}
                                      className="inline-block px-2 py-0.5 bg-white border border-blue-300 rounded text-xs"
                                    >
                                      {assignment.user.firstName} {assignment.user.lastName}
                                      {assignment.user.id === incident.reporter.id && ' (Melder)'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      // Berechtigungsprüfungen
                      const isReporter = user?.id === incident.reporter.id
                      const reportedAt = new Date(incident.reportedAt)
                      const now = new Date()
                      const hoursSinceReport = (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60)
                      const within24Hours = hoursSinceReport < 24
                      const isAdmin = user?.role === 'ADMIN'
                      const isManager = user?.role === 'MANAGER'
                      const isObjectLeader = site.assignments?.some(
                        (a) => a.user.id === user?.id && (a.role === 'OBJECT_LEADER' || a.role === 'SHIFT_LEADER')
                      )

                      const canEdit = isAdmin || isManager || isObjectLeader || (isReporter && within24Hours)
                      const canResolve = (isAdmin || isManager || isObjectLeader) && (incident.status === 'OPEN' || incident.status === 'IN_PROGRESS')
                      const canDelete = isAdmin || isManager

                      // Mindestens Historie sollte für alle sichtbar sein
                      return (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                let parsedPersons: Array<{ name: string; role?: string; isWitness?: boolean }> = []
                                try {
                                  if (incident.involvedPersons) {
                                    parsedPersons = JSON.parse(incident.involvedPersons)
                                  }
                                } catch {
                                  // Falls es noch ein alter String ist, ignorieren wir es
                                  parsedPersons = []
                                }
                                setEditIncident({ ...incident, involvedPersons: parsedPersons })
                              }}
                            >
                              <Pencil size={14} className="mr-1" />
                              Bearbeiten
                            </Button>
                          )}
                          {canResolve && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setResolveIncident({ id: incident.id, title: incident.title })}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Auflösen
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteIncidentId(incident.id)}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Löschen
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => setViewHistory({ incidentId: incident.id, incidentTitle: incident.title })}
                          >
                            <Clock size={14} className="mr-1" />
                            Historie
                          </Button>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vorfall melden/bearbeiten Modal */}
      {createIncidentModal && (
        <Modal open={true} onClose={() => setCreateIncidentModal(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall melden</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={createIncidentModal.title}
                onChange={(e) =>
                  setCreateIncidentModal({ ...createIncidentModal, title: e.target.value })
                }
                placeholder="Kurze Beschreibung des Vorfalls"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                value={createIncidentModal.description}
                onChange={(e) =>
                  setCreateIncidentModal({ ...createIncidentModal, description: e.target.value })
                }
                placeholder="Detaillierte Beschreibung des Vorfalls"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.category}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, category: e.target.value })
                  }
                >
                  <option value="FIRE">Brand</option>
                  <option value="BREAK_IN">Einbruch</option>
                  <option value="THEFT">Diebstahl</option>
                  <option value="VANDALISM">Vandalismus</option>
                  <option value="ACCIDENT">Unfall</option>
                  <option value="MEDICAL_EMERGENCY">Medizinischer Notfall</option>
                  <option value="DISTURBANCE">Ruhestörung</option>
                  <option value="PROPERTY_DAMAGE">Sachbeschädigung</option>
                  <option value="SUSPICIOUS_PERSON">Verdächtige Person</option>
                  <option value="TECHNICAL_FAILURE">Technischer Ausfall</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schweregrad *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.severity}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, severity: e.target.value })
                  }
                >
                  <option value="CRITICAL">Kritisch</option>
                  <option value="HIGH">Hoch</option>
                  <option value="MEDIUM">Mittel</option>
                  <option value="LOW">Niedrig</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorfallzeit *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.occurredAt}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, occurredAt: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={createIncidentModal.location}
                  onChange={(e) =>
                    setCreateIncidentModal({ ...createIncidentModal, location: e.target.value })
                  }
                  placeholder="z.B. Gebäude A, Eingang Süd"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Beteiligte Personen</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreateIncidentModal({
                      ...createIncidentModal,
                      involvedPersons: [...createIncidentModal.involvedPersons, { name: '', role: '', isWitness: false }],
                    })
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Person hinzufügen
                </Button>
              </div>
              {createIncidentModal.involvedPersons.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Keine beteiligten Personen hinzugefügt</p>
              ) : (
                <div className="space-y-2">
                  {createIncidentModal.involvedPersons.map((person, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 bg-gray-50 rounded border">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Name *"
                          value={person.name}
                          onChange={(e) => {
                            const updated = [...createIncidentModal.involvedPersons]
                            updated[index] = { ...updated[index], name: e.target.value }
                            setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                          }}
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Rolle (z.B. Zeuge, Betroffener)"
                          value={person.role || ''}
                          onChange={(e) => {
                            const updated = [...createIncidentModal.involvedPersons]
                            updated[index] = { ...updated[index], role: e.target.value }
                            setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                          }}
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={person.isWitness || false}
                          onChange={(e) => {
                            const updated = [...createIncidentModal.involvedPersons]
                            updated[index] = { ...updated[index], isWitness: e.target.checked }
                            setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                          }}
                        />
                        Zeuge
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const updated = createIncidentModal.involvedPersons.filter((_, i) => i !== index)
                          setCreateIncidentModal({ ...createIncidentModal, involvedPersons: updated })
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateIncidentModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  if (!createIncidentModal.title || !createIncidentModal.description) {
                    toast.error('Titel und Beschreibung sind erforderlich')
                    return
                  }
                  createIncidentMutation.mutate({
                    title: createIncidentModal.title,
                    description: createIncidentModal.description,
                    category: createIncidentModal.category,
                    severity: createIncidentModal.severity,
                    occurredAt: createIncidentModal.occurredAt,
                    location: createIncidentModal.location || undefined,
                    involvedPersons:
                      createIncidentModal.involvedPersons.length > 0
                        ? JSON.stringify(createIncidentModal.involvedPersons)
                        : undefined,
                  })
                }}
                disabled={createIncidentMutation.isPending}
              >
                {createIncidentMutation.isPending ? 'Wird gemeldet...' : 'Vorfall melden'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfall löschen Bestätigung */}
      {deleteIncidentId && (
        <Modal open={true} onClose={() => setDeleteIncidentId(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall löschen?</h2>
            <p className="text-gray-600">
              Möchten Sie diesen Vorfall wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteIncidentId(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteIncidentMutation.mutate(deleteIncidentId)}
                disabled={deleteIncidentMutation.isPending}
              >
                {deleteIncidentMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfall bearbeiten Modal */}
      {editIncident && (
        <Modal open={true} onClose={() => setEditIncident(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall bearbeiten</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={editIncident.title}
                onChange={(e) => setEditIncident({ ...editIncident, title: e.target.value })}
                placeholder="Kurze Beschreibung des Vorfalls"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                value={editIncident.description}
                onChange={(e) => setEditIncident({ ...editIncident, description: e.target.value })}
                placeholder="Detaillierte Beschreibung des Vorfalls"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editIncident.category}
                  onChange={(e) => setEditIncident({ ...editIncident, category: e.target.value })}
                >
                  <option value="FIRE">Brand</option>
                  <option value="BREAK_IN">Einbruch</option>
                  <option value="THEFT">Diebstahl</option>
                  <option value="VANDALISM">Vandalismus</option>
                  <option value="ACCIDENT">Unfall</option>
                  <option value="MEDICAL_EMERGENCY">Medizinischer Notfall</option>
                  <option value="DISTURBANCE">Ruhestörung</option>
                  <option value="PROPERTY_DAMAGE">Sachbeschädigung</option>
                  <option value="SUSPICIOUS_PERSON">Verdächtige Person</option>
                  <option value="TECHNICAL_FAILURE">Technischer Ausfall</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schweregrad *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editIncident.severity}
                  onChange={(e) => setEditIncident({ ...editIncident, severity: e.target.value })}
                >
                  <option value="CRITICAL">Kritisch</option>
                  <option value="HIGH">Hoch</option>
                  <option value="MEDIUM">Mittel</option>
                  <option value="LOW">Niedrig</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorfallzeit *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={new Date(editIncident.occurredAt).toISOString().slice(0, 16)}
                  onChange={(e) => setEditIncident({ ...editIncident, occurredAt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editIncident.location || ''}
                  onChange={(e) => setEditIncident({ ...editIncident, location: e.target.value })}
                  placeholder="z.B. Gebäude A, Eingang Süd"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Beteiligte Personen</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditIncident({
                      ...editIncident,
                      involvedPersons: [...(editIncident.involvedPersons || []), { name: '', role: '', isWitness: false }],
                    })
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Person hinzufügen
                </Button>
              </div>
              {(!editIncident.involvedPersons || editIncident.involvedPersons.length === 0) ? (
                <p className="text-sm text-gray-500 italic">Keine beteiligten Personen hinzugefügt</p>
              ) : (
                <div className="space-y-2">
                  {editIncident.involvedPersons.map((person: any, index: number) => (
                    <div key={index} className="flex gap-2 items-start p-2 bg-gray-50 rounded border">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Name *"
                          value={person.name}
                          onChange={(e) => {
                            const updated = [...editIncident.involvedPersons]
                            updated[index] = { ...updated[index], name: e.target.value }
                            setEditIncident({ ...editIncident, involvedPersons: updated })
                          }}
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Rolle (z.B. Zeuge, Betroffener)"
                          value={person.role || ''}
                          onChange={(e) => {
                            const updated = [...editIncident.involvedPersons]
                            updated[index] = { ...updated[index], role: e.target.value }
                            setEditIncident({ ...editIncident, involvedPersons: updated })
                          }}
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={person.isWitness || false}
                          onChange={(e) => {
                            const updated = [...editIncident.involvedPersons]
                            updated[index] = { ...updated[index], isWitness: e.target.checked }
                            setEditIncident({ ...editIncident, involvedPersons: updated })
                          }}
                        />
                        Zeuge
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const updated = editIncident.involvedPersons.filter((_: any, i: number) => i !== index)
                          setEditIncident({ ...editIncident, involvedPersons: updated })
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditIncident(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  if (!editIncident.title || !editIncident.description) {
                    toast.error('Titel und Beschreibung sind erforderlich')
                    return
                  }
                  updateIncidentMutation.mutate({
                    incidentId: editIncident.id,
                    data: {
                      title: editIncident.title,
                      description: editIncident.description,
                      category: editIncident.category,
                      severity: editIncident.severity,
                      location: editIncident.location || undefined,
                      involvedPersons:
                        editIncident.involvedPersons && editIncident.involvedPersons.length > 0
                          ? JSON.stringify(editIncident.involvedPersons)
                          : undefined,
                    },
                  })
                }}
                disabled={updateIncidentMutation.isPending}
              >
                {updateIncidentMutation.isPending ? 'Wird aktualisiert...' : 'Aktualisieren'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vorfall auflösen Modal */}
      {resolveIncident && (
        <Modal open={true} onClose={() => setResolveIncident(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vorfall auflösen</h2>
            <p className="text-gray-600">
              <strong>{resolveIncident.title}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auflösungs-Beschreibung *
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Beschreiben Sie, wie der Vorfall aufgelöst wurde..."
                value={resolveIncident.resolution || ''}
                onChange={(e) =>
                  setResolveIncident({ ...resolveIncident, resolution: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setResolveIncident(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const resolution = resolveIncident.resolution
                  if (!resolution || resolution.trim() === '') {
                    toast.error('Bitte geben Sie eine Auflösungs-Beschreibung ein')
                    return
                  }
                  resolveIncidentMutation.mutate({
                    incidentId: resolveIncident.id,
                    resolution,
                  })
                }}
                disabled={resolveIncidentMutation.isPending}
              >
                {resolveIncidentMutation.isPending ? 'Wird aufgelöst...' : 'Vorfall auflösen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dokument-Viewer */}
      {viewDocument && id && (
        <DocumentViewerModal siteId={id} document={viewDocument} onClose={() => setViewDocument(null)} />
      )}

      {/* Kalkulation ablehnen Modal */}
      {rejectCalculationModal && (
        <Modal open={true} onClose={() => setRejectCalculationModal(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
              <X size={20} />
              Kalkulation ablehnen
            </h2>
            <p className="text-gray-600">
              Möchten Sie diese Kalkulation wirklich ablehnen? Sie können optional einen Grund angeben.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ablehnungsgrund (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="z.B. Preis zu hoch, Anforderungen nicht erfüllt..."
                value={rejectCalculationModal.notes || ''}
                onChange={(e) =>
                  setRejectCalculationModal({ ...rejectCalculationModal, notes: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setRejectCalculationModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  rejectCalculationMutation.mutate({
                    calculationId: rejectCalculationModal.calculationId,
                    notes: rejectCalculationModal.notes || undefined,
                  })
                }}
                disabled={rejectCalculationMutation.isPending}
              >
                {rejectCalculationMutation.isPending ? 'Wird abgelehnt...' : 'Kalkulation ablehnen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* E-Mail versenden Modal */}
      {emailCalculationModal && (
        <Modal open={true} onClose={() => setEmailCalculationModal(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-green-600">
              <Mail size={20} />
              Angebot per E-Mail versenden
            </h2>
            <p className="text-gray-600">
              Senden Sie das Angebot an den Kunden. Die E-Mail enthält einen Link zum Angebot im System.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empfänger-E-Mail *
              </label>
              <Input
                type="email"
                placeholder="kunde@example.com"
                value={emailCalculationModal.email}
                onChange={(e) =>
                  setEmailCalculationModal({ ...emailCalculationModal, email: e.target.value })
                }
                className="focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEmailCalculationModal(null)}>
                Abbrechen
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  if (!emailCalculationModal.email) {
                    toast.error('Bitte geben Sie eine E-Mail-Adresse ein')
                    return
                  }
                  sendEmailCalculationMutation.mutate({
                    calculationId: emailCalculationModal.calculationId,
                    email: emailCalculationModal.email,
                  })
                }}
                disabled={sendEmailCalculationMutation.isPending || !emailCalculationModal.email}
              >
                {sendEmailCalculationMutation.isPending ? 'Wird versendet...' : 'E-Mail senden'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Historie-Modal */}
      {viewHistory && (
        <Modal open={true} onClose={() => setViewHistory(null)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock size={20} />
              Änderungs-Historie: {viewHistory.incidentTitle}
            </h2>

            {!incidentHistory || incidentHistory.length === 0 ? (
              <p className="text-gray-500 italic">Keine Historie vorhanden</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {incidentHistory.map((entry: any) => {
                  const actionLabel = ({
                    CREATED: 'Erstellt',
                    UPDATED: 'Bearbeitet',
                    RESOLVED: 'Aufgelöst',
                    STATUS_CHANGED: 'Status geändert',
                    DELETED: 'Gelöscht',
                  } as any)[entry.action] || entry.action

                  const actionColor = ({
                    CREATED: 'text-green-700 bg-green-50 border-green-200',
                    UPDATED: 'text-blue-700 bg-blue-50 border-blue-200',
                    RESOLVED: 'text-purple-700 bg-purple-50 border-purple-200',
                    STATUS_CHANGED: 'text-orange-700 bg-orange-50 border-orange-200',
                    DELETED: 'text-red-700 bg-red-50 border-red-200',
                  } as any)[entry.action] || 'text-gray-700 bg-gray-50 border-gray-200'

                  let changes = null
                  try {
                    changes = entry.changes ? JSON.parse(entry.changes) : null
                  } catch {}

                  return (
                    <div key={entry.id} className={`p-3 rounded border ${actionColor}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{actionLabel}</span>
                        <span className="text-xs text-gray-600">{new Date(entry.createdAt).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">von</span>{' '}
                        <span className="font-medium">
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                      </div>
                      {changes && Object.keys(changes).length > 0 && (
                        <div className="mt-2 text-xs space-y-1">
                          {Object.entries(changes).map(([field, value]: [string, any]) => (
                            <div key={field} className="flex gap-2">
                              <span className="font-medium">{field}:</span>
                              <span className="text-gray-600">
                                {String(value.old || '-')} → {String(value.new || '-')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.note && (
                        <div className="mt-2 text-xs italic text-gray-600">"{entry.note}"</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewHistory(null)}>
                Schließen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Kontrollpunkt-Tab */}
      {activeTab === 'control-points' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Kontrollpunkte</h2>
              <span className="text-sm text-gray-500">({controlPoints.length})</span>
            </div>
            <div className="flex gap-2">
              {controlPoints.length > 0 && (
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => setControlRoundSuggestionsModal(true)}
                >
                  <Lightbulb size={16} className="mr-1" />
                  Rundgang-Vorschläge
                </Button>
              )}
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => nav(`/sites/${id}/control-points/new`)}
              >
                <Plus size={16} className="mr-1" />
                Kontrollpunkt anlegen
              </Button>
            </div>
          </div>

          {controlPoints.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kontrollpunkte</h3>
              <p className="text-gray-600 mb-4">
                Legen Sie Kontrollpunkte an, um NFC/QR-basierte Rundgänge zu ermöglichen.
              </p>
              <Button onClick={() => nav(`/sites/${id}/control-points/new`)}>
                Ersten Kontrollpunkt anlegen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {controlPoints
                .sort((a, b) => a.order - b.order)
                .map((point) => (
                  <div
                    key={point.id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                            {point.order}
                          </span>
                          <h3 className="font-semibold text-lg">{point.name}</h3>
                          {!point.isActive && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              Inaktiv
                            </span>
                          )}
                        </div>
                        <div className="ml-10 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span>{point.location}</span>
                          </div>
                          {point.instructions && (
                            <div className="text-sm text-gray-600 mt-2">
                              <strong>Anweisungen:</strong> {point.instructions}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            {point.nfcTagId && (
                              <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                <Smartphone size={12} />
                                <span>NFC: {point.nfcTagId}</span>
                              </div>
                            )}
                            {point.qrCode && (
                              <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                <QrCode size={12} />
                                <span>QR: {point.qrCode.substring(0, 20)}...</span>
                              </div>
                            )}
                            {point._count && (
                              <div className="text-xs text-gray-500">
                                {point._count.scans} Scans
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => nav(`/sites/${id}/control-points/${point.id}/edit`)}
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Kontrollgang-Tab */}
      {activeTab === 'control-rounds' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-green-600" />
              <h2 className="text-lg font-semibold">Kontrollgänge</h2>
              <span className="text-sm text-gray-500">({controlRounds.length})</span>
            </div>
          </div>

          {controlRounds.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kontrollgänge</h3>
              <p className="text-gray-600">
                Kontrollgänge werden über die Mobile-App gestartet und durchgeführt.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {controlRounds
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((round) => {
                  const statusColors = {
                    IN_PROGRESS: 'bg-blue-100 text-blue-800',
                    COMPLETED: 'bg-green-100 text-green-800',
                    INCOMPLETE: 'bg-yellow-100 text-yellow-800',
                    CANCELLED: 'bg-gray-100 text-gray-800',
                  }
                  const statusLabels = {
                    IN_PROGRESS: 'In Bearbeitung',
                    COMPLETED: 'Abgeschlossen',
                    INCOMPLETE: 'Unvollständig',
                    CANCELLED: 'Abgebrochen',
                  }

                  return (
                    <div
                      key={round.id}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[round.status]}`}
                            >
                              {statusLabels[round.status]}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(round.startedAt).toLocaleString('de-DE')}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">
                              <strong>Durchgeführt von:</strong>{' '}
                              {round.performer
                                ? `${round.performer.firstName} ${round.performer.lastName}`
                                : 'Unbekannt'}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                <strong>Gescannt:</strong> {round.scannedPoints}/{round.totalPoints}
                              </span>
                              {round.missedPoints > 0 && (
                                <span className="text-orange-600">
                                  <AlertTriangle size={14} className="inline mr-1" />
                                  {round.missedPoints} verpasst
                                </span>
                              )}
                            </div>
                            {round.notes && (
                              <div className="text-sm text-gray-600 mt-2">
                                <strong>Notizen:</strong> {round.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => nav(`/control-rounds/${round.id}`)}
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Kalkulationen-Tab */}
      {activeTab === 'calculations' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Kalkulationen</h2>
              <span className="text-sm text-gray-500">({calculations.length})</span>
            </div>
            <Button onClick={() => nav(`/sites/${id}/calculations/new`)}>
              <Calculator size={16} className="mr-2" />
              Neue Kalkulation
            </Button>
          </div>

          {calculations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kalkulationen</h3>
              <p className="text-gray-600 mb-4">
                Erstellen Sie eine neue Kalkulation für dieses Objekt, um Angebote zu erstellen.
              </p>
              <Button onClick={() => nav(`/sites/${id}/calculations/new`)}>
                Erste Kalkulation erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {calculations
                .sort((a, b) => b.version - a.version)
                .map((calc) => {
                  const statusColors = {
                    DRAFT: 'bg-gray-100 text-gray-800',
                    SENT: 'bg-blue-100 text-blue-800',
                    ACCEPTED: 'bg-green-100 text-green-800',
                    REJECTED: 'bg-red-100 text-red-800',
                    ARCHIVED: 'bg-gray-100 text-gray-600',
                  }
                  const statusLabels = {
                    DRAFT: 'Entwurf',
                    SENT: 'Versendet',
                    ACCEPTED: 'Angenommen',
                    REJECTED: 'Abgelehnt',
                    ARCHIVED: 'Archiviert',
                  }

                  return (
                    <div
                      key={calc.id}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[calc.status]}`}
                            >
                              {statusLabels[calc.status]}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              Version {calc.version}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(calc.createdAt).toLocaleDateString('de-DE')}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-gray-600">Personalkosten:</span>{' '}
                                <span className="font-semibold">
                                  {calc.totalPersonnelCostMonthly.toLocaleString('de-DE', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  })}{' '}
                                  /Monat
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Gemeinkosten:</span>{' '}
                                <span className="font-semibold">
                                  {calc.totalOverheadMonthly.toLocaleString('de-DE', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  })}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Gewinn:</span>{' '}
                                <span className="font-semibold">
                                  {calc.totalProfitMonthly.toLocaleString('de-DE', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col justify-center">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <DollarSign size={18} className="text-blue-600" />
                                  <span className="text-sm font-medium text-blue-900">
                                    Gesamtpreis (monatlich)
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                  {calc.totalPriceMonthly.toLocaleString('de-DE', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Stunden/Woche:</strong> Tag: {calc.hoursDay}, Nacht:{' '}
                            {calc.hoursNight}, Sa: {calc.hoursSaturday}, So: {calc.hoursSunday}
                            {calc.hoursHoliday > 0 && `, Feiertag: ${calc.hoursHoliday}`}
                          </div>

                          {calc.calculator && (
                            <div className="mt-2 text-sm text-gray-500">
                              Erstellt von: {calc.calculator.firstName} {calc.calculator.lastName}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Status-spezifische Actions */}
                          <div className="flex gap-2">
                            {calc.status === 'DRAFT' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendCalculationMutation.mutate(calc.id)}
                                disabled={sendCalculationMutation.isPending}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Send size={14} className="mr-1" />
                                Versenden
                              </Button>
                            )}
                            {calc.status === 'SENT' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acceptCalculationMutation.mutate(calc.id)}
                                  disabled={acceptCalculationMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check size={14} className="mr-1" />
                                  Annehmen
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRejectCalculationModal({ calculationId: calc.id, notes: '' })}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X size={14} className="mr-1" />
                                  Ablehnen
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Allgemeine Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => nav(`/sites/${id}/calculations/${calc.id}`)}
                              className="hover:bg-gray-50"
                            >
                              <Eye size={14} className="mr-1" />
                              Ansehen
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(
                                  `/api/sites/${id}/calculations/${calc.id}/pdf`,
                                  '_blank'
                                )
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Download size={14} className="mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEmailCalculationModal({
                                  calculationId: calc.id,
                                  email: site.customerEmail || '',
                                })
                              }
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Mail size={14} className="mr-1" />
                              E-Mail
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateCalculationMutation.mutate(calc.id)}
                              disabled={duplicateCalculationMutation.isPending}
                              className="hover:bg-gray-50"
                            >
                              <Copy size={14} className="mr-1" />
                              Duplizieren
                            </Button>
                            {calc.status !== 'ARCHIVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => archiveCalculationMutation.mutate(calc.id)}
                                disabled={archiveCalculationMutation.isPending}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <Archive size={14} className="mr-1" />
                                Archivieren
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
