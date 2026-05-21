import { useEffect, useState } from 'react'
import {
  User,
  Lock,
  Bell,
  Palette,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { updateMeApi, changePasswordApi } from '../api/auth'
import { getEmployments } from '../api/employments'
import type { Employment } from '../types/employment'
import { useNavigate } from 'react-router-dom'
import { useTheme, THEME_PRESETS } from '../contexts/ThemeContext'

type Section = 'profile' | 'password' | 'notifications' | 'appearance'

const SECTIONS: { id: Section; icon: React.ElementType; label: string }[] = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'password', icon: Lock, label: 'Password' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
]

const NOTIF_SETTINGS = [
  { key: 'shift_reminders', label: 'Shift Reminders', desc: 'Get notified 1 hour before your shift starts.' },
  { key: 'unassigned_alerts', label: 'Unassigned Shift Alerts', desc: 'Alert when a shift has no assigned staff.' },
  { key: 'late_checkin', label: 'Late Check-in Alerts', desc: 'Notify when an employee is late.' },
  { key: 'timeoff_requests', label: 'Time-Off Requests', desc: 'When staff submit time-off requests.' },
  { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Email summary of the week every Monday.' },
]

type RoleKey = 'owner' | 'manager' | 'supervisor' | 'staff'

const ROLE_META: Record<RoleKey, { label: string; badge: string; dot: string }> = {
  owner:      { label: 'Owner',      badge: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  manager:    { label: 'Manager',    badge: 'bg-blue-100 text-blue-700 border border-blue-200',       dot: 'bg-blue-500' },
  supervisor: { label: 'Supervisor', badge: 'bg-sky-100 text-sky-700 border border-sky-200',          dot: 'bg-sky-500' },
  staff:      { label: 'Staff',      badge: 'bg-gray-100 text-gray-600 border border-gray-200',       dot: 'bg-gray-400' },
}

const ROLE_PERMISSIONS: Record<RoleKey | 'none', { label: string; granted: boolean }[]> = {
  owner: [
    { label: 'Create & edit branches', granted: true },
    { label: 'Manage staff & employment', granted: true },
    { label: 'Create & manage shifts', granted: true },
    { label: 'Approve / reject leave requests', granted: true },
    { label: 'Set & edit compensation', granted: true },
  ],
  manager: [
    { label: 'Create & edit branches', granted: false },
    { label: 'Manage staff & employment', granted: true },
    { label: 'Create & manage shifts', granted: true },
    { label: 'Approve / reject leave requests', granted: true },
    { label: 'Set & edit compensation', granted: true },
  ],
  supervisor: [
    { label: 'Create & edit branches', granted: false },
    { label: 'Manage staff & employment', granted: false },
    { label: 'Create & manage shifts', granted: false },
    { label: 'Approve / reject leave requests', granted: false },
    { label: 'Set & edit compensation', granted: false },
  ],
  staff: [
    { label: 'Create & edit branches', granted: false },
    { label: 'Manage staff & employment', granted: false },
    { label: 'Create & manage shifts', granted: false },
    { label: 'Approve / reject leave requests', granted: false },
    { label: 'Set & edit compensation', granted: false },
  ],
  none: [
    { label: 'Create & edit branches', granted: false },
    { label: 'Manage staff & employment', granted: false },
    { label: 'Create & manage shifts', granted: false },
    { label: 'Approve / reject leave requests', granted: false },
    { label: 'Set & edit compensation', granted: false },
  ],
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        No role
      </span>
    )
  }
  const meta = ROLE_META[role as RoleKey]
  if (!meta) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${meta.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function ProfileSection() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [employments, setEmployments] = useState<Employment[]>([])

  useEffect(() => {
    getEmployments()
      .then((all) => setEmployments(all.filter((e) => e.user_email === user?.email && e.status === 'active')))
      .catch(() => {})
  }, [user?.email])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await updateMeApi({ first_name: firstName, last_name: lastName, phone: phone || undefined })
      await refreshUser()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials =
    (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '') ||
    user?.email?.slice(0, 2).toUpperCase() ||
    '?'

  const role = (user?.employment_role ?? 'none') as RoleKey | 'none'
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.none

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

  return (
    <div className="space-y-6">
      {/* Role & Access */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Role & Access</h2>
        <p className="text-sm text-gray-500 mb-4">Your current role and what you can do in BarRoster.</p>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
          {/* Role row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Effective role</p>
                <p className="text-sm font-semibold text-gray-800">
                  {role === 'none' ? 'No employment' : ROLE_META[role as RoleKey]?.label}
                </p>
              </div>
            </div>
            <RoleBadge role={user?.employment_role} />
          </div>

          {/* Employments */}
          {employments.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-gray-200">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium pt-1">Active Positions</p>
              {employments.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700 font-medium">{emp.branch_name}</span>
                    {emp.position && (
                      <span className="text-xs text-gray-400 ml-1.5">— {emp.position}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-2 pt-1 border-t border-gray-200">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium pt-1">Permissions</p>
            {permissions.map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                {p.granted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                )}
                <span className={`text-xs ${p.granted ? 'text-gray-700' : 'text-gray-400'}`}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Profile Information</h2>
          <p className="text-sm text-gray-500">Update your name and contact details.</p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-semibold">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium text-gray-800">
                {user?.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              <RoleBadge role={user?.employment_role} />
            </div>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Profile saved successfully.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input
            value={user?.email ?? ''}
            disabled
            className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#0F172A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      await changePasswordApi(current, next)
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Incorrect')) setError('Current password is incorrect.')
      else setError('Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Change Password</h2>
        <p className="text-sm text-gray-500">Use a strong password of at least 8 characters.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Password changed successfully.
        </div>
      )}

      {(
        [
          { label: 'Current Password', value: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(s => !s), auto: 'current-password' },
          { label: 'New Password', value: next, set: setNext, show: showNext, toggle: () => setShowNext(s => !s), auto: 'new-password' },
          { label: 'Confirm New Password', value: confirm, set: setConfirm, show: showNext, toggle: () => setShowNext(s => !s), auto: 'new-password' },
        ] as const
      ).map((f) => (
        <div key={f.label}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
          <div className="relative">
            <input
              type={f.show ? 'text' : 'password'}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              autoComplete={f.auto}
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={f.toggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="bg-[#0F172A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
      >
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}

function NotificationsSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.map((s) => [s.key, true])),
  )

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500">Choose what events you want to be notified about.</p>
      </div>

      <div className="space-y-4">
        {NOTIF_SETTINGS.map((s) => (
          <div
            key={s.key}
            className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <button
              onClick={() => setEnabled((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 ${
                enabled[s.key] ? 'bg-sky-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  enabled[s.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Appearance</h2>
        <p className="text-sm text-gray-500">Customize how BarRoster looks on your device.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Sidebar Color</p>
        <p className="text-xs text-gray-400 mb-4">Choose a color theme for the navigation sidebar.</p>
        <div className="flex gap-4 flex-wrap">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                theme === preset.id
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg shadow-sm relative"
                style={{ backgroundColor: preset.color }}
              >
                {theme === preset.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium ${theme === preset.id ? 'text-sky-700' : 'text-gray-600'}`}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials =
    (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '') ||
    user?.email?.slice(0, 2).toUpperCase() ||
    '?'

  return (
    <div className="p-6 max-w-[1000px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-0.5 mb-4">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    section === s.id
                      ? 'bg-slate-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* User card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {user?.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email?.split('@')[0]}
                </p>
                <p className="text-[11px] text-gray-400 truncate mb-1.5">{user?.email}</p>
                <RoleBadge role={user?.employment_role} />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {section === 'profile' && <ProfileSection />}
          {section === 'password' && <PasswordSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'appearance' && <AppearanceSection />}
        </div>
      </div>
    </div>
  )
}
