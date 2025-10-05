/**
 * MetricBadge - Icon + Label + Wert mit Status-Farbe
 * v1.8.0 - Intelligent Replacement System
 */
import { type LucideIcon } from 'lucide-react'

type MetricBadgeProps = {
  icon: LucideIcon
  label: string
  value: string
  status?: 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md'
}

const STATUS_STYLES = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
}

const ICON_STYLES = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  neutral: 'text-gray-600',
}

export function MetricBadge({ icon: Icon, label, value, status = 'neutral', size = 'md' }: MetricBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 16
  const containerClass = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center gap-2 rounded-md border ${STATUS_STYLES[status]} ${containerClass}`}>
      <Icon className={ICON_STYLES[status]} size={iconSize} />
      <div className="flex items-baseline gap-1.5">
        <span className={`font-medium ${textSize}`}>{label}:</span>
        <span className={`font-semibold ${textSize}`}>{value}</span>
      </div>
    </div>
  )
}
