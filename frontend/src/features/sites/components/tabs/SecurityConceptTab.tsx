import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Shield, Plus, CheckCircle, AlertTriangle, FileText, Building2, Route, Briefcase, Phone, Calendar, BarChart3, RefreshCw, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import ShiftModelEditor from '../ShiftModelEditor'
import RiskAssessmentEditor from '../RiskAssessmentEditor'
import ProtectionMeasuresEditor from '../ProtectionMeasuresEditor'
import SiteSituationEditor from '../SiteSituationEditor'
import TaskProfilesEditor from '../TaskProfilesEditor'
import EmergencyPlanEditor from '../EmergencyPlanEditor'
import CommunicationPlanEditor from '../CommunicationPlanEditor'
import KPIEditor from '../KPIEditor'
import HandoverEditor from '../HandoverEditor'
import AttachmentManager from '../AttachmentManager'
import StatusBadge from '../security-concept/StatusBadge'
import CompletionBadge from '../security-concept/CompletionBadge'
import SectionGroup from '../security-concept/SectionGroup'

type SecurityConcept = {
  id: string
  version: string
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'
  validFrom?: string
  validUntil?: string
  shiftModel?: any
  staffRequirements?: any
  riskAssessment?: any
  emergencyPlan?: any
  dataProtection?: any
  protectionMeasures?: any
  siteSituation?: any
  taskProfiles?: any
  communicationPlan?: any
  qualityMetrics?: any
  handoverProcedures?: any
  attachments?: any
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

type Site = {
  id: string
  name: string
}

type SecurityConceptTabProps = {
  site: Site
  siteId: string
}

const fetchSecurityConcept = async (siteId: string): Promise<SecurityConcept | null> => {
  try {
    const res = await api.get(`/sites/${siteId}/security-concept`)
    return res.data.data
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null
    }
    throw error
  }
}

const createSecurityConcept = async (siteId: string, data: any): Promise<SecurityConcept> => {
  const res = await api.post(`/sites/${siteId}/security-concept`, data)
  return res.data.data
}

const updateSecurityConcept = async (siteId: string, conceptId: string, data: any): Promise<SecurityConcept> => {
  const res = await api.put(`/sites/${siteId}/security-concept/${conceptId}`, data)
  return res.data.data
}

const approveSecurityConcept = async (siteId: string, conceptId: string): Promise<SecurityConcept> => {
  const res = await api.post(`/sites/${siteId}/security-concept/${conceptId}/approve`)
  return res.data.data
}

