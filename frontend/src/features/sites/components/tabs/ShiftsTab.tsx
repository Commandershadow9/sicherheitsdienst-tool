/**
 * ShiftsTab V2 - Vollständig integrierte Schichtplanung
 *
 * Features:
 * - Shift Rules Verwaltung (Templates)
 * - v2.0 Matrix mit Drag & Drop
 * - Dashboard mit Konflikt-Analyse
 * - Timeline-Ansicht
 * - Manuelle Schicht-Erstellung
 * - Integration mit Sicherheitskonzept
 */

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  LayoutGrid,
  BarChart3,
  GanttChart,
  Zap,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchShifts } from '@/features/shifts/api';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { de } from 'date-fns/locale';

// v2.0 Components
import ShiftMatrixDnD from '@/features/shift-planning/components/ShiftMatrixDnD';
import PlanningDashboard from '@/features/shift-planning/components/PlanningDashboard';
import ShiftTimeline from '@/features/shift-planning/components/ShiftTimeline';
import CreateShiftModal from '@/features/shift-planning/components/CreateShiftModal';
import ShiftDetailModal from '@/features/shift-planning/components/ShiftDetailModal';
import AutoFillModal from '@/features/shift-planning/components/AutoFillModal';

// Alte Components (ShiftRules)
import ShiftRuleForm from '../shift-planning/ShiftRuleForm';
import GenerateShiftsDialog from '../shift-planning/GenerateShiftsDialog';
import TemplateSelector from '../shift-planning/TemplateSelector';
import SecurityConceptShiftModelSync from '../shift-planning/SecurityConceptShiftModelSync';
import {
  getShiftRules,
  createShiftRule,
  updateShiftRule,
  deleteShiftRule,
} from '../../api/shiftRuleApi';
import type { ShiftRule, CreateShiftRuleInput, UpdateShiftRuleInput } from '../../types/shiftRule';
import type { Shift } from '@/features/shifts/api';
import type { ShiftModel } from '@/types/securityConcept';

type Site = {
  id: string;
  name: string;
  securityConcept?: {
    shiftModel?: string;
  };
  securityConcepts?: Array<{
    id: string;
    status: string;
    shiftModel?: any;
  }>;
};

type ShiftsTabProps = {
  site: Site;
  siteId: string;
};

type ViewMode = 'dashboard' | 'matrix' | 'timeline' | 'rules';

