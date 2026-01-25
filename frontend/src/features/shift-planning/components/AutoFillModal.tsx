/**
 * Auto-Fill Modal
 * Dialog für automatische Schicht-Besetzung
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Zap, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { autoFillPeriod, type AutoFillResult } from '../api';
import { toast } from 'sonner';

interface AutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  siteId?: string;
}

export default function AutoFillModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  siteId,
}: AutoFillModalProps) {
  const queryClient = useQueryClient();
  const [results, setResults] = useState<AutoFillResult[] | null>(null);
  const [previewMode, setPreviewMode] = useState(true);

  // Auto-Fill Mutation
  const autoFillMutation = useMutation({
    mutationFn: ({ autoAssign }: { autoAssign: boolean }) =>
      autoFillPeriod({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        siteId,
        autoAssign,
      }),
    onSuccess: (data) => {
      setResults(data.data);
      if (!previewMode) {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['shift-conflicts'] });
        toast.success(data.message || 'Auto-Fill abgeschlossen');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Auto-Fill fehlgeschlagen');
    },
  });

  // Vorschau laden
  const handlePreview = () => {
    setPreviewMode(true);
    autoFillMutation.mutate({ autoAssign: false });
  };

  // Bestätigen & Zuweisen
  const handleConfirm = () => {
    setPreviewMode(false);
    autoFillMutation.mutate({ autoAssign: true });
  };

  // Reset
  const handleReset = () => {
    setResults(null);
    setPreviewMode(true);
  };

  // Stats
  const stats = results
    ? {
        total: results.length,
        filled: results.filter((r) => r.status === 'filled').length,
        partial: results.filter((r) => r.status === 'partially_filled').length,
        unfilled: results.filter((r) => r.status === 'unfilled').length,
        alreadyFilled: results.filter((r) => r.status === 'already_filled').length,
      }
    : null;

  // Status-Icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'partially_filled':
        return { icon: AlertCircle, color: 'text-orange-600' };
      case 'unfilled':
        return { icon: X, color: 'text-red-600' };
      case 'already_filled':
        return { icon: CheckCircle, color: 'text-gray-600' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600' };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auto-Fill" size="xl">
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Automatische Schicht-Besetzung</p>
              <p>
                Unterbesetzte Schichten werden automatisch mit den besten verfügbaren Kandidaten
                besetzt.
              </p>
              <p className="mt-2">
                <strong>Zeitraum:</strong> {format(startDate, 'd. MMM', { locale: de })} -{' '}
                {format(endDate, 'd. MMM yyyy', { locale: de })}
              </p>
            </div>
          </div>
        </div>

        {/* Initial State */}
        {!results && !autoFillMutation.isPending && (
          <div className="text-center py-8">
            <Zap size={48} className="mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 mb-4">
              Klicken Sie auf "Vorschau laden" um zu sehen, welche Schichten automatisch besetzt
              werden können.
            </p>
            <Button onClick={handlePreview}>Vorschau laden</Button>
          </div>
        )}

        {/* Loading */}
        {autoFillMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">
              {previewMode ? 'Analysiere Schichten...' : 'Weise Mitarbeiter zu...'}
            </p>
          </div>
        )}

        {/* Results */}
        {results && !autoFillMutation.isPending && stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-600">Gesamt</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.filled}</p>
                <p className="text-xs text-green-600">Vollständig</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.partial}</p>
                <p className="text-xs text-orange-600">Teilweise</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.unfilled}</p>
                <p className="text-xs text-red-600">Unbesetzt</p>
              </div>
            </div>

            {/* Result List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result) => {
                const statusInfo = getStatusIcon(result.status);
                const Icon = statusInfo.icon;

                return (
                  <div
                    key={result.shiftId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={16} className={statusInfo.color} />
                          <span className="font-medium">{result.shiftTitle}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {result.assigned}/{result.required} Mitarbeiter
                          </span>
                          {result.suggestions.length > 0 && (
                            <span className="text-blue-600">
                              {result.suggestions.filter((s) => s.assigned).length} zugewiesen
                            </span>
                          )}
                        </div>
                        {result.errors && result.errors.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            {result.errors.map((err, idx) => (
                              <p key={idx}>• {err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success Message (nach Zuweisung) */}
            {!previewMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-medium text-green-900">
                    Auto-Fill erfolgreich abgeschlossen!
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>

          <div className="flex gap-2">
            {results && previewMode && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Zurücksetzen
                </Button>
                <Button onClick={handleConfirm} disabled={autoFillMutation.isPending}>
                  <Zap size={16} className="mr-1" />
                  Jetzt zuweisen
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
