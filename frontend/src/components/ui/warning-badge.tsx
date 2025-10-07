/**
 * WarningBadge - Warnungs-Icon + Text
 * v1.8.0 - Intelligent Replacement System
 */
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type WarningBadgeProps = {
  message: string
  severity?: 'info' | 'warning' | 'error'
  size?: 'sm' | 'md'
  icon?: LucideIcon
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
  },
}

export function WarningBadge({ message, severity = 'warning', size = 'md', icon }: WarningBadgeProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = icon ?? config.icon
  const iconSize = size === 'sm' ? 14 : 16
  const containerClass = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div
      className={`flex items-center gap-2 rounded-md border ${config.bgColor} ${config.borderColor} ${containerClass}`}
    >
      <Icon className={config.iconColor} size={iconSize} />
      <span className={`${config.textColor} ${textSize}`}>{message}</span>
    </div>
  )
}
