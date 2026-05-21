import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Plus,
  Calendar,
  List,
  ChevronDown,
  MoreHorizontal,
  Clock,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  XCircle,
  CalendarOff,
  AlertTriangle,
  CheckCheck,
  Ban,
} from 'lucide-react'
import { getShifts, updateShift } from '../api/shifts'
import { getBranches } from '../api/branches'
import { ForbiddenError } from '../api/client'
import type { Shift } from '../types/shift'
import type { Branch } from '../types/branch'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import Badge, { statusVariant, statusLabel } from '../components/ui/Badge'
import { formatTime, diffHours } from '../utils/format'

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function groupByDate(shifts: Shift[]): Map<string, Shift[]> {
  const map = new Map<string, Shift[]>()
  for (const s of shifts) {
    const key = new Date(s.start_time).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return map
}

function assignmentName(email: string): string {
  const local = email.split('@')[0]
  return local.split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

type QuickAction = { label: string; icon: React.ElementType; cls: string; status: string }

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  planned:   [
    { label: 'Confirm',  icon: CheckCheck, cls: 'text-emerald-700 hover:bg-emerald-50', status: 'confirmed' },
    { label: 'Cancel',   icon: Ban,        cls: 'text-red-600 hover:bg-red-50',         status: 'cancelled' },
  ],
  confirmed: [
    { label: 'Complete', icon: CheckCircle2, cls: 'text-sky-700 hover:bg-sky-50',       status: 'completed' },
    { label: 'Cancel',   icon: Ban,          cls: 'text-red-600 hover:bg-red-50',       status: 'cancelled' },
  ],
  completed: [],
  cancelled: [],
}

function ShiftRowMenu({
  shiftId, status, onStatusChange,
}: {
  shiftId: string
  status: string
  onStatusChange: (id: string, newStatus: string) => void
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const actions = QUICK_ACTIONS[status] ?? []

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
          <button
            onClick={(e) => { e.preventDefault(); setOpen(false); navigate(`/shifts/${shiftId}`) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
          {actions.length > 0 && <div className="my-1 border-t border-gray-100" />}
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.status}
                onClick={(e) => { e.preventDefault(); setOpen(false); onStatusChange(shiftId, a.status) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${a.cls}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ShiftsPage() {
  const { toast } = useToast()
  const { canManage } = useRole()
  const { pathname } = useLocation()
  const isUnassigned = pathname === '/shifts/unassigned'
  const isTimeoff = pathname === '/shifts/timeoff'
  const [shifts, setShifts] = useState<Shift[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const updated = await updateShift(id, { status: newStatus })
      setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      toast(`Shift ${newStatus}`)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to update shift.', 'error')
    }
  }
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([getShifts(), getBranches()])
      .then(([s, b]) => { setShifts(s); setBranches(b) })
      .catch((err) => { if (!(err instanceof ForbiddenError)) toast('Failed to load shifts.', 'error') })
      .finally(() => setLoading(false))
  }, [])

  // Stats
  const today = new Date().toDateString()
  const totalShifts = shifts.length
  const completedShifts = shifts.filter((s) => s.status === 'completed').length
  const todayShifts = shifts.filter((s) => new Date(s.start_time).toDateString() === today && s.status !== 'cancelled').length
  const unfilledShifts = shifts.filter((s) => !s.assignments || s.assignments.length === 0).length
  const conflictedShifts = shifts.filter((s) => s.conflicts?.length > 0).length

  const STATS = [
    { label: 'Total Shifts', value: totalShifts, icon: CalendarDays, iconBg: 'bg-blue-50 text-blue-500' },
    { label: 'Completed', value: completedShifts, icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-500' },
    { label: 'Active Today', value: todayShifts, icon: Clock, iconBg: 'bg-sky-50 text-sky-500' },
    { label: 'Unfilled', value: unfilledShifts, icon: AlertCircle, iconBg: 'bg-amber-50 text-amber-500' },
    { label: 'Leave Conflicts', value: conflictedShifts, icon: CalendarOff, iconBg: conflictedShifts > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400' },
  ]

  // Filters
  const filtered = shifts.filter((s) => {
    if (isUnassigned && (s.assignments?.length ?? 0) > 0) return false
    if (isTimeoff && !(s.conflicts?.length > 0)) return false
    if (branchFilter && s.branch !== branchFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  })

  const grouped = groupByDate(filtered)
  const dateKeys = [...grouped.keys()]

  const STATUSES = [
    { value: 'planned', label: 'Planned' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  function FilterDropdown({
    open, setOpen, label, options, value, onChange,
  }: {
    open: boolean
    setOpen: (v: boolean) => void
    label: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
  }) {
    const active = options.find((o) => o.value === value)
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-2 border text-sm px-3 py-2 rounded-lg transition-colors ${
            value
              ? 'border-sky-300 bg-sky-50 text-sky-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {active ? active.label : label}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-10 left-0 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
              <button
                onClick={() => { onChange(''); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  !value ? 'text-sky-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    value === o.value ? 'text-sky-600 font-medium bg-sky-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isUnassigned ? 'Unassigned Shifts' : isTimeoff ? 'Leave Conflicts' : 'Shift Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isUnassigned
              ? 'Shifts with no staff assigned yet.'
              : isTimeoff
              ? 'Shifts where assigned staff have approved leave.'
              : 'Schedule, assign, and track shifts across all branches.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === 'calendar' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
          {canManage && (
            <Link
              to="/shifts/create"
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Shift
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-5">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <FilterDropdown
          open={branchMenuOpen}
          setOpen={setBranchMenuOpen}
          label="All Branches"
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          value={branchFilter}
          onChange={setBranchFilter}
        />
        <FilterDropdown
          open={statusMenuOpen}
          setOpen={setStatusMenuOpen}
          label="All Statuses"
          options={STATUSES}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        {(branchFilter || statusFilter) && (
          <button
            onClick={() => { setBranchFilter(''); setStatusFilter('') }}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {loading ? '' : `${filtered.length} shift${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Content */}
      <div className="grid grid-cols-[1fr_260px] gap-5">
        {/* Shifts list */}
        <div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {isUnassigned
                  ? 'All shifts have staff assigned.'
                  : isTimeoff
                  ? 'No leave conflicts found.'
                  : branchFilter || statusFilter
                  ? 'No shifts match the current filters.'
                  : 'No shifts scheduled'}
              </p>
              {!branchFilter && !statusFilter && !isUnassigned && !isTimeoff && (
                <Link
                  to="/shifts/create"
                  className="inline-flex items-center gap-1.5 text-sky-600 text-sm hover:underline mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create your first shift
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {dateKeys.map((dateKey) => {
                const dayShifts = grouped.get(dateKey)!
                return (
                  <div key={dateKey}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {dateKey === today
                          ? `Today, ${new Date(dayShifts[0].start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                          : formatDate(dayShifts[0].start_time)}
                      </h3>
                      <span className="text-xs text-gray-400">{dayShifts.length} Shift{dayShifts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {dayShifts.map((shift) => {
                        const sv = statusVariant(shift.status)
                        const sl = statusLabel(shift.status)
                        const hours = diffHours(shift.start_time, shift.end_time)
                        const isUnfilled = !shift.assignments || shift.assignments.length === 0

                        const conflict = (shift.conflicts?.length ?? 0) > 0
                        return (
                          <Link
                            key={shift.id}
                            to={`/shifts/${shift.id}`}
                            className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all ${
                              conflict ? 'border-amber-200 hover:border-amber-300' : 'border-gray-100 hover:border-sky-200'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Time + branch */}
                              <div className="w-32 shrink-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {shift.branch_name}
                                </p>
                              </div>

                              {/* Status badge */}
                              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                <Badge variant={sv}>{sl}</Badge>
                                {conflict && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3" />
                                    Leave conflict
                                  </span>
                                )}
                                {shift.note && !conflict && (
                                  <p className="text-xs text-gray-400 truncate w-full">{shift.note}</p>
                                )}
                              </div>

                              {/* Assignment */}
                              <div className="flex items-center gap-3 shrink-0">
                                {isUnfilled ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-lg">
                                    <UserPlus className="w-3 h-3" />
                                    Unassigned
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1">
                                      {shift.assignments.slice(0, 3).map((a, i) => (
                                        <div
                                          key={a.id}
                                          className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center border-2 border-white"
                                          style={{ zIndex: 3 - i }}
                                        >
                                          <span className="text-white text-[10px] font-bold">
                                            {a.user_email.slice(0, 2).toUpperCase()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {shift.assignments.length === 1
                                        ? assignmentName(shift.assignments[0].user_email)
                                        : `${shift.assignments.length} staff`}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-1 text-xs text-gray-400 w-10">
                                  <Clock className="w-3.5 h-3.5" />
                                  {hours}h
                                </div>

                                {canManage && (
                                  <ShiftRowMenu
                                    shiftId={shift.id}
                                    status={shift.status}
                                    onStatusChange={handleStatusChange}
                                  />
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Branch coverage from real data */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Branch Coverage</h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : branches.length === 0 ? (
              <p className="text-xs text-gray-400">No branches yet.</p>
            ) : (
              <div className="space-y-3">
                {branches.map((b) => {
                  const branchShifts = shifts.filter((s) => s.branch === b.id && s.status !== 'cancelled')
                  const filled = branchShifts.filter((s) => s.assignments && s.assignments.length > 0).length
                  const total = branchShifts.length
                  const pct = total === 0 ? 0 : Math.round((filled / total) * 100)
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 truncate">{b.name}</span>
                        <span className="text-gray-500 ml-2 shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-sky-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{filled}/{total} shifts filled</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">This Week</h3>
            <div className="space-y-2">
              {[
                { label: 'Total hours', value: `${shifts.reduce((acc, s) => acc + diffHours(s.start_time, s.end_time), 0)}h` },
                { label: 'Shifts planned', value: shifts.filter((s) => s.status === 'planned').length },
                { label: 'Shifts confirmed', value: shifts.filter((s) => s.status === 'confirmed').length },
                { label: 'Cancelled', value: shifts.filter((s) => s.status === 'cancelled').length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800">{loading ? '—' : row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
