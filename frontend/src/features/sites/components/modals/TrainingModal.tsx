import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { Clearance } from '../../api'

interface TrainingModalProps {
  clearance: Clearance | null
  open: boolean
  onClose: () => void
  onComplete: (clearanceId: string, hours: number) => void
  isPending?: boolean
}

export function TrainingModal({
  clearance,
  open,
  onClose,
  onComplete,
  isPending = false,
}: TrainingModalProps) {
  const [hours, setHours] = useState(0)

  if (!clearance) return null

  return (
    <Modal title="Training abschließen" open={open} onClose={onClose}>
      <div className="space-y-4">
        <p>
          Training für{' '}
          <strong>
            {clearance.user.firstName} {clearance.user.lastName}
          </strong>{' '}
          abschließen?
        </p>
        <FormField label="Anzahl Trainingsstunden">
          <Input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value) || 0)}
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={() => onComplete(clearance.id, hours)}
            loading={isPending}
            loadingText="Wird gespeichert..."
          >
            Abschließen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
