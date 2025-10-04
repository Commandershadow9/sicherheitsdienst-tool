import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { ReplacementCandidate } from './types'

type ReplacementCandidatesModalProps = {
  open: boolean
  onClose: () => void
  shiftTitle: string
  candidates: ReplacementCandidate[]
}

export function ReplacementCandidatesModal({
  open,
  onClose,
  shiftTitle,
  candidates,
}: ReplacementCandidatesModalProps) {
  function formatDate(isoString: string): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
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
                      onClick={() => {
                        // TODO: Direkt zur Schicht zuweisen
                        alert(`Mitarbeiter ${candidate.firstName} ${candidate.lastName} zuweisen`)
                      }}
                    >
                      Zuweisen
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
