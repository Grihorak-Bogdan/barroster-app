import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  MoreHorizontal,
  Building2,
  Pencil,
  Trash2,
  CalendarOff,
} from 'lucide-react'
import { getEmployments, deleteEmployment } from '../api/employments'
import { getLeaveRequests } from '../api/leaves'
import { ForbiddenError } from '../api/client'
import type { Employment } from '../types/employment'
import type { LeaveRequest } from '../types/leave'
import Badge, { statusVariant, statusLabel } from '../components/ui/Badge'
import EmploymentDrawer from '../components/employment/EmploymentDrawer'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { AVATAR_COLORS, ROLE_LABELS, getDisplayName, getInitials } from '../utils/ui'

const PAGE_SIZE = 8

function compensationLabel(emp: Employment): string {
  const comp = emp.compensations?.[0]
  if (!comp) return '—'
  if (comp.payment_type === 'hourly' && comp.hourly_rate)
    return `$${comp.hourly_rate}/hr`
  if (comp.payment_type === 'monthly' && comp.base_salary)
    return `$${comp.base_salary}/mo`
  if (comp.payment_type === 'shift_based') return 'Shift-based'
  return comp.payment_type
}

function scheduleLabel(emp: Employment): string {
  if (emp.status === 'suspended' && emp.end_date)
    return `Returns: ${emp.end_date}`
  return `Since ${emp.hire_date}`
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1">
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function EmployeesPage() {
  const { toast } = useToast()
  const { canManage } = useRole()
  const [employments, setEmployments] = useState<Employment[]>([])
  const [leaveMap, setLeaveMap] = useState<Map<string, LeaveRequest[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employment | null>(null)
  const [deleting, setDeleting] = useState(false)

  function loadEmployments() {
    setLoading(true)
    Promise.all([getEmployments(), getLeaveRequests()])
      .then(([emps, leaves]) => {
        setEmployments(emps)
        const map = new Map<string, LeaveRequest[]>()
        for (const l of leaves) {
          if (l.status === 'pending' || l.status === 'approved') {
            if (!map.has(l.user)) map.set(l.user, [])
            map.get(l.user)!.push(l)
          }
        }
        setLeaveMap(map)
      })
      .catch((err) => { if (!(err instanceof ForbiddenError)) toast('Failed to load employees.', 'error') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEmployments()
  }, [])

  const today = new Date().toISOString().split('T')[0]

  function leaveStatus(userId: string): 'on_leave' | 'pending' | null {
    const leaves = leaveMap.get(userId) ?? []
    if (leaves.some((l) => l.status === 'approved' && l.start_date <= today && l.end_date >= today))
      return 'on_leave'
    if (leaves.some((l) => l.status === 'pending')) return 'pending'
    return null
  }

  function openCreate() {
    setEditTarget(null)
    setDrawerOpen(true)
  }

  function openEdit(emp: Employment) {
    setEditTarget(emp)
    setDrawerOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteEmployment(deleteTarget.id)
      setEmployments((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast('Employment deleted')
      setDeleteTarget(null)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to delete employment.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = employments.filter((e) => {
    const q = search.toLowerCase()
    return (
      e.user_email.toLowerCase().includes(q) ||
      e.branch_name?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q)
    )
  })

  const totalStaff = employments.length
  const activeNow = employments.filter((e) => e.status === 'active').length
  const onLeave = employments.filter((e) => e.status === 'suspended').length
  const missingShifts = Math.max(0, Math.floor(totalStaff * 0.02))

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const STATS = [
    { label: 'Total Staff', value: totalStaff, icon: Users, iconBg: 'bg-blue-50 text-blue-500' },
    { label: 'Active Now', value: activeNow, icon: UserCheck, iconBg: 'bg-emerald-50 text-emerald-500' },
    { label: 'On Leave', value: onLeave, icon: Clock, iconBg: 'bg-amber-50 text-amber-500' },
    { label: 'Missing Shifts', value: missingShifts, icon: AlertCircle, iconBg: 'bg-red-50 text-red-500' },
  ]

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage staff, roles, and shift assignments across all branches.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employment
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, role, branch..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          {['All Branches', 'All Roles', 'All Statuses'].map((f) => (
            <button
              key={f}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {f}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 w-8">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              </th>
              {['Employee', 'Role & Branch', 'Status', 'Compensation', 'Hire Date', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3.5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  {search ? 'No employees match your search.' : 'No employees yet. Add the first one.'}
                </td>
              </tr>
            ) : (
              paged.map((emp, idx) => {
                const realIdx = (page - 1) * PAGE_SIZE + idx
                const avatarColor = AVATAR_COLORS[realIdx % AVATAR_COLORS.length]
                const name = getDisplayName(emp)
                const init = getInitials(emp)
                const comp = compensationLabel(emp)
                const schedule = scheduleLabel(emp)
                const sv = statusVariant(emp.status)
                const sl = statusLabel(emp.status)

                const ls = leaveStatus(emp.user)
                return (
                  <tr
                    key={emp.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${avatarColor}`}>
                          <span className="text-white text-xs font-semibold">{init}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                            {ls === 'on_leave' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                <CalendarOff className="w-2.5 h-2.5" />
                                On Leave
                              </span>
                            )}
                            {ls === 'pending' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                                <CalendarOff className="w-2.5 h-2.5" />
                                Leave Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">ID: EMP-{emp.id.slice(0, 3).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {emp.position || ROLE_LABELS[emp.role] || emp.role}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {emp.branch_name || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={sv} dot>{sl}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{comp}</p>
                      {emp.compensations?.[0]?.payment_type === 'hourly' && (
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-gray-500">{schedule}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {canManage && (
                        <RowMenu onEdit={() => openEdit(emp)} onDelete={() => setDeleteTarget(emp)} />
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {Math.min((page - 1) * PAGE_SIZE + 1, total)}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-700">{Math.min(page * PAGE_SIZE, total)}</span>{' '}
            of <span className="font-medium text-gray-700">{total}</span> employees
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <EmploymentDrawer
        open={drawerOpen}
        employment={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false)
          toast(editTarget ? 'Employment updated' : 'Employment created')
          loadEmployments()
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Employment"
        message={`Remove ${deleteTarget ? deleteTarget.user_email : ''} from this organization? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
