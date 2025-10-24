import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardData } from '../../../../types/wizard';
import { useCreateSite } from '../../../sites/api';
import { validateWizardStep } from '../../hooks/useWizardValidation';
import {
  CheckCircle, Building2, Shield, Users, MapPin, Calculator, FileText,
  Loader2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface SummaryStepProps {
  data: WizardData;
  onPrevious: () => void;
  onComplete?: () => void;
}

export default function SummaryStep({ data, onPrevious, onComplete }: SummaryStepProps) {
  const navigate = useNavigate();
  const createSiteMutation = useCreateSite();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customer: true,
    object: true,
    security: true,
    staff: false,
    controlPoints: false,
    calculation: true,
  });

  // Validate on mount
  useEffect(() => {
    const validation = validateWizardStep(8, data);
    if (!validation.isValid) {
      setValidationErrors(Object.values(validation.errors));
    }
  }, [data]);

  const toggleSection = (section: string) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  const handleCreate = async () => {
    setError(null);

    try {
      const result = await createSiteMutation.mutateAsync(data);

      // Clear wizard storage on success
      if (onComplete) {
        onComplete();
      }

      // Navigate to new site detail page
      if (result?.data?.id) {
        navigate(`/sites/${result.data.id}`);
      } else {
        navigate('/sites');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Erstellen des Objekts');
    }
  };

  const monthlyTotal = data.calculation?.hourlyRate
    ? ((data.calculation.hourlyRate * (data.securityConcept?.hoursPerWeek || 0) * 4.33) +
        (data.calculation.additionalCosts || 0) -
        (((data.calculation.hourlyRate * (data.securityConcept?.hoursPerWeek || 0) * 4.33) *
          (data.calculation.discount || 0)) /
          100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Zusammenfassung & Abschluss
        </h2>
        <p className="text-gray-600 text-sm">
          Überprüfen Sie alle Angaben und erstellen Sie das neue Objekt
        </p>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('customer')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">1. Kunde</span>
          </div>
          {expandedSections.customer ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.customer && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="pt-4">
              <div className="text-lg font-semibold text-gray-900">{data.customer?.companyName}</div>
              {data.customer?.industry && (
                <div className="text-sm text-gray-600 mt-1">{data.customer.industry}</div>
              )}
              <div className="text-sm text-gray-600 mt-2">
                {data.customer?.city}, {data.customer?.postalCode}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Object */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('object')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">2. Objekt-Grunddaten</span>
          </div>
          {expandedSections.object ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.object && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-2">
              <div className="text-lg font-semibold text-gray-900">{data.siteName}</div>
              <div className="text-sm text-gray-600">{data.buildingType}</div>
              <div className="text-sm text-gray-600">
                {data.address}, {data.postalCode} {data.city}
              </div>
              {data.floorCount && (
                <div className="text-sm text-gray-600">{data.floorCount} Etagen</div>
              )}
              {data.squareMeters && (
                <div className="text-sm text-gray-600">{data.squareMeters} m²</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Security Concept */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('security')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">3. Sicherheitskonzept</span>
          </div>
          {expandedSections.security ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.security && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-2">
              {data.securityConcept?.templateName && (
                <div className="text-sm text-indigo-600 mb-2">
                  ✨ Basierend auf Template: {data.securityConcept.templateName}
                </div>
              )}
              <div className="text-sm text-gray-900">
                <strong>Schichtmodell:</strong> {data.securityConcept?.shiftModel}
              </div>
              <div className="text-sm text-gray-900">
                <strong>Stunden/Woche:</strong> {data.securityConcept?.hoursPerWeek}h
              </div>
              <div className="text-sm text-gray-900">
                <strong>Benötigte Mitarbeiter:</strong> {data.securityConcept?.requiredStaff}
              </div>
              <div className="text-sm text-gray-900 mt-3">
                <strong>Aufgaben:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {data.securityConcept?.tasks.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('staff')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">4. Personal</span>
            <span className="text-sm text-gray-500">
              ({(data.staff?.siteManagerId ? 1 : 0) +
                (data.staff?.shiftLeaderIds?.length || 0) +
                (data.staff?.additionalStaffIds?.length || 0)}{' '}
              zugewiesen)
            </span>
          </div>
          {expandedSections.staff ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.staff && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-2 text-sm text-gray-900">
              {data.staff?.siteManagerId && <div>✓ Objektleiter zugewiesen</div>}
              {data.staff?.shiftLeaderIds && data.staff.shiftLeaderIds.length > 0 && (
                <div>✓ {data.staff.shiftLeaderIds.length} Schichtleiter zugewiesen</div>
              )}
              {data.staff?.additionalStaffIds && data.staff.additionalStaffIds.length > 0 && (
                <div>✓ {data.staff.additionalStaffIds.length} weitere Mitarbeiter zugewiesen</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Points */}
      {data.controlPoints && data.controlPoints.points.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('controlPoints')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">5. Kontrollgänge</span>
              <span className="text-sm text-gray-500">({data.controlPoints.points.length} Punkte)</span>
            </div>
            {expandedSections.controlPoints ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.controlPoints && (
            <div className="px-6 pb-4 border-t border-gray-100">
              <div className="pt-4 space-y-2 text-sm text-gray-900">
                <div>{data.controlPoints.points.length} Kontrollpunkte definiert</div>
                {data.controlPoints.roundIntervalMinutes && data.controlPoints.roundIntervalMinutes > 0 && (
                  <div>Intervall: alle {data.controlPoints.roundIntervalMinutes} Minuten</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('calculation')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">6. Kalkulation</span>
          </div>
          {expandedSections.calculation ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.calculation && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-2">
              <div className="text-sm text-gray-900">
                <strong>Stundensatz:</strong> {data.calculation?.hourlyRate?.toFixed(2)} €
              </div>
              {data.calculation?.additionalCosts && data.calculation.additionalCosts > 0 && (
                <div className="text-sm text-gray-900">
                  <strong>Zusatzkosten:</strong> {data.calculation.additionalCosts.toFixed(2)} €
                </div>
              )}
              {data.calculation?.discount && data.calculation.discount > 0 && (
                <div className="text-sm text-gray-900">
                  <strong>Rabatt:</strong> {data.calculation.discount}%
                </div>
              )}
              <div className="text-lg font-bold text-indigo-600 mt-3">
                Monatlich: {monthlyTotal.toFixed(2)} €
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      {data.documents && data.documents.emergencyContacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-gray-900">7. Notfallkontakte</span>
              <span className="text-sm text-gray-500">
                ({data.documents.emergencyContacts.length} Kontakt
                {data.documents.emergencyContacts.length > 1 ? 'e' : ''})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900 mb-2">Fehlende Pflichtangaben</div>
              <ul className="space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="text-sm text-yellow-700">• {err}</li>
                ))}
              </ul>
              <p className="text-sm text-yellow-700 mt-3">
                Bitte gehen Sie zurück und vervollständigen Sie die Angaben.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-900 mb-1">Fehler beim Erstellen</div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Final Info */}
      {validationErrors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-900 mb-2">Bereit zum Erstellen</div>
              <p className="text-sm text-green-700 mb-3">
                Alle erforderlichen Informationen wurden erfasst. Das Objekt kann nun erstellt werden.
              </p>
              <p className="text-xs text-green-600">
                Nach dem Erstellen können Sie alle Daten in der Objekt-Verwaltung weiter bearbeiten.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          disabled={createSiteMutation.isPending}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          ← Zurück zu Schritt 7
        </button>
        <button
          onClick={handleCreate}
          disabled={createSiteMutation.isPending || validationErrors.length > 0}
          className="px-8 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-lg"
        >
          {createSiteMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Objekt wird erstellt...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Objekt jetzt erstellen
            </>
          )}
        </button>
      </div>
    </div>
  );
}
