/**
 * Shift Detail Modal
 * Zeigt Schicht-Details mit Auto-Fill-Vorschlägen
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  X,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  Zap,
  CheckCircle,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchAssignmentCandidates, assignUserToShift, removeShiftAssignment } from '../../shifts/api';
import type { Shift } from '../../shifts/api';
import { toast } from 'sonner';

interface ShiftDetailModalProps {
  shift: Shift;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftDetailModal({ shift, isOpen, onClose }: ShiftDetailModalProps) {
  const queryClient = useQueryClient();
  const [showAutoFill, setShowAutoFill] = useState(false);

  // Lade Kandidaten
  const { data: candidatesData, isLoading: loadingCandidates } = useQuery({
    queryKey: ['assignment-candidates', shift.id],
    queryFn: () => fetchAssignmentCandidates(shift.id, { limit: 10 }),
    enabled: isOpen && showAutoFill,
  });

  const candidates = candidatesData?.candidates || [];

  // Assign Mutation
  const assignMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => assignUserToShift(shift.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-candidates'] });
      toast.success('Mitarbeiter zugewiesen');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Zuweisung fehlgeschlagen');
    },
  });

  // Remove Mutation
  const removeMutation = useMutation({
    mutationFn: ({ assignmentId }: { assignmentId: string }) => removeShiftAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Mitarbeiter entfernt');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Entfernen fehlgeschlagen');
    },
  });

  // Status
  const assigned = shift.assignments?.length || 0;
  const required = shift.requiredEmployees;
  const isUnderstaffed = assigned < required;
  const isFull = assigned >= required;

  // Score Farbe
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schicht-Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{shift.title}</h2>
          {shift.description && <p className="text-gray-600">{shift.description}</p>}
        </div>

        {/* Basis-Informationen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-500" />
            <span>
              {format(new Date(shift.startTime), 'PPP HH:mm', { locale: de })} -{' '}
              {format(new Date(shift.endTime), 'HH:mm')}
            </span>
          </div>
          {shift.site && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-gray-500" />
              <span>{shift.site.name}</span>
            </div>
          )}
        </div>

        {/* Status-Banner */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            isUnderstaffed
              ? 'bg-orange-50 border-orange-200'
              : 'bg-green-50 border-green-200'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} className={isUnderstaffed ? 'text-orange-600' : 'text-green-600'} />
              <span className="font-semibold">
                {assigned}/{required} Mitarbeiter
              </span>
            </div>
            {isUnderstaffed && (
              <span className="text-sm text-orange-600 font-medium">
                {required - assigned} fehlen
              </span>
            )}
          </div>
        </div>

        {/* Zugewiesene Mitarbeiter */}
        {shift.assignments && shift.assignments.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Zugewiesene Mitarbeiter</h3>
            <div className="space-y-2">
              {shift.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {assignment.user.firstName[0]}
                      {assignment.user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.user.firstName} {assignment.user.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{assignment.user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMutation.mutate({ assignmentId: assignment.id })}
                    disabled={removeMutation.isPending}
                  >
                    <UserMinus size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-Fill Vorschläge */}
        {!isFull && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Vorschläge</h3>
              {!showAutoFill && (
                <Button size="sm" onClick={() => setShowAutoFill(true)}>
                  <Zap size={16} className="mr-1" />
                  Vorschläge laden
                </Button>
              )}
            </div>

            {showAutoFill && (
              <>
                {loadingCandidates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-blue-600" />
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Keine verfügbaren Kandidaten gefunden</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-500 text-white rounded-full flex items-center justify-center font-semibold">
                            {candidate.firstName[0]}
                            {candidate.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded font-medium',
                                  getScoreColor(candidate.score.total)
                                )}
                              >
                                Score: {candidate.score.total}
                              </span>
                              {candidate.hasRequiredQualifications ? (
                                <CheckCircle size={14} className="text-green-600" />
                              ) : (
                                <AlertCircle size={14} className="text-orange-600" />
                              )}
                            </div>
                            {candidate.warnings.length > 0 && (
                              <p className="text-xs text-orange-600 mt-1">
                                {candidate.warnings[0].message}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => assignMutation.mutate({ userId: candidate.id })}
                          disabled={assignMutation.isPending}
                        >
                          <UserPlus size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
