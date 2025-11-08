import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { SkeletonDetailPage } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { cn } from '@/lib/utils'
import RbacForbidden from '@/components/RbacForbidden'
import { SubTabs } from '@/components/ui/sub-tabs'
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
import { Building2, Phone, Shield, Calendar, UserCheck, FileText, Calculator, Sparkles, Briefcase } from 'lucide-react'
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
import CalculationsTab from '../components/tabs/CalculationsTab'
import { ControlPointsTab } from '../components/tabs/ControlPointsTab'
import { ControlRoundsTab } from '../components/tabs/ControlRoundsTab'
import {
  DeleteConfirmModal,
  TrainingModal,
  RevokeModal,
  CreateClearanceModal,
  UploadImageModal,
  UploadDocumentModal,
} from '../components/modals'
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
    return <div className="p-4 text-red-600">Auftrag nicht gefunden</div>
  }

  const tabs = [
    { key: 'overview' as const, label: 'Übersicht', icon: Building2 },
    { key: 'planning' as const, label: 'Planung & Personal', icon: Calendar, badge: (site.clearances?.length || 0) + shifts.length },
    { key: 'controls' as const, label: 'Kontrollen & Vorfälle', icon: Shield, badge: controlPoints.length + controlRounds.length + (site.incidents?.length || 0) },
    { key: 'calculations' as const, label: 'Finanzen', icon: Calculator, badge: calculations.length },
    { key: 'media' as const, label: 'Dokumente & Medien', icon: FileText, badge: (site.images?.length || 0) + (site.documents?.length || 0) },
  ]

  const breadcrumbItems = [
    { label: 'Aufträge', href: '/sites', icon: Briefcase },
    { label: site.name },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{site.name}</h1>
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
        <nav className="flex gap-2 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-3 font-medium text-sm border-b-2 transition-all flex items-center gap-2',
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon size={18} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full font-semibold',
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
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
                          ⚠️ <strong>Hinweis:</strong> Für diesen Auftrag ist noch kein Sicherheitskonzept hinterlegt. Die angezeigten Werte sind Fallback-Werte. Bitte erstellen Sie ein Sicherheitskonzept für genaue Anforderungen.
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
                <Button
                  size="sm"
                  onClick={() => setSmartAssignmentModal(true)}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  title="Intelligente Mitarbeiterzuweisung basierend auf Qualifikationen, Auslastung und Compliance"
                >
                  <Sparkles size={14} />
                  Mitarbeiter zuweisen
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

        {activeTab === 'planning' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SubTabs
              tabs={[
                {
                  key: 'security-concept',
                  label: 'Sicherheitskonzept',
                  content: <SecurityConceptTab site={site} siteId={id!} />,
                },
                {
                  key: 'shifts',
                  label: 'Schichtplanung',
                  badge: shifts.length,
                  content: <ShiftsTab site={site} siteId={id!} />,
                },
                {
                  key: 'clearances',
                  label: 'Clearances',
                  badge: site.clearances?.length || 0,
                  content: <ClearancesTab site={site} siteId={id!} />,
                },
              ]}
              defaultTab="security-concept"
            />
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SubTabs
              tabs={[
                {
                  key: 'images',
                  label: 'Bilder',
                  badge: site.images?.length || 0,
                  content: <ImagesTab site={site} siteId={id!} />,
                },
                {
                  key: 'documents',
                  label: 'Dokumente',
                  badge: site.documents?.length || 0,
                  content: <DocumentsTab site={site} siteId={id!} />,
                },
              ]}
              defaultTab="images"
            />
          </div>
        )}
      </div>

      {/* Controls & Incidents Tab (outside main content box for layout reasons) */}
      {activeTab === 'controls' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <SubTabs
            tabs={[
              {
                key: 'control-points',
                label: 'Kontrollpunkte',
                badge: controlPoints.length,
                content: (
                  <ControlPointsTab
                    siteId={id!}
                    controlPoints={controlPoints}
                    onShowSuggestions={() => setControlRoundSuggestionsModal(true)}
                  />
                ),
              },
              {
                key: 'control-rounds',
                label: 'Kontrollgänge',
                badge: controlRounds.length,
                content: (
                  <ControlRoundsTab
                    siteId={id!}
                    controlRounds={controlRounds}
                  />
                ),
              },
              {
                key: 'incidents',
                label: 'Vorfälle',
                badge: site.incidents?.length || 0,
                content: <IncidentsTab site={site} siteId={id!} />,
              },
            ]}
            defaultTab="control-points"
          />
        </div>
      )}

      {/* Training abschließen Modal */}
      <TrainingModal
        clearance={trainingModal?.clearance || null}
        open={!!trainingModal}
        onClose={() => setTrainingModal(null)}
        onComplete={(id, hours) => completeTrainingMutation.mutate({ id, hours })}
        isPending={completeTrainingMutation.isPending}
      />

      {/* Widerrufen Modal */}
      <RevokeModal
        clearance={revokeModal?.clearance || null}
        open={!!revokeModal}
        onClose={() => setRevokeModal(null)}
        onRevoke={(id, notes) => revokeMutation.mutate({ id, notes })}
        isPending={revokeMutation.isPending}
      />

      {/* Bild hochladen Modal */}
      <UploadImageModal
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        onUpload={(file, category) => uploadImageMutation.mutate({ file, category })}
        isPending={uploadImageMutation.isPending}
      />

      {/* Bild löschen Bestätigung */}
      <DeleteConfirmModal
        open={!!deleteImageId}
        onClose={() => setDeleteImageId(null)}
        onConfirm={() => deleteImageId && deleteImageMutation.mutate(deleteImageId)}
        title="Bild löschen"
        description="Möchten Sie dieses Bild wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isPending={deleteImageMutation.isPending}
      />

      {/* Neue Clearance anlegen */}
      <CreateClearanceModal
        open={!!createClearanceModal}
        onClose={() => setCreateClearanceModal(null)}
        onCreate={(userId, notes) => createClearanceMutation.mutate({ userId, notes })}
        users={usersData?.data || []}
        existingClearances={site.clearances}
        isPending={createClearanceMutation.isPending}
      />

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
            toast.error('Dieser Mitarbeiter ist bereits diesem Auftrag zugewiesen');
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
      <DeleteConfirmModal
        open={!!deleteAssignmentId}
        onClose={() => setDeleteAssignmentId(null)}
        onConfirm={() => deleteAssignmentId && deleteAssignmentMutation.mutate(deleteAssignmentId)}
        title="Zuweisung entfernen"
        description="Möchten Sie diese Zuweisung wirklich entfernen? Der Mitarbeiter verliert damit seine erweiterten Berechtigungen für diesen Auftrag."
        confirmText="Entfernen"
        isPending={deleteAssignmentMutation.isPending}
      />

      {/* Auftrag löschen Bestätigung */}
      <DeleteConfirmModal
        open={deleteSiteConfirm}
        onClose={() => setDeleteSiteConfirm(false)}
        onConfirm={() => deleteSiteMutation.mutate()}
        title="Auftrag löschen"
        description={
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-900 font-semibold mb-2">
                ⚠️ Achtung: Diese Aktion kann nicht rückgängig gemacht werden!
              </p>
              <p className="text-red-800 text-sm">
                Das Löschen des Auftrags "<strong>{site.name}</strong>" führt zu folgenden Konsequenzen:
              </p>
              <ul className="list-disc list-inside text-red-800 text-sm mt-2 space-y-1">
                <li>Alle Clearances werden gelöscht</li>
                <li>Alle Zuweisungen werden entfernt</li>
                <li>Alle hochgeladenen Bilder werden gelöscht</li>
                <li>Schichten werden vom Auftrag getrennt (bleiben aber erhalten)</li>
              </ul>
            </div>
            <p className="text-gray-700">
              Sind Sie sicher, dass Sie diesen Auftrag endgültig löschen möchten?
            </p>
          </div>
        }
        confirmText="Auftrag endgültig löschen"
        isPending={deleteSiteMutation.isPending}
      />

      {/* Dokument hochladen Modal */}
      <UploadDocumentModal
        open={!!uploadDocumentModal}
        onClose={() => setUploadDocumentModal(null)}
        onUpload={(data) => uploadDocumentMutation.mutate(data)}
        isPending={uploadDocumentMutation.isPending}
      />

      {/* Dokument löschen Bestätigung */}
      <DeleteConfirmModal
        open={!!deleteDocumentId}
        onClose={() => setDeleteDocumentId(null)}
        onConfirm={() => deleteDocumentId && deleteDocumentMutation.mutate(deleteDocumentId)}
        title="Dokument löschen"
        description={
          <>
            <p>Möchten Sie dieses Dokument wirklich löschen?</p>
            <p className="text-sm text-gray-600 mt-2">
              Hinweis: Falls eine ältere Version existiert, wird diese automatisch als "aktuell" markiert.
            </p>
          </>
        }
        isPending={deleteDocumentMutation.isPending}
      />

      {/* Kalkulationen-Tab */}
      {activeTab === 'calculations' && (
        <CalculationsTab
          siteId={id!}
          site={site}
          calculations={calculations}
          onSendCalculation={(calcId) => sendCalculationMutation.mutate(calcId)}
          onAcceptCalculation={(calcId) => acceptCalculationMutation.mutate(calcId)}
          onRejectCalculation={(calcId) => setRejectCalculationModal({ calculationId: calcId, notes: '' })}
          onDuplicateCalculation={(calcId) => duplicateCalculationMutation.mutate(calcId)}
          onArchiveCalculation={(calcId) => archiveCalculationMutation.mutate(calcId)}
          onEmailCalculation={(calcId, email) => setEmailCalculationModal({ calculationId: calcId, email })}
          isPending={{
            send: sendCalculationMutation.isPending,
            accept: acceptCalculationMutation.isPending,
            duplicate: duplicateCalculationMutation.isPending,
            archive: archiveCalculationMutation.isPending,
          }}
        />
      )}
    </div>
  )
}
