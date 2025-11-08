import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MapPin, Lightbulb, Plus, Pencil, Smartphone, QrCode } from 'lucide-react'
import type { ControlPoint } from '../../controlApi'

interface ControlPointsTabProps {
  siteId: string
  controlPoints: ControlPoint[]
  onShowSuggestions: () => void
}

export function ControlPointsTab({
  siteId,
  controlPoints,
  onShowSuggestions,
}: ControlPointsTabProps) {
  const nav = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Kontrollpunkte</h2>
          <span className="text-sm text-gray-500">({controlPoints.length})</span>
        </div>
        <div className="flex gap-2">
          {controlPoints.length > 0 && (
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={onShowSuggestions}
            >
              <Lightbulb size={16} className="mr-1" />
              Rundgang-Vorschläge
            </Button>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => nav(`/sites/${siteId}/control-points/new`)}
          >
            <Plus size={16} className="mr-1" />
            Neuer Kontrollpunkt
          </Button>
        </div>
      </div>

      {controlPoints.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kontrollpunkte</h3>
          <p className="text-gray-600 mb-4">
            Legen Sie Kontrollpunkte an, um NFC/QR-basierte Rundgänge zu ermöglichen.
          </p>
          <Button onClick={() => nav(`/sites/${siteId}/control-points/new`)}>
            Ersten Kontrollpunkt anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {controlPoints
            .sort((a, b) => a.order - b.order)
            .map((point) => (
              <div
                key={point.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {point.order}
                      </span>
                      <h3 className="font-semibold text-lg">{point.name}</h3>
                      {!point.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <div className="ml-10 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{point.location}</span>
                      </div>
                      {point.instructions && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Anweisungen:</strong> {point.instructions}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        {point.nfcTagId && (
                          <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            <Smartphone size={12} />
                            <span>NFC: {point.nfcTagId}</span>
                          </div>
                        )}
                        {point.qrCode && (
                          <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            <QrCode size={12} />
                            <span>QR: {point.qrCode.substring(0, 20)}...</span>
                          </div>
                        )}
                        {point._count && (
                          <div className="text-xs text-gray-500">
                            {point._count.scans} Scans
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => nav(`/sites/${siteId}/control-points/${point.id}/edit`)}
                    >
                      <Pencil size={14} />
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
