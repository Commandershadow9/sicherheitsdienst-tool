/**
 * useSecurityConceptShiftModelSync
 *
 * Automatische bidirektionale Synchronisation zwischen:
 * - SecurityConcept.shiftModel (Sicherheitskonzept - Das Herzstück)
 * - ShiftRules (Templates für Schichtgenerierung)
 *
 * Flow:
 * 1. ShiftModel existiert, aber keine Rules → Auto-Create Rules
 * 2. ShiftRules ändern sich → Update ShiftModel (REVERSE-SYNC)
 * 3. ShiftModel ändert sich → Update/Sync Rules
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createShiftRule } from '../api/shiftRuleApi';
import { api } from '@/lib/api';
import type { ShiftModel, ShiftDefinition } from '@/types/securityConcept';
import type { CreateShiftRuleInput, ShiftRule } from '../types/shiftRule';

// Map ShiftDefinition weekdays to ShiftRule daysOfWeek
const mapWeekdaysToDaysOfWeek = (weekdays: string[]): number[] => {
  const mapping: Record<string, number> = {
    So: 0,
    Sonntag: 0,
    Mo: 1,
    Montag: 1,
    Di: 2,
    Dienstag: 2,
    Mi: 3,
    Mittwoch: 3,
    Do: 4,
    Donnerstag: 4,
    Fr: 5,
    Freitag: 5,
    Sa: 6,
    Samstag: 6,
  };

  return weekdays
    .map((day) => mapping[day])
    .filter((num) => num !== undefined)
    .sort();
};

// Reverse Map: daysOfWeek to weekdays
const mapDaysOfWeekToWeekdays = (daysOfWeek: number[]): string[] => {
  const mapping: Record<number, string> = {
    0: 'So',
    1: 'Mo',
    2: 'Di',
    3: 'Mi',
    4: 'Do',
    5: 'Fr',
    6: 'Sa',
  };

  return daysOfWeek.map((day) => mapping[day]).filter((day) => day !== undefined);
};

// Convert ShiftModel to ShiftRules (Forward Sync)
const convertShiftModelToRules = (
  shiftModel: ShiftModel,
  siteId: string
): CreateShiftRuleInput[] => {
  const today = new Date().toISOString().split('T')[0];

  return shiftModel.shifts.map((shift: ShiftDefinition, index: number) => ({
    siteId,
    name: shift.name,
    startTime: shift.from,
    endTime: shift.to,
    requiredStaff: shift.requiredStaff,
    requiredQualifications: [],
    pattern: 'WEEKLY' as const,
    daysOfWeek: mapWeekdaysToDaysOfWeek(shift.weekdays),
    specificDates: [],
    validFrom: today,
    priority: 100 + index,
    isActive: true,
    description: `Automatisch synchronisiert aus Sicherheitskonzept (${shiftModel.type})`,
  }));
};

// Convert ShiftRules to ShiftModel (Reverse Sync)
const convertRulesToShiftModel = (
  rules: ShiftRule[],
  currentShiftModel: ShiftModel | null
): ShiftModel => {
  // Filter nur aktive WEEKLY Rules (das sind die aus dem ShiftModel)
  const relevantRules = rules.filter(
    (r) => r.isActive && r.pattern === 'WEEKLY' && r.description?.includes('synchronisiert')
  );

  const shifts: ShiftDefinition[] = relevantRules.map((rule) => ({
    name: rule.name,
    from: rule.startTime,
    to: rule.endTime,
    duration: calculateDuration(rule.startTime, rule.endTime),
    requiredStaff: rule.requiredStaff,
    weekdays: mapDaysOfWeekToWeekdays(rule.daysOfWeek),
  }));

  // Berechne totalHoursPerWeek
  const totalHoursPerWeek = shifts.reduce((sum, shift) => {
    return sum + shift.duration * shift.weekdays.length;
  }, 0);

  // Schätze requiredFulltimeStaff (vereinfacht)
  const requiredFulltimeStaff = Math.ceil(totalHoursPerWeek / 40);

  return {
    type: currentShiftModel?.type || 'CUSTOM',
    shifts,
    totalHoursPerWeek,
    requiredFulltimeStaff,
    notes: currentShiftModel?.notes,
  };
};

// Helper: Calculate duration in hours
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let hours = endHour - startHour;
  let minutes = endMin - startMin;

  if (hours < 0) {
    // Overnight shift
    hours += 24;
  }

  return hours + minutes / 60;
};

interface UseSecurityConceptShiftModelSyncOptions {
  siteId: string;
  shiftModel: ShiftModel | null;
  existingRules: ShiftRule[];
  enabled?: boolean;
  securityConceptId?: string; // For Reverse-Sync
}

export function useSecurityConceptShiftModelSync({
  siteId,
  shiftModel,
  existingRules,
  enabled = true,
  securityConceptId,
}: UseSecurityConceptShiftModelSyncOptions) {
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);
  const lastShiftModelRef = useRef<string | null>(null);
  const lastRulesRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const shiftModelHash = JSON.stringify(shiftModel);
    const rulesHash = JSON.stringify(existingRules);

    // Auto-Create: ShiftModel existiert, aber keine Rules
    const shouldAutoCreate = shiftModel && existingRules.length === 0 && !syncedRef.current;

    // Forward-Sync: ShiftModel hat sich geändert
    const shiftModelChanged =
      lastShiftModelRef.current !== null && lastShiftModelRef.current !== shiftModelHash;

    // Reverse-Sync: ShiftRules haben sich geändert
    const rulesChanged = lastRulesRef.current !== null && lastRulesRef.current !== rulesHash;

    if (shouldAutoCreate) {
      // Initial Auto-Create
      autoCreateRulesFromShiftModel();
      syncedRef.current = true;
      lastShiftModelRef.current = shiftModelHash;
      lastRulesRef.current = rulesHash;
    } else if (shiftModelChanged && !rulesChanged) {
      // Forward-Sync: ShiftModel → Rules
      autoSyncRulesWithShiftModel();
      lastShiftModelRef.current = shiftModelHash;
    } else if (rulesChanged && !shiftModelChanged && existingRules.length > 0) {
      // Reverse-Sync: Rules → ShiftModel
      autoSyncShiftModelWithRules();
      lastRulesRef.current = rulesHash;
    } else {
      // Update references
      lastShiftModelRef.current = shiftModelHash;
      lastRulesRef.current = rulesHash;
    }
  }, [shiftModel, existingRules, enabled, siteId, securityConceptId]);

  const autoCreateRulesFromShiftModel = async () => {
    if (!shiftModel) return;

    try {
      const rulesToCreate = convertShiftModelToRules(shiftModel, siteId);

      let successCount = 0;
      for (const ruleInput of rulesToCreate) {
        await createShiftRule(siteId, ruleInput);
        successCount++;
      }

      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });

      toast.success(
        `✓ ${successCount} Schicht-Regeln automatisch aus Sicherheitskonzept erstellt`,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Auto-Sync Fehler:', error);
      toast.error('Fehler bei automatischer Regel-Erstellung');
    }
  };

  const autoSyncRulesWithShiftModel = async () => {
    if (!shiftModel) return;

    const targetRules = convertShiftModelToRules(shiftModel, siteId);
    const rulesToCreate: CreateShiftRuleInput[] = [];

    for (const targetRule of targetRules) {
      const existing = existingRules.find((r) => r.name === targetRule.name);
      if (!existing) {
        rulesToCreate.push(targetRule);
      }
    }

    if (rulesToCreate.length > 0) {
      try {
        for (const ruleInput of rulesToCreate) {
          await createShiftRule(siteId, ruleInput);
        }

        queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });

        toast.success(`✓ ${rulesToCreate.length} neue Schicht-Regeln synchronisiert`, {
          duration: 4000,
        });
      } catch (error: any) {
        console.error('Forward-Sync Fehler:', error);
        toast.error('Fehler bei Regel-Synchronisation');
      }
    }
  };

  const autoSyncShiftModelWithRules = async () => {
    if (!securityConceptId || existingRules.length === 0) {
      return; // Kein SecurityConcept oder keine Rules
    }

    try {
      const updatedShiftModel = convertRulesToShiftModel(existingRules, shiftModel);

      // Update ShiftModel via Backend API
      await api.patch(`/sites/${siteId}/security-concept/${securityConceptId}/shift-model`, {
        shiftModel: updatedShiftModel,
      });

      // Invalidate SecurityConcept query
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['security-concept', siteId] });

      toast.success('✓ Sicherheitskonzept automatisch mit Schichtplanung synchronisiert', {
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Reverse-Sync Fehler:', error);
      // Silent fail - Reverse-Sync ist optional
    }
  };

  return {
    isSynced: existingRules.length > 0 && shiftModel !== null,
    shiftModel,
    existingRules,
  };
}
