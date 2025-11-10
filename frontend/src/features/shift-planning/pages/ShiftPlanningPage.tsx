/**
 * Shift Planning Page
 * Hauptseite für Schichtplanung v2.0 mit Tab-Navigation
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { LayoutGrid, BarChart3, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchShifts } from '../../shifts/api';
import ShiftMatrix from '../components/ShiftMatrix';
import ShiftTimeline from '../components/ShiftTimeline';
import PlanningDashboard from '../components/PlanningDashboard';
import type { Shift } from '../../shifts/api';

type ViewMode = 'dashboard' | 'matrix' | 'timeline';

export default function ShiftPlanningPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = aktuelle Woche

  // Berechne Datumbereich
  const dateRange = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    return {
      start: weekStart,
      end: weekEnd,
      startStr: format(weekStart, 'yyyy-MM-dd'),
      endStr: format(weekEnd, 'yyyy-MM-dd'),
    };
  }, [weekOffset]);

  // Lade Schichten
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', dateRange.startStr, dateRange.endStr],
    queryFn: async () => {
      const result = await fetchShifts({
        startDate: dateRange.startStr,
        endDate: dateRange.endStr,
      });
      return Array.isArray(result) ? result : [];
    },
  });

  // Navigation
  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);
  const goToToday = () => setWeekOffset(0);

  // Tab-Items
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutGrid },
    { id: 'matrix' as const, label: 'Matrix', icon: Calendar },
    { id: 'timeline' as const, label: 'Timeline', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schichtplanung</h1>
          <p className="text-gray-600 mt-1">
            Intelligente Planung & Konflikt-Management
          </p>
        </div>

        {/* Wochen-Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">
            {format(dateRange.start, 'd. MMM', { locale: de })} -{' '}
            {format(dateRange.end, 'd. MMM yyyy', { locale: de })}
          </span>
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

      {/* Tab-Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                  isActive
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
      <div className="min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Lade Schichtdaten...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {viewMode === 'dashboard' && (
              <PlanningDashboard
                weekOffset={weekOffset}
                onViewConflict={(conflict) => {
                  console.log('View conflict:', conflict);
                  // TODO: Modal öffnen
                }}
                onAutoFill={() => {
                  console.log('Auto-Fill triggered');
                  // TODO: Auto-Fill Dialog öffnen
                }}
              />
            )}

            {/* Matrix */}
            {viewMode === 'matrix' && (
              <ShiftMatrix
                shifts={shifts}
                initialDate={dateRange.start}
                onShiftClick={(shift) => {
                  console.log('Shift clicked:', shift);
                  // TODO: Shift-Detail Modal öffnen
                }}
                onEmployeeClick={(userId) => {
                  console.log('Employee clicked:', userId);
                  // TODO: Employee-Detail Modal öffnen
                }}
              />
            )}

            {/* Timeline */}
            {viewMode === 'timeline' && (
              <ShiftTimeline
                shifts={shifts}
                startDate={dateRange.start}
                endDate={dateRange.end}
                onShiftClick={(shift) => {
                  console.log('Shift clicked:', shift);
                  // TODO: Shift-Detail Modal öffnen
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
