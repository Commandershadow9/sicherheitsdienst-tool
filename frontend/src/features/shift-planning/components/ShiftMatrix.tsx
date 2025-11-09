/**
 * Shift Matrix View
 * Wöchentliche Matrix-Ansicht für Schichtplanung
 *
 * Features:
 * - Drag & Drop für Zuweisungen
 * - Visuelle Konflikte
 * - Smart-Matching Integration
 * - Clearance-Status
 */

import React, { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Shift, ShiftAssignment } from '../types';

interface ShiftMatrixProps {
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
  onEmployeeClick?: (userId: string) => void;
  initialDate?: Date;
}

interface MatrixCell {
  date: Date;
  dayName: string;
  shifts: Shift[];
}

export default function ShiftMatrix({
  shifts,
  onShiftClick,
  onEmployeeClick,
  initialDate = new Date(),
}: ShiftMatrixProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(initialDate, { weekStartsOn: 1 }));

  // Generiere Matrix-Struktur (7 Tage)
  const matrixData = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const matrix: MatrixCell[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayName = format(date, 'EEE', { locale: de });
      const dateStr = format(date, 'yyyy-MM-dd');

      // Filtere Schichten für diesen Tag
      const dayShifts = shifts.filter((shift) => {
        const shiftDate = format(new Date(shift.startTime), 'yyyy-MM-dd');
        return shiftDate === dateStr;
      });

      matrix.push({
        date,
        dayName,
        shifts: dayShifts.sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      });
    }

    return matrix;
  }, [shifts, currentWeek]);

  // Navigation
  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek((prev) => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Status-Indikatoren
  const getShiftStatus = (shift: Shift) => {
    const assigned = shift.assignments?.length || 0;
    const required = shift.requiredEmployees;

    if (assigned === 0) {
      return { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Unbesetzt' };
    } else if (assigned < required) {
      return { icon: AlertCircle, color: 'text-orange-600 bg-orange-50', label: 'Unterbesetzt' };
    } else if (assigned === required) {
      return { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Besetzt' };
    } else {
      return { icon: Users, color: 'text-blue-600 bg-blue-50', label: 'Überbesetzt' };
    }
  };

  // Zeitformat
  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  return (
    <div className="space-y-4">
      {/* Header mit Navigation */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Schichtplanung</h2>
          <p className="text-sm text-gray-600">
            {format(currentWeek, 'd. MMM', { locale: de })} -{' '}
            {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Matrix-Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Wochentag-Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {matrixData.map((cell, idx) => {
            const isToday = format(cell.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={idx}
                className={cn(
                  'px-4 py-3 text-center border-r border-gray-200 last:border-r-0',
                  isToday && 'bg-blue-50'
                )}
              >
                <div className="text-xs font-semibold text-gray-700 uppercase">
                  {cell.dayName}
                </div>
                <div
                  className={cn(
                    'text-sm mt-1',
                    isToday ? 'text-blue-600 font-bold' : 'text-gray-600'
                  )}
                >
                  {format(cell.date, 'd. MMM', { locale: de })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schicht-Zellen */}
        <div className="grid grid-cols-7 min-h-[500px]">
          {matrixData.map((cell, idx) => (
            <div
              key={idx}
              className={cn(
                'border-r border-gray-200 last:border-r-0 p-2 space-y-2 bg-gray-50/30',
                format(cell.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                  'bg-blue-50/50'
              )}
            >
              {/* Schichten für diesen Tag */}
              {cell.shifts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                  Keine Schichten
                </div>
              ) : (
                cell.shifts.map((shift) => {
                  const status = getShiftStatus(shift);
                  const StatusIcon = status.icon;

                  return (
                    <button
                      key={shift.id}
                      onClick={() => onShiftClick?.(shift)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md',
                        'bg-white hover:bg-gray-50',
                        status.color.includes('red') && 'border-red-200',
                        status.color.includes('orange') && 'border-orange-200',
                        status.color.includes('green') && 'border-green-200'
                      )}
                    >
                      {/* Titel */}
                      <div className="font-medium text-sm truncate mb-1">{shift.title}</div>

                      {/* Zeit */}
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <Clock size={12} />
                        <span>
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </span>
                      </div>

                      {/* Status & Besetzung */}
                      <div className="flex items-center justify-between">
                        <div className={cn('flex items-center gap-1 text-xs', status.color)}>
                          <StatusIcon size={12} />
                          <span>
                            {shift.assignments?.length || 0}/{shift.requiredEmployees}
                          </span>
                        </div>

                        {shift.requiredQualifications?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {shift.requiredQualifications.length} Qual.
                          </div>
                        )}
                      </div>

                      {/* Mitarbeiter-Avatare (Preview) */}
                      {shift.assignments && shift.assignments.length > 0 && (
                        <div className="mt-2 flex -space-x-2">
                          {shift.assignments.slice(0, 3).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                              title={`${assignment.user.firstName} ${assignment.user.lastName}`}
                            >
                              {assignment.user.firstName[0]}
                              {assignment.user.lastName[0]}
                            </div>
                          ))}
                          {shift.assignments.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                              +{shift.assignments.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>Unbesetzt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-50 border border-orange-200" />
          <span>Unterbesetzt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          <span>Vollständig besetzt</span>
        </div>
      </div>
    </div>
  );
}
