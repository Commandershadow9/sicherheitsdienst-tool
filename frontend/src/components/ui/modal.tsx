import * as React from 'react'
import { cn } from '@/lib/utils'

type ModalProps = {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  title?: string | React.ReactNode
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  fullscreen: 'max-w-full h-screen m-0 rounded-none',
}

export function Modal({ open, isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  const isVisible = open ?? isOpen ?? false
  if (!isVisible) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full mx-4 rounded-lg border border-border bg-card shadow-xl p-4',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size],
          size === 'fullscreen' && 'mx-0'
        )}
      >
        {title && <div className="text-base font-semibold mb-3 pr-2">{title}</div>}
        <div className={cn('overflow-y-auto pr-2', size !== 'fullscreen' && 'max-h-[calc(90vh-6rem)]')}>
          {children}
        </div>
      </div>
    </div>
  )
}
