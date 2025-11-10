/**
 * Planning Dashboard
 * Zentrale Übersicht für Schichtplanung mit Konflikten, Warnungen & Quick-Actions
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyzeConflicts } from '../api';
import type { ShiftConflict } from '../api';

interface PlanningDashboardProps {
  siteId?: string;
  weekOffset?: number; // 0 = aktuelle Woche, 1 = nächste Woche, etc.
  onViewConflict?: (conflict: ShiftConflict) => void;
  onAutoFill?: () => void;
}

export default function PlanningDashboard({
  siteId,
  weekOffset = 0,
  onViewConflict,
  onAutoFill,
}: PlanningDashboardProps) {
  // Berechne Zeitraum
  const dateRange = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    return {
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
      label: format(weekStart, 'KW w, yyyy', { locale: de }),
    };
  }, [weekOffset]);

  // Lade Konflikte
  const {
    data: conflictData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['shift-conflicts', dateRange.start, dateRange.end, siteId],
    queryFn: () =>
      analyzeConflicts({
        startDate: dateRange.start,
        endDate: dateRange.end,
        siteId,
      }),
  });

  const conflicts = conflictData?.conflicts || [];
  const stats = conflictData?.stats || {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  // Gruppiere Konflikte nach Typ
  const conflictsByType = useMemo(() => {
    const grouped = new Map<string, ShiftConflict[]>();

    conflicts.forEach((conflict) => {
      const existing = grouped.get(conflict.type) || [];
      grouped.set(conflict.type, [...existing, conflict]);
    });

    return grouped;
  }, [conflicts]);

  // Top 5 kritische Konflikte
  const topConflicts = useMemo(() => {
    return conflicts
      .filter((c) => c.severity === 'critical' || c.severity === 'high')
      .slice(0, 5);
  }, [conflicts]);

  // Konflikt-Icon & Farbe
  const getConflictStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'medium':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'low':
        return { icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  // Konflikt-Typ Label
  const getConflictTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      UNDERSTAFFED: 'Unterbesetzt',
      OVERSTAFFED: 'Überbesetzt',
      UNASSIGNED: 'Unbesetzt',
      NO_CLEARANCE: 'Keine Clearance',
      MISSING_QUALIFICATIONS: 'Fehlende Qualifikationen',
      DOUBLE_BOOKING: 'Doppelbuchung',
      REST_TIME_VIOLATION: 'Ruhezeit-Verstoß',
      WEEKLY_HOURS_EXCEEDED: 'Wochenstunden überschritten',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Schichtplanungs-Zentrale</h2>
          <p className="text-sm text-gray-600 mt-1">{dateRange.label}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Aktualisieren
          </Button>
          {onAutoFill && (
            <Button size="sm" onClick={onAutoFill} className="gap-2">
              <Zap size={16} />
              Auto-Fill
            </Button>
          )}
        </div>
      </div>

      {/* Stats-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gesamt */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Konflikte gesamt</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Kritisch */}
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kritisch</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.critical}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Hoch */}
        <div className="bg-white rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoch</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{stats.high}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Gesund */}
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold mt-1 text-green-600">
                {stats.total === 0 ? 'Optimal' : stats.critical === 0 ? 'Gut' : 'Kritisch'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              {stats.total === 0 ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <TrendingUp size={24} className="text-green-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Konflikte */}
      {topConflicts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dringende Konflikte</h3>
            <span className="text-sm text-gray-600">{topConflicts.length} kritisch/hoch</span>
          </div>

          <div className="space-y-3">
            {topConflicts.map((conflict, idx) => {
              const style = getConflictStyle(conflict.severity);
              const Icon = style.icon;

              return (
                <button
                  key={idx}
                  onClick={() => onViewConflict?.(conflict)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all hover:shadow-md',
                    style.color
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{conflict.shiftTitle}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/50">
                          {getConflictTypeLabel(conflict.type)}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{conflict.description}</p>
                      {conflict.userName && (
                        <p className="text-xs mt-1 opacity-75">Mitarbeiter: {conflict.userName}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Konflikte nach Typ */}
      {conflictsByType.size > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Konflikte nach Typ</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(conflictsByType.entries()).map(([type, typeConflicts]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{getConflictTypeLabel(type)}</span>
                  <span className="text-lg font-bold text-gray-900">{typeConflicts.length}</span>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="text-red-600">
                    {typeConflicts.filter((c) => c.severity === 'critical').length} kritisch
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-orange-600">
                    {typeConflicts.filter((c) => c.severity === 'high').length} hoch
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leer-State */}
      {!isLoading && stats.total === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Keine Konflikte gefunden</h3>
          <p className="text-gray-600">
            Alle Schichten sind optimal besetzt. Keine Verstöße oder Warnungen.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Analysiere Konflikte...</p>
        </div>
      )}
    </div>
  );
}
