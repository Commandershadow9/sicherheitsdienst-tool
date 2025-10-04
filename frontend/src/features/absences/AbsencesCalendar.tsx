import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Absence } from './types'
import { getAbsenceStatusLabel, getAbsenceTypeLabel } from './utils'

type AbsencesCalendarProps = {
  absences: Absence[]
}

export function AbsencesCalendar({ absences }: AbsencesCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []

    // Add empty cells for days before month starts (Monday as first day)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [daysInMonth, startDayOfWeek])

  // Group absences by date
  const absencesByDate = useMemo(() => {
    const map = new Map<string, Absence[]>()

    absences.forEach((absence) => {
      const start = new Date(absence.startsAt)
      const end = new Date(absence.endsAt)

      // Add absence to all days in range
      const current = new Date(start)
      while (current <= end) {
        if (current.getFullYear() === year && current.getMonth() === month) {
          const dateKey = current.getDate().toString()
          const existing = map.get(dateKey) || []
          map.set(dateKey, [...existing, absence])
        }
        current.setDate(current.getDate() + 1)
      }
    })

    return map
  }, [absences, year, month])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthName = firstDay.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={goToToday}>
            Heute
          </Button>
          <Button size="sm" variant="ghost" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2 min-h-[80px]" />
          }

          const dayAbsences = absencesByDate.get(day.toString()) || []
          const hasAbsences = dayAbsences.length > 0

          return (
            <div
              key={day}
              className={`
                border rounded p-1 min-h-[80px] text-sm
                ${isToday(day) ? 'bg-blue-50 border-blue-300' : 'bg-background'}
                ${hasAbsences ? 'border-orange-200' : ''}
              `}
            >
              <div className={`text-center font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayAbsences.slice(0, 2).map((absence) => (
                  <div
                    key={absence.id}
                    className={`
                      text-[10px] px-1 py-0.5 rounded truncate
                      ${absence.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                      ${absence.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800' : ''}
                      ${absence.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                      ${absence.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                    `}
                    title={`${absence.user.firstName} ${absence.user.lastName}: ${getAbsenceTypeLabel(absence.type)} (${getAbsenceStatusLabel(absence.status)})`}
                  >
                    {absence.user.firstName.charAt(0)}.{absence.user.lastName.charAt(0)}. - {getAbsenceTypeLabel(absence.type).substring(0, 4)}
                  </div>
                ))}
                {dayAbsences.length > 2 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayAbsences.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span>Genehmigt</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span>Ausstehend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span>Abgelehnt</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-300" />
          <span>Heute</span>
        </div>
      </div>
    </div>
  )
}
