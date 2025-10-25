import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchAssignmentCandidates, type AssignmentCandidate } from '../api';
import { AlertTriangle, CheckCircle2, User, XCircle, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SmartAssignmentModalProps {
  siteId: string;
  siteName: string;
  open: boolean;
  onClose: () => void;
  onAssign: (userId: string, role: string) => void;
  isLoading?: boolean;
}

export default function SmartAssignmentModal({
  siteId,
  siteName,
  open,
  onClose,
  onAssign,
  isLoading = false,
}: SmartAssignmentModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<AssignmentCandidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch assignment candidates
  const { data: candidatesData, isLoading: loadingCandidates } = useQuery({
    queryKey: ['assignment-candidates', siteId, selectedRole],
    queryFn: () => fetchAssignmentCandidates(siteId, selectedRole || undefined),
    enabled: open,
    staleTime: 30000, // 30 seconds
  });

  const candidates = candidatesData?.candidates || [];

  // Filter candidates by search term
  const filteredCandidates = candidates.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const email = c.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleAssign = () => {
    if (!selectedCandidate) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }

    if (!selectedRole) {
      toast.error('Bitte wählen Sie eine Rolle aus');
      return;
    }

    // Check for missing qualifications and warn
    if (
      selectedCandidate.qualifications.status === 'NONE' &&
      candidatesData?.requiredQualifications.length! > 0
    ) {
      toast.warning(
        `${selectedCandidate.firstName} ${selectedCandidate.lastName} hat keine der erforderlichen Qualifikationen!`
      );
    } else if (selectedCandidate.qualifications.status === 'PARTIAL') {
      toast.warning(
        `${selectedCandidate.firstName} ${selectedCandidate.lastName} fehlen einige Qualifikationen: ${selectedCandidate.qualifications.missing.join(', ')}`
      );
    }

    onAssign(selectedCandidate.userId, selectedRole);
  };

  const getQualificationStatusBadge = (status: 'FULL' | 'PARTIAL' | 'NONE') => {
    const statusConfig = {
      FULL: {
        icon: CheckCircle2,
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Alle Qualifikationen',
      },
      PARTIAL: {
        icon: AlertTriangle,
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Teilweise qualifiziert',
      },
      NONE: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', label: 'Keine Qualifikationen' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getClearanceStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Eingearbeitet' },
      TRAINING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Einarbeitung' },
      NONE: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Keine Einarbeitung' },
    };

    const config = statusConfig[status] || statusConfig.NONE;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Shield size={12} />
        {config.label}
      </span>
    );
  };

  const getScoreBadge = (score: number) => {
    const color =
      score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold`}>
          {score}
        </div>
      </div>
    );
  };

  return (
    <Modal title={`Mitarbeiter zuweisen - ${siteName}`} open={open} onClose={onClose} size="large">
      <div className="space-y-4">
        {/* Role Selection */}
        <FormField label="Rolle *">
          <Select value={selectedRole} onChange={(e: any) => setSelectedRole(e.target.value)}>
            <option value="">Alle Rollen</option>
            <option value="OBJEKTLEITER">Objektleiter</option>
            <option value="SCHICHTLEITER">Schichtleiter</option>
            <option value="MITARBEITER">Mitarbeiter</option>
          </Select>
        </FormField>

        {/* Search */}
        <FormField label="Suche">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Name oder Email suchen..."
              className="pl-10"
            />
          </div>
        </FormField>

        {/* Required Qualifications Info */}
        {candidatesData?.requiredQualifications && candidatesData.requiredQualifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium mb-1">Erforderliche Qualifikationen:</p>
            <div className="flex flex-wrap gap-1">
              {candidatesData.requiredQualifications.map((q, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Candidates List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loadingCandidates && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingCandidates && filteredCandidates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine passenden Kandidaten gefunden</p>
            </div>
          )}

          {!loadingCandidates &&
            filteredCandidates.map((candidate) => (
              <div
                key={candidate.userId}
                onClick={() => setSelectedCandidate(candidate)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-300 hover:shadow-md ${
                  selectedCandidate?.userId === candidate.userId
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Score Badge */}
                  {getScoreBadge(candidate.score)}

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{candidate.role}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{candidate.email}</p>

                    {/* Qualification Status */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getQualificationStatusBadge(candidate.qualifications.status)}
                      {getClearanceStatusBadge(candidate.clearance.status)}
                    </div>

                    {/* Qualification Details */}
                    {candidate.qualifications.has.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Qualifikationen:</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.qualifications.has.map((q, idx) => (
                            <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              ✓ {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Qualifications */}
                    {candidate.qualifications.missing.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Fehlende Qualifikationen:</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.qualifications.missing.map((q, idx) => (
                            <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                              ✗ {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleAssign} disabled={isLoading || !selectedCandidate || !selectedRole}>
            {isLoading ? 'Wird zugewiesen...' : 'Zuweisen'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
