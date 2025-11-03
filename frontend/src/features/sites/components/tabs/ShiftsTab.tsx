import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar, Clock, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { fetchSiteShifts, generateShiftsForSite, type Shift, type GenerateShiftsPayload } from '../../api'

type Site = {
  id: string
  name: string
  securityConcept?: {
    shiftModel?: string
  }
  securityConcepts?: Array<{
    id: string
    status: string
    shiftModel?: any
  }>
}

type ShiftsTabProps = {
  site: Site
  siteId: string
}

export default function ShiftsTab({ site, siteId }: ShiftsTabProps) {
  const nav = useNavigate()
  const queryClient = useQueryClient()

  // Prüfe ob Sicherheitskonzept mit Schichtmodell vorhanden ist
  // Unterstützt sowohl altes Format (site.securityConcept) als auch neues (site.securityConcepts[])
  const hasShiftModel = !!(
    site.securityConcept?.shiftModel ||
    (site.securityConcepts && site.securityConcepts.length > 0 && site.securityConcepts[0].shiftModel)
  )

  // Fetch shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', siteId],
    queryFn: () => fetchSiteShifts(siteId),
    enabled: true,
  })

  // Generate Shifts Mutation
  const generateShiftsMutation = useMutation({
    mutationFn: (payload: GenerateShiftsPayload) => generateShiftsForSite(siteId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', siteId] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Generieren der Schichten')
    },
  })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Schichten ({shifts.length})
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const startDate = new Date().toISOString()
              generateShiftsMutation.mutate({ startDate, daysAhead: 30 })
            }}
            disabled={generateShiftsMutation.isPending || !hasShiftModel}
          >
            {generateShiftsMutation.isPending ? 'Generiere...' : 'Schichten generieren'}
          </Button>
          <Button size="sm" onClick={() => nav(`/sites/${siteId}/shifts`)}>
            Alle anzeigen →
          </Button>
        </div>
      </div>

      {!hasShiftModel && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-900">
            ⚠️ <strong>Hinweis:</strong> Für dieses Objekt ist noch kein Sicherheitskonzept mit Schichtmodell hinterlegt. Bitte bearbeiten Sie das Objekt und fügen Sie ein Schichtmodell hinzu.
          </p>
        </div>
      )}

      {shiftsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-20 rounded-lg" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Calendar size={48} className="text-blue-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Noch keine Schichten vorhanden</p>
          <p className="text-sm text-gray-500 mb-4">
            Klicken Sie auf "Schichten generieren", um automatisch Schichten basierend auf dem Sicherheitskonzept zu erstellen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.slice(0, 10).map((shift) => {
            const startDate = new Date(shift.startTime)
            const endDate = new Date(shift.endTime)
            const isToday = new Date().toDateString() === startDate.toDateString()

            return (
              <div
                key={shift.id}
                className={cn(
                  'border rounded-lg p-4 hover:shadow-md transition-all duration-200',
                  isToday && 'border-blue-500 bg-blue-50',
                  !isToday && 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{shift.title}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
                          Heute
                        </span>
                      )}
                      {shift.status === 'PLANNED' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                          Geplant
                        </span>
                      )}
                      {shift.status === 'CONFIRMED' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          Bestätigt
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>
                          {startDate.toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                          , {startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck size={14} />
                        <span>
                          {shift.assignedEmployees || 0} / {shift.requiredEmployees} Mitarbeiter
                        </span>
                      </div>
                    </div>
                    {shift.description && (
                      <p className="text-sm text-gray-500 mt-2">{shift.description}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => nav(`/shifts/${shift.id}`)}
                    >
                      Details →
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          {shifts.length > 10 && (
            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => nav(`/sites/${siteId}/shifts`)}>
                Alle {shifts.length} Schichten anzeigen →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
