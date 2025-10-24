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
import SiteDetail from '@/features/sites/pages/SiteDetail'
import SiteShifts from '@/features/sites/pages/SiteShifts'
import SiteForm from '@/features/sites/pages/SiteForm'
import ControlPointForm from '@/features/sites/pages/ControlPointForm'
import ControlRoundDetail from '@/features/sites/pages/ControlRoundDetail'
import CalculationForm from '@/features/sites/pages/CalculationForm'
import UsersList from '@/features/users/UsersList'
import ShiftList from '@/features/shifts/ShiftList'
import IncidentsList from '@/features/incidents/IncidentsList'
import IncidentForm from '@/features/incidents/IncidentForm'
import RequireRole from '@/features/auth/RequireRole'
import SystemPage from '@/pages/System'
import AbsencesList from '@/features/absences/AbsencesList'
import UserProfile from '@/features/users/UserProfile'
import UserPreferences from '@/features/users/UserPreferences'
import CustomerList from '@/features/customers/pages/CustomerList'
import CustomerDetail from '@/features/customers/pages/CustomerDetail'
import CustomerForm from '@/features/customers/pages/CustomerForm'
import SiteWizard from '@/features/wizard/components/SiteWizard'

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
          { path: 'sites/wizard/new', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <SiteWizard />
            </RequireRole>
          ) },
          { path: 'sites/new', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SiteForm mode="create" />
            </RequireRole>
          ) },
          { path: 'sites/:id', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SiteDetail />
            </RequireRole>
          ) },
          { path: 'sites/:id/edit', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SiteForm mode="edit" />
            </RequireRole>
          ) },
          { path: 'sites/:id/shifts', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <SiteShifts />
            </RequireRole>
          ) },
          { path: 'sites/:siteId/control-points/:pointId', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <ControlPointForm />
            </RequireRole>
          ) },
          { path: 'control-rounds/:roundId', element: (
            <RequireRole roles={['ADMIN','MANAGER','DISPATCHER']}>
              <ControlRoundDetail />
            </RequireRole>
          ) },
          { path: 'sites/:siteId/calculations/:calculationId', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <CalculationForm />
            </RequireRole>
          ) },
          { path: 'customers', element: (
            <RequireRole roles={['ADMIN','MANAGER','DISPATCHER']}>
              <CustomerList />
            </RequireRole>
          ) },
          { path: 'customers/new', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <CustomerForm />
            </RequireRole>
          ) },
          { path: 'customers/:id/edit', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <CustomerForm />
            </RequireRole>
          ) },
          { path: 'customers/:id', element: (
            <RequireRole roles={['ADMIN','MANAGER','DISPATCHER']}>
              <CustomerDetail />
            </RequireRole>
          ) },
          { path: 'users', element: (
            <RequireRole roles={['ADMIN','DISPATCHER']}>
              <UsersList />
            </RequireRole>
          ) },
          { path: 'users/me/profile', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <UserProfile />
            </RequireRole>
          ) },
          { path: 'users/:id/profile', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <UserProfile />
            </RequireRole>
          ) },
          { path: 'users/me/preferences', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <UserPreferences />
            </RequireRole>
          ) },
          { path: 'users/:id/preferences', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <UserPreferences />
            </RequireRole>
          ) },
          { path: 'shifts', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <ShiftList />
            </RequireRole>
          ) },
          { path: 'absences', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <AbsencesList />
            </RequireRole>
          ) },
          { path: 'incidents', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','MANAGER']}>
              <IncidentsList />
            </RequireRole>
          ) },
          { path: 'incidents/new', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <IncidentForm mode="create" />
            </RequireRole>
          ) },
          { path: 'incidents/:id/edit', element: (
            <RequireRole roles={['ADMIN','MANAGER']}>
              <IncidentForm mode="edit" />
            </RequireRole>
          ) },
          { path: 'system', element: (
            <RequireRole roles={['ADMIN','DISPATCHER','EMPLOYEE','MANAGER']}>
              <SystemPage />
            </RequireRole>
          ) },
        ],
      },
    ],
  },
])
