/**
 * ShiftCalendar - Monatsansicht für Schichten
 *
 * Zeigt alle Schichten eines Monats in Kalenderform an mit:
 * - Farbcodierung nach Status
 * - Besetzungsanzeige (zugewiesen/benötigt)
 * - Navigation zwischen Monaten
 * - Klick auf Tag zeigt Details
 */

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar, Clock, UserCheck, AlertCircle } from 'lucide-react'
import type { Shift } from '../../api'

type ShiftCalendarProps = {
  shifts: Shift[]
  onShiftClick?: (shift: Shift) => void
  initialMonth?: Date
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  shifts: Shift[]
}

export default function ShiftCalendar({
  shifts,
  onShiftClick,
  initialMonth = new Date(),
}: ShiftCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of month
    const firstDay = new Date(year, month, 1)
    // Last day of month
    const lastDay = new Date(year, month + 1, 0)

    // Start from Monday of the week containing the 1st
    const startDate = new Date(firstDay)
    const dayOfWeek = firstDay.getDay() // 0 = Sunday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
    startDate.setDate(startDate.getDate() - daysToSubtract)

    // End at Sunday of the week containing the last day
    const endDate = new Date(lastDay)
    const endDayOfWeek = lastDay.getDay()
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + daysToAdd)

    // Build calendar days
    const days: CalendarDay[] = []
    const current = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]

      // Filter shifts for this day
      const dayShifts = shifts.filter((shift) => {
        const shiftDate = new Date(shift.startTime).toISOString().split('T')[0]
        return shiftDate === dateStr
      })

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === today.toDateString(),
        shifts: dayShifts,
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentMonth, shifts])

  // Format month/year for header
  const monthYearLabel = currentMonth.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  // Status colors
  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // Check if shift is understaffed
  const isUnderstaffed = (shift: Shift) => {
    return (shift.assignedEmployees || 0) < shift.requiredEmployees
  }

  // Weekday labels
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{monthYearLabel}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekdays.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                'min-h-[120px] border-r border-b border-gray-200 p-2',
                !day.isCurrentMonth && 'bg-gray-50 opacity-50',
                day.isToday && 'bg-blue-50 ring-2 ring-blue-500 ring-inset'
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    day.isToday
                      ? 'text-blue-600 font-bold'
                      : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  )}
                >
                  {day.date.getDate()}
                </span>
                {day.shifts.length > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {day.shifts.length}
                  </span>
                )}
              </div>

              {/* Shifts */}
              <div className="space-y-1">
                {day.shifts.slice(0, 3).map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => onShiftClick?.(shift)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded text-xs border transition-all hover:shadow-md',
                      getStatusColor(shift.status)
                    )}
                  >
                    <div className="font-medium truncate">{shift.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      <span className="truncate">
                        {new Date(shift.startTime).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isUnderstaffed(shift) && (
                        <AlertCircle size={10} className="text-red-600 ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <UserCheck size={10} />
                      <span
                        className={cn(
                          'text-[10px]',
                          isUnderstaffed(shift) ? 'text-red-700 font-medium' : ''
                        )}
                      >
                        {shift.assignedEmployees || 0}/{shift.requiredEmployees}
                      </span>
                    </div>
                  </button>
                ))}
                {day.shifts.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{day.shifts.length - 3} weitere
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          <span>Geplant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Bestätigt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span>In Arbeit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span>Abgeschlossen</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-red-600" />
          <span>Unterbesetzt</span>
        </div>
      </div>
    </div>
  )
}
