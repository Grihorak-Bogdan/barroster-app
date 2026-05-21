import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import BranchesPage from '../pages/BranchesPage'
import EmployeesPage from '../pages/EmployeesPage'
import ShiftsPage from '../pages/ShiftsPage'
import ShiftDetailPage from '../pages/ShiftDetailPage'
import CreateShiftPage from '../pages/CreateShiftPage'
import SettingsPage from '../pages/SettingsPage'
import LeaveRequestsPage from '../pages/LeaveRequestsPage'
import AuditLogPage from '../pages/AuditLogPage'
import PayrollPage from '../pages/PayrollPage'
import PayrollDetailPage from '../pages/PayrollDetailPage'
import ReportsPage from '../pages/ReportsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/branches', element: <BranchesPage /> },
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/shifts', element: <ShiftsPage /> },
          { path: '/shifts/create', element: <CreateShiftPage /> },
          { path: '/shifts/unassigned', element: <ShiftsPage /> },
          { path: '/shifts/timeoff', element: <ShiftsPage /> },
          { path: '/shifts/:id', element: <ShiftDetailPage /> },
          { path: '/leave-requests', element: <LeaveRequestsPage /> },
          { path: '/payroll', element: <PayrollPage /> },
          { path: '/payroll/:id', element: <PayrollDetailPage /> },
          { path: '/audit-log', element: <AuditLogPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
