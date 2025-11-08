import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { SkeletonDetailPage } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { fetchControlRound } from '../controlApi'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Smartphone,
  QrCode,
  XCircle,
  FileText,
  Briefcase,
  Shield,
} from 'lucide-react'

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

const SCAN_METHOD_LABELS = {
  NFC: 'NFC',
  QR_CODE: 'QR-Code',
  MANUAL: 'Manuell',
}

const SCAN_METHOD_ICONS = {
  NFC: Smartphone,
  QR_CODE: QrCode,
  MANUAL: FileText,
}

export default function ControlRoundDetail() {
  const { roundId } = useParams<{ roundId: string }>()
  const navigate = useNavigate()

  const { data: round, isLoading, isError } = useQuery({
    queryKey: ['controlRound', roundId],
    queryFn: () => fetchControlRound(roundId!),
    enabled: !!roundId,
  })

  if (isLoading) {
    return <SkeletonDetailPage />
  }

  if (isError || !round) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Kontrollgang nicht gefunden</div>
        <Button onClick={() => navigate(-1)}>Zurück</Button>
      </div>
    )
  }

  const completionRate = round.totalPoints > 0
    ? Math.round((round.scannedPoints / round.totalPoints) * 100)
    : 0

  const duration = round.completedAt
    ? Math.round(
        (new Date(round.completedAt).getTime() - new Date(round.startedAt).getTime()) / 1000 / 60
      )
    : null

  const breadcrumbItems = [
    { label: 'Aufträge', href: '/sites', icon: Briefcase },
    { label: round.site?.name || 'Auftrag', href: `/sites/${round.siteId}` },
    { label: 'Kontrollgänge', icon: Shield },
    { label: new Date(round.startedAt).toLocaleDateString('de-DE') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <Breadcrumbs items={breadcrumbItems} />
          <div>
            <h1 className="text-2xl font-bold">Kontrollgang-Details</h1>
            <p className="text-gray-600">
              {round.site?.name} • {new Date(round.startedAt).toLocaleString('de-DE')}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[round.status]}`}>
          {STATUS_LABELS[round.status]}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Performer */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <User size={16} />
            <span>Durchgeführt von</span>
          </div>
          <div className="font-semibold">
            {round.performer
              ? `${round.performer.firstName} ${round.performer.lastName}`
              : 'Unbekannt'}
          </div>
          {round.performer?.employeeId && (
            <div className="text-xs text-gray-500 mt-1">ID: {round.performer.employeeId}</div>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <CheckCircle size={16} />
            <span>Fortschritt</span>
          </div>
          <div className="font-semibold text-2xl">
            {round.scannedPoints}/{round.totalPoints}
          </div>
          <div className="text-xs text-gray-500 mt-1">{completionRate}% abgeschlossen</div>
        </div>

        {/* Missed Points */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <AlertTriangle size={16} />
            <span>Verpasst</span>
          </div>
          <div className={`font-semibold text-2xl ${round.missedPoints > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {round.missedPoints}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {round.missedPoints === 0 ? 'Alle Punkte gescannt' : 'Punkte nicht erreicht'}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Clock size={16} />
            <span>Dauer</span>
          </div>
          <div className="font-semibold text-2xl">
            {duration !== null ? `${duration} min` : '-'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {round.completedAt
              ? new Date(round.completedAt).toLocaleTimeString('de-DE')
              : 'Noch nicht beendet'}
          </div>
        </div>
      </div>

      {/* Notes */}
      {round.notes && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText size={18} />
            Notizen
          </h3>
          <p className="text-gray-700">{round.notes}</p>
        </div>
      )}

      {/* Scans Timeline */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-blue-600" />
          Gescannte Kontrollpunkte ({round.scans?.length || 0})
        </h2>

        {!round.scans || round.scans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin size={48} className="mx-auto text-gray-300 mb-2" />
            <p>Noch keine Kontrollpunkte gescannt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {round.scans
              .sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime())
              .map((scan, index) => {
                const ScanIcon = SCAN_METHOD_ICONS[scan.scanMethod]
                const isValid = scan.isValid
                const hasIssue = scan.hasIssue

                return (
                  <div key={scan.id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-0 -ml-[9px]">
                      {isValid && !hasIssue ? (
                        <CheckCircle size={18} className="text-green-600 bg-white" />
                      ) : hasIssue ? (
                        <AlertTriangle size={18} className="text-orange-600 bg-white" />
                      ) : (
                        <XCircle size={18} className="text-red-600 bg-white" />
                      )}
                    </div>

                    {/* Scan Content */}
                    <div className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                              {scan.point?.order ?? index + 1}
                            </span>
                            <h4 className="font-semibold">{scan.point?.name || 'Unbekannter Punkt'}</h4>
                            {!isValid && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                                Ungültig
                              </span>
                            )}
                            {hasIssue && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                                Problem
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{scan.point?.location || 'Keine Ortsangabe'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(scan.scannedAt).toLocaleTimeString('de-DE')}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                            <ScanIcon size={12} />
                            <span>{SCAN_METHOD_LABELS[scan.scanMethod]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Validation Error */}
                      {scan.validationError && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Validierungsfehler:</strong> {scan.validationError}
                        </div>
                      )}

                      {/* GPS Info */}
                      {scan.latitude && scan.longitude && (
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>GPS:</strong> {scan.latitude.toFixed(6)}, {scan.longitude.toFixed(6)}
                          {scan.accuracy && ` (±${Math.round(scan.accuracy)}m)`}
                        </div>
                      )}

                      {/* Notes */}
                      {scan.notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                          <strong>Notiz:</strong> {scan.notes}
                        </div>
                      )}

                      {/* Scanner Info */}
                      {scan.scanner && (
                        <div className="mt-2 text-xs text-gray-500">
                          Gescannt von: {scan.scanner.firstName} {scan.scanner.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Shift Info (optional) */}
      {round.shift && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar size={18} />
            Schicht
          </h3>
          <p className="text-gray-700">
            {round.shift.title} • {round.shift.startTime} - {round.shift.endTime}
          </p>
        </div>
      )}
    </div>
  )
}
