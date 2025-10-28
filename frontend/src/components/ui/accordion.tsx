import { useState, createContext, useContext, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccordionContextType = {
  openItems: string[];
  toggle: (id: string) => void;
  multiple?: boolean;
};

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ children, type = 'multiple', defaultValue, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, multiple: type === 'multiple' }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionItem({ id, children, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(id);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)} data-state={isOpen ? 'open' : 'closed'}>
      {children}
    </div>
  );
}

interface AccordionTriggerProps {
  children: ReactNode;
  id: string;
  className?: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

export function AccordionTrigger({ children, id, className, icon, badge }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const isOpen = context.openItems.includes(id);

  return (
    <button
      onClick={() => context.toggle(id)}
      className={cn(
        'flex items-center justify-between w-full px-4 py-3 text-left font-medium transition-colors',
        'hover:bg-gray-50',
        isOpen && 'bg-gray-50',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className="flex-1">{children}</span>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <ChevronDown
        size={20}
        className={cn('flex-shrink-0 transition-transform text-gray-500', isOpen && 'transform rotate-180')}
      />
    </button>
  );
}

interface AccordionContentProps {
  children: ReactNode;
  id: string;
  className?: string;
}

export function AccordionContent({ children, id, className }: AccordionContentProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');

  const isOpen = context.openItems.includes(id);

  if (!isOpen) return null;

  return (
    <div className={cn('px-4 py-4 border-t animate-in fade-in slide-in-from-top-2', className)}>
      {children}
    </div>
  );
}
