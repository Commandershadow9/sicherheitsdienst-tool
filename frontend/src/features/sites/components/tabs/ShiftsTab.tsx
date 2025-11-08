/**
 * ShiftsTab - Konsolidierte Schichtplanung & Schicht-Verwaltung
 *
 * Enthält:
 * - Schicht-Regeln verwalten (Templates, CRUD)
 * - Generierte Schichten anzeigen
 * - Kalender & Listen-Ansicht
 * - Direkte Integration mit Sicherheitskonzept
 */

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { Calendar, Clock, UserCheck, CalendarDays, List, Plus, Settings, Play, Lightbulb, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { fetchSiteShifts, generateShiftsForSite, type Shift, type GenerateShiftsPayload } from '../../api'
import {
  getShiftRules,
  createShiftRule,
  deleteShiftRule,
} from '../../api/shiftRuleApi'
import type { ShiftRule, CreateShiftRuleInput } from '../../types/shiftRule'
import ShiftCalendar from '../shifts/ShiftCalendar'
import ShiftRuleForm from '../shift-planning/ShiftRuleForm'
import GenerateShiftsDialog from '../shift-planning/GenerateShiftsDialog'
import TemplateSelector from '../shift-planning/TemplateSelector'
import type { ShiftRuleTemplate } from '../../types/shiftRuleTemplates'
import { RULE_PATTERN_LABELS, WEEKDAY_LABELS } from '../../types/shiftRule'

type Site = {
  id: string
  name: string
  securityConcept?: {
    shiftModel?: string
  }
  securityConcepts?: Array<{
    id: string
    status: string
    shiftModel?: any
  }>
}

type ShiftsTabProps = {
  site: Site
  siteId: string
}

export default function ShiftsTab({ site, siteId }: ShiftsTabProps) {
  const nav = useNavigate()
  const queryClient = useQueryClient()

  // View states
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [showRulesManager, setShowRulesManager] = useState(false)
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // Prüfe ob Sicherheitskonzept mit Schichtmodell vorhanden ist
  const hasShiftModel = !!(
    site.securityConcept?.shiftModel ||
    (site.securityConcepts && site.securityConcepts.length > 0 && site.securityConcepts[0].shiftModel)
  )

  // Fetch shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', siteId],
    queryFn: () => fetchSiteShifts(siteId),
    enabled: true,
  })

  // Fetch shift rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['shift-rules', siteId],
    queryFn: () => getShiftRules(siteId),
  })

  // Generate Shifts Mutation
  const generateShiftsMutation = useMutation({
    mutationFn: (payload: GenerateShiftsPayload) => generateShiftsForSite(siteId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', siteId] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren der Schichten')
    },
  })

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (input: CreateShiftRuleInput) => createShiftRule(siteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] })
      setShowCreateRuleModal(false)
      toast.success('Schichtregel erfolgreich erstellt')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Regel')
    },
  })

  // Handle template selection
  const handleTemplateSelect = async (template: ShiftRuleTemplate) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      let created = 0
      for (const ruleTemplate of template.rules) {
        const input: CreateShiftRuleInput = {
          ...ruleTemplate,
          siteId,
          validFrom: today,
        }
        await createShiftRule(siteId, input)
        created++
      }
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] })
      toast.success(`${created} Regel${created !== 1 ? 'n' : ''} aus Vorlage "${template.name}" erstellt`)
      setShowRulesManager(true) // Öffne Regel-Manager um die erstellten Regeln zu sehen
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Regeln aus Vorlage')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Schichtplanung ({shifts.length} Schichten, {rules.length} Regeln)
        </h3>
        <div className="flex gap-2">
          {/* Rules Manager Toggle */}
          <Button
            size="sm"
            variant={showRulesManager ? 'default' : 'outline'}
            onClick={() => setShowRulesManager(!showRulesManager)}
          >
            <Settings size={16} className="mr-1" />
            {showRulesManager ? 'Schichten anzeigen' : 'Regeln verwalten'}
          </Button>

          {/* View Toggle (nur bei Schichten-Ansicht) */}
          {!showRulesManager && (
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                  view === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <List size={16} />
                Liste
              </button>
              <button
                onClick={() => setView('calendar')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 border-l border-gray-300',
                  view === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <CalendarDays size={16} />
                Kalender
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rules Manager View */}
      {showRulesManager && (
        <div className="space-y-4">
          {/* Rules Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGenerateDialog(true)}
              disabled={rules.length === 0}
            >
              <Play size={16} className="mr-1" />
              Schichten generieren
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTemplateSelector(true)}
            >
              <Lightbulb size={16} className="mr-1" />
              Aus Vorlage
            </Button>
            <Button size="sm" onClick={() => setShowCreateRuleModal(true)}>
              <Plus size={16} className="mr-1" />
              Neue Regel
            </Button>
          </div>

          {/* Info Banner wenn keine Regeln */}
          {rules.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Calendar size={48} className="text-blue-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-2">
                Noch keine Schichtregeln definiert
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Erstellen Sie Regeln für wiederkehrende Schichten (z.B. "Frühschicht Mo-Fr"). Das System generiert dann automatisch die entsprechenden Schichten.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowTemplateSelector(true)}>
                  <Lightbulb size={16} className="mr-1" />
                  Vorlage wählen
                </Button>
                <Button variant="outline" onClick={() => setShowCreateRuleModal(true)}>
                  Manuell erstellen
                </Button>
              </div>
            </div>
          )}

          {/* Rules List */}
          {rules.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  {rules.length} Regel{rules.length !== 1 ? 'n' : ''} definiert. Diese Regeln werden zur automatischen Generierung von Schichten verwendet.
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            rule.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          )}>
                            {rule.isActive ? 'Aktiv' : 'Inaktiv'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Priorität: {rule.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{rule.startTime} - {rule.endTime}</span>
                          </div>
                          <div>
                            <span className="font-medium">{RULE_PATTERN_LABELS[rule.pattern]}</span>
                            {rule.pattern === 'WEEKLY' && (
                              <span className="ml-2 text-xs">
                                ({rule.daysOfWeek.map(d => WEEKDAY_LABELS[d]).join(', ')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCheck size={14} />
                            <span>{rule.requiredStaff} MA</span>
                          </div>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mt-2">{rule.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => nav(`/sites/${siteId}?tab=shifts&rule=${rule.id}`)}
                      >
                        Bearbeiten →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shifts View */}
      {!showRulesManager && (
        <>
          {!hasShiftModel && rules.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-900">
                ⚠️ <strong>Hinweis:</strong> Für diesen Auftrag sind noch keine Schichtregeln definiert. Klicken Sie auf "Regeln verwalten" um Regeln zu erstellen.
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
                {rules.length > 0
                  ? 'Klicken Sie auf "Regeln verwalten" und dann "Schichten generieren".'
                  : 'Erstellen Sie zuerst Schichtregeln unter "Regeln verwalten".'}
              </p>
            </div>
          ) : view === 'calendar' ? (
            <ShiftCalendar
              shifts={shifts}
              onShiftClick={(shift) => nav(`/shifts/${shift.id}`)}
            />
          ) : (
            <div className="space-y-3">
              {shifts.slice(0, 10).map((shift) => {
                const startDate = new Date(shift.startTime)
                const endDate = new Date(shift.endTime)
                const isToday = new Date().toDateString() === startDate.toDateString()

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
                  <Button variant="outline" onClick={() => nav(`/sites/${siteId}/shifts`)}>
                    Alle {shifts.length} Schichten anzeigen →
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateRuleModal && (
        <Modal
          isOpen={showCreateRuleModal}
          onClose={() => setShowCreateRuleModal(false)}
          title="Neue Schichtregel erstellen"
          size="lg"
        >
          <ShiftRuleForm
            siteId={siteId}
            onSubmit={(input) => createRuleMutation.mutate(input)}
            onCancel={() => setShowCreateRuleModal(false)}
            isSubmitting={createRuleMutation.isPending}
          />
        </Modal>
      )}

      {showTemplateSelector && (
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}

      {showGenerateDialog && (
        <GenerateShiftsDialog
          siteId={siteId}
          isOpen={showGenerateDialog}
          onClose={() => setShowGenerateDialog(false)}
        />
      )}
    </div>
  )
}
