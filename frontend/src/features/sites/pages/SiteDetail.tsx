import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { completeClearanceTraining, revokeClearance, type Clearance } from '../api'
import { Building2, Phone, Users, Shield, Calendar, Image as ImageIcon, UserCheck, FileText, Upload, Download, Trash2, Eye } from 'lucide-react'
import DocumentViewerModal from '../components/DocumentViewerModal'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'clearances' | 'shifts' | 'images' | 'documents'>('overview')
  const [trainingModal, setTrainingModal] = useState<{ clearance: Clearance; hours: number } | null>(null)
  const [revokeModal, setRevokeModal] = useState<{ clearance: Clearance; notes: string } | null>(null)
  const [uploadModal, setUploadModal] = useState<{ file: File | null; category: string } | null>(null)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)
  const [createClearanceModal, setCreateClearanceModal] = useState<{ userId: string; notes: string } | null>(null)
  const [createAssignmentModal, setCreateAssignmentModal] = useState<{ userId: string; role: string } | null>(null)
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

  const { data: site, isLoading, isError, error } = useQuery<Site>({
    queryKey: ['site', id],
    queryFn: async () => {
      const res = await api.get<{ data: Site }>(`/sites/${id}?include=relations`)
      return res.data.data
    },
    enabled: !!id,
  })

  const completeTrainingMutation = useMutation({
    mutationFn: (data: { id: string; hours: number }) => completeClearanceTraining(data.id, { trainingHours: data.hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Training erfolgreich abgeschlossen')
      setTrainingModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Abschließen des Trainings')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => revokeClearance(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Clearance erfolgreich widerrufen')
      setRevokeModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Widerrufen der Clearance')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Bild erfolgreich hochgeladen')
      setUploadModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Hochladen')
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/sites/${id}/images/${imageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Bild erfolgreich gelöscht')
      setDeleteImageId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Dokument erfolgreich hochgeladen')
      setUploadDocumentModal(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Hochladen')
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/sites/${id}/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] })
      toast.success('Dokument erfolgreich gelöscht')
      setDeleteDocumentId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen')
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
    { key: 'images', label: `Bilder (${site.images?.length || 0})` },
    { key: 'documents', label: `Dokumente (${site.documents?.length || 0})` },
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

            {/* Zuweisungen */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-5 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                  <UserCheck size={20} className="text-purple-600" />
                  Zuweisungen ({site.assignments?.length || 0})
                </h3>
                <Button size="sm" onClick={() => setCreateAssignmentModal({ userId: '', role: 'MITARBEITER' })}>
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
                Schichten
              </h3>
              <Button onClick={() => nav(`/sites/${id}/shifts`)}>Alle Schichten anzeigen →</Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Tipp:</strong> Wechseln Sie zur{' '}
                <Link to={`/sites/${id}/shifts`} className="text-blue-600 hover:underline font-medium">
                  Schichten-Ansicht
                </Link>
                , um alle Schichten dieses Objekts zu verwalten, zu bearbeiten und neue Schichten anzulegen.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                Hier können Sie die Schichten für dieses Objekt verwalten:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Alle geplanten Schichten anzeigen</li>
                <li>Neue Schichten für dieses Objekt erstellen</li>
                <li>Mitarbeiter zu Schichten zuweisen</li>
                <li>Schicht-Zeiten anpassen</li>
                <li>Schichten exportieren (CSV, XLSX, ICS)</li>
              </ul>
            </div>
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
                disabled={completeTrainingMutation.isPending}
              >
                {completeTrainingMutation.isPending ? 'Wird gespeichert...' : 'Abschließen'}
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
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending ? 'Wird widerrufen...' : 'Widerrufen'}
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
                disabled={uploadImageMutation.isPending || !uploadModal.file}
              >
                {uploadImageMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
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
                disabled={deleteImageMutation.isPending}
              >
                {deleteImageMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
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
                disabled={uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
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

      {/* Dokument-Viewer */}
      {viewDocument && id && (
        <DocumentViewerModal siteId={id} document={viewDocument} onClose={() => setViewDocument(null)} />
      )}
    </div>
  )
}
