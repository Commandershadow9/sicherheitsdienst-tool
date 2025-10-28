import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Shield, Plus, CheckCircle, Clock, AlertTriangle, FileText, Building2, Route, Briefcase, Phone, Calendar } from 'lucide-react'
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

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Entwurf' },
      IN_REVIEW: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle, label: 'In Prüfung' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Freigegeben' },
      ACTIVE: { color: 'bg-green-600 text-white', icon: CheckCircle, label: 'Aktiv' },
      EXPIRED: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Abgelaufen' },
      ARCHIVED: { color: 'bg-gray-100 text-gray-600', icon: FileText, label: 'Archiviert' },
    }
    const variant = variants[status as keyof typeof variants] || variants.DRAFT
    const Icon = variant.icon

    return (
      <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium', variant.color)}>
        <Icon size={14} />
        {variant.label}
      </span>
    )
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Sicherheitskonzept</h3>
            <p className="text-sm text-gray-600">Version {concept.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(concept.status)}
          {concept.status === 'DRAFT' && (
            <Button
              onClick={() => approveMutation.mutate()}
              loading={approveMutation.isPending}
              size="sm"
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle size={14} />
              Freigeben
            </Button>
          )}
        </div>
      </div>

      {/* Accordion für alle Bereiche */}
      <Accordion type="multiple" className="space-y-3">
        {/* 1. Schichtmodell */}
        <AccordionItem id="shift-model">
          <AccordionTrigger
            id="shift-model"
            icon={<Calendar className="text-blue-600" size={20} />}
            badge={
              concept.shiftModel ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">1. Schichtmodell</span>
          </AccordionTrigger>
          <AccordionContent id="shift-model" className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <ShiftModelEditor
              shiftModel={concept.shiftModel || null}
              onSave={(shiftModel) => {
                updateMutation.mutate({ shiftModel })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 2. Personal & Qualifikationen */}
        <AccordionItem id="staff">
          <AccordionTrigger
            id="staff"
            icon={<Shield className="text-indigo-600" size={20} />}
            badge={
              concept.staffRequirements ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">2. Personal & Qualifikationen</span>
          </AccordionTrigger>
          <AccordionContent id="staff">
            {concept.staffRequirements && (
              <div>
                <h4 className="font-semibold mb-3">Personal & Qualifikationen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Anzahl Mitarbeiter</p>
                    <p className="font-semibold">{concept.staffRequirements.anzahlMA || 'Nicht definiert'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Qualifikationen</p>
                    <div className="flex flex-wrap gap-1">
                      {concept.staffRequirements.qualifikationen?.map((q: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {q}
                        </span>
                      )) || <span className="text-gray-500">Keine</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 3. Risikobeurteilung */}
        <AccordionItem id="risk">
          <AccordionTrigger
            id="risk"
            icon={<AlertTriangle className="text-red-600" size={20} />}
            badge={
              concept.riskAssessment ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">3. Risikobeurteilung (5×5 Matrix)</span>
          </AccordionTrigger>
          <AccordionContent id="risk" className="bg-gradient-to-r from-red-50 to-orange-50">
            <RiskAssessmentEditor
              riskAssessment={concept.riskAssessment || null}
              onSave={(riskAssessment) => {
                updateMutation.mutate({ riskAssessment })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 4. Objekt-/Lagebild */}
        <AccordionItem id="site-situation">
          <AccordionTrigger
            id="site-situation"
            icon={<Building2 className="text-cyan-600" size={20} />}
            badge={
              concept.siteSituation ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">4. Objekt-/Lagebild</span>
          </AccordionTrigger>
          <AccordionContent id="site-situation" className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <SiteSituationEditor
              siteSituation={concept.siteSituation || null}
              onSave={(siteSituation) => {
                updateMutation.mutate({ siteSituation })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 5. Schutzmaßnahmen & Kontrollgänge */}
        <AccordionItem id="protection">
          <AccordionTrigger
            id="protection"
            icon={<Route className="text-purple-600" size={20} />}
            badge={
              concept.protectionMeasures ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">5. Schutzmaßnahmen & Kontrollgänge</span>
          </AccordionTrigger>
          <AccordionContent id="protection" className="bg-gradient-to-r from-purple-50 to-pink-50">
            <ProtectionMeasuresEditor
              protectionMeasures={concept.protectionMeasures || null}
              onSave={(protectionMeasures) => {
                updateMutation.mutate({ protectionMeasures })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 6. Aufgaben- & Postenprofile */}
        <AccordionItem id="tasks">
          <AccordionTrigger
            id="tasks"
            icon={<Briefcase className="text-indigo-600" size={20} />}
            badge={
              concept.taskProfiles ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">6. Aufgaben- & Postenprofile</span>
          </AccordionTrigger>
          <AccordionContent id="tasks" className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <TaskProfilesEditor
              taskProfiles={concept.taskProfiles || null}
              onSave={(taskProfiles) => {
                updateMutation.mutate({ taskProfiles })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 7. Kommunikation & Eskalation */}
        <AccordionItem id="communication">
          <AccordionTrigger
            id="communication"
            icon={<Phone className="text-green-600" size={20} />}
            badge={
              concept.communicationPlan ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">7. Kommunikation & Eskalation</span>
          </AccordionTrigger>
          <AccordionContent id="communication" className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CommunicationPlanEditor
              communicationPlan={concept.communicationPlan || null}
              onSave={(communicationPlan) => {
                updateMutation.mutate({ communicationPlan })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 8. Notfall & Evakuierung */}
        <AccordionItem id="emergency">
          <AccordionTrigger
            id="emergency"
            icon={<AlertTriangle className="text-orange-600" size={20} />}
            badge={
              concept.emergencyPlan ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Definiert</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Nicht definiert</span>
              )
            }
          >
            <span className="text-gray-900">8. Notfall & Evakuierung</span>
          </AccordionTrigger>
          <AccordionContent id="emergency" className="bg-gradient-to-r from-red-50 to-orange-50">
            <EmergencyPlanEditor
              emergencyPlan={concept.emergencyPlan || null}
              onSave={(emergencyPlan) => {
                updateMutation.mutate({ emergencyPlan })
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* 9. Weitere Komponenten */}
        <AccordionItem id="misc">
          <AccordionTrigger
            id="misc"
            icon={<FileText className="text-gray-600" size={20} />}
            badge={
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Optional</span>
            }
          >
            <span className="text-gray-900">9. Weitere Komponenten (DSGVO, etc.)</span>
          </AccordionTrigger>
          <AccordionContent id="misc">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                title="Datenschutz (DSGVO)"
                hasData={!!concept.dataProtection}
                icon={Shield}
                color="purple"
              />
              <InfoCard
                title="Weitere Komponenten"
                hasData={false}
                icon={FileText}
                color="gray"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="gap-2" disabled>
          <FileText size={16} />
          PDF Export (Coming Soon)
        </Button>
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
