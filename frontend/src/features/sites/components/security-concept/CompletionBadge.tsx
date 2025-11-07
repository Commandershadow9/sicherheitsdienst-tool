import { CheckCircle, AlertTriangle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type CompletionStatus = 'complete' | 'partial' | 'empty'

type CompletionBadgeProps = {
  status: CompletionStatus
  label?: string
  className?: string
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    defaultLabel: 'Definiert',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  partial: {
    icon: AlertTriangle,
    defaultLabel: 'Unvollständig',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  empty: {
    icon: Circle,
    defaultLabel: 'Nicht definiert',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
}

export default function CompletionBadge({ status, label, className }: CompletionBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayLabel = label || config.defaultLabel

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon size={12} />
      {displayLabel}
    </span>
  )
}
