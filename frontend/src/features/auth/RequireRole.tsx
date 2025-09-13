import React from 'react'
import { useAuth } from './AuthProvider'
import ForbiddenCard from '@/features/common/ForbiddenCard'

type Props = { roles: Array<'ADMIN'|'MANAGER'|'DISPATCHER'|'EMPLOYEE'>; children: React.ReactNode }

export function RequireRole({ roles, children }: Props) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return null // wird von ProtectedRoute abgefangen
  if (!user) return null // kurzer Zwischenzustand, bis /auth/me geladen ist
  if (!roles.includes(user.role)) return <ForbiddenCard />
  return <>{children}</>
}
export default RequireRole
