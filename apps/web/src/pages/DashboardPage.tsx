import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import {
  Plus,
  TrendingUp,
  Calendar,
  MapPin,
  Building2,
  Wine,
  Users,
  CalendarOff,
  GitBranch,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getBranches } from '../api/branches'
import { getShifts } from '../api/shifts'
import { getEmployments } from '../api/employments'
import { getLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '../api/leaves'
import type { Branch } from '../types/branch'
import type { Shift } from '../types/shift'
import type { Employment } from '../types/employment'
import type { LeaveRequest } from '../types/leave'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { ForbiddenError } from '../api/client'
import { AVATAR_COLORS, getDisplayName, getInitials } from '../utils/ui'

// ── Date helpers ───────────────────────────────────────────────────────────────

function getMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  const d = new Date(now)
  d.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(d.getDate() + n)
  return r
}

function isSameDay(iso: string, date: Date): boolean {
  const d = new Date(iso)
  return (
    d.getDate() === date.getDate() &&
    d.getMonth() === date.getMonth() &&
    d.getFullYear() === date.getFullYear()
  )
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function weekLabel(offset: number): string {
  if (offset === 0) return 'This week'
  if (offset === -1) return 'Last week'
  if (offset === 1) return 'Next week'
  if (offset < -1) return `${Math.abs(offset)} weeks ago`
  return `In ${offset} weeks`
}

// ── Coverage chart ─────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CoverageChart({ data }: { data: number[] }) {
  const hasData = data.some((v) => v > 0)
  const w = 380
  const h = 80
  const maxHours = Math.max(...data, 1)
  const yMax = Math.ceil(maxHours / 4) * 4 || 4
  const yMid = yMax / 2

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / yMax) * h,
  }))

  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1]
    const c = pts[i]
    const cp1x = p.x + (c.x - p.x) / 3
    const cp2x = c.x - (c.x - p.x) / 3
    line += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`
  }
  const area = `${line} L ${w} ${h + 4} L 0 ${h + 4} Z`

  return (
    <div className="mt-4">
      {hasData ? (
        <>
          <div className="flex items-stretch gap-2">
            {/* Y-axis labels in HTML — not distorted by preserveAspectRatio="none" */}
            <div className="flex flex-col justify-between text-right shrink-0 pb-px" style={{ width: 26 }}>
              <span className="text-[10px] leading-none text-gray-400">{yMax}h</span>
              <span className="text-[10px] leading-none text-gray-400">{yMid}h</span>
              <span className="text-[10px] leading-none text-gray-400">0</span>
            </div>
            {/* Chart area */}
            <div className="flex-1 min-w-0">
              <svg viewBox={`0 0 ${w} ${h + 4}`} className="w-full h-24" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cov-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1={0} y1={0} x2={w} y2={0} stroke="#F3F4F6" strokeWidth="1" />
                <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#F3F4F6" strokeWidth="1" />
                <line x1={0} y1={h} x2={w} y2={h} stroke="#F3F4F6" strokeWidth="1" />
                <path d={area} fill="url(#cov-grad)" />
                <path d={line} fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {/* Day labels aligned under the chart area */}
          <div className="flex justify-between mt-1" style={{ paddingLeft: 42 }}>
            {DAYS.map((d) => (
              <span key={d} className="text-[11px] text-gray-400">{d}</span>
            ))}
          </div>
        </>
      ) : (
        <div className="h-24 flex items-center justify-center text-xs text-gray-400">
          No shift data for this week yet
        </div>
      )}
    </div>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconCls, loading,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  iconCls: string
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}

// ── Branch icon ────────────────────────────────────────────────────────────────

function branchIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('lounge') || lower.includes('bar') || lower.includes('cellar') || lower.includes('wine'))
    return Wine
  return Building2
}

// ── Leave type meta ────────────────────────────────────────────────────────────

const LEAVE_LABELS: Record<string, string> = {
  day_off: 'Day Off', vacation: 'Vacation', sick_leave: 'Sick Leave',
}
const LEAVE_COLORS: Record<string, string> = {
  day_off: 'bg-sky-100 text-sky-700',
  vacation: 'bg-emerald-100 text-emerald-700',
  sick_leave: 'bg-red-100 text-red-700',
}


// ── Role breakdown ─────────────────────────────────────────────────────────────

const ROLE_DEFS = [
  { key: 'owner', label: 'Owners', color: 'bg-amber-400' },
  { key: 'manager', label: 'Managers', color: 'bg-sky-500' },
  { key: 'supervisor', label: 'Supervisors', color: 'bg-violet-500' },
  { key: 'staff', label: 'Staff', color: 'bg-emerald-500' },
]

// ── DashboardPage ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { toast } = useToast()
  const { canManage } = useRole()

  const [branches, setBranches] = useState<Branch[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employments, setEmployments] = useState<Employment[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    Promise.all([
      getBranches(),
      getShifts(),
      getEmployments(),
      getLeaveRequests('pending'),
    ])
      .then(([b, s, e, l]) => {
        setBranches(b)
        setShifts(s)
        setEmployments(e)
        setPendingLeaves(l)
      })
      .catch((err) => {
        if (!(err instanceof ForbiddenError)) toast('Failed to load dashboard data.', 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const currentMonday = getMonday()
  const selectedMonday = addDays(currentMonday, weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedMonday, i))
  const weekShifts = shifts.filter((s) => {
    const d = new Date(s.start_time)
    return d >= selectedMonday && d < addDays(selectedMonday, 7)
  })
  const coveredCount = weekShifts.filter(
    (s) => s.status === 'confirmed' || s.status === 'completed',
  ).length
  const uncoveredCount = weekShifts.filter((s) => s.status === 'planned').length
  const cancelledCount = weekShifts.filter((s) => s.status === 'cancelled').length
  const coveragePct = weekShifts.length > 0
    ? Math.round((coveredCount / weekShifts.length) * 100)
    : 0

  const uniqueStaffCount = new Set(
    weekShifts.flatMap((s) => s.assignments.map((a) => a.user)),
  ).size
  const branchesWithShifts = new Set(weekShifts.map((s) => s.branch)).size

  const activeBranches = branches.filter((b) => b.status === 'active').length
  const activeStaff = employments.filter((e) => e.status === 'active').length

  // Per-day total scheduled hours for chart
  const coverageByDay = weekDays.map((day) => {
    const dayShifts = shifts.filter((s) => isSameDay(s.start_time, day) && s.status !== 'cancelled')
    return dayShifts.reduce((sum, s) => {
      const ms = new Date(s.end_time).getTime() - new Date(s.start_time).getTime()
      return sum + ms / 3600000
    }, 0)
  })

  // Role breakdown
  const activeEmps = employments.filter((e) => e.status === 'active')
  const roleCounts = ROLE_DEFS.map((r) => ({
    ...r,
    count: activeEmps.filter((e) => e.role === r.key).length,
  }))
  const maxRoleCount = Math.max(...roleCounts.map((r) => r.count), 1)

  // ── Leave review handlers ────────────────────────────────────────────────────

  async function handleApprove(id: string) {
    setReviewingId(id)
    try {
      await approveLeaveRequest(id)
      setPendingLeaves((prev) => prev.filter((l) => l.id !== id))
      toast('Leave request approved')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to approve leave request.', 'error')
    } finally {
      setReviewingId(null)
    }
  }

  async function handleReject(id: string) {
    setReviewingId(id)
    try {
      await rejectLeaveRequest(id)
      setPendingLeaves((prev) => prev.filter((l) => l.id !== id))
      toast('Leave request rejected')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to reject leave request.', 'error')
    } finally {
      setReviewingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const weekRange = `${formatDate(selectedMonday)} – ${formatDate(addDays(selectedMonday, 6))}`

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Operations Overview</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            All Branches
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {weekRange}
          </button>
          {canManage && (
            <Link
              to="/shifts/create"
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Shift
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Active Branches"
          value={activeBranches}
          icon={GitBranch}
          iconCls="bg-sky-100 text-sky-600"
          loading={loading}
        />
        <StatCard
          label="Active Staff"
          value={activeStaff}
          icon={Users}
          iconCls="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
        <StatCard
          label={weekOffset === 0 ? 'Shifts This Week' : `Shifts · ${weekLabel(weekOffset)}`}
          value={weekShifts.length}
          icon={Calendar}
          iconCls="bg-violet-100 text-violet-600"
          loading={loading}
        />
        <StatCard
          label="Pending Leaves"
          value={pendingLeaves.length}
          icon={CalendarOff}
          iconCls={pendingLeaves.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}
          loading={loading}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-[1fr_296px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Shift Coverage */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Card header with week navigator */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Shift Coverage</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  title="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center min-w-[132px]">
                  <p className="text-xs font-medium text-gray-700">{weekRange}</p>
                  <p className={`text-[10px] font-medium ${weekOffset === 0 ? 'text-sky-600' : 'text-gray-400'}`}>
                    {weekLabel(weekOffset)}
                  </p>
                </div>
                <button
                  onClick={() => setWeekOffset((o) => o + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  title="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="ml-1 text-[10px] font-medium text-sky-600 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* Coverage % */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-900">
                {loading ? '—' : weekShifts.length === 0 ? '—' : `${coveragePct}%`}
              </span>
              {!loading && weekShifts.length > 0 && coveragePct > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Covered
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {weekShifts.length === 0 ? 'No shifts scheduled this week' : 'Confirmed + completed shifts'}
            </p>

            {/* Counts row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                {loading ? '—' : coveredCount} Covered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {loading ? '—' : uncoveredCount} Planned
              </span>
              {cancelledCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-300 inline-block" />
                  {cancelledCount} Cancelled
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                {loading ? '—' : weekShifts.length} Total
              </span>
            </div>

            {/* Extra context */}
            {!loading && weekShifts.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {uniqueStaffCount} staff assigned
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {branchesWithShifts} {branchesWithShifts === 1 ? 'branch' : 'branches'}
                </span>
              </div>
            )}

            {!loading && <CoverageChart data={coverageByDay} />}
          </div>

          {/* Active Branches */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Active Branches</h2>
              <Link to="/branches" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No branches yet</p>
                <Link to="/branches" className="text-xs text-sky-600 hover:underline mt-1 inline-block">
                  Add your first branch
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {branches.slice(0, 4).map((branch) => {
                  const Icon = branchIcon(branch.name)
                  const staffCount = employments.filter(
                    (e) => e.branch === branch.id && e.status === 'active',
                  ).length
                  const today = new Date()
                  const todayShifts = shifts.filter(
                    (s) => s.branch === branch.id && isSameDay(s.start_time, today),
                  ).length
                  const isOperating = branch.status === 'active'

                  return (
                    <div
                      key={branch.id}
                      className={`rounded-xl border p-4 ${
                        isOperating ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isOperating ? 'bg-sky-100 text-sky-600' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-tight truncate">
                            {branch.name}
                          </p>
                          <p
                            className={`text-[11px] capitalize ${
                              isOperating ? 'text-gray-400' : 'text-amber-500 font-medium'
                            }`}
                          >
                            {isOperating ? 'Active' : branch.status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {staffCount} staff
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {todayShifts} today
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Staff by Role */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Staff by Role</h2>
              <Link to="/employees" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                Roster
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : activeStaff === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No active staff yet</p>
            ) : (
              <div className="space-y-4">
                {roleCounts.map((r) => (
                  <div key={r.key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700">{r.label}</span>
                      <span className="text-gray-500">{r.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.color} transition-all duration-500`}
                        style={{ width: `${(r.count / maxRoleCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 text-center">
              {activeStaff} active {activeStaff === 1 ? 'employee' : 'employees'} total
            </p>
          </div>

          {/* Pending Leave Requests */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Pending Leave</h2>
              {pendingLeaves.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {pendingLeaves.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div className="text-center py-6">
                <CalendarOff className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.slice(0, 4).map((lr, idx) => {
                  const isBusy = reviewingId === lr.id
                  return (
                    <div
                      key={lr.id}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            AVATAR_COLORS[idx % AVATAR_COLORS.length]
                          }`}
                        >
                          <span className="text-white text-[10px] font-semibold">
                            {getInitials(lr)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 leading-tight">
                            {getDisplayName(lr)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                LEAVE_COLORS[lr.leave_type] ?? 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {LEAVE_LABELS[lr.leave_type] ?? lr.leave_type}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {lr.start_date === lr.end_date
                                ? lr.start_date
                                : `${lr.start_date} – ${lr.end_date}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={() => handleApprove(lr.id)}
                            disabled={isBusy}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(lr.id)}
                            disabled={isBusy}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {pendingLeaves.length > 4 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    +{pendingLeaves.length - 4} more
                  </p>
                )}
              </div>
            )}

            <Link
              to="/leave-requests"
              className="mt-4 w-full block text-center border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Leave Requests
            </Link>
          </div>
        </div>
      </div>

      {/* Activity Feed — full width below main grid */}
      {canManage && <ActivityFeed />}
    </div>
  )
}
