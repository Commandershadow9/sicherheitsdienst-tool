import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { ReplacementCandidate } from './types'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate } from '@/lib'

type ReplacementCandidatesModalProps = {
  open: boolean
  onClose: () => void
  shiftId: string
  shiftTitle: string
  candidates: ReplacementCandidate[]
  onAssignSuccess?: (info: { shiftId: string; shiftTitle: string; candidate: ReplacementCandidate }) => void
}

export function ReplacementCandidatesModal({
  open,
  onClose,
  shiftId,
  shiftTitle,
  candidates,
  onAssignSuccess,
}: ReplacementCandidatesModalProps) {
  const [assigning, setAssigning] = useState(false)

  async function handleAssign(candidate: ReplacementCandidate) {
    const confirmed = window.confirm(
      `Mitarbeiter ${candidate.firstName} ${candidate.lastName} zur Schicht "${shiftTitle}" zuweisen?`
    )

    if (!confirmed) return

    setAssigning(true)
    try {
      await api.post(`/shifts/${shiftId}/assign`, { userId: candidate.id })
      toast.success(`${candidate.firstName} ${candidate.lastName} erfolgreich zugewiesen`)
      onClose()
      onAssignSuccess?.({ shiftId, shiftTitle, candidate }) // Parent informieren (z.B. für Refresh)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Zuweisung fehlgeschlagen')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Ersatz-Mitarbeiter für "${shiftTitle}"`}>
      <div className="max-w-2xl">
        {candidates.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-gray-700">
              ⚠️ Keine verfügbaren Ersatz-Mitarbeiter gefunden.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Alle eingewiesenen Mitarbeiter sind entweder bereits eingeteilt oder abwesend.
            </p>
          </div>
        )}

        {candidates.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {candidates.length} verfügbare Mitarbeiter mit Objekt-Einweisung gefunden:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-blue-50 border-blue-300"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{candidate.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Eingewiesen: {formatDate(candidate.clearanceTrainedAt)}
                      {candidate.clearanceValidUntil && (
                        <> · Gültig bis: {formatDate(candidate.clearanceValidUntil)}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssign(candidate)}
                      disabled={assigning}
                    >
                      {assigning ? 'Zuweisen...' : 'Zuweisen'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
