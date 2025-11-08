import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatPeriod, getAbsenceStatusLabel, getAbsenceTypeLabel } from './utils'
import type { Absence, ClearanceStatus, AffectedShift } from './types'
import { ReplacementCandidatesModalV2 } from './ReplacementCandidatesModalV2'
import { fetchAbsenceById } from './api'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useReplacementCandidates } from './hooks/useReplacementCandidates'
import { formatDate, formatDateTime } from '@/lib'

type AbsenceDetailModalProps = {
  absence: Absence | null
  open: boolean
  onClose: () => void
}

function getClearanceStatusLabel(status: ClearanceStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Aktiv'
    case 'EXPIRED':
      return 'Abgelaufen'
    case 'REVOKED':
      return 'Widerrufen'
    default:
      return status
  }
}

function getClearanceStatusIcon(status: ClearanceStatus): string {
  switch (status) {
    case 'ACTIVE':
      return '✅'
    case 'EXPIRED':
      return '⏳'
    case 'REVOKED':
      return '❌'
    default:
      return '❓'
  }
}

function isClearanceExpired(clearance: { status: ClearanceStatus; validUntil?: string | null }): boolean {
  if (clearance.status !== 'ACTIVE') return true
  if (!clearance.validUntil) return false // Kein Ablaufdatum = nie abgelaufen
  return new Date(clearance.validUntil) < new Date()
}

