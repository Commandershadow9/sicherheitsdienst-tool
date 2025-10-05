import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PendingApproval } from './types'
import type { CapacityWarning } from '@/features/absences/types'
import { formatPeriod, getAbsenceTypeLabel } from '@/features/absences/utils'
import { Loader2, AlertTriangle } from 'lucide-react'

type QuickApprovalModalProps = {
  open: boolean
  mode: 'approve' | 'reject'
  approval: PendingApproval | null
  warnings?: CapacityWarning[]
  warningsLoading?: boolean
  warningsError?: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}

export function QuickApprovalModal({
  open,
  mode,
  approval,
  warnings,
  warningsLoading,
  warningsError,
  loading,
  onClose,
  onSubmit,
}: QuickApprovalModalProps) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setNote('')
    }
  }, [open, approval?.absenceId, mode])

  const title = mode === 'approve' ? 'Antrag genehmigen' : 'Antrag ablehnen'
  const primaryLabel = mode === 'approve' ? 'Genehmigen' : 'Ablehnen'

  const warningList = useMemo(() => warnings ?? [], [warnings])

  if (!approval) {
    return null
  }

  const handleSubmit = () => {
    onSubmit(note.trim())
  }

  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} title={title}>
      <div className="space-y-4">
        <div className="space-y-1 text-sm">
          <div className="font-semibold">
            {approval.employee.firstName} {approval.employee.lastName}
          </div>
          <div className="text-muted-foreground">
            {getAbsenceTypeLabel(approval.type)} · {formatPeriod(approval.startsAt, approval.endsAt)}
          </div>
          {approval.reason && <div>Grund: {approval.reason}</div>}
        </div>

        {mode === 'approve' && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Kapazitätswarnungen
            </div>
            {warningsLoading ? (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                <span>Prüfe Kapazität…</span>
              </div>
            ) : warningsError ? (
              <div className="mt-2 text-xs text-red-700">{warningsError}</div>
            ) : warningList.length === 0 ? (
              <div className="mt-2 text-xs">Keine zusätzlichen Warnungen gefunden.</div>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {warningList.map((warning) => (
                  <li key={warning.shiftId}>
                    {warning.date}: {warning.shiftTitle} ({warning.siteName}) – Benötigt {warning.required}, verfügbar {warning.available} → {warning.shortage} fehlen
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <label className="font-medium" htmlFor="quick-decision-note">
            Notiz (optional)
          </label>
          <Textarea
            id="quick-decision-note"
            placeholder={mode === 'approve' ? 'Optionale Notiz für den Mitarbeiter' : 'Begründung für die Ablehnung'}
            minLength={0}
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={loading}
          />
          {mode === 'reject' && (
            <div className="text-xs text-muted-foreground">
              Bitte gib idealerweise einen kurzen Hinweis für den Mitarbeiter.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {primaryLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
