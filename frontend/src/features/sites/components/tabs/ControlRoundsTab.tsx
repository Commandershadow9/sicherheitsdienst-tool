import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, AlertTriangle } from 'lucide-react'
import type { ControlRound } from '../../controlApi'

interface ControlRoundsTabProps {
  siteId: string
  controlRounds: ControlRound[]
}

const STATUS_COLORS = {
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS = {
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  INCOMPLETE: 'Unvollständig',
  CANCELLED: 'Abgebrochen',
}

export function ControlRoundsTab({
  siteId,
  controlRounds,
}: ControlRoundsTabProps) {
  const nav = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-green-600" />
          <h2 className="text-lg font-semibold">Kontrollgänge</h2>
          <span className="text-sm text-gray-500">({controlRounds.length})</span>
        </div>
      </div>

      {controlRounds.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kontrollgänge</h3>
          <p className="text-gray-600">
            Kontrollgänge werden über die Mobile-App gestartet und durchgeführt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {controlRounds
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .map((round) => (
              <div
                key={round.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[round.status]}`}
                      >
                        {STATUS_LABELS[round.status]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(round.startedAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        <strong>Durchgeführt von:</strong>{' '}
                        {round.performer
                          ? `${round.performer.firstName} ${round.performer.lastName}`
                          : 'Unbekannt'}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          <strong>Gescannt:</strong> {round.scannedPoints}/{round.totalPoints}
                        </span>
                        {round.missedPoints > 0 && (
                          <span className="text-orange-600">
                            <AlertTriangle size={14} className="inline mr-1" />
                            {round.missedPoints} verpasst
                          </span>
                        )}
                      </div>
                      {round.notes && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Notizen:</strong> {round.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => nav(`/control-rounds/${round.id}`)}
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
