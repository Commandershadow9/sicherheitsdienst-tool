import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tantml:parameter name="react-query">';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { UserSelect } from '@/components/ui/user-select';
import { bulkAssignUserToShifts } from '@/features/shifts/api';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, CheckCircle } from 'lucide-react';

interface BulkAssignmentModalProps {
  shiftIds: string[];
  shifts: Array<{ id: string; title: string; startTime: string }>;
  onClose: () => void;
}

export default function BulkAssignmentModal({ shiftIds, shifts, onClose }: BulkAssignmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data || res.data;
    },
  });

  // Bulk Assign Mutation
  const bulkAssignMutation = useMutation({
    mutationFn: () => bulkAssignUserToShifts(selectedUserId, shiftIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(data.message || `${data.data?.assigned || shiftIds.length} Schichten zugewiesen`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler bei der Bulk-Zuweisung');
    },
  });

  const handleAssign = () => {
    if (!selectedUserId) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }
    bulkAssignMutation.mutate();
  };

  return (
    <Modal open={true} onClose={onClose} title="Bulk-Zuweisung" size="md">
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {shiftIds.length} Schicht{shiftIds.length !== 1 ? 'en' : ''} ausgewählt
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Weisen Sie einen Mitarbeiter allen ausgewählten Schichten gleichzeitig zu
              </p>
            </div>
          </div>
        </div>

        {/* Selected Shifts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ausgewählte Schichten:
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
            {shifts.map((shift) => (
              <div key={shift.id} className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span className="truncate">{shift.title}</span>
                <span className="text-xs text-gray-400">
                  {new Date(shift.startTime).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mitarbeiter auswählen:
          </label>
          <UserSelect
            users={users}
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder="Mitarbeiter auswählen..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={bulkAssignMutation.isPending}>
            Abbrechen
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || bulkAssignMutation.isPending}
          >
            <Users size={16} className="mr-2" />
            {bulkAssignMutation.isPending
              ? 'Weise zu...'
              : `${shiftIds.length} Schicht${shiftIds.length !== 1 ? 'en' : ''} zuweisen`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
