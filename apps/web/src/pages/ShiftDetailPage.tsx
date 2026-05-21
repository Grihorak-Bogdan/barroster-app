import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  X,
  Pencil,
  Clock,
  MapPin,
  UserPlus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarOff,
  AlertTriangle,
  ChevronDown,
  Check,
} from 'lucide-react'
import {
  getShift, updateShift, updateAssignment,
  checkInAssignment, checkOutAssignment, deleteAssignment, deleteShift, createShift,
} from '../api/shifts'
import type { Shift, ShiftAssignment } from '../types/shift'
import Badge, { statusVariant, statusLabel } from '../components/ui/Badge'
import AssignStaffModal from '../components/shifts/AssignStaffModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { ForbiddenError } from '../api/client'
import { AVATAR_COLORS, getDisplayName, getInitials } from '../utils/ui'
import { formatDateShort, formatTime, diffHours } from '../utils/format'

function formatDateTime(dt: string) {
  const d = new Date(dt)
  return {
    date: formatDateShort(d),
    time: formatTime(dt),
    full: formatTime(dt),
  }
}

function toHHMM(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

function buildDateTimes(baseIso: string, startHHMM: string, endHHMM: string) {
  const base = new Date(baseIso)
  const [sh, sm] = startHHMM.split(':').map(Number)
  const [eh, em] = endHHMM.split(':').map(Number)
  const startDt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm, 0)
  let endDt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em, 0)
  // Overnight shift: if end <= start, end is next day
  if (endDt <= startDt) {
    endDt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, eh, em, 0)
  }
  return { startISO: startDt.toISOString(), endISO: endDt.toISOString() }
}