export function AbsenceDetailModal({ absence, open, onClose }: AbsenceDetailModalProps) {
  const queryClient = useQueryClient()
  const [replacementModalOpen, setReplacementModalOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<{ id: string; title: string } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentAbsence, setCurrentAbsence] = useState<Absence | null>(absence)
  const {
    candidates,
    loading: candidatesLoading,
    fetchCandidates,
    reset: resetCandidates,
  } = useReplacementCandidates()

  useEffect(() => {
    setCurrentAbsence(absence ?? null)
  }, [absence])

  if (!currentAbsence) return null

  const isCreatedByOther = currentAbsence.createdBy.id !== currentAbsence.user.id

  const refreshAbsenceData = async () => {
    setRefreshing(true)
    try {
      const updated = await fetchAbsenceById(currentAbsence.id)
      setCurrentAbsence(updated)
      toast.success('Daten aktualisiert')
    } catch (error: any) {
      toast.error('Aktualisierung fehlgeschlagen')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFindReplacement = async (shift: AffectedShift) => {
    try {
      await fetchCandidates(shift.id, currentAbsence?.user.id)
      setSelectedShift({ id: shift.id, title: shift.title })
      setReplacementModalOpen(true)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Laden fehlgeschlagen')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Abwesenheitsdetails">
      <div className="max-w-2xl">
        <div className="space-y-6">
          {/* Betroffener Mitarbeiter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Betroffener Mitarbeiter</h3>
            <p className="text-base">
              {currentAbsence.user.firstName} {currentAbsence.user.lastName}
            </p>
            <p className="text-sm text-gray-600">{currentAbsence.user.email}</p>
          </div>

          {/* Ersteller (nur wenn unterschiedlich) */}
          {isCreatedByOther && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Erstellt von</h3>
              <p className="text-base">
                {currentAbsence.createdBy.firstName} {currentAbsence.createdBy.lastName}
              </p>
              <p className="text-sm text-gray-600">
                Admin/Manager hat diese Abwesenheit für den Mitarbeiter eingetragen
              </p>
            </div>
          )}

          {/* Zeitraum */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Zeitraum</h3>
            <p className="text-base">{formatPeriod(currentAbsence.startsAt, currentAbsence.endsAt)}</p>
            <p className="text-sm text-gray-600">
              {formatDate(currentAbsence.startsAt, 'full')} bis {formatDate(currentAbsence.endsAt, 'full')}
            </p>
          </div>

          {/* Typ & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Typ</h3>
              <p className="text-base">{getAbsenceTypeLabel(currentAbsence.type)}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
              <p className="text-base">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentAbsence.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : currentAbsence.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : currentAbsence.status === 'REQUESTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {getAbsenceStatusLabel(currentAbsence.status)}
                </span>
              </p>
            </div>
          </div>

          {/* Urlaubstage-Saldo (nur bei VACATION) */}
          {currentAbsence.type === 'VACATION' && currentAbsence.leaveDaysSaldo && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Urlaubstage-Saldo</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Jahresanspruch:</span>
                  <span className="font-medium ml-2">{currentAbsence.leaveDaysSaldo.annualLeaveDays} Tage</span>
                </div>
                <div>
                  <span className="text-gray-600">Bereits genommen:</span>
                  <span className="font-medium ml-2">{currentAbsence.leaveDaysSaldo.takenDays} Tage</span>
                </div>
                <div>
                  <span className="text-gray-600">Beantragt:</span>
                  <span className="font-medium ml-2">{currentAbsence.leaveDaysSaldo.requestedDays} Tage</span>
                </div>
                <div>
                  <span className="text-gray-600">Aktuell verfügbar:</span>
                  <span className="font-medium ml-2">{currentAbsence.leaveDaysSaldo.remainingDays} Tage</span>
                </div>
              </div>
              {currentAbsence.status === 'REQUESTED' && (
                <div className="mt-3 pt-3 border-t border-blue-400">
                  <span className="text-sm font-semibold text-blue-900">
                    Nach Genehmigung verbleibend: {currentAbsence.leaveDaysSaldo.remainingAfterApproval} Tage
                  </span>
                  {currentAbsence.leaveDaysSaldo.remainingAfterApproval < 0 && (
                    <p className="text-xs text-red-700 mt-1">
                      ⚠️ Warnung: Überschreitet verfügbare Urlaubstage um{' '}
                      {Math.abs(currentAbsence.leaveDaysSaldo.remainingAfterApproval)} Tage
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Objekt-Zuordnungen */}
          {currentAbsence.objectClearances && currentAbsence.objectClearances.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Objekt-Zuordnungen</h3>
              <div className="space-y-2">
                {currentAbsence.objectClearances.map((clearance) => {
                  const expired = isClearanceExpired(clearance)
                  return (
                    <div
                      key={clearance.id}
                      className={`flex items-start justify-between p-3 rounded-lg border ${
                        expired ? 'bg-gray-50 border-gray-300' : 'bg-green-50 border-green-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getClearanceStatusIcon(clearance.status)}</span>
                          <span className="font-medium">{clearance.site.name}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{clearance.site.address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Eingewiesen: {formatDate(clearance.trainedAt, 'full')}
                          {clearance.validUntil && (
                            <> · Gültig bis: {formatDate(clearance.validUntil, 'full')}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            clearance.status === 'ACTIVE' && !expired
                              ? 'bg-green-100 text-green-800'
                              : clearance.status === 'EXPIRED' || expired
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {expired ? 'Abgelaufen' : getClearanceStatusLabel(clearance.status)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {currentAbsence.objectClearances && currentAbsence.objectClearances.length === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <p className="text-sm text-gray-600">
                ℹ️ Dieser Mitarbeiter ist aktuell für kein Objekt eingewiesen.
              </p>
            </div>
          )}

          {/* Betroffene Schichten - BUG-003 Fix: Kompakte Darstellung */}
          {currentAbsence.affectedShifts && currentAbsence.affectedShifts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Betroffene Schichten</h3>
              {/* Kompakte Übersicht */}
              <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {currentAbsence.affectedShifts.length} {currentAbsence.affectedShifts.length === 1 ? 'Schicht' : 'Schichten'} betroffen
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPeriod(currentAbsence.startsAt, currentAbsence.endsAt)}
                      </div>
                    </div>
                  </div>
                  {currentAbsence.affectedShifts.some(s => s.hasCapacityWarning) && (
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded text-sm">
                      <span>⚠️</span>
                      <span className="font-medium text-red-800">
                        {currentAbsence.affectedShifts.filter(s => s.hasCapacityWarning).length} unterbesetzt
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Detaillierte Liste (unterbesetzt Schichten zuerst) */}
              <div className="space-y-2">
                {currentAbsence.affectedShifts
                  .sort((a, b) => (b.hasCapacityWarning ? 1 : 0) - (a.hasCapacityWarning ? 1 : 0))
                  .map((shift) => {
                  const startDate = new Date(shift.startTime)
                  const endDate = new Date(shift.endTime)
                  const dateStr = new Intl.DateTimeFormat('de-DE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  }).format(startDate)
                  const timeStr = `${new Intl.DateTimeFormat('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(startDate)} - ${new Intl.DateTimeFormat('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(endDate)}`

                  return (
                    <div
                      key={shift.id}
                      className={`flex items-start justify-between p-3 rounded-lg border ${
                        shift.hasCapacityWarning
                          ? 'bg-red-50 border-red-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {shift.hasCapacityWarning ? '⚠️' : '✓'}
                          </span>
                          <div>
                            <span className="font-medium">{shift.title}</span>
                            {shift.site && (
                              <span className="text-sm text-gray-600 ml-2">
                                ({shift.site.name})
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {dateStr} · {timeStr}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                          Kapazität: {shift.availableEmployees} / {shift.requiredEmployees} MA verfügbar
                          {shift.hasCapacityWarning && (
                            <span className="text-red-700 font-medium ml-1">
                              → {shift.requiredEmployees - shift.availableEmployees} fehlen
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            shift.hasCapacityWarning
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {shift.hasCapacityWarning ? 'Unterbesetzt' : 'OK'}
                        </span>
                        {shift.hasCapacityWarning && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFindReplacement(shift)}
                            disabled={candidatesLoading}
                          >
                            🔍 Ersatz finden
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {currentAbsence.affectedShifts && currentAbsence.affectedShifts.length === 0 && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm text-gray-600">
                ℹ️ Keine Schichten im Abwesenheitszeitraum betroffen.
              </p>
            </div>
          )}

          {/* Grund */}
          {currentAbsence.reason && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Grund</h3>
              <p className="text-base whitespace-pre-wrap">{currentAbsence.reason}</p>
            </div>
          )}

          {/* Entscheidung */}
          {(currentAbsence.decidedBy || currentAbsence.decisionNote) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Entscheidung</h3>
              {currentAbsence.decidedBy && (
                <p className="text-sm text-gray-600 mb-1">
                  Entschieden von: {currentAbsence.decidedBy.firstName} {currentAbsence.decidedBy.lastName}
                </p>
              )}
              {currentAbsence.decisionNote && (
                <p className="text-base whitespace-pre-wrap mt-2">{currentAbsence.decisionNote}</p>
              )}
            </div>
          )}

          {/* Erstellt am */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Erstellt am {formatDateTime(currentAbsence.createdAt)} Uhr
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4">
          <Button onClick={onClose} variant="outline">
            Schließen
          </Button>
        </div>
      </div>

      {selectedShift && (
      <ReplacementCandidatesModalV2
        open={replacementModalOpen}
        onClose={() => {
          setReplacementModalOpen(false)
          setSelectedShift(null)
          resetCandidates()
        }}
        shiftId={selectedShift.id}
        shiftTitle={selectedShift.title}
        candidates={candidates}
          onAssignSuccess={() => {
            // BUG-004 Fix: Dashboard Auto-Refresh nach Ersatz-Zuweisung
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['critical-shifts'] })
            queryClient.invalidateQueries({ queryKey: ['upcoming-warnings'] })

            // Detailansicht neu laden, damit aktualisierte Kapazität angezeigt wird
            refreshAbsenceData()

            toast.success('Ersatz zugewiesen - Dashboard wird aktualisiert')
          }}
        />
      )}
    </Modal>
  )
}
