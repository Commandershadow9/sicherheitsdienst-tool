/**
 * Payroll Summary Component
 * Shows wage calculation summary for shifts/periods
 * Used for payroll reporting
 */

import { Calendar, User, Clock, DollarSign, TrendingUp } from 'lucide-react'
import {
  formatEuro,
  formatDate,
  calculateFlexibleWage,
  getSurchargeLabel,
  type FlexibleWageCalculationInput,
  type FlexibleWageCalculationResult,
} from '@/lib'

interface PayrollEntry {
  employeeName: string
  date: Date
  hoursWorked: number
  calculation: FlexibleWageCalculationResult
}

interface PayrollSummaryProps {
  entries: PayrollEntry[]
  periodStart: Date
  periodEnd: Date
  className?: string
}

export function PayrollSummary({
  entries,
  periodStart,
  periodEnd,
  className = '',
}: PayrollSummaryProps) {
  // Calculate totals
  const totalHours = entries.reduce((sum, e) => sum + e.hoursWorked, 0)
  const totalGross = entries.reduce((sum, e) => sum + e.calculation.grossWage, 0)
  const totalNet = entries.reduce((sum, e) => sum + e.calculation.netWageEstimate, 0)
  const totalSurcharges = entries.reduce((sum, e) => sum + e.calculation.totalSurcharges, 0)

  // Group by employee
  const byEmployee = entries.reduce((acc, entry) => {
    const key = entry.employeeName
    if (!acc[key]) {
      acc[key] = {
        name: key,
        hours: 0,
        gross: 0,
        net: 0,
        entries: [],
      }
    }
    acc[key].hours += entry.hoursWorked
    acc[key].gross += entry.calculation.grossWage
    acc[key].net += entry.calculation.netWageEstimate
    acc[key].entries.push(entry)
    return acc
  }, {} as Record<string, { name: string; hours: number; gross: number; net: number; entries: PayrollEntry[] }>)

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign size={24} className="text-green-600" />
              Lohnabrechnung
            </h2>
            <p className="text-gray-600 mt-1">
              <Calendar size={14} className="inline mr-1" />
              {formatDate(periodStart)} - {formatDate(periodEnd)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Gesamt Brutto</div>
            <div className="text-3xl font-bold text-green-600">
              {formatEuro(totalGross)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b bg-gray-50">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <User size={14} className="inline mr-1" />
            Mitarbeiter
          </div>
          <div className="text-2xl font-bold">{Object.keys(byEmployee).length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <Clock size={14} className="inline mr-1" />
            Stunden
          </div>
          <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            <TrendingUp size={14} className="inline mr-1" />
            Zuschläge
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatEuro(totalSurcharges)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Netto (geschätzt)</div>
          <div className="text-2xl font-bold text-green-600">{formatEuro(totalNet)}</div>
        </div>
      </div>

      {/* Employee Breakdown */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aufschlüsselung nach Mitarbeiter</h3>
        <div className="space-y-4">
          {Object.values(byEmployee).map((emp) => (
            <div key={emp.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{emp.name}</h4>
                  <p className="text-sm text-gray-600">
                    {emp.hours.toFixed(2)} Stunden • {emp.entries.length} Schichten
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Brutto</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatEuro(emp.gross)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Netto: ~{formatEuro(emp.net)}
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              <div className="mt-3 space-y-2">
                {emp.entries.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{formatDate(entry.date, 'short')}</span>
                      <span className="font-medium">{entry.hoursWorked}h</span>
                      {entry.calculation.surcharges.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {entry.calculation.surcharges.map(s => getSurchargeLabel(s.type)).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="font-medium">{formatEuro(entry.calculation.grossWage)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Gesamt (Brutto):</span>
          <span className="text-green-600 text-2xl">{formatEuro(totalGross)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Netto-Werte sind Schätzungen. Tatsächliche Beträge können je nach Steuerklasse,
          Freibeträgen und anderen Faktoren variieren.
        </p>
      </div>
    </div>
  )
}
