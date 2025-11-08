import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { Clearance } from '../../api'

interface RevokeModalProps {
  clearance: Clearance | null
  open: boolean
  onClose: () => void
  onRevoke: (clearanceId: string, notes: string) => void
  isPending?: boolean
}

export function RevokeModal({
  clearance,
  open,
  onClose,
  onRevoke,
  isPending = false,
}: RevokeModalProps) {
  const [notes, setNotes] = useState('')

  if (!clearance) return null

  return (
    <Modal title="Clearance widerrufen" open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-red-600">
          Clearance für{' '}
          <strong>
            {clearance.user.firstName} {clearance.user.lastName}
          </strong>{' '}
          widerrufen?
        </p>
        <FormField label="Grund (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Geben Sie einen Grund an..."
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onRevoke(clearance.id, notes)}
            loading={isPending}
            loadingText="Wird widerrufen..."
          >
            Widerrufen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
