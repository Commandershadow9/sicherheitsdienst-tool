import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string | React.ReactNode
  confirmText?: string
  isPending?: boolean
  variant?: 'danger' | 'warning'
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Löschen',
  isPending = false,
  variant = 'danger',
}: DeleteConfirmModalProps) {
  const textColor = variant === 'danger' ? 'text-red-600' : 'text-orange-600'
  const buttonColor = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-orange-600 hover:bg-orange-700'

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className={textColor}>{description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Abbrechen
          </Button>
          <Button
            className={`${buttonColor} text-white`}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Wird gelöscht...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
