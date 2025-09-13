import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const loc = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />
}

export default ProtectedRoute
