import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Search,
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  X,
  FileText,
} from 'lucide-react'
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from '../api/leaves'
import { getEmployments } from '../api/employments'
import type { LeaveRequest, LeaveType } from '../types/leave'
import type { Employment } from '../types/employment'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { ForbiddenError } from '../api/client'
import ConfirmModal from '../components/ui/ConfirmModal'
import Drawer, { DrawerFooter } from '../components/ui/Drawer'
import { AVATAR_COLORS, getDisplayName, getInitials } from '../utils/ui'
import { formatDate } from '../utils/format'

// ─── helpers ────────────────────────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  day_off: 'Day Off',
  vacation: 'Vacation',
  sick_leave: 'Sick Leave',
}

const LEAVE_TYPE_STYLES: Record<LeaveType, string> = {
  day_off: 'bg-sky-50 text-sky-700 border-sky-200',
  vacation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sick_leave: 'bg-amber-50 text-amber-700 border-amber-200',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: XCircle,
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 86400000) + 1
}

// ─── Row menu ────────────────────────────────────────────────────────────────

function RowMenu({
  status,
  onApprove,
  onReject,
  onCancel,
}: {
  status: string
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const isPending = status === 'pending'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1">
          {isPending && (
            <>
              <button
                onClick={() => { setOpen(false); onApprove() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => { setOpen(false); onReject() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
          {(status === 'pending' || status === 'approved') && (
            <button
              onClick={() => { setOpen(false); onCancel() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Create Drawer ────────────────────────────────────────────────────────────

function CreateLeaveDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (leave: LeaveRequest) => void
}) {
  const { toast } = useToast()
  const [employments, setEmployments] = useState<Employment[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employment: '',
    leave_type: 'vacation' as LeaveType,
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    if (!open) return
    getEmployments().then(setEmployments).catch(() => {})
    setForm({ employment: '', leave_type: 'vacation', start_date: '', end_date: '', reason: '' })
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.start_date || !form.end_date) return
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast('End date must be on or after start date.', 'error')
      return
    }
    setSaving(true)
    try {
      const created = await createLeaveRequest({
        employment: form.employment || null,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      })
      toast('Leave request submitted')
      onCreated(created)
    } catch {
      toast('Failed to submit leave request.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      title="New Leave Request"
      subtitle="Submit a time-off request"
      onClose={onClose}
      footer={
        <DrawerFooter
          confirmLabel="Submit Request"
          loadingLabel="Submitting..."
          loading={saving}
          disabled={!form.start_date || !form.end_date}
          onCancel={onClose}
          onConfirm={handleSubmit as unknown as () => void}
        />
      }
    >
      <div className="px-6 py-5 space-y-4">
        {/* Leave type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Leave Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, leave_type: value }))}
                className={`py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                  form.leave_type === value
                    ? LEAVE_TYPE_STYLES[value]
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Duration preview */}
        {form.start_date && form.end_date && new Date(form.end_date) >= new Date(form.start_date) && (
          <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <CalendarOff className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-xs text-sky-700 font-medium">
              {daysBetween(form.start_date, form.end_date)} day{daysBetween(form.start_date, form.end_date) !== 1 ? 's' : ''} off
            </span>
          </div>
        )}

        {/* Employment (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Employment <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={form.employment}
            onChange={(e) => setForm((f) => ({ ...f, employment: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="">— Not specified —</option>
            {employments.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.branch_name} — {emp.position || emp.role}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={3}
            placeholder="Briefly describe the reason for your request..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>
    </Drawer>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function LeaveRequestsPage() {
  const { toast } = useToast()
  const { canManage } = useRole()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    action: 'approve' | 'reject' | 'cancel'
  } | null>(null)
  const [actioning, setActioning] = useState(false)

  function load() {
    setLoading(true)
    getLeaveRequests()
      .then(setRequests)
      .catch((err) => { if (!(err instanceof ForbiddenError)) toast('Failed to load leave requests.', 'error') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = requests.filter((r) => {
    if (tab && r.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      const name = getDisplayName(r).toLowerCase()
      return name.includes(q) || r.user_email.toLowerCase().includes(q) || r.leave_type.includes(q)
    }
    return true
  })

  const pending = requests.filter((r) => r.status === 'pending').length
  const approved = requests.filter((r) => r.status === 'approved').length
  const rejected = requests.filter((r) => r.status === 'rejected').length

  async function executeAction() {
    if (!confirmAction) return
    setActioning(true)
    try {
      let updated: LeaveRequest
      if (confirmAction.action === 'approve') updated = await approveLeaveRequest(confirmAction.id)
      else if (confirmAction.action === 'reject') updated = await rejectLeaveRequest(confirmAction.id)
      else updated = await cancelLeaveRequest(confirmAction.id)

      setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r))
      toast(
        confirmAction.action === 'approve'
          ? 'Leave request approved'
          : confirmAction.action === 'reject'
          ? 'Leave request rejected'
          : 'Leave request cancelled',
      )
      setConfirmAction(null)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Action failed. Please try again.', 'error')
    } finally {
      setActioning(false)
    }
  }

  const ACTION_META = {
    approve: { title: 'Approve Request', message: 'Approve this leave request?', confirmLabel: 'Approve', danger: false },
    reject: { title: 'Reject Request', message: 'Reject this leave request?', confirmLabel: 'Reject', danger: true },
    cancel: { title: 'Cancel Request', message: 'Cancel this leave request?', confirmLabel: 'Cancel Request', danger: true },
  }

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {canManage ? 'Leave Requests' : 'My Leave Requests'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {canManage
              ? 'Manage time-off, vacations, and sick leave across all staff.'
              : 'View your time-off history and submit new requests.'}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Pending Review', value: pending, icon: Clock, bg: 'bg-amber-50 text-amber-500', text: 'text-amber-700' },
          { label: 'Approved', value: approved, icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-500', text: 'text-emerald-700' },
          { label: 'Rejected', value: rejected, icon: XCircle, bg: 'bg-red-50 text-red-500', text: 'text-red-700' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs + search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.value
                    ? 'border-[#0F172A] text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.value === 'pending' && pending > 0 && (
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          {canManage && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-52"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {(canManage
                ? ['Employee', 'Type', 'Dates', 'Duration', 'Branch / Position', 'Status', 'Actions']
                : ['Type', 'Dates', 'Duration', 'Branch / Position', 'Status']
              ).map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"
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
                  {[...Array(canManage ? 7 : 5)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 5} className="text-center py-16 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">{search ? 'No requests match your search.' : 'No leave requests yet.'}</p>
                  {!search && (
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="text-xs text-sky-600 hover:underline mt-1 inline-block"
                    >
                      Submit the first request
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((leave, idx) => {
                const name = getDisplayName(leave)
                const init = getInitials(leave)
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                const days = daysBetween(leave.start_date, leave.end_date)
                const StatusIcon = STATUS_ICONS[leave.status]

                return (
                  <tr key={leave.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <span className="text-white text-xs font-semibold">{init}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">{leave.user_email}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${LEAVE_TYPE_STYLES[leave.leave_type]}`}>
                        {LEAVE_TYPE_LABELS[leave.leave_type]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{formatDate(leave.start_date)}</p>
                      {leave.start_date !== leave.end_date && (
                        <p className="text-xs text-gray-400">→ {formatDate(leave.end_date)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 font-medium">{days}d</p>
                    </td>
                    <td className="px-5 py-4">
                      {leave.employment_branch_name ? (
                        <>
                          <p className="text-sm text-gray-700">{leave.employment_branch_name}</p>
                          <p className="text-xs text-gray-400">{leave.employment_position || '—'}</p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[leave.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusLabel(leave.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <RowMenu
                          status={leave.status}
                          onApprove={() => setConfirmAction({ id: leave.id, action: 'approve' })}
                          onReject={() => setConfirmAction({ id: leave.id, action: 'reject' })}
                          onCancel={() => setConfirmAction({ id: leave.id, action: 'cancel' })}
                        />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{filtered.length}</span> request{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <CreateLeaveDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(leave) => {
          setRequests((prev) => [leave, ...prev])
          setDrawerOpen(false)
        }}
      />

      {confirmAction && (
        <ConfirmModal
          open
          title={ACTION_META[confirmAction.action].title}
          message={ACTION_META[confirmAction.action].message}
          confirmLabel={ACTION_META[confirmAction.action].confirmLabel}
          danger={ACTION_META[confirmAction.action].danger}
          loading={actioning}
          onConfirm={executeAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