export default function SecurityConceptTab({ site, siteId }: SecurityConceptTabProps) {
  const queryClient = useQueryClient()
  const [createMode, setCreateMode] = useState(false)

  // Fetch Security Concept
  const { data: concept, isLoading } = useQuery({
    queryKey: ['security-concept', siteId],
    queryFn: () => fetchSecurityConcept(siteId),
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => createSecurityConcept(siteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-concept', siteId] })
      toast.success('Sicherheitskonzept erstellt')
      setCreateMode(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen')
    },
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSecurityConcept(siteId, concept!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-concept', siteId] })
      toast.success('Sicherheitskonzept aktualisiert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren')
    },
  })

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: () => approveSecurityConcept(siteId, concept!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-concept', siteId] })
      toast.success('Sicherheitskonzept wurde freigegeben und ist nun aktiv')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Freigeben')
    },
  })

  const handleCreateBasicConcept = () => {
    createMutation.mutate({
      version: '1.0',
      status: 'DRAFT',
      shiftModel: {
        model: '2-SHIFT',
        hoursPerWeek: 168,
        shifts: [
          { name: 'Frühschicht', start: '06:00', end: '18:00', requiredStaff: 1 },
          { name: 'Spätschicht', start: '18:00', end: '06:00', requiredStaff: 1 },
        ],
      },
      staffRequirements: {
        anzahlMA: 2,
        qualifikationen: ['§34a GewO'],
      },
    })
  }

  // Helper function to determine completion status
  const getCompletionStatus = (data: any): 'complete' | 'partial' | 'empty' => {
    if (!data) return 'empty'
    // Check if data has meaningful content
    if (typeof data === 'object') {
      const hasContent = Object.values(data).some(val => {
        if (Array.isArray(val)) return val.length > 0
        if (typeof val === 'object' && val !== null) return Object.keys(val).length > 0
        return val !== null && val !== undefined && val !== ''
      })
      return hasContent ? 'complete' : 'empty'
    }
    return 'complete'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    )
  }

  // Kein Konzept vorhanden
  if (!concept) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Kein Sicherheitskonzept vorhanden</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Das Sicherheitskonzept ist das <strong>Herzstück</strong> des Objekts. Es definiert Schichtmodelle,
            Risikobeurteilungen, Notfallpläne und alle sicherheitsrelevanten Vorgaben.
          </p>
          <Button onClick={handleCreateBasicConcept} loading={createMutation.isPending} className="gap-2">
            <Plus size={16} />
            Sicherheitskonzept erstellen (Basis-Vorlage)
          </Button>
        </div>
      </div>
    )
  }

  // Konzept vorhanden
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-slate-900">Sicherheitskonzept</h3>
                <StatusBadge status={concept.status as any} />
              </div>
              <p className="text-sm text-slate-600">
                Version {concept.version}
                {concept.validUntil && (
                  <span className="ml-2">
                    · Gültig bis {new Date(concept.validUntil).toLocaleDateString('de-DE')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {concept.status === 'DRAFT' && (
              <Button
                onClick={() => approveMutation.mutate()}
                loading={approveMutation.isPending}
                size="sm"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle size={14} />
                Freigeben
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Critical Components */}
      <SectionGroup priority="critical" title="KRITISCHE KOMPONENTEN" defaultOpen>
        <Accordion type="multiple" className="space-y-2">
          {/* 1. Schichtmodell */}
          <AccordionItem id="shift-model">
            <AccordionTrigger
              id="shift-model"
              icon={<Calendar className="text-blue-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.shiftModel)} />}
            >
              <span className="text-slate-900 font-medium">Schichtmodell & Personal</span>
            </AccordionTrigger>
            <AccordionContent id="shift-model" className="bg-slate-50">
              <ShiftModelEditor
                shiftModel={concept.shiftModel || null}
                onSave={(shiftModel) => {
                  updateMutation.mutate({ shiftModel })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 2. Risikobeurteilung */}
          <AccordionItem id="risk">
            <AccordionTrigger
              id="risk"
              icon={<AlertTriangle className="text-red-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.riskAssessment)} />}
            >
              <span className="text-slate-900 font-medium">Risikobeurteilung (5×5 Matrix)</span>
            </AccordionTrigger>
            <AccordionContent id="risk" className="bg-slate-50">
              <RiskAssessmentEditor
                riskAssessment={concept.riskAssessment || null}
                onSave={(riskAssessment) => {
                  updateMutation.mutate({ riskAssessment })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 3. Personal & Qualifikationen */}
          <AccordionItem id="staff">
            <AccordionTrigger
              id="staff"
              icon={<Users className="text-indigo-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.staffRequirements)} />}
            >
              <span className="text-slate-900 font-medium">Personal & Qualifikationen</span>
            </AccordionTrigger>
            <AccordionContent id="staff" className="bg-slate-50">
              {concept.staffRequirements ? (
                <div className="p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Personal & Qualifikationen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Anzahl Mitarbeiter</p>
                      <p className="font-semibold text-slate-900">{concept.staffRequirements.anzahlMA || 'Nicht definiert'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Qualifikationen</p>
                      <div className="flex flex-wrap gap-1">
                        {concept.staffRequirements.qualifikationen?.map((q: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200">
                            {q}
                          </span>
                        )) || <span className="text-slate-500">Keine</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <p className="text-sm">Personal & Qualifikationen noch nicht definiert</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 4. Notfallplan */}
          <AccordionItem id="emergency">
            <AccordionTrigger
              id="emergency"
              icon={<AlertTriangle className="text-orange-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.emergencyPlan)} />}
            >
              <span className="text-slate-900 font-medium">Notfall & Evakuierung</span>
            </AccordionTrigger>
            <AccordionContent id="emergency" className="bg-slate-50">
              <EmergencyPlanEditor
                emergencyPlan={concept.emergencyPlan || null}
                onSave={(emergencyPlan) => {
                  updateMutation.mutate({ emergencyPlan })
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionGroup>

      {/* Important Components */}
      <SectionGroup priority="important" title="WICHTIGE KOMPONENTEN">
        <Accordion type="multiple" className="space-y-2">
          {/* 5. Objekt-/Lagebild */}
          <AccordionItem id="site-situation">
            <AccordionTrigger
              id="site-situation"
              icon={<Building2 className="text-cyan-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.siteSituation)} />}
            >
              <span className="text-slate-900 font-medium">Objekt-/Lagebild</span>
            </AccordionTrigger>
            <AccordionContent id="site-situation" className="bg-slate-50">
              <SiteSituationEditor
                siteSituation={concept.siteSituation || null}
                onSave={(siteSituation) => {
                  updateMutation.mutate({ siteSituation })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 6. Schutzmaßnahmen & Kontrollgänge */}
          <AccordionItem id="protection">
            <AccordionTrigger
              id="protection"
              icon={<Route className="text-purple-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.protectionMeasures)} />}
            >
              <span className="text-slate-900 font-medium">Schutzmaßnahmen & Kontrollgänge</span>
            </AccordionTrigger>
            <AccordionContent id="protection" className="bg-slate-50">
              <ProtectionMeasuresEditor
                protectionMeasures={concept.protectionMeasures || null}
                onSave={(protectionMeasures) => {
                  updateMutation.mutate({ protectionMeasures })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 7. Aufgaben- & Postenprofile */}
          <AccordionItem id="tasks">
            <AccordionTrigger
              id="tasks"
              icon={<Briefcase className="text-indigo-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.taskProfiles)} />}
            >
              <span className="text-slate-900 font-medium">Aufgaben- & Postenprofile</span>
            </AccordionTrigger>
            <AccordionContent id="tasks" className="bg-slate-50">
              <TaskProfilesEditor
                taskProfiles={concept.taskProfiles || null}
                onSave={(taskProfiles) => {
                  updateMutation.mutate({ taskProfiles })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 8. Kommunikation & Eskalation */}
          <AccordionItem id="communication">
            <AccordionTrigger
              id="communication"
              icon={<Phone className="text-green-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.communicationPlan)} />}
            >
              <span className="text-slate-900 font-medium">Kommunikation & Eskalation</span>
            </AccordionTrigger>
            <AccordionContent id="communication" className="bg-slate-50">
              <CommunicationPlanEditor
                communicationPlan={concept.communicationPlan || null}
                onSave={(communicationPlan) => {
                  updateMutation.mutate({ communicationPlan })
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionGroup>

      {/* Optional Components */}
      <SectionGroup priority="optional" title="OPTIONALE KOMPONENTEN">
        <Accordion type="multiple" className="space-y-2">
          {/* 9. KPIs & Qualitätssicherung */}
          <AccordionItem id="quality-metrics">
            <AccordionTrigger
              id="quality-metrics"
              icon={<BarChart3 className="text-teal-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.qualityMetrics)} />}
            >
              <span className="text-slate-900 font-medium">KPIs & Qualitätssicherung</span>
            </AccordionTrigger>
            <AccordionContent id="quality-metrics" className="bg-slate-50">
              <KPIEditor
                qualityMetrics={concept.qualityMetrics || null}
                onSave={(qualityMetrics) => {
                  updateMutation.mutate({ qualityMetrics })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 10. Übergaben/Schichtwechsel */}
          <AccordionItem id="handover">
            <AccordionTrigger
              id="handover"
              icon={<RefreshCw className="text-amber-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.handoverProcedures)} />}
            >
              <span className="text-slate-900 font-medium">Übergaben/Schichtwechsel</span>
            </AccordionTrigger>
            <AccordionContent id="handover" className="bg-slate-50">
              <HandoverEditor
                handoverProcedures={concept.handoverProcedures || null}
                onSave={(handoverProcedures) => {
                  updateMutation.mutate({ handoverProcedures })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 11. Anhänge & Dokumente */}
          <AccordionItem id="attachments">
            <AccordionTrigger
              id="attachments"
              icon={<FileText className="text-slate-600" size={18} />}
              badge={
                concept.attachments ? (
                  <CompletionBadge status="complete" label={`${concept.attachments.completionPercentage || 0}%`} />
                ) : (
                  <CompletionBadge status="empty" />
                )
              }
            >
              <span className="text-slate-900 font-medium">Anhänge & Dokumente</span>
            </AccordionTrigger>
            <AccordionContent id="attachments" className="bg-slate-50">
              <AttachmentManager
                attachments={concept.attachments || null}
                onSave={(attachments) => {
                  updateMutation.mutate({ attachments })
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 12. Weitere Komponenten */}
          <AccordionItem id="misc">
            <AccordionTrigger
              id="misc"
              icon={<Shield className="text-slate-600" size={18} />}
              badge={<CompletionBadge status={getCompletionStatus(concept.dataProtection)} />}
            >
              <span className="text-slate-900 font-medium">Datenschutz (DSGVO)</span>
            </AccordionTrigger>
            <AccordionContent id="misc" className="bg-slate-50">
              <div className="p-4">
                {concept.dataProtection ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard
                      title="Datenschutz (DSGVO)"
                      hasData={!!concept.dataProtection}
                      icon={Shield}
                      color="purple"
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <p className="text-sm">Datenschutzinformationen noch nicht definiert</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionGroup>

      {/* Footer Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <p>
              Zuletzt aktualisiert: {new Date(concept.updatedAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <FileText size={16} />
              PDF Export (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Component
function InfoCard({
  title,
  hasData,
  icon: Icon,
  color,
}: {
  title: string
  hasData: boolean
  icon: any
  color: string
}) {
  const colors = {
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200',
  }

  return (
    <div
      className={cn(
        'rounded-lg p-4 border',
        hasData ? colors[color as keyof typeof colors] : 'bg-gray-50 border-gray-200'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={hasData ? '' : 'text-gray-400'} />
        <p className="font-medium text-sm">{title}</p>
      </div>
      <p className="text-xs text-gray-600">
        {hasData ? 'Vorhanden ✓' : 'Nicht definiert'}
      </p>
    </div>
  )
}
