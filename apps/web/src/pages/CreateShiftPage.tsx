import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Info,
  Clock,
  FileText,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { getBranches } from '../api/branches'
import { createShift, updateShift, getShift } from '../api/shifts'
import { ForbiddenError } from '../api/client'
import type { Branch } from '../types/branch'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { useAuth } from '../contexts/AuthContext'

const SHIFT_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function isoToDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA')
}

function isoToTime(iso: string): string {
  const d = new Date(iso)
  return d.toTimeString().slice(0, 5)
}

export default function CreateShiftPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { loading: authLoading } = useAuth()
  const { canManage } = useRole()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = !!editId

  useEffect(() => {
    if (!authLoading && !canManage) {
      toast("Only managers and owners can create shifts.", 'error')
      navigate('/shifts', { replace: true })
    }
  }, [authLoading, canManage])

  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingEdit, setLoadingEdit] = useState(isEdit)

  const [branch, setBranch] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState('planned')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getBranches().then(setBranches).catch(() => toast('Failed to load branches.', 'error'))
  }, [])

  useEffect(() => {
    if (!editId) return
    getShift(editId)
      .then((shift) => {
        setBranch(shift.branch)
        setDate(isoToDate(shift.start_time))
        setStartTime(isoToTime(shift.start_time))
        setEndTime(isoToTime(shift.end_time))
        setStatus(shift.status)
        setNotes(shift.note ?? '')
      })
      .catch(() => setErrors({ form: 'Failed to load shift for editing.' }))
      .finally(() => setLoadingEdit(false))
  }, [editId])

  function validate() {
    const e: Record<string, string> = {}
    if (!branch) e.branch = 'Branch is required'
    if (!date) e.date = 'Date is required'
    if (!startTime) e.startTime = 'Start time is required'
    if (!endTime) e.endTime = 'End time is required'
    if (startTime && endTime && startTime >= endTime)
      e.endTime = 'End time must be after start time'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setErrors({})
    try {
      const start_time = new Date(`${date}T${startTime}`).toISOString()
      const end_time = new Date(`${date}T${endTime}`).toISOString()
      const payload = { branch, start_time, end_time, status, note: notes || undefined }

      if (isEdit && editId) {
        await updateShift(editId, payload)
        toast('Shift updated')
        navigate(`/shifts/${editId}`)
      } else {
        const created = await createShift(payload)
        toast('Shift created')
        navigate(`/shifts/${created.id}`)
      }
    } catch (err) {
      if (err instanceof ForbiddenError) return
      setErrors({ form: `Failed to ${isEdit ? 'save' : 'create'} shift. Please try again.` })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white'
  const selectCls = inputCls + ' appearance-none pr-8 cursor-pointer'
  const errBorder = (field: string) => errors[field] ? 'border-red-400 focus:ring-red-400' : ''

  if (loadingEdit) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to={isEdit && editId ? `/shifts/${editId}` : '/shifts'}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Shift' : 'Create New Shift'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? 'Update the shift details below' : 'Fill in the details to schedule a new shift'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={isEdit && editId ? `/shifts/${editId}` : '/shifts'}
            className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            form="shift-form"
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? '✓ Save Changes' : '✓ Create Shift'}
          </button>
        </div>
      </div>

      {errors.form && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errors.form}
        </div>
      )}

      <form id="shift-form" onSubmit={handleSave} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
            <span className="text-xs text-gray-400 ml-auto">* Required fields</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Branch Location *
              </label>
              <div className="relative">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={`${selectCls} ${errBorder('branch')}`}
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={selectCls}
                  >
                    {SHIFT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-semibold text-gray-900">Date &amp; Time</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shift Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputCls} ${errBorder('date')}`}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`${inputCls} ${errBorder('startTime')}`}
                />
                {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`${inputCls} ${errBorder('endTime')}`}
                />
                {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {date && startTime && endTime && startTime < endTime && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration:{' '}
                {Math.round(
                  (new Date(`${date}T${endTime}`).getTime() -
                    new Date(`${date}T${startTime}`).getTime()) /
                    3600000,
                )}{' '}
                hours
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any special instructions, requirements, or notes for this shift..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </div>
  )
}
