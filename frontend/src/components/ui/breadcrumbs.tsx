import { ChevronRight, Home, LucideProps } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ForwardRefExoticComponent, RefAttributes, ComponentType } from 'react'

// Typ für Lucide Icons
type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

export interface Breadcrumb {
  label: string
  href?: string
  icon?: LucideIcon | ComponentType<{ size?: number | string; className?: string }>
}

interface BreadcrumbsProps {
  items: Breadcrumb[]
  className?: string
  showHome?: boolean
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: 'Dashboard', href: '/dashboard', icon: Home }, ...items]
    : items

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      <ol className="flex items-center space-x-1 flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const Icon = item.icon

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight size={16} className="text-gray-400 mx-1 flex-shrink-0" />
              )}
              {isLast ? (
                <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                  {Icon && <Icon size={16} className="flex-shrink-0" />}
                  <span className="truncate max-w-[200px] sm:max-w-none">{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.href!}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {Icon && <Icon size={16} className="flex-shrink-0" />}
                  <span className="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
