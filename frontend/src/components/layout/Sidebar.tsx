import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, AlertTriangle, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'

const NAV_ALL = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN','DISPATCHER','EMPLOYEE','MANAGER'] as const },
  { to: '/sites', label: 'Standorte', icon: CalendarDays, roles: ['ADMIN','DISPATCHER','MANAGER'] as const },
  { to: '/shifts', label: 'Schichten', icon: Clock, roles: ['ADMIN','DISPATCHER','EMPLOYEE','MANAGER'] as const },
  { to: '/users', label: 'Benutzer', icon: Users, roles: ['ADMIN','DISPATCHER'] as const },
  { to: '/incidents', label: 'Vorfälle', icon: AlertTriangle, roles: ['ADMIN','DISPATCHER','MANAGER'] as const },
  { to: '/system', label: 'System', icon: Settings, roles: ['ADMIN','DISPATCHER','EMPLOYEE','MANAGER'] as const },
]

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role || 'EMPLOYEE'
  const nav = NAV_ALL.filter((n) => (n.roles as readonly string[]).includes(role))
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card">
      <div className="p-4 font-bold">Sicherheitsdienst</div>
      <nav className="px-2 pb-4 space-y-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground'
              )
            }
          >
            <n.icon className="h-4 w-4" />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
