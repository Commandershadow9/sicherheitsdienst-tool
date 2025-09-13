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
import RequireRole from '@/features/auth/RequireRole'

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
          { path: 'dashboard', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <Dashboard />
            </RequireRole>
          ) },
          { path: 'sites', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SitesList />
            </RequireRole>
          ) },
          { path: 'sites/:id/shifts', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SiteShifts />
            </RequireRole>
          ) },
          { path: 'users', element: (
            <RequireRole roles={['ADMIN','DISPATCHER']}>
              <UsersList />
            </RequireRole>
          ) },
          { path: 'shifts', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <ShiftList />
            </RequireRole>
          ) },
          { path: 'incidents', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <IncidentsList />
            </RequireRole>
          ) },
        ],
      },
    ],
  },
])
