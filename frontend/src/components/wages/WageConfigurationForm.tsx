/**
 * Wage Configuration Form Component
 * Used in Employee Management (MA-Verwaltung)
 * Allows configuration of individual employee wages
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Trash2, Info } from 'lucide-react'
import {
  WAGE_GROUPS,
  WAGE_GROUP_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  getBaseHourlyWage,
  getActivityWageAdjustment,
  getWageBreakdown,
  formatEuro,
  type WageGroup,
  type ActivityType,
} from '@/lib'

interface WageConfigurationFormProps {
  // Current values
  wageGroup?: string
  baseWageOverride?: number
  activityWages?: Record<string, number>

  // Callbacks
  onChange: (config: {
    wageGroup?: string
    baseWageOverride?: number | null
    activityWages?: Record<string, number> | null
  }) => void

  // Optional
  readOnly?: boolean
  className?: string
}

export function WageConfigurationForm({
  wageGroup,
  baseWageOverride,
  activityWages = {},
  onChange,
  readOnly = false,
  className = '',
}: WageConfigurationFormProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [newActivity, setNewActivity] = useState<{ type: ActivityType | ''; wage: string }>({
    type: '',
    wage: '',
  })

  // Calculate effective wage for display
  const effectiveWage = wageGroup
    ? getWageBreakdown(wageGroup as WageGroup, undefined, { employeeBaseWage: baseWageOverride })
    : null

  const handleWageGroupChange = (value: string) => {
    onChange({ wageGroup: value || undefined })
  }

  const handleBaseWageChange = (value: string) => {
    const numValue = value ? parseFloat(value) : null
    onChange({ baseWageOverride: numValue })
  }

  const handleAddActivityWage = () => {
    if (!newActivity.type || !newActivity.wage) return

    const wage = parseFloat(newActivity.wage)
    if (isNaN(wage) || wage <= 0) return

    onChange({
      activityWages: {
        ...activityWages,
        [newActivity.type]: wage,
      },
    })

    setNewActivity({ type: '', wage: '' })
  }

  const handleRemoveActivityWage = (activityType: string) => {
    const updated = { ...activityWages }
    delete updated[activityType]
    onChange({ activityWages: Object.keys(updated).length > 0 ? updated : null })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wage Group Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lohngruppe (BSDW Tarifvertrag)
        </label>
        <Select
          value={wageGroup || ''}
          onChange={(e) => handleWageGroupChange(e.target.value)}
          disabled={readOnly}
          className="w-full"
        >
          <option value="">Keine Lohngruppe zugewiesen</option>
          {Object.entries(WAGE_GROUP_LABELS).map(([key, label]) => {
            const hourlyWage = getBaseHourlyWage(key as WageGroup)
            return (
              <option key={key} value={key}>
                {label} - {formatEuro(hourlyWage)}/h
              </option>
            )
          })}
        </Select>
        {wageGroup && (
          <p className="mt-1 text-sm text-gray-600">
            Tarif-Lohn: <strong>{formatEuro(getBaseHourlyWage(wageGroup as WageGroup))}</strong>/h
          </p>
        )}
      </div>

      {/* Base Wage Override */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Individueller Stundenlohn (optional)
          <span className="ml-2 text-xs text-gray-500">
            Übersteuert Tarifvertrag
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.50"
            min="0"
            value={baseWageOverride || ''}
            onChange={(e) => handleBaseWageChange(e.target.value)}
            placeholder="z.B. 16.50"
            disabled={readOnly}
            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-600">€/h</span>
        </div>
        {baseWageOverride && (
          <p className="mt-1 text-sm text-green-600">
            ✓ Individueller Lohn: <strong>{formatEuro(baseWageOverride)}</strong>/h
          </p>
        )}
      </div>

      {/* Activity-Specific Wages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tätigkeits-spezifische Löhne (optional)
          <span className="ml-2 text-xs text-gray-500">
            Verschiedene Löhne für verschiedene Tätigkeiten
          </span>
        </label>

        {/* Existing Activity Wages */}
        {Object.entries(activityWages).length > 0 && (
          <div className="mb-3 space-y-2">
            {Object.entries(activityWages).map(([activityType, wage]) => (
              <div
                key={activityType}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
              >
                <div>
                  <span className="font-medium">
                    {ACTIVITY_TYPE_LABELS[activityType as ActivityType]}
                  </span>
                  <span className="ml-2 text-gray-600">
                    {formatEuro(wage)}/h
                  </span>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveActivityWage(activityType)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Activity Wage */}
        {!readOnly && (
          <div className="flex gap-2">
            <Select
              value={newActivity.type}
              onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as ActivityType })}
              className="flex-1"
            >
              <option value="">Tätigkeit wählen...</option>
              {Object.entries(ACTIVITY_TYPE_LABELS)
                .filter(([key]) => !activityWages[key])
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </Select>
            <input
              type="number"
              step="0.50"
              min="0"
              value={newActivity.wage}
              onChange={(e) => setNewActivity({ ...newActivity, wage: e.target.value })}
              placeholder="€/h"
              className="w-24 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={handleAddActivityWage}
              disabled={!newActivity.type || !newActivity.wage}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Wage Breakdown Button */}
      {wageGroup && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowBreakdown(true)}
            className="w-full"
          >
            <Info size={16} className="mr-2" />
            Lohn-Aufschlüsselung anzeigen
          </Button>
        </div>
      )}

      {/* Wage Breakdown Modal */}
      {showBreakdown && effectiveWage && (
        <Modal
          title="Lohn-Aufschlüsselung"
          open={showBreakdown}
          onClose={() => setShowBreakdown(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Effektiver Stundenlohn</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatEuro(effectiveWage.effectiveWage)}/h
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Quelle: <strong>{effectiveWage.source}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">BSDW Tarifvertrag:</span>
                <span className="font-medium">{formatEuro(effectiveWage.tariffWage)}/h</span>
              </div>

              {effectiveWage.employeeBaseWage !== undefined && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Individueller Basislohn:</span>
                  <span className="font-medium">{formatEuro(effectiveWage.employeeBaseWage)}/h</span>
                </div>
              )}

              {effectiveWage.activityAdjustment > 0 && (
                <div className="flex justify-between items-center text-blue-600">
                  <span>Tätigkeits-Zuschlag:</span>
                  <span className="font-medium">+{formatEuro(effectiveWage.activityAdjustment)}/h</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Hinweis:</strong> Objekt-spezifische Lohn-Überschreibungen werden bei der
                Schichtplanung berücksichtigt und haben die höchste Priorität.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
