import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated, hydrated } = useAuth()
  const loc = useLocation()

  if (!hydrated) {
    return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Lade…</div>
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />
}

export default ProtectedRoute
