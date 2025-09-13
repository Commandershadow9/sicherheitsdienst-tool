import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shifts', label: 'Schichten', icon: CalendarDays },
  { to: '/users', label: 'Benutzer', icon: Users },
]

export function Sidebar() {
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

