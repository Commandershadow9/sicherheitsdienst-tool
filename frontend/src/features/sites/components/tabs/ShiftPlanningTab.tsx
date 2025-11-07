/**
 * ShiftPlanningTab - Verwaltung von Schichtplanungs-Regeln
 *
 * Ermöglicht das Erstellen, Bearbeiten und Löschen von ShiftRules
 * sowie die Generierung von Schichten basierend auf diesen Regeln.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { Calendar, Clock, Plus, Trash2, Pencil, Play, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getShiftRules,
  createShiftRule,
  updateShiftRule,
  deleteShiftRule,
  generateShiftsFromRules,
} from '../../api/shiftRuleApi'
import type {
  ShiftRule,
  CreateShiftRuleInput,
  UpdateShiftRuleInput,
} from '../../types/shiftRule'
import { RULE_PATTERN_LABELS, WEEKDAY_LABELS } from '../../types/shiftRule'
import ShiftRuleForm from '../shift-planning/ShiftRuleForm'
import GenerateShiftsDialog from '../shift-planning/GenerateShiftsDialog'

type ShiftPlanningTabProps = {
  siteId: string
}

export default function ShiftPlanningTab({ siteId }: ShiftPlanningTabProps) {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<ShiftRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // Fetch shift rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['shift-rules', siteId],
    queryFn: () => getShiftRules(siteId),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateShiftRuleInput) => createShiftRule(siteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] })
      setShowCreateModal(false)
      toast.success('Schichtregel erfolgreich erstellt')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Regel')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: UpdateShiftRuleInput }) =>
      updateShiftRule(siteId, ruleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] })
      setEditingRule(null)
      toast.success('Schichtregel erfolgreich aktualisiert')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren der Regel')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteShiftRule(siteId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] })
      setDeletingRuleId(null)
      toast.success('Schichtregel erfolgreich gelöscht')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen der Regel')
    },
  })

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Format weekdays for WEEKLY pattern
  const formatWeekdays = (days: number[]) => {
    if (!days || days.length === 0) return '-'
    return days.map((d) => WEEKDAY_LABELS[d]).join(', ')
  }

  // Render pattern details
  const renderPatternDetails = (rule: ShiftRule) => {
    switch (rule.pattern) {
      case 'DAILY':
        return <span className="text-gray-600">Täglich</span>
      case 'WEEKLY':
        return (
          <span className="text-gray-600">
            {formatWeekdays(rule.daysOfWeek)}
          </span>
        )
      case 'SPECIFIC_DATES':
        return (
          <span className="text-gray-600">
            {rule.specificDates.length} Datum/Daten
          </span>
        )
      case 'DATE_RANGE':
        return <span className="text-gray-600">Zeitraum</span>
      default:
        return null
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Schichtplanung ({rules.length} Regel{rules.length !== 1 ? 'n' : ''})
        </h3>
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
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1" />
            Neue Regel
          </Button>
        </div>
      </div>

      {/* Info Banner wenn keine Regeln */}
      {!isLoading && rules.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-6">
          <Calendar size={48} className="text-blue-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">
            Noch keine Schichtregeln definiert
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Erstellen Sie Regeln für wiederkehrende Schichten (z.B. "Frühschicht Mo-Fr" oder
            "Nachtschicht Wochenende"). Das System generiert dann automatisch die entsprechenden
            Schichten.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1" />
            Erste Regel erstellen
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-lg" />
          ))}
        </div>
      )}

      {/* Rules Table */}
      {!isLoading && rules.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Zeit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Muster
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Gültigkeit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  MA
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Priorität
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    !rule.isActive && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    {rule.description && (
                      <div className="text-sm text-gray-500 mt-1">{rule.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Clock size={14} />
                      {rule.startTime} - {rule.endTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        {RULE_PATTERN_LABELS[rule.pattern]}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {renderPatternDetails(rule)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>ab {formatDate(rule.validFrom)}</div>
                    {rule.validUntil && (
                      <div className="text-gray-500 text-xs">bis {formatDate(rule.validUntil)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rule.requiredStaff}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        rule.priority >= 10
                          ? 'bg-red-100 text-red-800'
                          : rule.priority >= 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {rule.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingRuleId(rule.id)}
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Neue Schichtregel erstellen"
          size="lg"
        >
          <ShiftRuleForm
            siteId={siteId}
            onSubmit={(input) => createMutation.mutate(input)}
            onCancel={() => setShowCreateModal(false)}
            isSubmitting={createMutation.isPending}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingRule && (
        <Modal
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          title="Schichtregel bearbeiten"
          size="lg"
        >
          <ShiftRuleForm
            siteId={siteId}
            initialData={editingRule}
            onSubmit={(input) =>
              updateMutation.mutate({ ruleId: editingRule.id, input })
            }
            onCancel={() => setEditingRule(null)}
            isSubmitting={updateMutation.isPending}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingRuleId && (
        <Modal
          isOpen={!!deletingRuleId}
          onClose={() => setDeletingRuleId(null)}
          title="Schichtregel löschen"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Achtung: Diese Aktion kann nicht rückgängig gemacht werden.</p>
                <p>Die Regel wird permanent gelöscht. Bereits generierte Schichten bleiben erhalten.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingRuleId(null)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingRuleId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Lösche...' : 'Endgültig löschen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Shifts Dialog */}
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
