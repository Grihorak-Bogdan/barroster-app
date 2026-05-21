import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, DollarSign, FileText, CheckCircle2, Banknote,
  Building2, X, MoreHorizontal, RefreshCw, Trash2,
  Filter, ChevronDown,
} from 'lucide-react'
import {
  getPayrollPeriods, createPayrollPeriod, deletePayrollPeriod,
  generatePayroll, approvePayroll, markPayrollPaid,
} from '../api/payroll'
import { getBranches } from '../api/branches'
import { ForbiddenError } from '../api/client'
import type { PayrollPeriod, PayrollFrequency, PayrollPeriodPayload, PayrollStatus } from '../types/payroll'
import type { Branch } from '../types/branch'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { formatDate as fmtDate, formatCurrency as fmt } from '../utils/format'

const STATUS_META: Record<PayrollStatus, { variant: 'amber' | 'blue' | 'green'; label: string }> = {
  draft:    { variant: 'amber', label: 'Draft' },
  approved: { variant: 'blue',  label: 'Approved' },
  paid:     { variant: 'green', label: 'Paid' },
}

const FREQ_LABELS: Record<PayrollFrequency, string> = {
  weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly',
}

function endDateFor(start: string, freq: PayrollFrequency): string {
  const d = new Date(start + 'T00:00:00')
  if (freq === 'weekly')   d.setDate(d.getDate() + 6)
  if (freq === 'biweekly') d.setDate(d.getDate() + 13)
  if (freq === 'monthly')  d.setMonth(d.getMonth() + 1, 0)
  return d.toISOString().slice(0, 10)
}

function sumAmount(list: PayrollPeriod[]): number {
  return list.reduce((s, p) => s + Number(p.total_amount), 0)
}

// ── PeriodRowMenu ──────────────────────────────────────────────────────────────

