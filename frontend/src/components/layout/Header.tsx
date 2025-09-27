import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthProvider'
import { LogOut } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : ''

  return (
    <header className="flex items-center justify-between h-14 border-b border-border px-4">
      <div className="font-medium">Dashboard</div>
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{displayName}</span>
            <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              {user.role}
            </span>
          </div>
        )}
        <ThemeToggle />
        <Button size="sm" variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4 mr-1" />
          Abmelden
        </Button>
      </div>
    </header>
  )
}
