import * as React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

export interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  icon?: boolean; // Show help icon instead of wrapping children
  iconSize?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  icon = false,
  iconSize = 16,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={cn('inline-flex items-center', icon && 'cursor-help')}
      >
        {icon ? (
          <HelpCircle
            size={iconSize}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          />
        ) : (
          children
        )}
      </div>

      {/* Tooltip Content */}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
            'max-w-xs whitespace-normal break-words',
            'animate-in fade-in duration-200',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Info Tooltip - Blue colored for informational hints
 */
export function InfoTooltip({ content, iconSize = 16 }: { content: string | React.ReactNode; iconSize?: number }) {
  return (
    <Tooltip
      content={content}
      icon
      iconSize={iconSize}
      className="bg-blue-600 text-white"
    />
  );
}

/**
 * Help Tooltip - For contextual help text
 */
export function HelpTooltip({ content, children }: { content: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <Tooltip content={content} position="top">
      {children || <HelpCircle size={16} className="text-gray-400 hover:text-gray-600 cursor-help" />}
    </Tooltip>
  );
}
