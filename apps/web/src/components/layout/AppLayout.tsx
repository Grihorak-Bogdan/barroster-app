import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { useToast } from '../../contexts/ToastContext'
import { NotificationProvider } from '../../contexts/NotificationContext'

function AppLayoutInner() {
  const { toast } = useToast()

  useEffect(() => {
    const handle = () => toast("You don't have permission to perform this action.", 'error')
    window.addEventListener('api:forbidden', handle)
    return () => window.removeEventListener('api:forbidden', handle)
  }, [toast])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-100 flex items-center justify-end px-6">
          <NotificationBell />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <NotificationProvider>
      <AppLayoutInner />
    </NotificationProvider>
  )
}
