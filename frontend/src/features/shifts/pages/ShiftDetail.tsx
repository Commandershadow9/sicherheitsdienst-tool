import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SkeletonDetailPage } from '@/components/ui/skeleton';
import { fetchShift, fetchAssignmentCandidates, assignUserToShift, removeShiftAssignment, type Shift } from '../api';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  AlertCircle,
  Building2,
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Geplant',
  CONFIRMED: 'Bestätigt',
  IN_PROGRESS: 'Läuft',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgesagt',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-200 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ShiftDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);

  // Fetch Shift Data
  const { data: shift, isLoading, isError } = useQuery<Shift>({
    queryKey: ['shift', id],
    queryFn: () => fetchShift(id!),
    enabled: !!id,
  });

  // Fetch Assignment Candidates (nur wenn Modal offen)
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ['assignmentCandidates', id],
    queryFn: () => fetchAssignmentCandidates(id!),
    enabled: !!id && showAssignmentModal,
  });

  // Assign User Mutation
  const assignMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => assignUserToShift(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift', id] });
      toast.success('Mitarbeiter erfolgreich zugewiesen');
      setShowAssignmentModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Zuweisen des Mitarbeiters');
    },
  });

  // Remove Assignment Mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => removeShiftAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift', id] });
      toast.success('Zuweisung erfolgreich entfernt');
      setDeleteAssignmentId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Entfernen der Zuweisung');
    },
  });

  if (isLoading) {
    return <SkeletonDetailPage />;
  }

  if (isError || !shift) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <AlertCircle className="inline mr-2" size={20} />
          Schicht nicht gefunden
        </div>
        <Button className="mt-4" onClick={() => nav('/shifts')}>
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const isToday = new Date().toDateString() === startDate.toDateString();
  const isPast = startDate < new Date();
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60); // hours

  const assignedCount = shift.assignments?.length || 0;
  const requiredCount = shift.requiredEmployees;
  const coveragePercent = requiredCount > 0 ? Math.round((assignedCount / requiredCount) * 100) : 0;
  const isFull = assignedCount >= requiredCount;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/shifts" className="hover:text-gray-700">
            Schichten
          </Link>
          <span>/</span>
          <span className="text-gray-900">{shift.title}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{shift.title}</h1>
            <div className="flex items-center gap-3">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', STATUS_COLORS[shift.status])}>
                {STATUS_LABELS[shift.status]}
              </span>
              {isToday && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">Heute</span>
              )}
              {isPast && shift.status === 'PLANNED' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Überfällig
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => nav(`/sites/${shift.siteId}`)}>
              Zum Objekt →
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time & Location Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Zeit & Ort
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Datum</div>
                <div className="font-medium">
                  {startDate.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Uhrzeit</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock size={16} />
                  {startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-sm text-gray-500 ml-2">({duration}h)</span>
                </div>
              </div>

              {shift.location && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Ort</div>
                  <div className="font-medium flex items-center gap-1">
                    <MapPin size={16} />
                    {shift.location}
                  </div>
                </div>
              )}

              {shift.site && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Objekt</div>
                  <div className="font-medium flex items-center gap-1">
                    <Building2 size={16} />
                    <Link to={`/sites/${shift.siteId}`} className="text-blue-600 hover:underline">
                      {shift.site.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {shift.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Beschreibung</div>
                <div className="text-gray-700">{shift.description}</div>
              </div>
            )}
          </div>

          {/* Requirements Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-purple-600" />
              Anforderungen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Benötigte Mitarbeiter</div>
                <div className="font-medium text-2xl">{shift.requiredEmployees}</div>
              </div>

              {shift.requiredQualifications && shift.requiredQualifications.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-2">Erforderliche Qualifikationen</div>
                  <div className="flex flex-wrap gap-2">
                    {shift.requiredQualifications.map((qual) => (
                      <span
                        key={qual}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {qual}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignments Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Zugewiesene Mitarbeiter ({assignedCount}/{requiredCount})
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAssignmentModal(true)}
                disabled={isFull}
              >
                <UserPlus size={16} className="mr-1" />
                {isFull ? 'Voll besetzt' : 'Mitarbeiter zuweisen'}
              </Button>
            </div>

            {/* Coverage Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Besetzung</span>
                <span className={cn('font-medium', isFull ? 'text-green-600' : 'text-orange-600')}>
                  {coveragePercent}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    coveragePercent >= 100 ? 'bg-green-500' : coveragePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Assignments List */}
            {!shift.assignments || shift.assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Noch keine Mitarbeiter zugewiesen</p>
                <p className="text-sm mt-1">Klicken Sie auf "Mitarbeiter zuweisen", um MA hinzuzufügen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shift.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {assignment.user.firstName[0]}
                        {assignment.user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{assignment.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          assignment.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'STARTED'
                            ? 'bg-blue-100 text-blue-700'
                            : assignment.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {assignment.status === 'ASSIGNED' && 'Zugewiesen'}
                        {assignment.status === 'CONFIRMED' && 'Bestätigt'}
                        {assignment.status === 'STARTED' && 'Gestartet'}
                        {assignment.status === 'COMPLETED' && 'Abgeschlossen'}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteAssignmentId(assignment.id)}
                        disabled={assignment.status === 'COMPLETED'}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Statistiken</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="font-medium">{STATUS_LABELS[shift.status]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dauer</span>
                <span className="font-medium">{duration}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Besetzung</span>
                <span className={cn('font-medium', isFull ? 'text-green-600' : 'text-orange-600')}>
                  {assignedCount}/{requiredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Abdeckung</span>
                <span className={cn('font-medium', coveragePercent >= 100 ? 'text-green-600' : 'text-red-600')}>
                  {coveragePercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Aktionen</h3>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setShowAssignmentModal(true)}
                disabled={isFull}
              >
                <UserPlus size={16} className="mr-2" />
                Mitarbeiter zuweisen
              </Button>
              <Button variant="outline" className="w-full" onClick={() => nav(`/sites/${shift.siteId}`)}>
                <Building2 size={16} className="mr-2" />
                Zum Objekt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <Modal open={true} onClose={() => setShowAssignmentModal(false)} title="Mitarbeiter zuweisen" size="lg">
          <div className="space-y-4">
            {candidatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !candidatesData || candidatesData.candidates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Keine verfügbaren Kandidaten gefunden</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {candidatesData.candidates.slice(0, 10).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            {candidate.firstName} {candidate.lastName}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded',
                              candidate.score.color === 'green' && 'bg-green-100 text-green-700',
                              candidate.score.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
                              candidate.score.color === 'orange' && 'bg-orange-100 text-orange-700',
                              candidate.score.color === 'red' && 'bg-red-100 text-red-700'
                            )}
                          >
                            Score: {Math.round(candidate.score.total)}
                          </span>
                          <span className="text-xs text-gray-500">{candidate.score.recommendation}</span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span>Auslastung: {candidate.metrics.utilizationPercent}%</span>
                            {candidate.siteAccessStatus === 'CLEARED' && (
                              <CheckCircle size={14} className="text-green-500" />
                            )}
                            {candidate.siteAccessStatus === 'NOT_CLEARED' && (
                              <AlertCircle size={14} className="text-yellow-500" />
                            )}
                          </div>
                          {candidate.missingQualifications.length > 0 && (
                            <div className="text-xs text-orange-600">
                              Fehlende Qualifikationen: {candidate.missingQualifications.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => assignMutation.mutate({ userId: candidate.id })}
                        disabled={assignMutation.isPending}
                      >
                        Zuweisen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Assignment Confirmation */}
      {deleteAssignmentId && (
        <Modal
          open={true}
          onClose={() => setDeleteAssignmentId(null)}
          title="Zuweisung entfernen"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Möchten Sie diese Zuweisung wirklich entfernen?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteAssignmentId(null)}>
                Abbrechen
              </Button>
              <Button
                variant="outline"
                onClick={() => removeAssignmentMutation.mutate(deleteAssignmentId)}
                disabled={removeAssignmentMutation.isPending}
              >
                {removeAssignmentMutation.isPending ? 'Entferne...' : 'Entfernen'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
