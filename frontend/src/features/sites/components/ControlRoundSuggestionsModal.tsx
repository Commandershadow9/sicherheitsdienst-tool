import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { HelpTooltip } from '@/components/ui/tooltip';
import {
  fetchControlRoundSuggestions,
  ControlRoundSuggestionsResult,
  ControlRoundSuggestion
} from '../api';
import {
  Clock,
  MapPin,
  Route,
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlRoundSuggestionsModalProps {
  siteId: string;
  onClose: () => void;
}

export default function ControlRoundSuggestionsModal({
  siteId,
  onClose
}: ControlRoundSuggestionsModalProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ControlRoundSuggestion | null>(null);

  const { data, isLoading } = useQuery<ControlRoundSuggestionsResult>({
    queryKey: ['controlRoundSuggestions', siteId],
    queryFn: () => fetchControlRoundSuggestions(siteId),
  });

  const securityLevelColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-green-100 text-green-800 border-green-300',
  };

  const securityLevelLabels = {
    HIGH: 'Hoch',
    MEDIUM: 'Mittel',
    LOW: 'Niedrig',
  };

  const securityLevelTooltips = {
    HIGH: 'Hohe Sicherheitsstufe: 24/7-Betrieb mit 3-Schicht-System. Empfohlen werden häufige Rundgänge (alle 2-4 Stunden).',
    MEDIUM: 'Mittlere Sicherheitsstufe: 2-Schicht-System. Empfohlen werden regelmäßige Rundgänge (alle 4 Stunden).',
    LOW: 'Niedrige Sicherheitsstufe: Einzelschicht-Betrieb. Tägliche Rundgänge sind ausreichend.',
  };

  return (
    <Modal open={true} onClose={onClose} title="Kontrollgang-Vorschläge" size="xl">
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">Lade Vorschläge...</p>
          </div>
        )}

        {/* Loaded State */}
        {!isLoading && data && (
          <>
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Security Level */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sicherheitsstufe</span>
                  <HelpTooltip content={securityLevelTooltips[data.securityLevel]} />
                </div>
                <div className={cn(
                  'inline-block px-3 py-1 rounded-full text-sm font-semibold border',
                  securityLevelColors[data.securityLevel]
                )}>
                  {securityLevelLabels[data.securityLevel]}
                </div>
              </div>

              {/* Total Control Points */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Kontrollpunkte</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.activeControlPoints}
                </p>
                <p className="text-xs text-gray-500">
                  {data.stats.taggedPoints} mit Tags
                </p>
              </div>

              {/* Untagged Points */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Fehlende Tags</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.untaggedPoints}
                </p>
                {data.stats.untaggedPoints > 0 && (
                  <p className="text-xs text-amber-600">
                    <AlertCircle size={12} className="inline mr-1" />
                    NFC/QR-Tags empfohlen
                  </p>
                )}
              </div>
            </div>

            {/* Suggestions List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Vorgeschlagene Rundgänge ({data.suggestions.length})
              </h3>
              <div className="space-y-3">
                {data.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer transition-all duration-200',
                      selectedSuggestion === suggestion
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    )}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {suggestion.templateName}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {suggestion.frequency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {suggestion.description}
                        </p>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock size={14} />
                            <span>{suggestion.estimatedDuration} Min</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin size={14} />
                            <span>{suggestion.controlPoints.length} Punkte</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Route size={14} />
                            <span>{suggestion.routeSegments.length} Abschnitte</span>
                          </div>
                          {suggestion.requiredTags.needsTag > 0 && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertCircle size={14} />
                              <span>{suggestion.requiredTags.needsTag} ohne Tag</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={20}
                        className={cn(
                          'flex-shrink-0 transition-transform',
                          selectedSuggestion === suggestion ? 'rotate-90 text-blue-600' : 'text-gray-400'
                        )}
                      />
                    </div>

                    {/* Expanded Details */}
                    {selectedSuggestion === suggestion && (
                      <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
                        {/* Optimized Route */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Route size={16} className="text-blue-600" />
                            Optimierte Route
                          </h5>
                          <div className="space-y-2">
                            {suggestion.controlPoints.map((point, idx) => {
                              const isOptimizedOrder = suggestion.optimizedRoute[idx] === point.id;
                              return (
                                <div
                                  key={point.id}
                                  className="flex items-start gap-3 text-sm"
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{point.name}</p>
                                    <p className="text-xs text-gray-500">{point.location}</p>
                                    <div className="flex gap-2 mt-1">
                                      {point.hasNfcTag && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                          NFC
                                        </span>
                                      )}
                                      {point.hasQrCode && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                          QR
                                        </span>
                                      )}
                                      {!point.hasNfcTag && !point.hasQrCode && (
                                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                          Kein Tag
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {suggestion.routeSegments[idx] && (
                                    <div className="text-xs text-gray-500 text-right flex-shrink-0">
                                      <p>{suggestion.routeSegments[idx].distance}m</p>
                                      <p>{Math.ceil(suggestion.routeSegments[idx].duration / 60)} Min</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tag Statistics */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Tag-Status</h5>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">NFC-Tags</p>
                              <p className="text-lg font-bold text-green-600">
                                {suggestion.requiredTags.withNfc}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">QR-Codes</p>
                              <p className="text-lg font-bold text-purple-600">
                                {suggestion.requiredTags.withQr}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Benötigt</p>
                              <p className="text-lg font-bold text-amber-600">
                                {suggestion.requiredTags.needsTag}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {data.suggestions.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Keine Kontrollpunkte vorhanden.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Legen Sie zuerst Kontrollpunkte für dieses Objekt an.
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