function PeriodRowMenu({
  period, onGenerate, onApprove, onMarkPaid, onDelete,
}: {
  period: PayrollPeriod
  onGenerate: () => void
  onApprove: () => void
  onMarkPaid: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
          <Link
            to={`/payroll/${period.id}`}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Details
          </Link>

          {period.status === 'draft' && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setOpen(false); onGenerate() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Generate Records
              </button>
              {period.record_count > 0 && (
                <button
                  onClick={() => { setOpen(false); onApprove() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setOpen(false); onDelete() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}

          {period.status === 'approved' && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setOpen(false); onMarkPaid() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Banknote className="w-3.5 h-3.5" /> Mark as Paid
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── CreateModal ────────────────────────────────────────────────────────────────

function CreateModal({ branches, onClose, onCreated }: {
  branches: Branch[]
  onClose: () => void
  onCreated: (p: PayrollPeriod) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [branchId, setBranchId] = useState('')
  const [frequency, setFrequency] = useState<PayrollFrequency>('monthly')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(endDateFor(today, 'monthly'))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFreqChange(f: PayrollFrequency) {
    setFrequency(f)
    setEndDate(endDateFor(startDate, f))
  }

  function handleStartChange(s: string) {
    setStartDate(s)
    setEndDate(endDateFor(s, frequency))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return }
    if (endDate < startDate) { setError('End date must be after start date.'); return }
    setSaving(true)
    try {
      const payload: PayrollPeriodPayload = {
        frequency, start_date: startDate, end_date: endDate,
        branch: branchId || null, notes,
      }
      const created = await createPayrollPeriod(payload)
      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof ForbiddenError ? 'Access denied.' : 'Failed to create payroll period.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">New Payroll Period</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
            <div className="relative">
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className={inputCls + ' appearance-none pr-8'}
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'biweekly', 'monthly'] as PayrollFrequency[]).map(f => (
                <button
                  key={f} type="button" onClick={() => handleFreqChange(f)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    frequency === f
                      ? 'border-sky-400 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
              <input type="date" value={startDate} onChange={e => handleStartChange(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes…" className={inputCls + ' resize-none'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── SummaryCard ────────────────────────────────────────────────────────────────

function SummaryCard({
  label, count, amount, icon: Icon, iconCls, amountCls, loading, active, onClick,
}: {
  label: string
  count: number
  amount: number
  icon: React.ElementType
  iconCls: string
  amountCls?: string
  loading: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-xl border shadow-sm p-4 transition-all ${
        active
          ? 'border-sky-400 ring-1 ring-sky-400/30 shadow-sky-100'
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className={`text-2xl font-bold ${amountCls ?? 'text-gray-900'}`}>
            {amount > 0 ? fmt(amount) : count > 0 ? fmt(0) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {count === 0 ? 'No periods' : `${count} period${count !== 1 ? 's' : ''}`}
          </p>
        </>
      )}
    </button>
  )
}

// ── PayrollPage ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { toast } = useToast()
  const { canManage } = useRole()

  // Data
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  // Filters (client-side — full dataset loaded once)
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | ''>('')
  const [branchFilter, setBranchFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Modals / actions
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PayrollPeriod | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPayrollPeriods(), getBranches()])
      .then(([p, b]) => { setPeriods(p); setBranches(b) })
      .catch(err => { if (!(err instanceof ForbiddenError)) toast('Failed to load payroll data.', 'error') })
      .finally(() => setLoading(false))
  }, [])

  // ── Computed ───────────────────────────────────────────────────────────────

  const byStatus = useMemo(() => ({
    draft:    periods.filter(p => p.status === 'draft'),
    approved: periods.filter(p => p.status === 'approved'),
    paid:     periods.filter(p => p.status === 'paid'),
  }), [periods])

  const filteredPeriods = useMemo(() => {
    return periods.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      if (branchFilter && p.branch !== branchFilter) return false
      if (fromDate && p.start_date < fromDate) return false
      if (toDate && p.end_date > toDate) return false
      return true
    })
  }, [periods, statusFilter, branchFilter, fromDate, toDate])

  const hasFilters = !!(statusFilter || branchFilter || fromDate || toDate)

  function clearFilters() {
    setStatusFilter('')
    setBranchFilter('')
    setFromDate('')
    setToDate('')
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleGenerate(id: string) {
    setActingId(id)
    try {
      const updated = await generatePayroll(id)
      setPeriods(prev => prev.map(p =>
        p.id === id ? { ...updated, records: undefined as never, record_count: updated.records.length, total_amount: updated.total_amount } : p
      ))
      toast(`Generated ${updated.records.length} records`)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to generate records.', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleApprove(id: string) {
    setActingId(id)
    try {
      const updated = await approvePayroll(id)
      setPeriods(prev => prev.map(p => p.id === id ? updated : p))
      toast('Payroll period approved')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to approve.', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleMarkPaid(id: string) {
    setActingId(id)
    try {
      const updated = await markPayrollPaid(id)
      setPeriods(prev => prev.map(p => p.id === id ? updated : p))
      toast('Marked as paid')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to mark as paid.', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePayrollPeriod(deleteTarget.id)
      setPeriods(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast('Payroll period deleted')
      setDeleteTarget(null)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to delete.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white'

  return (
    <div className="p-6 max-w-[1400px]">
      {showCreate && (
        <CreateModal
          branches={branches}
          onClose={() => setShowCreate(false)}
          onCreated={p => setPeriods(prev => [p, ...prev])}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Payroll Period"
        message={`Delete payroll period ${deleteTarget?.start_date} – ${deleteTarget?.end_date}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage pay periods, generate records, approve and pay.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Period
          </button>
        )}
      </div>

      {/* Summary cards — always over full dataset */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <SummaryCard
          label="All Periods"
          count={periods.length}
          amount={sumAmount(periods)}
          icon={DollarSign}
          iconCls="bg-slate-100 text-slate-600"
          loading={loading}
          active={statusFilter === ''}
          onClick={() => setStatusFilter('')}
        />
        <SummaryCard
          label="Draft"
          count={byStatus.draft.length}
          amount={sumAmount(byStatus.draft)}
          icon={FileText}
          iconCls="bg-amber-100 text-amber-600"
          amountCls="text-amber-700"
          loading={loading}
          active={statusFilter === 'draft'}
          onClick={() => setStatusFilter(v => v === 'draft' ? '' : 'draft')}
        />
        <SummaryCard
          label="Approved"
          count={byStatus.approved.length}
          amount={sumAmount(byStatus.approved)}
          icon={CheckCircle2}
          iconCls="bg-blue-100 text-blue-600"
          amountCls="text-blue-700"
          loading={loading}
          active={statusFilter === 'approved'}
          onClick={() => setStatusFilter(v => v === 'approved' ? '' : 'approved')}
        />
        <SummaryCard
          label="Paid"
          count={byStatus.paid.length}
          amount={sumAmount(byStatus.paid)}
          icon={Banknote}
          iconCls="bg-emerald-100 text-emerald-600"
          amountCls="text-emerald-700"
          loading={loading}
          active={statusFilter === 'paid'}
          onClick={() => setStatusFilter(v => v === 'paid' ? '' : 'paid')}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-medium uppercase tracking-wide">Filter</span>
        </div>

        {/* Branch */}
        <div className="relative">
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className={inputCls + ' pr-8 appearance-none'}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className={inputCls}
            title="Period start from"
          />
          <span className="text-gray-300 text-sm">→</span>
          <input
            type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className={inputCls}
            title="Period end to"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}

        {hasFilters && (
          <span className="text-xs text-gray-400 ml-auto">
            {filteredPeriods.length} of {periods.length} periods
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                ['Period', 'text-left'],
                ['Branch', 'text-left'],
                ['Frequency', 'text-left'],
                ['Status', 'text-left'],
                ['Records', 'text-right'],
                ['Total Amount', 'text-right'],
                ['Actions', 'text-right'],
              ].map(([h, align]) => (
                <th key={h} className={`text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 ${align}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredPeriods.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  {hasFilters ? 'No periods match the current filters.' : 'No payroll periods yet. Create your first one.'}
                </td>
              </tr>
            ) : (
              filteredPeriods.map(period => {
                const sm = STATUS_META[period.status]
                const isBusy = actingId === period.id
                return (
                  <tr key={period.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to={`/payroll/${period.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-sky-600 transition-colors"
                      >
                        {fmtDate(period.start_date)} – {fmtDate(period.end_date)}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{period.created_by_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {period.branch_name ?? 'All Branches'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {FREQ_LABELS[period.frequency]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={sm.variant} dot>{sm.label}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-gray-700">{period.record_count}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-semibold ${period.record_count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {period.record_count > 0 ? fmt(period.total_amount) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isBusy ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Working…
                        </div>
                      ) : canManage ? (
                        <PeriodRowMenu
                          period={period}
                          onGenerate={() => handleGenerate(period.id)}
                          onApprove={() => handleApprove(period.id)}
                          onMarkPaid={() => handleMarkPaid(period.id)}
                          onDelete={() => setDeleteTarget(period)}
                        />
                      ) : null}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer totals — shown when viewing paid periods */}
        {!loading && filteredPeriods.some(p => p.status === 'paid') && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Total paid
              {statusFilter !== 'paid' && ` (paid periods in current view)`}
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {fmt(sumAmount(filteredPeriods.filter(p => p.status === 'paid')))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
