/**
 * Shift Timeline
 * Gantt-Style Timeline für Mitarbeiter-Übersicht
 */

import React, { useMemo } from 'react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Shift } from '../../shifts/api';
import { checkClearanceForSite } from '../utils/clearanceUtils';

interface ShiftTimelineProps {
  shifts: Shift[];
  employees?: Array<{
    id: string;
    name: string;
  }>;
  startDate: Date;
  endDate: Date;
  onShiftClick?: (shift: Shift) => void;
  siteId?: string; // Optional: Filter auf spezifischen Site
  siteName?: string; // Optional: Name für Anzeige
}

interface TimelineRow {
  employeeId: string;
  employeeName: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    objectClearances?: Array<{
      id: string;
      siteId: string;
      status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
      validUntil: string | null;
      trainedAt: string;
    }>;
  };
  shifts: Array<{
    shift: Shift;
    startPercent: number;
    widthPercent: number;
  }>;
}

export default function ShiftTimeline({
  shifts,
  employees = [],
  startDate,
  endDate,
  onShiftClick,
  siteId,
  siteName,
}: ShiftTimelineProps) {
  // Filter Shifts nach siteId (falls angegeben)
  const filteredShifts = useMemo(() => {
    if (!siteId) return shifts;
    return shifts.filter((shift) => shift.siteId === siteId);
  }, [shifts, siteId]);

  // Berechne Timeline-Daten
  const timelineData = useMemo(() => {
    const totalHours = differenceInHours(endDate, startDate);
    const rows: TimelineRow[] = [];

    // Gruppiere Schichten nach Mitarbeiter
    const employeeShifts = new Map<string, Shift[]>();

    filteredShifts.forEach((shift) => {
      shift.assignments?.forEach((assignment) => {
        const userId = assignment.user.id;
        const existing = employeeShifts.get(userId) || [];
        employeeShifts.set(userId, [...existing, shift]);
      });
    });

    // Erstelle Rows
    employeeShifts.forEach((userShifts, userId) => {
      const user = userShifts[0]?.assignments?.find((a) => a.user.id === userId)?.user;
      if (!user) return;

      const timelineShifts = userShifts.map((shift) => {
        const shiftStart = parseISO(shift.startTime);
        const shiftEnd = parseISO(shift.endTime);

        // Berechne Position (% von totalHours)
        const hoursFromStart = differenceInHours(shiftStart, startDate);
        const shiftDuration = differenceInHours(shiftEnd, shiftStart);

        return {
          shift,
          startPercent: (hoursFromStart / totalHours) * 100,
          widthPercent: (shiftDuration / totalHours) * 100,
        };
      });

      rows.push({
        employeeId: userId,
        employeeName: `${user.firstName} ${user.lastName}`,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          objectClearances: user.objectClearances,
        },
        shifts: timelineShifts.sort((a, b) => a.startPercent - b.startPercent),
      });
    });

    // Sortiere nach Namen
    return rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [filteredShifts, startDate, endDate]);

  // Zeit-Marker (alle 4 Stunden)
  const timeMarkers = useMemo(() => {
    const totalHours = differenceInHours(endDate, startDate);
    const markers: Array<{ time: Date; percent: number; label: string }> = [];

    // Erstelle Marker alle 24h
    for (let hour = 0; hour <= totalHours; hour += 24) {
      const time = new Date(startDate.getTime() + hour * 60 * 60 * 1000);
      markers.push({
        time,
        percent: (hour / totalHours) * 100,
        label: format(time, 'EEE d. MMM', { locale: de }),
      });
    }

    return markers;
  }, [startDate, endDate]);

  // Schicht-Status-Farbe
  const getShiftColor = (shift: Shift) => {
    const assigned = shift.assignments?.length || 0;
    const required = shift.requiredEmployees;

    if (assigned < required) {
      return 'bg-orange-500 hover:bg-orange-600';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {siteName ? `Mitarbeiter-Timeline - ${siteName}` : 'Mitarbeiter-Timeline'}
        </h3>
        <div className="text-sm text-gray-600">
          {format(startDate, 'd. MMM', { locale: de })} -{' '}
          {format(endDate, 'd. MMM yyyy', { locale: de })}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Zeit-Header */}
        <div className="relative bg-gray-50 border-b border-gray-200" style={{ height: '40px' }}>
          {timeMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0 h-full border-l border-gray-300"
              style={{ left: `${marker.percent}%` }}
            >
              <span className="absolute top-2 left-2 text-xs font-medium text-gray-700">
                {marker.label}
              </span>
            </div>
          ))}
        </div>

        {/* Mitarbeiter-Rows */}
        <div className="divide-y divide-gray-200">
          {timelineData.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>Keine Schichten im gewählten Zeitraum</p>
            </div>
          ) : (
            timelineData.map((row) => (
              <div key={row.employeeId} className="flex hover:bg-gray-50">
                {/* Mitarbeiter-Name */}
                <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 bg-gray-50">
                  <p className="font-medium text-sm truncate">{row.employeeName}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{row.shifts.length} Schichten</p>
                </div>

                {/* Timeline-Bereich */}
                <div className="flex-1 relative p-2" style={{ minHeight: '60px' }}>
                  {/* Schicht-Blöcke */}
                  {row.shifts.map((item, idx) => {
                    // Clearance-Check für diese Schicht
                    const clearanceCheck = checkClearanceForSite(
                      row.user.objectClearances,
                      item.shift.siteId
                    );
                    const hasClearanceIssue = clearanceCheck.status !== 'CLEARED';

                    return (
                      <button
                        key={idx}
                        onClick={() => onShiftClick?.(item.shift)}
                        className={cn(
                          'absolute top-2 h-10 rounded transition-all text-white text-xs font-medium px-2 flex items-center gap-1 hover:shadow-md',
                          getShiftColor(item.shift),
                          hasClearanceIssue && 'ring-2 ring-orange-400'
                        )}
                        style={{
                          left: `${item.startPercent}%`,
                          width: `${item.widthPercent}%`,
                          minWidth: '60px',
                        }}
                        title={`${item.shift.title} - ${format(
                          parseISO(item.shift.startTime),
                          'HH:mm'
                        )} bis ${format(parseISO(item.shift.endTime), 'HH:mm')}${
                          hasClearanceIssue ? ` | ⚠️ ${clearanceCheck.message}` : ''
                        }`}
                      >
                        <Clock size={12} className="flex-shrink-0" />
                        <span className="truncate">{item.shift.title}</span>
                        {hasClearanceIssue && (
                          <ShieldAlert size={12} className="flex-shrink-0 ml-auto" />
                        )}
                        {!hasClearanceIssue &&
                          (item.shift.assignments?.length || 0) < item.shift.requiredEmployees && (
                            <AlertCircle size={12} className="flex-shrink-0 ml-auto" />
                          )}
                      </button>
                    );
                  })}

                  {/* Zeit-Marker (vertikal) */}
                  {timeMarkers.map((marker, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l border-gray-200"
                      style={{ left: `${marker.percent}%` }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Vollständig besetzt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Unterbesetzt</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-gray-600" />
          <span>Warnung</span>
        </div>
      </div>
    </div>
  );
}