function AssignmentRowMenu({
  onRemove,
  onEditHours,
}: {
  onRemove: () => void
  onEditHours: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1">
          <button
            onClick={() => { setOpen(false); onEditHours() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Edit Hours
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { setOpen(false); onRemove() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove from Shift
          </button>
        </div>
      )}
    </div>
  )
}

type ShiftStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled'

const STATUS_TRANSITIONS: Record<ShiftStatus, { value: ShiftStatus; label: string; cls: string }[]> = {
  planned:   [
    { value: 'confirmed', label: 'Confirm shift',  cls: 'text-emerald-700 hover:bg-emerald-50' },
    { value: 'cancelled', label: 'Cancel shift',   cls: 'text-red-600 hover:bg-red-50' },
  ],
  confirmed: [
    { value: 'completed', label: 'Mark completed', cls: 'text-sky-700 hover:bg-sky-50' },
    { value: 'cancelled', label: 'Cancel shift',   cls: 'text-red-600 hover:bg-red-50' },
  ],
  completed: [],
  cancelled: [],
}

function StatusSelector({
  status, onSelect, updating,
}: {
  status: string
  onSelect: (s: ShiftStatus) => void
  updating: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const transitions = STATUS_TRANSITIONS[status as ShiftStatus] ?? []

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (transitions.length === 0) {
    return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={updating}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
          statusVariant(status) === 'green'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : statusVariant(status) === 'blue'
            ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
            : statusVariant(status) === 'gray'
            ? 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
        }`}
      >
        {updating ? (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
        {statusLabel(status)}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
          {transitions.map((t) => (
            <button
              key={t.value}
              onClick={() => { setOpen(false); onSelect(t.value) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${t.cls}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inline hours editor for an assignment row ─────────────────────────────────

function HoursEditor({
  assignment,
  shiftStartIso,
  onSave,
  onCancel,
}: {
  assignment: ShiftAssignment
  shiftStartIso: string
  onSave: (startISO: string, endISO: string) => Promise<void>
  onCancel: () => void
}) {
  const [startTime, setStartTime] = useState(toHHMM(assignment.start_time) || toHHMM(shiftStartIso))
  const [endTime, setEndTime] = useState(toHHMM(assignment.end_time) || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!startTime || !endTime) return
    setSaving(true)
    const { startISO, endISO } = buildDateTimes(
      assignment.start_time ?? shiftStartIso,
      startTime,
      endTime,
    )
    await onSave(startISO, endISO)
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1">
        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="text-xs font-medium text-gray-800 border-none outline-none bg-transparent w-[72px]"
        />
        <span className="text-gray-400 text-xs">–</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="text-xs font-medium text-gray-800 border-none outline-none bg-transparent w-[72px]"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !startTime || !endTime}
        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ShiftDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { canManage } = useRole()
  const [shift, setShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  // Inline note editing
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState('')

  // Inline assignment hours editing
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null)

  function loadShift() {
    if (!id) return
    getShift(id)
      .then((s) => { setShift(s); setNoteValue(s.note ?? '') })
      .catch(() => setFetchError('Shift not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadShift() }, [id])

  async function handleCheckIn(assignment: ShiftAssignment) {
    try {
      const updated = await checkInAssignment(assignment.id)
      setShift((prev) =>
        prev ? { ...prev, assignments: prev.assignments.map((a) => a.id === updated.id ? updated : a) } : prev,
      )
      toast('Checked in successfully')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to mark check-in.', 'error')
    }
  }

  async function handleCheckOut(assignment: ShiftAssignment) {
    try {
      const updated = await checkOutAssignment(assignment.id)
      setShift((prev) =>
        prev ? { ...prev, assignments: prev.assignments.map((a) => a.id === updated.id ? updated : a) } : prev,
      )
      toast('Checked out successfully')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to mark check-out.', 'error')
    }
  }

  async function handleRemove(assignmentId: string) {
    try {
      await deleteAssignment(assignmentId)
      setShift((prev) =>
        prev
          ? { ...prev, assignments: prev.assignments.filter((a) => a.id !== assignmentId) }
          : prev,
      )
      toast('Staff removed from shift')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to remove assignment.', 'error')
    }
  }

  async function handleSaveHours(assignmentId: string, startISO: string, endISO: string) {
    try {
      const updated = await updateAssignment(assignmentId, { start_time: startISO, end_time: endISO })
      setShift((prev) =>
        prev ? { ...prev, assignments: prev.assignments.map((a) => a.id === updated.id ? updated : a) } : prev,
      )
      setEditingHoursId(null)
      toast('Hours updated')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to update hours.', 'error')
      throw err
    }
  }

  async function handleStatusChange(newStatus: ShiftStatus) {
    if (!shift) return
    setUpdating(true)
    try {
      const updated = await updateShift(shift.id, { status: newStatus })
      setShift(updated)
      toast(`Shift ${newStatus}`)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to update shift status.', 'error')
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveNote() {
    if (!shift) return
    try {
      const updated = await updateShift(shift.id, { note: noteValue })
      setShift(updated)
      setEditingNote(false)
      toast('Notes saved')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to save notes.', 'error')
    }
  }

  async function handleDuplicate() {
    if (!shift || duplicating) return
    setDuplicating(true)
    try {
      const created = await createShift({
        branch: shift.branch,
        start_time: shift.start_time,
        end_time: shift.end_time,
        status: 'planned',
        note: shift.note ?? '',
      })
      toast('Shift duplicated')
      navigate(`/shifts/${created.id}`)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to duplicate shift.', 'error')
    } finally {
      setDuplicating(false)
    }
  }

  async function handleDeleteShift() {
    if (!shift) return
    setDeleting(true)
    try {
      await deleteShift(shift.id)
      toast('Shift cancelled successfully')
      navigate('/shifts')
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to cancel shift.', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (fetchError || !shift) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 text-sm">{fetchError || 'Shift not found.'}</p>
        <Link to="/shifts" className="text-sky-600 hover:underline text-sm mt-2 inline-block">
          ← Back to Shifts
        </Link>
      </div>
    )
  }

  const start = formatDateTime(shift.start_time)
  const end = formatDateTime(shift.end_time)
  const hours = diffHours(shift.start_time, shift.end_time)
  const sv = statusVariant(shift.status)
  const sl = statusLabel(shift.status)
  const onLeaveUserIds = new Set((shift.conflicts ?? []).map((c) => c.user))

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Shift Details</h1>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <Copy className="w-4 h-4" />
              {duplicating ? 'Duplicating…' : 'Duplicate'}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 border border-red-200 text-red-600 bg-white text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel Shift
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_280px] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Shift info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg text-center shrink-0">
                  <p className="text-xs font-medium uppercase">{start.date.split(' ')[0]}</p>
                  <p className="text-xl font-bold leading-tight">{start.date.split(' ')[1]}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {shift.branch_name} Shift
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {start.full} – {end.full} ({hours}h)
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {shift.branch_name}
                    </span>
                  </div>
                </div>
              </div>
              {canManage ? (
                <StatusSelector
                  status={shift.status}
                  onSelect={handleStatusChange}
                  updating={updating}
                />
              ) : (
                <Badge variant={sv}>{sl}</Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Duration', value: `${hours} hours` },
                { label: 'Branch', value: shift.branch_name },
                { label: 'Created By', value: shift.created_by_email?.split('@')[0] || '—' },
              ].map((d) => (
                <div key={d.label}>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{d.label}</p>
                  <p className="text-sm font-medium text-gray-800">{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  Assigned Staff ({shift.assignments.length})
                </h3>
                {shift.assignments.some((a) => onLeaveUserIds.has(a.user)) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    Leave conflict
                  </span>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff
                </button>
              )}
            </div>

            {shift.assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No staff assigned yet.{' '}
                {canManage && (
                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="text-sky-600 hover:underline"
                  >
                    Add the first one.
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Employee', 'Assignment', 'Attendance', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shift.assignments.map((a, i) => {
                    const av = statusVariant(a.status)
                    const al = statusLabel(a.status)
                    const isCheckedIn = !!a.check_in_time
                    const name = getDisplayName(a)
                    const init = getInitials(a)
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    const isEditingHours = editingHoursId === a.id

                    return (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                              <span className="text-white text-xs font-semibold">{init}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-gray-800">{name}</p>
                                {onLeaveUserIds.has(a.user) && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                    <CalendarOff className="w-2.5 h-2.5" />
                                    On Leave
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{a.user_email}</p>
                              {/* Hours display or inline editor */}
                              {isEditingHours ? (
                                <HoursEditor
                                  assignment={a}
                                  shiftStartIso={shift.start_time}
                                  onSave={(s, e) => handleSaveHours(a.id, s, e)}
                                  onCancel={() => setEditingHoursId(null)}
                                />
                              ) : a.start_time && a.end_time ? (
                                <p className="text-xs text-sky-600 font-medium">
                                  {new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  {' – '}
                                  {new Date(a.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={av} dot>{al}</Badge>
                        </td>
                        <td className="py-3">
                          {a.check_out_time ? (
                            <span className="text-xs text-gray-500 font-medium">
                              Out {new Date(a.check_out_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          ) : isCheckedIn ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-600 font-medium">
                                In {new Date(a.check_in_time!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                              {canManage && (
                                <button
                                  onClick={() => handleCheckOut(a)}
                                  className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                                >
                                  Check-out
                                </button>
                              )}
                            </div>
                          ) : canManage ? (
                            <button
                              onClick={() => handleCheckIn(a)}
                              className="text-xs border border-emerald-300 text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap"
                            >
                              Mark Check-in
                            </button>
                          ) : null}
                        </td>
                        <td className="py-3 text-right">
                          {canManage && (
                            <AssignmentRowMenu
                              onEditHours={() => setEditingHoursId(a.id)}
                              onRemove={() => handleRemove(a.id)}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Shift Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Shift Notes</h3>
              {canManage && !editingNote && (
                <button
                  onClick={() => { setNoteValue(shift.note ?? ''); setEditingNote(true) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Add a note for this shift…"
                  className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="flex-1 text-xs bg-[#0F172A] text-white py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNote(false)}
                    className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed">
                {shift.note || (
                  <span className="text-gray-400 italic">No notes added.</span>
                )}
              </p>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>
            <div className="space-y-3">
              {shift.assignments.length === 0 ? (
                <div className="flex gap-2.5">
                  <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-800">Shift Created</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(shift.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                [
                  ...shift.assignments.flatMap((a) => {
                    const events = []
                    if (a.check_in_time) {
                      events.push({
                        text: `${getDisplayName(a)} checked in`,
                        time: new Date(a.check_in_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                        done: true,
                      })
                    }
                    events.push({
                      text: `${getDisplayName(a)} assigned`,
                      time: new Date(shift.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      done: true,
                    })
                    return events
                  }),
                  {
                    text: 'Shift Created',
                    time: new Date(shift.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    done: false,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">{item.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {shift && (
        <AssignStaffModal
          open={assignModalOpen}
          shiftId={shift.id}
          branchId={shift.branch}
          shiftStartTime={shift.start_time}
          shiftEndTime={shift.end_time}
          existingAssignments={shift.assignments}
          onClose={() => setAssignModalOpen(false)}
          onAssigned={() => {
            setAssignModalOpen(false)
            loadShift()
          }}
        />
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Cancel Shift"
        message="Are you sure you want to cancel this shift? This action cannot be undone."
        confirmLabel="Cancel Shift"
        loading={deleting}
        onConfirm={handleDeleteShift}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}
