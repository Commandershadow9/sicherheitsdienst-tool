import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { UserSelect } from '@/components/ui/user-select'
import { toast } from 'sonner'

interface CreateClearanceModalProps {
  open: boolean
  onClose: () => void
  onCreate: (userId: string, notes: string) => void
  users: any[]
  existingClearances?: Array<{ user: { id: string } }>
  isPending?: boolean
}

export function CreateClearanceModal({
  open,
  onClose,
  onCreate,
  users,
  existingClearances = [],
  isPending = false,
}: CreateClearanceModalProps) {
  const [userId, setUserId] = useState('')
  const [notes, setNotes] = useState('')

  const handleCreate = () => {
    if (!userId) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus')
      return
    }

    // Check if clearance already exists
    const exists = existingClearances.some((c) => c.user.id === userId)
    if (exists) {
      toast.error('Dieser Mitarbeiter hat bereits eine Clearance für diesen Auftrag')
      return
    }

    onCreate(userId, notes)
  }

  return (
    <Modal title="Neue Clearance anlegen" open={open} onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Mitarbeiter auswählen *">
          <UserSelect
            users={users}
            value={userId}
            onChange={setUserId}
            placeholder="Suche nach Name oder Email..."
          />
        </FormField>
        <FormField label="Notizen (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Zusätzliche Informationen zur Clearance..."
            rows={3}
          />
        </FormField>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900">
            💡 <strong>Hinweis:</strong> Die Clearance wird mit Status{' '}
            <strong>TRAINING</strong> angelegt. Nach Abschluss des Trainings kann der Status auf
            ACTIVE gesetzt werden.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={isPending || !userId}>
            {isPending ? 'Wird angelegt...' : 'Clearance anlegen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
