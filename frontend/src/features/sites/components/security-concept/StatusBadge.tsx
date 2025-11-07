import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'

type StatusBadgeProps = {
  status: Status
  className?: string
}

const statusConfig = {
  DRAFT: {
    label: 'Entwurf',
    icon: Clock,
    className: 'bg-slate-100 text-slate-700 border border-slate-300',
  },
  IN_REVIEW: {
    label: 'In Prüfung',
    icon: AlertTriangle,
    className: 'bg-blue-100 text-blue-700 border border-blue-300',
  },
  APPROVED: {
    label: 'Freigegeben',
    icon: CheckCircle,
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  },
  ACTIVE: {
    label: 'Aktiv',
    icon: CheckCircle,
    className: 'bg-emerald-600 text-white border border-emerald-700',
  },
  EXPIRED: {
    label: 'Abgelaufen',
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700 border border-amber-300',
  },
  ARCHIVED: {
    label: 'Archiviert',
    icon: FileText,
    className: 'bg-slate-100 text-slate-600 border border-slate-300',
  },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon size={14} />
      {config.label}
    </span>
  )
}
