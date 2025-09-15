import * as React from 'react'
import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg rounded-lg border border-border bg-card shadow-lg p-4')}>
        {title && <div className="text-base font-semibold mb-2">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  )
}

