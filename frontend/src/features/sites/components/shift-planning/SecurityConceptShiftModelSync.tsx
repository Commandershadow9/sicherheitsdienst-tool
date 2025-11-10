/**
 * SecurityConceptShiftModelSync
 *
 * Zeigt das Schichtmodell aus dem Sicherheitskonzept an
 * und ermöglicht Import als ShiftRules
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle2, AlertCircle, Clock, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShiftModel, ShiftDefinition } from '@/types/securityConcept';
import type { CreateShiftRuleInput } from '../../types/shiftRule';

interface SecurityConceptShiftModelSyncProps {
  shiftModel: ShiftModel;
  existingRules: Array<{ name: string }>;
  onImport: (rules: CreateShiftRuleInput[]) => Promise<void>;
}

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

export default function SecurityConceptShiftModelSync({
  shiftModel,
  existingRules,
  onImport,
}: SecurityConceptShiftModelSyncProps) {
  const [importing, setImporting] = useState(false);

  // Convert ShiftModel to ShiftRules
  const convertToRules = (): CreateShiftRuleInput[] => {
    const today = new Date().toISOString().split('T')[0];

    return shiftModel.shifts.map((shift: ShiftDefinition, index: number) => ({
      siteId: '', // Will be set by parent
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
      description: `Importiert aus Sicherheitskonzept (${shiftModel.type})`,
    }));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const rules = convertToRules();
      await onImport(rules);
    } finally {
      setImporting(false);
    }
  };

  // Check if rules already exist
  const checkIfImported = (shift: ShiftDefinition): boolean => {
    return existingRules.some((rule) => rule.name === shift.name);
  };

  const allImported = shiftModel.shifts.every(checkIfImported);
  const someImported = shiftModel.shifts.some(checkIfImported);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <FileText size={24} className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Schichtmodell aus Sicherheitskonzept
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {shiftModel.type === '2-SHIFT' && '2-Schicht-System'}
              {shiftModel.type === '3-SHIFT' && '3-Schicht-System'}
              {shiftModel.type === '24/7' && '24/7 Dauerbewachung'}
              {shiftModel.type === 'CUSTOM' && 'Individuelles Modell'}
              {' '}• {shiftModel.totalHoursPerWeek}h/Woche • {shiftModel.requiredFulltimeStaff} Vollzeit-MA
            </p>
          </div>
        </div>

        {allImported ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">Importiert</span>
          </div>
        ) : someImported ? (
          <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-3 py-1.5 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Teilweise importiert</span>
          </div>
        ) : null}
      </div>

      {/* Shifts Preview */}
      <div className="space-y-3 mb-4">
        {shiftModel.shifts.map((shift: ShiftDefinition, index: number) => {
          const imported = checkIfImported(shift);
          return (
            <div
              key={index}
              className={cn(
                'bg-white rounded-lg p-4 border-2 transition-all',
                imported
                  ? 'border-green-300 bg-green-50'
                  : 'border-blue-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                    {imported && (
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

      {/* Import Button */}
      {!allImported && (
        <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
          <Button
            onClick={handleImport}
            disabled={importing}
            className="gap-2"
          >
            <Download size={16} />
            {importing
              ? 'Importiere...'
              : someImported
              ? 'Fehlende Schichten importieren'
              : 'Alle Schichten als Regeln importieren'}
          </Button>
          <p className="text-sm text-blue-700">
            Erstellt {shiftModel.shifts.filter((s: ShiftDefinition) => !checkIfImported(s)).length}{' '}
            neue Schicht-Regeln basierend auf dem Sicherheitskonzept
          </p>
        </div>
      )}

      {allImported && (
        <div className="flex items-center gap-2 text-green-700 pt-4 border-t border-blue-200">
          <CheckCircle2 size={16} />
          <p className="text-sm font-medium">
            Alle Schichten aus dem Sicherheitskonzept sind als Regeln importiert
          </p>
        </div>
      )}
    </div>
  );
}
