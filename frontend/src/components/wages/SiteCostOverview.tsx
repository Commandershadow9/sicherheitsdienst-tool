/**
 * Site Cost Overview Component
 * Shows cost breakdown for a specific site
 * Used in site management and reporting
 */

import { useState } from 'react'
import { Building2, Users, Clock, DollarSign, TrendingDown, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import {
  formatEuro,
  formatCompactEuro,
  formatDate,
  type WageGroup,
  type ActivityType,
} from '@/lib'

interface SiteCostEntry {
  employeeName: string
  wageGroup: WageGroup
  activityType?: ActivityType
  effectiveHourlyRate: number
  hoursWorked: number
  totalCost: number
  wageSource: string
}

interface SiteCostOverviewProps {
  siteName: string
  period: { start: Date; end: Date }
  entries: SiteCostEntry[]
  siteWageOverride?: number
  className?: string
}

export function SiteCostOverview({
  siteName,
  period,
  entries,
  siteWageOverride,
  className = '',
}: SiteCostOverviewProps) {
  const [groupBy, setGroupBy] = useState<'employee' | 'source'>('employee')

  // Calculate totals
  const totalHours = entries.reduce((sum, e) => sum + e.hoursWorked, 0)
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0)
  const avgHourlyRate = totalHours > 0 ? totalCost / totalHours : 0
  const uniqueEmployees = new Set(entries.map(e => e.employeeName)).size

  // Group by employee
  const byEmployee = entries.reduce((acc, entry) => {
    const key = entry.employeeName
    if (!acc[key]) {
      acc[key] = { name: key, hours: 0, cost: 0, entries: [] }
    }
    acc[key].hours += entry.hoursWorked
    acc[key].cost += entry.totalCost
    acc[key].entries.push(entry)
    return acc
  }, {} as Record<string, { name: string; hours: number; cost: number; entries: SiteCostEntry[] }>)

  // Group by wage source
  const bySource = entries.reduce((acc, entry) => {
    const key = entry.wageSource
    if (!acc[key]) {
      acc[key] = { source: key, hours: 0, cost: 0, count: 0 }
    }
    acc[key].hours += entry.hoursWorked
    acc[key].cost += entry.totalCost
    acc[key].count++
    return acc
  }, {} as Record<string, { source: string; hours: number; cost: number; count: number }>)

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={24} className="text-blue-600" />
              {siteName}
            </h2>
            <p className="text-gray-600 mt-1">
              <CalendarIcon size={14} className="inline mr-1" />
              {formatDate(period.start)} - {formatDate(period.end)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Gesamtkosten</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatEuro(totalCost)}
            </div>
          </div>
        </div>

        {/* Site Wage Override Warning */}
        {siteWageOverride && (
          <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-sm text-orange-900">
              <strong>⚠️ Objekt-spezifischer Lohn aktiv:</strong> {formatEuro(siteWageOverride)}/h
              für alle Mitarbeiter
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b bg-gray-50">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <Users size={14} className="inline mr-1" />
            Mitarbeiter
          </div>
          <div className="text-2xl font-bold">{uniqueEmployees}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <Clock size={14} className="inline mr-1" />
            Arbeitsstunden
          </div>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <DollarSign size={14} className="inline mr-1" />
            Ø Stundenlohn
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatEuro(avgHourlyRate)}/h
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Gesamtkosten</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCompactEuro(totalCost)}
          </div>
        </div>
      </div>

      {/* Group By Toggle */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Gruppieren nach:</span>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setGroupBy('employee')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                groupBy === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Mitarbeiter
            </button>
            <button
              onClick={() => setGroupBy('source')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                groupBy === 'source'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Lohn-Quelle
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {groupBy === 'employee' && (
          <div className="space-y-4">
            {Object.values(byEmployee)
              .sort((a, b) => b.cost - a.cost)
              .map((emp) => (
                <div key={emp.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{emp.name}</h4>
                      <p className="text-sm text-gray-600">{emp.hours.toFixed(1)} Stunden</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {formatEuro(emp.cost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ø {formatEuro(emp.cost / emp.hours)}/h
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {groupBy === 'source' && (
          <div className="space-y-4">
            {Object.values(bySource)
              .sort((a, b) => b.cost - a.cost)
              .map((src) => (
                <div key={src.source} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{src.source}</h4>
                      <p className="text-sm text-gray-600">
                        {src.count} Einträge • {src.hours.toFixed(1)} Stunden
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {formatEuro(src.cost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ø {formatEuro(src.cost / src.hours)}/h
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Gesamtkosten (Periode)</div>
            <div className="text-2xl font-bold text-blue-600">{formatEuro(totalCost)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Hochrechnung/Monat</div>
            <div className="text-xl font-semibold text-gray-700">
              ~{formatCompactEuro(totalCost * 4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
