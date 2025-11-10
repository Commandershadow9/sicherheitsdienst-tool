/**
 * SecurityConceptShiftModelSync (Info-Only)
 *
 * Zeigt das Schichtmodell aus dem Sicherheitskonzept an.
 * KEIN manueller Import mehr - synchronisiert automatisch via Hook.
 */

import { FileText, CheckCircle2, Clock, Users, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShiftModel, ShiftDefinition } from '@/types/securityConcept';

interface SecurityConceptShiftModelSyncProps {
  shiftModel: ShiftModel;
  existingRules: Array<{ name: string }>;
}

// Check if rule exists for this shift
const checkIfSynced = (shift: ShiftDefinition, rules: Array<{ name: string }>): boolean => {
  return rules.some((rule) => rule.name === shift.name);
};

export default function SecurityConceptShiftModelSync({
  shiftModel,
  existingRules,
}: SecurityConceptShiftModelSyncProps) {
  const allSynced = shiftModel.shifts.every((s: ShiftDefinition) => checkIfSynced(s, existingRules));

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-blue-900">
                Schichtmodell aus Sicherheitskonzept
              </h3>
              <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <Zap size={14} />
                <span className="text-xs font-medium">Auto-Sync aktiv</span>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {shiftModel.type === '2-SHIFT' && '2-Schicht-System'}
              {shiftModel.type === '3-SHIFT' && '3-Schicht-System'}
              {shiftModel.type === '24/7' && '24/7 Dauerbewachung'}
              {shiftModel.type === 'CUSTOM' && 'Individuelles Modell'}
              {' '}• {shiftModel.totalHoursPerWeek}h/Woche • {shiftModel.requiredFulltimeStaff} Vollzeit-MA
            </p>
          </div>
        </div>

        {allSynced && (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">Synchronisiert</span>
          </div>
        )}
      </div>

      {/* Shifts Preview */}
      <div className="space-y-3 mb-4">
        {shiftModel.shifts.map((shift: ShiftDefinition, index: number) => {
          const synced = checkIfSynced(shift, existingRules);
          return (
            <div
              key={index}
              className={cn(
                'bg-white rounded-lg p-4 border-2 transition-all',
                synced
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-blue-200 bg-blue-50/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                    {synced && (
                      <CheckCircle2 size={16} className="text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {shift.from} - {shift.to} ({shift.duration}h)
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {shift.requiredStaff} MA
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {shift.weekdays.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {shiftModel.notes && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900">
            <strong>Hinweise:</strong> {shiftModel.notes}
          </p>
        </div>
      )}

      {/* Auto-Sync Info */}
      <div className="flex items-start gap-3 pt-4 border-t border-blue-200">
        <Zap size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">
            Automatische Synchronisation aktiv
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Schicht-Regeln werden automatisch aus dem Sicherheitskonzept synchronisiert.
            Änderungen im Sicherheitskonzept werden automatisch übernommen.
          </p>
        </div>
      </div>
    </div>
  );
}
