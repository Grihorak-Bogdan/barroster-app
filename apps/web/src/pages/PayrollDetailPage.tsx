import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, RefreshCw, CheckCircle2, Banknote,
  User, Clock, CalendarDays, AlertCircle,
} from 'lucide-react'
import {
  getPayrollPeriod, generatePayroll, approvePayroll, markPayrollPaid,
} from '../api/payroll'
import { ForbiddenError } from '../api/client'
import type { PayrollPeriodDetail, PayrollRecord } from '../types/payroll'
import Badge from '../components/ui/Badge'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { formatDate as fmtDate, formatCurrency as fmt, formatHours as fmtHours } from '../utils/format'
import { ROLE_LABELS, getDisplayName, getInitials } from '../utils/ui'

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { variant: 'amber' | 'blue' | 'green'; label: string }> = {
  draft:    { variant: 'amber', label: 'Draft' },
  approved: { variant: 'blue',  label: 'Approved' },
  paid:     { variant: 'green', label: 'Paid' },
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly',
}

const PAY_TYPE_LABELS: Record<string, string> = {
  hourly: 'Hourly', shift_based: 'Per Shift', monthly: 'Monthly',
}

// ── RecordRow ──────────────────────────────────────────────────────────────────

function RecordRow({ record }: { record: PayrollRecord }) {
  const name = getDisplayName(record)
  const initials = getInitials(record)

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">{record.user_email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-700">{record.position || '—'}</p>
        <p className="text-xs text-gray-400">{ROLE_LABELS[record.role] ?? record.role}</p>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          {PAY_TYPE_LABELS[record.payment_type ?? ''] ?? record.payment_type ?? '—'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {fmtHours(record.hours_worked)}
        </div>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="text-sm text-gray-700">{record.shifts_count}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="text-sm text-gray-700">{fmt(record.base_amount)}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className={`text-sm ${Number(record.bonus_amount) > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
          {Number(record.bonus_amount) > 0 ? `+${fmt(record.bonus_amount)}` : '—'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="text-sm font-semibold text-gray-900">{fmt(record.total_amount)}</span>
      </td>
    </tr>
  )
}

// ── PayrollDetailPage ──────────────────────────────────────────────────────────

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { canManage } = useRole()

  const [period, setPeriod] = useState<PayrollPeriodDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getPayrollPeriod(id)
      .then(setPeriod)
      .catch(err => {
        if (err instanceof ForbiddenError) return
        setError('Failed to load payroll period.')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleGenerate() {
    if (!id) return
    setActing('generate')
    try {
      const updated = await generatePayroll(id)
      setPeriod(updated)
      toast(`Generated ${updated.records.length} payroll records`)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to generate records.', 'error')
    } finally {
      setActing(null)
    }
  }

  async function handleApprove() {
    if (!id || !period) return
    setActing('approve')
    try {
      const updated = await approvePayroll(id)
      setPeriod({ ...period, ...updated })
      toast('Payroll period approved')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to approve.', 'error')
    } finally {
      setActing(null)
    }
  }

  async function handleMarkPaid() {
    if (!id || !period) return
    setActing('paid')
    try {
      const updated = await markPayrollPaid(id)
      setPeriod({ ...period, ...updated })
      toast('Marked as paid')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to mark as paid.', 'error')
    } finally {
      setActing(null)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px]">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !period) {
    return (
      <div className="p-6 max-w-[1400px]">
        <Link to="/payroll" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Payroll
        </Link>
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{error || 'Period not found.'}</p>
        </div>
      </div>
    )
  }

  const sm = STATUS_META[period.status]
  const totalAmount = period.records.reduce((s, r) => s + Number(r.total_amount), 0)
  const totalBase   = period.records.reduce((s, r) => s + Number(r.base_amount), 0)
  const totalBonus  = period.records.reduce((s, r) => s + Number(r.bonus_amount), 0)
  const totalHours  = period.records.reduce((s, r) => s + Number(r.hours_worked), 0)

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Back nav */}
      <Link to="/payroll" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Payroll
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-xl font-bold text-gray-900">
                {fmtDate(period.start_date)} – {fmtDate(period.end_date)}
              </h1>
              <Badge variant={sm.variant} dot>{sm.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {period.branch_name ?? 'All Branches'}
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                {FREQ_LABELS[period.frequency]}
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Created by {period.created_by_email}
              </div>
              {period.approved_by_email && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Approved by {period.approved_by_email}
                </div>
              )}
            </div>
            {period.notes && (
              <p className="mt-2 text-sm text-gray-500 italic">{period.notes}</p>
            )}
          </div>

          {/* Action buttons */}
          {canManage && (
            <div className="flex items-center gap-2">
              {period.status === 'draft' && (
                <button
                  onClick={handleGenerate}
                  disabled={acting !== null}
                  className="inline-flex items-center gap-2 border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${acting === 'generate' ? 'animate-spin' : ''}`} />
                  {acting === 'generate' ? 'Generating…' : 'Generate Records'}
                </button>
              )}
              {period.status === 'draft' && period.record_count > 0 && (
                <button
                  onClick={handleApprove}
                  disabled={acting !== null}
                  className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className={`w-4 h-4 ${acting === 'approve' ? 'animate-spin' : ''}`} />
                  {acting === 'approve' ? 'Approving…' : 'Approve'}
                </button>
              )}
              {period.status === 'approved' && (
                <button
                  onClick={handleMarkPaid}
                  disabled={acting !== null}
                  className="inline-flex items-center gap-2 bg-[#0F172A] text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <Banknote className={`w-4 h-4 ${acting === 'paid' ? 'animate-spin' : ''}`} />
                  {acting === 'paid' ? 'Processing…' : 'Mark as Paid'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {period.records.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Employees', value: period.records.length.toString(), suffix: '' },
            { label: 'Total Hours', value: fmtHours(String(totalHours)), suffix: '' },
            { label: 'Base Pay', value: fmt(totalBase), suffix: '' },
            { label: 'Total Payout', value: fmt(totalAmount), suffix: totalBonus > 0 ? `incl. ${fmt(totalBonus)} bonus` : '' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              {s.suffix && <p className="text-xs text-gray-400 mt-0.5">{s.suffix}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Payroll Records
            {period.records.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">({period.records.length})</span>
            )}
          </h2>
          {period.status === 'draft' && period.records.length > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Draft — regenerate to refresh
            </span>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                ['Employee', 'text-left'],
                ['Position / Role', 'text-left'],
                ['Pay Type', 'text-left'],
                ['Hours', 'text-right'],
                ['Shifts', 'text-right'],
                ['Base', 'text-right'],
                ['Bonus', 'text-right'],
                ['Total', 'text-right'],
              ].map(([h, align]) => (
                <th key={h} className={`text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 ${align}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {period.records.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-200" />
                  No records yet.{canManage && ' Click "Generate Records" to calculate payroll.'}
                </td>
              </tr>
            ) : (
              period.records.map(r => <RecordRow key={r.id} record={r} />)
            )}
          </tbody>
        </table>

        {period.records.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">{period.records.length} employees</span>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">Base <span className="font-semibold text-gray-700">{fmt(totalBase)}</span></span>
              {totalBonus > 0 && <span className="text-gray-500">Bonus <span className="font-semibold text-emerald-600">+{fmt(totalBonus)}</span></span>}
              <span className="text-gray-700">Total <span className="font-bold text-gray-900">{fmt(totalAmount)}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