export default function ShiftsTab({ site, siteId }: ShiftsTabProps) {
  const queryClient = useQueryClient();

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [weekOffset, setWeekOffset] = useState(0);

  // Modal States
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showEditRule, setShowEditRule] = useState(false);
  const [editingRule, setEditingRule] = useState<ShiftRule | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Berechne aktuelle Woche
  const currentWeek = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    return weekStart;
  }, []);

  const dateRange = useMemo(() => {
    return {
      start: format(currentWeek, 'yyyy-MM-dd'),
      end: format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }, [currentWeek]);

  // Fetch Shifts für dieses Objekt
  const {
    data: allShifts = [],
    isLoading: shiftsLoading,
    refetch: refetchShifts,
  } = useQuery({
    queryKey: ['shifts', dateRange.start, dateRange.end],
    queryFn: () =>
      fetchShifts({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
  });

  // Filter auf diesen Site
  const siteShifts = useMemo(() => {
    return allShifts.filter((shift) => shift.siteId === siteId);
  }, [allShifts, siteId]);

  // Fetch Shift Rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['shift-rules', siteId],
    queryFn: () => getShiftRules(siteId),
  });

  // Prüfe Sicherheitskonzept
  const hasShiftModel = !!(
    site.securityConcept?.shiftModel ||
    (site.securityConcepts && site.securityConcepts.length > 0 && site.securityConcepts[0].shiftModel)
  );

  // Extract ShiftModel from SecurityConcept
  const shiftModel: ShiftModel | null = useMemo(() => {
    if (site.securityConcept?.shiftModel) {
      return site.securityConcept.shiftModel as ShiftModel;
    }
    if (site.securityConcepts && site.securityConcepts.length > 0) {
      return site.securityConcepts[0].shiftModel as ShiftModel;
    }
    return null;
  }, [site]);

  // Create Rule Mutation
  const createRuleMutation = useMutation({
    mutationFn: (input: CreateShiftRuleInput) => createShiftRule(siteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });
      toast.success('Regel erstellt');
      setShowCreateRule(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen');
    },
  });

  // Update Rule Mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShiftRuleInput }) =>
      updateShiftRule(siteId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });
      toast.success('Regel aktualisiert');
      setShowEditRule(false);
      setEditingRule(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Aktualisieren');
    },
  });

  // Delete Rule Mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => deleteShiftRule(siteId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });
      toast.success('Regel gelöscht');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Löschen');
    },
  });

  const handleEditRule = (rule: ShiftRule) => {
    setEditingRule(rule);
    setShowEditRule(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Regel wirklich löschen?')) {
      deleteRuleMutation.mutate(id);
    }
  };

  // Bulk import from SecurityConcept ShiftModel
  const handleBulkImport = async (rulesToImport: CreateShiftRuleInput[]) => {
    try {
      let successCount = 0;
      for (const ruleInput of rulesToImport) {
        await createShiftRule(siteId, { ...ruleInput, siteId });
        successCount++;
      }
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });
      toast.success(`${successCount} Schicht-Regeln aus Sicherheitskonzept importiert`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Fehler beim Importieren');
    }
  };

  const viewTabs = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: BarChart3 },
    { id: 'matrix' as ViewMode, label: 'Matrix', icon: LayoutGrid },
    { id: 'timeline' as ViewMode, label: 'Timeline', icon: GanttChart },
    { id: 'rules' as ViewMode, label: 'Regeln & Templates', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Schichtplanung</h2>
          <p className="text-sm text-gray-600 mt-1">{site.name}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateShift(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Schicht hinzufügen
          </Button>

          {viewMode !== 'rules' && (
            <Button size="sm" onClick={() => setShowAutoFill(true)} className="gap-2">
              <Zap size={16} />
              Auto-Fill
            </Button>
          )}
        </div>
      </div>

      {/* Sicherheitskonzept Info */}
      {!hasShiftModel && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <FileText size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Kein Schichtmodell definiert</p>
            <p className="text-sm text-yellow-700 mt-1">
              Im Sicherheitskonzept wurde noch kein Schichtmodell hinterlegt. Templates können Sie unter
              "Regeln & Templates" verwalten.
            </p>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  viewMode === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {viewMode === 'dashboard' && (
          <PlanningDashboard
            siteId={siteId}
            siteName={site.name}
            weekOffset={weekOffset}
            onViewConflict={(conflict) => {
              // TODO: Highlight in Matrix
              setViewMode('matrix');
            }}
            onAutoFill={() => setShowAutoFill(true)}
          />
        )}

        {viewMode === 'matrix' && (
          <ShiftMatrixDnD
            shifts={allShifts}
            siteId={siteId}
            siteName={site.name}
            initialDate={currentWeek}
            onShiftClick={(shift) => setSelectedShift(shift)}
          />
        )}

        {viewMode === 'timeline' && (
          <ShiftTimeline
            shifts={allShifts}
            siteId={siteId}
            siteName={site.name}
            startDate={currentWeek}
            endDate={endOfWeek(currentWeek, { weekStartsOn: 1 })}
            onShiftClick={(shift) => setSelectedShift(shift)}
          />
        )}

        {viewMode === 'rules' && (
          <div className="space-y-6">
            {/* Rules Manager Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Schicht-Regeln & Templates</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Verwalten Sie wiederverwendbare Schichtmuster für dieses Objekt
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(true)}>
                  Aus Template
                </Button>
                <Button size="sm" onClick={() => setShowCreateRule(true)}>
                  <Plus size={16} className="mr-2" />
                  Neue Regel
                </Button>
              </div>
            </div>

            {/* SecurityConcept ShiftModel Sync */}
            {shiftModel && (
              <SecurityConceptShiftModelSync
                shiftModel={shiftModel}
                existingRules={rules}
                onImport={handleBulkImport}
              />
            )}

            {/* Rules List */}
            {rulesLoading ? (
              <div className="text-center py-12 text-gray-500">Lade Regeln...</div>
            ) : rules.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <Settings size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Regeln vorhanden</h3>
                <p className="text-gray-600 mb-6">
                  Erstellen Sie Regeln für wiederkehrende Schichtmuster
                </p>
                <Button onClick={() => setShowCreateRule(true)}>
                  <Plus size={16} className="mr-2" />
                  Erste Regel erstellen
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        {rule.description && (
                          <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {rule.startTime} - {rule.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {rule.requiredStaff} Mitarbeiter
                          </span>
                          {rule.daysOfWeek && rule.daysOfWeek.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {rule.daysOfWeek.length} Tage/Woche
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Button */}
            {rules.length > 0 && (
              <div className="border-t pt-6">
                <Button
                  size="lg"
                  onClick={() => setShowGenerateDialog(true)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Calendar size={20} />
                  Schichten aus Regeln generieren
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateShiftModal
        isOpen={showCreateShift}
        onClose={() => setShowCreateShift(false)}
        siteId={siteId}
        siteName={site.name}
        initialDate={currentWeek}
      />

      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          isOpen={!!selectedShift}
          onClose={() => setSelectedShift(null)}
        />
      )}

      <AutoFillModal
        isOpen={showAutoFill}
        onClose={() => setShowAutoFill(false)}
        startDate={currentWeek}
        endDate={endOfWeek(currentWeek, { weekStartsOn: 1 })}
        siteId={siteId}
      />

      {/* Rules Modals */}
      <Modal
        isOpen={showCreateRule}
        onClose={() => setShowCreateRule(false)}
        title="Neue Schicht-Regel erstellen"
        maxWidth="3xl"
      >
        <ShiftRuleForm
          onSubmit={(data) => createRuleMutation.mutate(data)}
          onCancel={() => setShowCreateRule(false)}
          isLoading={createRuleMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={showEditRule}
        onClose={() => {
          setShowEditRule(false);
          setEditingRule(null);
        }}
        title="Schicht-Regel bearbeiten"
        maxWidth="3xl"
      >
        {editingRule && (
          <ShiftRuleForm
            initialData={editingRule}
            onSubmit={(data) => updateRuleMutation.mutate({ id: editingRule.id, data })}
            onCancel={() => {
              setShowEditRule(false);
              setEditingRule(null);
            }}
            isLoading={updateRuleMutation.isPending}
          />
        )}
      </Modal>

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(template) => {
          setShowTemplateSelector(false);
          // TODO: Pre-fill create form with template
          setShowCreateRule(true);
        }}
      />

      <GenerateShiftsDialog
        siteId={siteId}
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
      />
    </div>
  );
}
