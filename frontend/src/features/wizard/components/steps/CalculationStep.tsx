import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { Calculator, DollarSign, TrendingUp, FileText, Percent, Clock, Users } from 'lucide-react';

interface CalculationStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function CalculationStep({ data, onUpdate, onNext, onPrevious }: CalculationStepProps) {
  const [hourlyRate, setHourlyRate] = useState<number>(data.calculation?.hourlyRate || 0);
  const [additionalCosts, setAdditionalCosts] = useState<number>(data.calculation?.additionalCosts || 0);
  const [discount, setDiscount] = useState<number>(data.calculation?.discount || 0);
  const [notes, setNotes] = useState<string>(data.calculation?.notes || '');

  const hoursPerWeek = data.securityConcept?.hoursPerWeek || 0;
  const requiredStaff = data.securityConcept?.requiredStaff || 1;

  // Berechnungen
  const hoursPerMonth = (hoursPerWeek * 4.33).toFixed(2); // Durchschnittliche Wochen pro Monat
  const baseMonthly = hourlyRate * parseFloat(hoursPerMonth);
  const discountAmount = (baseMonthly * discount) / 100;
  const totalMonthly = baseMonthly + additionalCosts - discountAmount;
  const totalYearly = totalMonthly * 12;

  const handleNext = () => {
    onUpdate({
      calculation: {
        hourlyRate,
        additionalCosts,
        discount,
        notes,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-600" />
          Kalkulation & Preisberechnung
        </h2>
        <p className="text-gray-600 text-sm">
          Definieren Sie die Preisgestaltung für dieses Objekt
        </p>
      </div>

      {/* Summary Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
        <div className="text-sm font-medium text-indigo-900 mb-4">Leistungsübersicht</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              Stunden
            </div>
            <div className="text-2xl font-bold text-gray-900">{hoursPerWeek}h</div>
            <div className="text-xs text-gray-500 mt-1">pro Woche</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              Stunden
            </div>
            <div className="text-2xl font-bold text-gray-900">{hoursPerMonth}h</div>
            <div className="text-xs text-gray-500 mt-1">pro Monat (∅)</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              Mitarbeiter
            </div>
            <div className="text-2xl font-bold text-gray-900">{requiredStaff}</div>
            <div className="text-xs text-gray-500 mt-1">benötigt</div>
          </div>
        </div>
      </div>

      {/* Price Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="text-sm font-medium text-gray-700 mb-3">Preisgestaltung</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Stundensatz (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. 25.00"
            />
          </div>

          {/* Additional Costs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Zusatzkosten/Monat (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={additionalCosts}
              onChange={(e) => setAdditionalCosts(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. Material, Fahrtkosten"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Percent className="w-4 h-4" />
              Rabatt (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. 10 für 10%"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Interne Notizen (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="z.B. Sonderkonditionen, Vertragslaufzeit, etc."
          />
        </div>
      </div>

      {/* Calculation Summary */}
      {hourlyRate > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <div className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            Kalkulationsübersicht
          </div>

          <div className="space-y-3">
            {/* Base Calculation */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Basis (Stundensatz × Stunden/Monat)</span>
                <span className="text-sm text-gray-900">
                  {hourlyRate.toFixed(2)} € × {hoursPerMonth} h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Monatlicher Grundpreis</span>
                <span className="font-bold text-lg text-gray-900">{baseMonthly.toFixed(2)} €</span>
              </div>
            </div>

            {/* Additional Costs */}
            {additionalCosts > 0 && (
              <div className="flex justify-between items-center px-4">
                <span className="text-sm text-gray-600">+ Zusatzkosten</span>
                <span className="text-sm font-medium text-green-600">+ {additionalCosts.toFixed(2)} €</span>
              </div>
            )}

            {/* Discount */}
            {discount > 0 && (
              <div className="flex justify-between items-center px-4">
                <span className="text-sm text-gray-600">- Rabatt ({discount}%)</span>
                <span className="text-sm font-medium text-red-600">- {discountAmount.toFixed(2)} €</span>
              </div>
            )}

            {/* Monthly Total */}
            <div className="bg-indigo-600 text-white rounded-lg p-4 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Gesamt pro Monat</span>
                <span className="font-bold text-2xl">{totalMonthly.toFixed(2)} €</span>
              </div>
            </div>

            {/* Yearly Total */}
            <div className="bg-white rounded-lg p-4 border-2 border-indigo-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Gesamt pro Jahr</span>
                <span className="font-bold text-xl text-indigo-600">{totalYearly.toFixed(2)} €</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                (12 Monate × {totalMonthly.toFixed(2)} €)
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Hinweis:</strong> Dies ist eine vorläufige Kalkulation. Die finale Preisgestaltung
                kann im Angebot noch angepasst werden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning if no price set */}
      {hourlyRate === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900 mb-1">Kein Stundensatz definiert</div>
              <p className="text-sm text-yellow-700">
                Bitte geben Sie einen Stundensatz ein, um die Kalkulation durchzuführen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          ← Zurück zu Schritt 5
        </button>
        <button
          onClick={handleNext}
          disabled={hourlyRate === 0}
          className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Weiter zu Schritt 7
          <span className="text-sm opacity-75">→</span>
        </button>
      </div>
    </div>
  );
}
