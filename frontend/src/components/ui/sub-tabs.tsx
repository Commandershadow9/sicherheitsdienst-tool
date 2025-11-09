import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface SubTab {
  key: string
  label: string
  badge?: string | number
  content: React.ReactNode
}

interface SubTabsProps {
  tabs: SubTab[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (key: string) => void
  className?: string
}

export function SubTabs({ tabs, defaultTab, activeTab: controlledActiveTab, onTabChange, className }: SubTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.key)

  // Use controlled state if provided, otherwise use internal state
  const activeTab = controlledActiveTab ?? internalActiveTab

  const handleTabChange = (key: string) => {
    if (onTabChange) {
      onTabChange(key)
    } else {
      setInternalActiveTab(key)
    }
  }

  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sub-Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div className="py-2">{activeTabContent}</div>
    </div>
  )
}
