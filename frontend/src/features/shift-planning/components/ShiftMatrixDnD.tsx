/**
 * Shift Matrix mit React-DnD
 * Professionelle Drag & Drop Lösung für langfristige Wartbarkeit
 */

import React, { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Users, Clock, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignUserToShift } from '../../shifts/api';
import { toast } from 'sonner';
import type { Shift, ShiftAssignment } from '../../shifts/api';

// Drag Item Type
const ItemTypes = {
  EMPLOYEE: 'employee',
};

interface EmployeeCardProps {
  assignment: ShiftAssignment;
  shiftId: string;
}

// Draggable Employee Card
function EmployeeCard({ assignment, shiftId }: EmployeeCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.EMPLOYEE,
    item: {
      userId: assignment.user.id,
      userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
      sourceShiftId: shiftId,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={cn(
        'flex items-center gap-2 px-2 py-1 bg-white/80 rounded text-xs cursor-move hover:bg-white transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical size={12} className="text-gray-400 flex-shrink-0" />
      <span className="truncate">
        {assignment.user.firstName} {assignment.user.lastName}
      </span>
    </div>
  );
}

interface ShiftCardProps {
  shift: Shift;
  onShiftClick?: (shift: Shift) => void;
  onDrop: (userId: string, shiftId: string) => void;
}

// Droppable Shift Card
function ShiftCard({ shift, onShiftClick, onDrop }: ShiftCardProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.EMPLOYEE,
    canDrop: (item: any) => {
      // Verhindere Drop auf selbe Schicht
      return item.sourceShiftId !== shift.id;
    },
    drop: (item: any) => {
      onDrop(item.userId, shift.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Status
  const assigned = shift.assignments?.length || 0;
  const required = shift.requiredEmployees;

  const getShiftStatus = () => {
    if (assigned === 0) {
      return { icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Unbesetzt' };
    } else if (assigned < required) {
      return { icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Unterbesetzt' };
    } else if (assigned === required) {
      return { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Besetzt' };
    } else {
      return { icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Überbesetzt' };
    }
  };

  const status = getShiftStatus();
  const StatusIcon = status.icon;
  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  return (
    <div
      ref={drop}
      className={cn(
        'relative w-full p-3 rounded-lg border transition-all',
        'bg-white',
        status.color,
        isOver && canDrop && 'ring-2 ring-blue-500 scale-105 shadow-lg',
        isOver && !canDrop && 'ring-2 ring-gray-400'
      )}
    >
      <button onClick={() => onShiftClick?.(shift)} className="w-full text-left">
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
        <div className="flex items-center justify-between mb-2">
          <div className={cn('flex items-center gap-1 text-xs', status.color)}>
            <StatusIcon size={12} />
            <span>
              {assigned}/{required}
            </span>
          </div>
        </div>
      </button>

      {/* Mitarbeiter-Liste (Draggable) */}
      {shift.assignments && shift.assignments.length > 0 && (
        <div className="mt-2 space-y-1">
          {shift.assignments.slice(0, 2).map((assignment) => (
            <EmployeeCard key={assignment.id} assignment={assignment} shiftId={shift.id} />
          ))}
          {shift.assignments.length > 2 && (
            <div className="text-xs text-gray-600 px-2">
              +{shift.assignments.length - 2} weitere
            </div>
          )}
        </div>
      )}

      {/* Drop-Indikator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-500/10 rounded-lg border-2 border-blue-500 pointer-events-none flex items-center justify-center">
          <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
            Hier ablegen
          </span>
        </div>
      )}

      {isOver && !canDrop && (
        <div className="absolute inset-0 bg-gray-500/10 rounded-lg border-2 border-gray-400 pointer-events-none flex items-center justify-center">
          <span className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium">
            Bereits zugewiesen
          </span>
        </div>
      )}
    </div>
  );
}

interface ShiftMatrixDnDProps {
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
  initialDate?: Date;
}

interface MatrixCell {
  date: Date;
  dayName: string;
  shifts: Shift[];
}

export default function ShiftMatrixDnD({
  shifts,
  onShiftClick,
  initialDate = new Date(),
}: ShiftMatrixDnDProps) {
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(initialDate, { weekStartsOn: 1 }));

  // Assign Mutation
  const assignMutation = useMutation({
    mutationFn: ({ userId, shiftId }: { userId: string; shiftId: string }) =>
      assignUserToShift(shiftId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Mitarbeiter zugewiesen');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Zuweisung fehlgeschlagen');
    },
  });

  // Generiere Matrix-Struktur (7 Tage)
  const matrixData = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const matrix: MatrixCell[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayName = format(date, 'EEE', { locale: de });
      const dateStr = format(date, 'yyyy-MM-dd');

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
  const goToPreviousWeek = () => setCurrentWeek((prev) => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeek((prev) => addDays(prev, 7));
  const goToToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Drop Handler
  const handleDrop = (userId: string, shiftId: string) => {
    assignMutation.mutate({ userId, shiftId });
  };

  return (
    <DndProvider backend={HTML5Backend}>
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

        {/* Drag & Drop Hinweis */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          <p>
            💡 <strong>Tipp:</strong> Ziehen Sie Mitarbeiter aus den Schicht-Karten auf andere
            Schichten, um sie zuzuweisen.
          </p>
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
                {cell.shifts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                    Keine Schichten
                  </div>
                ) : (
                  cell.shifts.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onShiftClick={onShiftClick}
                      onDrop={handleDrop}
                    />
                  ))
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
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-gray-600" />
            <span>Ziehen um zuzuweisen</span>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
