import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import ProtectedRoute from '@/features/auth/ProtectedRoute'
import React from 'react'

function RouteError() {
  return (
    <div style={{ padding: 16 }}>
      <h3>Ups – da lief was schief.</h3>
      <p>Bitte neu laden oder später erneut versuchen.</p>
    </div>
  )
}
import SitesList from '@/features/sites/pages/SitesList'
import SiteShifts from '@/features/sites/pages/SiteShifts'
import UsersList from '@/features/users/UsersList'
import ShiftList from '@/features/shifts/ShiftList'
import IncidentsList from '@/features/incidents/IncidentsList'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <RouteError />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        element: <Layout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'sites', element: <SitesList /> },
          { path: 'sites/:id/shifts', element: <SiteShifts /> },
          { path: 'users', element: <UsersList /> },
          { path: 'shifts', element: <ShiftList /> },
          { path: 'incidents', element: <IncidentsList /> },
        ],
      },
    ],
  },
])
