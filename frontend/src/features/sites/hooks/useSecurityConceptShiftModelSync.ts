/**
 * useSecurityConceptShiftModelSync
 *
 * Automatische bidirektionale Synchronisation zwischen:
 * - SecurityConcept.shiftModel (Sicherheitskonzept - Das Herzstück)
 * - ShiftRules (Templates für Schichtgenerierung)
 *
 * Flow:
 * 1. ShiftModel existiert, aber keine Rules → Auto-Create Rules
 * 2. ShiftRules ändern sich → Update ShiftModel
 * 3. ShiftModel ändert sich → Update/Sync Rules
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createShiftRule } from '../api/shiftRuleApi';
import type { ShiftModel, ShiftDefinition } from '@/types/securityConcept';
import type { CreateShiftRuleInput, ShiftRule } from '../types/shiftRule';

// Map ShiftDefinition weekdays to ShiftRule daysOfWeek
const mapWeekdaysToDaysOfWeek = (weekdays: string[]): number[] => {
  const mapping: Record<string, number> = {
    So: 0, Sonntag: 0,
    Mo: 1, Montag: 1,
    Di: 2, Dienstag: 2,
    Mi: 3, Mittwoch: 3,
    Do: 4, Donnerstag: 4,
    Fr: 5, Freitag: 5,
    Sa: 6, Samstag: 6,
  };

  return weekdays
    .map((day) => mapping[day])
    .filter((num) => num !== undefined)
    .sort();
};

// Convert ShiftModel to ShiftRules
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

interface UseSecurityConceptShiftModelSyncOptions {
  siteId: string;
  shiftModel: ShiftModel | null;
  existingRules: ShiftRule[];
  enabled?: boolean;
}

export function useSecurityConceptShiftModelSync({
  siteId,
  shiftModel,
  existingRules,
  enabled = true,
}: UseSecurityConceptShiftModelSyncOptions) {
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);
  const lastShiftModelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !shiftModel) {
      return;
    }

    const shiftModelHash = JSON.stringify(shiftModel);

    // Auto-Create: ShiftModel existiert, aber keine Rules
    const shouldAutoCreate = existingRules.length === 0 && !syncedRef.current;

    // Auto-Update: ShiftModel hat sich geändert
    const shiftModelChanged =
      lastShiftModelRef.current !== null &&
      lastShiftModelRef.current !== shiftModelHash;

    if (shouldAutoCreate) {
      // Initial Auto-Create
      autoCreateRulesFromShiftModel();
      syncedRef.current = true;
      lastShiftModelRef.current = shiftModelHash;
    } else if (shiftModelChanged) {
      // ShiftModel wurde geändert → Sync Rules
      autoSyncRulesWithShiftModel();
      lastShiftModelRef.current = shiftModelHash;
    } else {
      // Update reference
      lastShiftModelRef.current = shiftModelHash;
    }
  }, [shiftModel, existingRules, enabled, siteId]);

  const autoCreateRulesFromShiftModel = async () => {
    if (!shiftModel) return;

    try {
      const rulesToCreate = convertShiftModelToRules(shiftModel, siteId);

      let successCount = 0;
      for (const ruleInput of rulesToCreate) {
        await createShiftRule(siteId, ruleInput);
        successCount++;
      }

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });

      toast.success(
        `✓ ${successCount} Schicht-Regeln automatisch aus Sicherheitskonzept erstellt`,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Auto-Sync Fehler:', error);
      toast.error('Fehler bei automatischer Regel-Erstellung. Bitte manuell prüfen.');
    }
  };

  const autoSyncRulesWithShiftModel = async () => {
    if (!shiftModel) return;

    // Find rules that need to be updated/created
    const targetRules = convertShiftModelToRules(shiftModel, siteId);
    const rulesToCreate: CreateShiftRuleInput[] = [];

    for (const targetRule of targetRules) {
      const existing = existingRules.find((r) => r.name === targetRule.name);
      if (!existing) {
        rulesToCreate.push(targetRule);
      }
      // TODO: Update existing rules if times/staff changed
    }

    if (rulesToCreate.length > 0) {
      try {
        for (const ruleInput of rulesToCreate) {
          await createShiftRule(siteId, ruleInput);
        }

        queryClient.invalidateQueries({ queryKey: ['shift-rules', siteId] });

        toast.success(
          `✓ ${rulesToCreate.length} neue Schicht-Regeln synchronisiert`,
          { duration: 4000 }
        );
      } catch (error: any) {
        console.error('Auto-Sync Update Fehler:', error);
        toast.error('Fehler bei Regel-Synchronisation');
      }
    }
  };

  return {
    isSynced: existingRules.length > 0 && shiftModel !== null,
    shiftModel,
    existingRules,
  };
}
