/**
 * Site Wage Override Component
 * Used in Site Management (Objektverwaltung)
 * Allows setting site-specific wage override (highest priority)
 */

import { AlertTriangle, DollarSign, Info } from 'lucide-react'
import { formatEuro } from '@/lib'

interface SiteWageOverrideProps {
  siteWageOverride?: number
  onChange: (value: number | null) => void
  readOnly?: boolean
  className?: string
}

export function SiteWageOverride({
  siteWageOverride,
  onChange,
  readOnly = false,
  className = '',
}: SiteWageOverrideProps) {
  const handleChange = (value: string) => {
    const numValue = value ? parseFloat(value) : null
    onChange(numValue)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign size={16} className="inline mr-1" />
          Objekt-spezifischer Stundenlohn (optional)
        </label>

        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.50"
            min="0"
            value={siteWageOverride || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="z.B. 18.00"
            disabled={readOnly}
            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <span className="text-gray-600">€/h</span>
        </div>

        {siteWageOverride && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  Höchste Priorität aktiviert
                </p>
                <p className="text-sm text-orange-800 mt-1">
                  Dieser Objekt-spezifische Lohn von <strong>{formatEuro(siteWageOverride)}/h</strong>
                  überschreibt ALLE anderen Lohn-Einstellungen (Tarifvertrag, MA-Lohn, Tätigkeits-Lohn).
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  Alle Mitarbeiter in diesem Objekt erhalten diesen Stundenlohn, unabhängig von
                  ihren individuellen Lohn-Einstellungen.
                </p>
              </div>
            </div>
          </div>
        )}

        {!siteWageOverride && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Keine Objekt-Überschreibung
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Es wird der individuelle Lohn des Mitarbeiters verwendet:
                </p>
                <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
                  <li>Tätigkeits-spezifischer Lohn (falls konfiguriert)</li>
                  <li>MA-Basislohn + Tätigkeitszuschlag (falls konfiguriert)</li>
                  <li>BSDW Tarifvertrag + Tätigkeitszuschlag (Standard)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Use Case Examples */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          💡 Anwendungsbeispiele
        </h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>
              <strong>Hochpreisiges Objekt:</strong> Objekt zahlt 20€/h, auch wenn MA nur 15€
              verdient
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>
              <strong>Einheitlicher Lohn:</strong> Alle Mitarbeiter im Objekt erhalten den
              gleichen Lohn
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>
              <strong>Kundenwunsch:</strong> Kunde zahlt +1€ mehr als üblich für dieses Objekt
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
