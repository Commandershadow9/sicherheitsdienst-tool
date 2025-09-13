import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function Header() {
  return (
    <header className="flex items-center justify-between h-14 border-b border-border px-4">
      <div className="font-medium">Dashboard</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}

