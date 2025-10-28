import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Users, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ShiftOverviewCardProps {
  siteId: string;
  onShowAll?: () => void;
}

interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  requiredEmployees: number;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function ShiftOverviewCard({ siteId, onShowAll }: ShiftOverviewCardProps) {
  // Fetch shifts for next 7 days
  const startDate = startOfDay(new Date()).toISOString();
  const endDate = endOfDay(addDays(new Date(), 6)).toISOString();

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts', siteId, 'upcoming'],
    queryFn: async () => {
      const res = await api.get(`/shifts`, {
        params: {
          siteId,
          startDate,
          endDate,
          limit: 20,
        },
      });
      return res.data.data || res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const shifts: Shift[] = shiftsData?.shifts || [];

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = format(parseISO(shift.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Get next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    return format(date, 'EEE, dd.MM', { locale: de });
  };

  const getShiftStatusColor = (shift: Shift) => {
    const assignedCount = shift.assignments?.length || 0;
    const required = shift.requiredEmployees;

    if (assignedCount === 0) return 'bg-red-100 border-red-200 text-red-800';
    if (assignedCount < required) return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    return 'bg-green-100 border-green-200 text-green-800';
  };

  const getStatusBadge = (shift: Shift) => {
    const assignedCount = shift.assignments?.length || 0;
    const required = shift.requiredEmployees;

    if (assignedCount === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle size={12} />
          Unbesetzt
        </span>
      );
    }

    if (assignedCount < required) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Users size={12} />
          {assignedCount}/{required}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Users size={12} />
        Besetzt
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Schichten (nächste 7 Tage)</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const totalShifts = shifts.length;
  const unassignedShifts = shifts.filter((s) => (s.assignments?.length || 0) === 0).length;
  const partiallyAssigned = shifts.filter((s) => {
    const assigned = s.assignments?.length || 0;
    return assigned > 0 && assigned < s.requiredEmployees;
  }).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Schichten (nächste 7 Tage)</h3>
        </div>
        {onShowAll && (
          <Button variant="ghost" size="sm" onClick={onShowAll}>
            Alle anzeigen
            <ChevronRight size={16} className="ml-1" />
          </Button>
        )}
      </div>

      {/* Stats */}
      {totalShifts > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{totalShifts}</div>
            <div className="text-xs text-gray-600">Gesamt</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">{unassignedShifts}</div>
            <div className="text-xs text-red-700">Unbesetzt</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">{partiallyAssigned}</div>
            <div className="text-xs text-yellow-700">Teilweise</div>
          </div>
        </div>
      )}

      {/* Shifts by Day */}
      <div className="space-y-3">
        {next7Days.map((dateStr) => {
          const dayShifts = shiftsByDate[dateStr] || [];

          if (dayShifts.length === 0) {
            return (
              <div key={dateStr} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">{getDateLabel(dateStr)}</div>
                  <span className="text-xs text-gray-500">Keine Schichten</span>
                </div>
              </div>
            );
          }

          return (
            <div key={dateStr} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{getDateLabel(dateStr)}</div>
                  <span className="text-xs text-gray-600">{dayShifts.length} Schicht{dayShifts.length !== 1 ? 'en' : ''}</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={cn(
                      'p-3 hover:bg-gray-50 transition-colors cursor-pointer',
                      getShiftStatusColor(shift).replace('bg-', 'hover:bg-')
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={14} className="text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            {format(parseISO(shift.startTime), 'HH:mm')} - {format(parseISO(shift.endTime), 'HH:mm')}
                          </span>
                        </div>

                        {/* Assigned Users */}
                        {shift.assignments && shift.assignments.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {shift.assignments.map((assignment) => (
                              <div key={assignment.id} className="flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                  {assignment.user.firstName[0]}
                                  {assignment.user.lastName[0]}
                                </div>
                                <span className="text-gray-700">
                                  {assignment.user.firstName} {assignment.user.lastName}
                                </span>
                              </div>
                            ))}

                            {/* Show missing count */}
                            {shift.assignments.length < shift.requiredEmployees && (
                              <div className="text-xs text-gray-500 ml-8">
                                + {shift.requiredEmployees - shift.assignments.length} weitere benötigt
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-gray-500 ml-5">
                            {shift.requiredEmployees} Mitarbeiter benötigt
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">{getStatusBadge(shift)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No shifts message */}
      {totalShifts === 0 && (
        <div className="text-center py-8">
          <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-2">Keine Schichten in den nächsten 7 Tagen</p>
          <p className="text-sm text-gray-500">
            Erstellen Sie Schichten über "Schichten generieren"
          </p>
        </div>
      )}
    </div>
  );
}
