import React from 'react'
import { useAuth } from './AuthProvider'

type Props = { roles: Array<'ADMIN'|'MANAGER'|'DISPATCHER'|'EMPLOYEE'>; children: React.ReactNode }

export function RequireRole({ roles, children }: Props) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return null // wird von ProtectedRoute abgefangen
  if (!user) return null // kurzer Zwischenzustand, bis /auth/me geladen ist
  if (!roles.includes(user.role)) return <Forbidden />
  return <>{children}</>
}

function Forbidden() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">403 – Zugriff verweigert</h1>
      <p className="text-sm text-muted-foreground">Du hast keine Berechtigung für diese Seite.</p>
    </div>
  )
}

export default RequireRole

