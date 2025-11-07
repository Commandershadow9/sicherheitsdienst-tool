import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Priority = 'critical' | 'important' | 'optional'

type SectionGroupProps = {
  priority: Priority
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

const priorityConfig = {
  critical: {
    emoji: '🔴',
    label: 'KRITISCHE KOMPONENTEN',
    className: 'border-red-200 bg-red-50/30',
    headerClassName: 'text-red-800',
  },
  important: {
    emoji: '🟡',
    label: 'WICHTIGE KOMPONENTEN',
    className: 'border-amber-200 bg-amber-50/30',
    headerClassName: 'text-amber-800',
  },
  optional: {
    emoji: '⚪',
    label: 'OPTIONALE KOMPONENTEN',
    className: 'border-slate-200 bg-slate-50/30',
    headerClassName: 'text-slate-700',
  },
}

export default function SectionGroup({
  priority,
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: SectionGroupProps) {
  const config = priorityConfig[priority]

  return (
    <div className={cn('rounded-lg border-2 overflow-hidden', config.className, className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-current/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <h3 className={cn('text-sm font-semibold uppercase tracking-wide', config.headerClassName)}>
            {title || config.label}
          </h3>
        </div>
        {description && <p className="text-xs text-slate-600 mt-1 ml-7">{description}</p>}
      </div>

      {/* Content */}
      <div className="p-3 bg-white space-y-2">{children}</div>
    </div>
  )
}
