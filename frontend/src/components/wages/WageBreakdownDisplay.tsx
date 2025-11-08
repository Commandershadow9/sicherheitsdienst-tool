/**
 * Wage Breakdown Display Component
 * Shows detailed wage calculation breakdown
 * Used in reporting and shift planning
 */

import { TrendingUp, Info, DollarSign, Activity, Building2 } from 'lucide-react'
import {
  formatEuro,
  getWageBreakdown,
  type WageGroup,
  type ActivityType,
  type WageOverrides,
} from '@/lib'

interface WageBreakdownDisplayProps {
  wageGroup: WageGroup
  activityType?: ActivityType
  overrides?: WageOverrides
  hoursWorked?: number
  showDetails?: boolean
  className?: string
}

export function WageBreakdownDisplay({
  wageGroup,
  activityType,
  overrides,
  hoursWorked,
  showDetails = true,
  className = '',
}: WageBreakdownDisplayProps) {
  const breakdown = getWageBreakdown(wageGroup, activityType, overrides)

  const totalWage = hoursWorked ? breakdown.effectiveWage * hoursWorked : null

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign size={20} className="text-green-600" />
          Lohn-Berechnung
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatEuro(breakdown.effectiveWage)}/h
          </div>
          {totalWage !== null && (
            <div className="text-sm text-gray-600">
              {hoursWorked}h = <strong>{formatEuro(totalWage)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Source Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            breakdown.source === 'Objekt-spezifisch'
              ? 'bg-orange-100 text-orange-800'
              : breakdown.source === 'MA-Tätigkeitsart'
              ? 'bg-purple-100 text-purple-800'
              : breakdown.source === 'MA-Basislohn'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <Info size={14} className="mr-1" />
          Quelle: {breakdown.source}
        </span>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <div className="border-t pt-3">
            {/* Tariff Wage */}
            <div className="flex items-center justify-between text-sm py-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-gray-400" />
                <span className="text-gray-600">BSDW Tarifvertrag:</span>
              </div>
              <span className="font-medium">{formatEuro(breakdown.tariffWage)}/h</span>
            </div>

            {/* Employee Base Wage */}
            {breakdown.employeeBaseWage !== undefined && (
              <div className="flex items-center justify-between text-sm py-2 bg-blue-50 -mx-2 px-2 rounded">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="text-blue-700 font-medium">MA-Basislohn:</span>
                </div>
                <span className="font-medium text-blue-700">
                  {formatEuro(breakdown.employeeBaseWage)}/h
                </span>
              </div>
            )}

            {/* Activity Adjustment */}
            {breakdown.activityAdjustment > 0 && (
              <div className="flex items-center justify-between text-sm py-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" />
                  <span className="text-gray-600">Tätigkeits-Zuschlag:</span>
                </div>
                <span className="font-medium text-blue-600">
                  +{formatEuro(breakdown.activityAdjustment)}/h
                </span>
              </div>
            )}

            {/* Employee Activity Wage */}
            {breakdown.employeeActivityWage !== undefined && (
              <div className="flex items-center justify-between text-sm py-2 bg-purple-50 -mx-2 px-2 rounded">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-purple-600" />
                  <span className="text-purple-700 font-medium">MA-Tätigkeitslohn:</span>
                </div>
                <span className="font-medium text-purple-700">
                  {formatEuro(breakdown.employeeActivityWage)}/h
                </span>
              </div>
            )}

            {/* Site Override */}
            {breakdown.siteOverride !== undefined && (
              <div className="flex items-center justify-between text-sm py-2 bg-orange-50 -mx-2 px-2 rounded">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-orange-600" />
                  <span className="text-orange-700 font-medium">Objekt-Override:</span>
                </div>
                <span className="font-medium text-orange-700">
                  {formatEuro(breakdown.siteOverride)}/h
                </span>
              </div>
            )}
          </div>

          {/* Final Total */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Effektiver Stundenlohn:</span>
              <span className="text-xl font-bold text-green-600">
                {formatEuro(breakdown.effectiveWage)}/h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Text */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          {breakdown.source === 'Objekt-spezifisch' && (
            <span>
              ⚠️ <strong>Objekt-spezifischer Lohn aktiv:</strong> Überschreibt alle anderen
              Lohn-Einstellungen
            </span>
          )}
          {breakdown.source === 'MA-Tätigkeitsart' && (
            <span>
              ✓ <strong>Tätigkeits-spezifischer Lohn:</strong> Individuell für diese Tätigkeit
              konfiguriert
            </span>
          )}
          {breakdown.source === 'MA-Basislohn' && (
            <span>
              ✓ <strong>Individueller MA-Lohn:</strong> Basislohn + Tätigkeitszuschlag
            </span>
          )}
          {breakdown.source === 'BSDW Tarifvertrag' && (
            <span>
              ℹ️ <strong>Standard Tarifvertrag:</strong> BSDW-Lohn + Tätigkeitszuschlag
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
