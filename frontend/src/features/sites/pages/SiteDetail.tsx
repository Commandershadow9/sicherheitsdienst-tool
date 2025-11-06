import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
import ShiftOverviewCard from '../components/ShiftOverviewCard'
import SmartAssignmentModal from '../components/SmartAssignmentModal'
import ControlRoundSuggestionsModal from '../components/ControlRoundSuggestionsModal'
import ClearancesTab from '../components/tabs/ClearancesTab'
import ShiftsTab from '../components/tabs/ShiftsTab'
import ImagesTab from '../components/tabs/ImagesTab'
import DocumentsTab from '../components/tabs/DocumentsTab'
import IncidentsTab from '../components/tabs/IncidentsTab'
import SecurityConceptTab from '../components/tabs/SecurityConceptTab'
import type { Site, TabType } from '../types/site'
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from '../constants/site'
import { useSiteModals } from '../hooks/useSiteModals'
import { useSiteQueries } from '../hooks/useSiteQueries'
import { useSiteMutations } from '../hooks/useSiteMutations'

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [incidentFilters, setIncidentFilters] = useState<{
    status: string
    severity: string
    category: string
  }>({
    status: 'ALL',
    severity: 'ALL',
    category: 'ALL',
  })

  // Modal states consolidated into custom hook
  const {
    trainingModal, setTrainingModal,
    revokeModal, setRevokeModal,
    uploadModal, setUploadModal,
    deleteImageId, setDeleteImageId,
    createClearanceModal, setCreateClearanceModal,
    createAssignmentModal, setCreateAssignmentModal,
    smartAssignmentModal, setSmartAssignmentModal,
    controlRoundSuggestionsModal, setControlRoundSuggestionsModal,
    deleteAssignmentId, setDeleteAssignmentId,
    deleteSiteConfirm, setDeleteSiteConfirm,
    uploadDocumentModal, setUploadDocumentModal,
    deleteDocumentId, setDeleteDocumentId,
    viewDocument, setViewDocument,
    createIncidentModal, setCreateIncidentModal,
    deleteIncidentId, setDeleteIncidentId,
    editIncident, setEditIncident,
    resolveIncident, setResolveIncident,
    viewHistory, setViewHistory,
    rejectCalculationModal, setRejectCalculationModal,
    emailCalculationModal, setEmailCalculationModal,
  } = useSiteModals()

  // Consolidate all queries in custom hook
  const {
    site,
    isLoading,
    isError,
    error,
    controlPoints,
    controlRounds,
    calculations,
    incidentHistory,
    shifts,
    shiftsLoading,
    usersData,
  } = useSiteQueries({
    siteId: id,
    activeTab,
    viewHistoryIncidentId: viewHistory?.incidentId,
    createClearanceModalOpen: !!createClearanceModal,
    createAssignmentModalOpen: !!createAssignmentModal,
  })

  // Consolidate all mutations in custom hook
  const {
    completeTrainingMutation,
    revokeMutation,
    createClearanceMutation,
    uploadImageMutation,
    deleteImageMutation,
    uploadDocumentMutation,
    deleteDocumentMutation,
    createAssignmentMutation,
    deleteAssignmentMutation,
    deleteSiteMutation,
    createIncidentMutation,
    updateIncidentMutation,
    resolveIncidentMutation,
    deleteIncidentMutation,
    sendCalculationMutation,
    acceptCalculationMutation,
    rejectCalculationMutation,
    archiveCalculationMutation,
    duplicateCalculationMutation,
    sendEmailCalculationMutation,
    generateShiftsMutation,
  } = useSiteMutations({
    siteId: id,
    site,
    trainingModal,
    setTrainingModal,
    revokeModal,
    setRevokeModal,
    setUploadModal,
    setDeleteImageId,
    setUploadDocumentModal,
    setDeleteDocumentId,
    setCreateClearanceModal,
    setCreateAssignmentModal,
    setDeleteAssignmentId,
    setCreateIncidentModal,
    setEditIncident,
    setResolveIncident,
    setDeleteIncidentId,
    setRejectCalculationModal,
    setEmailCalculationModal,
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
    { key: 'security-concept', label: 'Sicherheitskonzept' },
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

            {/* Anforderungen - Single Source of Truth: SecurityConcept */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Anforderungen</h3>
              {(() => {
                // Nutze SecurityConcept als Single Source of Truth
                const securityConcept = site.securityConcepts?.[0]
                const staffRequirements = securityConcept?.staffRequirements
                const taskProfiles = securityConcept?.taskProfiles

                // Fallback zu alten Feldern wenn kein SecurityConcept vorhanden
                const requiredStaff = staffRequirements?.anzahlMA ?? site.requiredStaff ?? 1
                const requiredQualifications = staffRequirements?.qualifikationen ?? site.requiredQualifications ?? []

                return (
                  <>
                    <dl className="grid grid-cols-2 gap-4">
                      <dt className="text-sm font-medium text-gray-600">Benötigte Mitarbeiter</dt>
                      <dd className="text-sm font-semibold">
                        {requiredStaff}
                        {!securityConcept && (
                          <span className="ml-2 text-xs text-orange-600 font-normal">
                            (ohne Sicherheitskonzept)
                          </span>
                        )}
                      </dd>
                      {requiredQualifications.length > 0 && (
                        <>
                          <dt className="text-sm font-medium text-gray-600">Benötigte Qualifikationen</dt>
                          <dd className="text-sm">
                            <div className="flex flex-wrap gap-1">
                              {requiredQualifications.map((q, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                                  {q}
                                </span>
                              ))}
                            </div>
                          </dd>
                        </>
                      )}
                    </dl>

                    {/* TaskProfiles (Objektleiter/Schichtleiter) - Optional */}
                    {taskProfiles && (taskProfiles.objektleiter || taskProfiles.schichtleiter) && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Rollen-Anforderungen</h4>
                        <dl className="grid grid-cols-1 gap-3">
                          {taskProfiles.objektleiter && (
                            <div className="flex items-start gap-2">
                              <dt className="text-sm font-medium text-gray-600 min-w-[140px]">
                                Objektleiter:
                              </dt>
                              <dd className="text-sm">
                                {taskProfiles.objektleiter.required ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    ✓ Erforderlich
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    Optional
                                  </span>
                                )}
                                {taskProfiles.objektleiter.qualifikationen && taskProfiles.objektleiter.qualifikationen.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {taskProfiles.objektleiter.qualifikationen.map((q, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                                        {q}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </dd>
                            </div>
                          )}
                          {taskProfiles.schichtleiter && (
                            <div className="flex items-start gap-2">
                              <dt className="text-sm font-medium text-gray-600 min-w-[140px]">
                                Schichtleiter:
                              </dt>
                              <dd className="text-sm">
                                {taskProfiles.schichtleiter.required ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    ✓ Erforderlich
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    Optional
                                  </span>
                                )}
                                {taskProfiles.schichtleiter.qualifikationen && taskProfiles.schichtleiter.qualifikationen.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {taskProfiles.schichtleiter.qualifikationen.map((q, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                                        {q}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}

                    {/* Hinweis wenn kein Sicherheitskonzept vorhanden */}
                    {!securityConcept && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-900">
                          ⚠️ <strong>Hinweis:</strong> Für dieses Objekt ist noch kein Sicherheitskonzept hinterlegt. Die angezeigten Werte sind Fallback-Werte. Bitte erstellen Sie ein Sicherheitskonzept für genaue Anforderungen.
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Coverage Stats */}
            <CoverageStats siteId={site.id} />

            {/* Schichten-Übersicht */}
            <ShiftOverviewCard
              siteId={site.id}
              onShowAll={() => setActiveTab('shifts')}
            />

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

        {activeTab === 'security-concept' && <SecurityConceptTab site={site} siteId={id!} />}

        {activeTab === 'clearances' && <ClearancesTab site={site} siteId={id!} />}

        {activeTab === 'shifts' && <ShiftsTab site={site} siteId={id!} />}

        {activeTab === 'images' && <ImagesTab site={site} siteId={id!} />}

        {activeTab === 'documents' && <DocumentsTab site={site} siteId={id!} />}
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
      {activeTab === 'incidents' && <IncidentsTab site={site} siteId={id!} />}

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
