import { type ComponentType, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  CalendarOff,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  ClipboardList,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { useTheme } from '../../contexts/ThemeContext'

type NavChild = { label: string; to: string }
type NavItem = { icon: ComponentType<{ className?: string }>; label: string; to: string; children?: NavChild[] }

const SHIFT_CHILDREN: NavChild[] = [
  { label: 'All Shifts', to: '/shifts' },
  { label: 'Unassigned', to: '/shifts/unassigned' },
  { label: 'Time-Off Requests', to: '/shifts/timeoff' },
]

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Building2, label: 'Branches', to: '/branches' },
  { icon: Users, label: 'Employees', to: '/employees' },
  { icon: Calendar, label: 'Shifts', to: '/shifts', children: SHIFT_CHILDREN },
  { icon: CalendarOff, label: 'Leave Requests', to: '/leave-requests' },
  { icon: BarChart2, label: 'Reports', to: '/reports' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

const MANAGER_NAV_ITEMS: NavItem[] = [
  { icon: Wallet, label: 'Payroll', to: '/payroll' },
  { icon: ClipboardList, label: 'Audit Log', to: '/audit-log' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { canManage } = useRole()
  const { sidebarColor } = useTheme()
  const [shiftsOpen, setShiftsOpen] = useState(
    location.pathname.startsWith('/shifts'),
  )

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user
    ? user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email.split('@')[0]
    : 'User'

  const initials = user
    ? user.first_name && user.last_name
      ? (user.first_name[0] + user.last_name[0]).toUpperCase()
      : user.email.slice(0, 2).toUpperCase()
    : '?'

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner', manager: 'Manager', supervisor: 'Supervisor', staff: 'Staff',
  }
  const role = user?.employment_role
    ? ROLE_LABELS[user.employment_role] ?? user.employment_role
    : user?.email ?? ''

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full" style={{ backgroundColor: sidebarColor }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm leading-none">B</span>
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">
          BarRoster
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {[...NAV_ITEMS, ...(canManage ? MANAGER_NAV_ITEMS : [])].map((item) => {
          const Icon = item.icon
          const hasChildren = !!item.children
          const isShifts = item.label === 'Shifts'
          const isParentActive =
            isShifts && location.pathname.startsWith('/shifts')
          const isActive = !hasChildren && location.pathname === item.to

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setShiftsOpen((o) => !o)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isParentActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {shiftsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {shiftsOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.label}
                        to={child.to}
                        end={child.to === '/shifts'}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'text-white bg-white/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={() =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-slate-400 text-[11px] truncate">{role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
