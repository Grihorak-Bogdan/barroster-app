import { useEffect, useState } from 'react'
import { X, UserPlus, Building2, Check, Loader2, CalendarOff, Clock, ChevronRight } from 'lucide-react'
import { getEmployments } from '../../api/employments'
import { createAssignment } from '../../api/shifts'
import { getApprovedLeavesOnDate } from '../../api/leaves'
import type { Employment } from '../../types/employment'
import type { ShiftAssignment } from '../../types/shift'

interface Props {
  open: boolean
  shiftId: string
  branchId: string
  shiftStartTime: string
  shiftEndTime: string
  existingAssignments: ShiftAssignment[]
  onClose: () => void
  onAssigned: () => void
}

import { AVATAR_COLORS, getDisplayName as empDisplayName, getInitials as empInitials } from '../../utils/ui'

function toLocalTime(iso: string): string {
  const d = new Date(iso)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

function buildDateTimes(shiftStartIso: string, startHHMM: string, endHHMM: string) {
  const base = new Date(shiftStartIso)
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

type Pending = { userId: string; startTime: string; endTime: string }

export default function AssignStaffModal({
  open, shiftId, branchId, shiftStartTime, shiftEndTime, existingAssignments, onClose, onAssigned,
}: Props) {
  const [employments, setEmployments] = useState<Employment[]>([])
  const [onLeaveUserIds, setOnLeaveUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    setPending(null)
    const shiftDate = shiftStartTime.split('T')[0]
    Promise.all([
      getEmployments(branchId),
      getApprovedLeavesOnDate(shiftDate),
    ])
      .then(([emps, leaves]) => {
        setEmployments(emps)
        setOnLeaveUserIds(new Set(leaves.map((l) => l.user)))
      })
      .catch(() => setError('Failed to load staff.'))
      .finally(() => setLoading(false))
  }, [open, branchId, shiftStartTime])

  const assignedUserIds = new Set(existingAssignments.map((a) => a.user))

  function openPicker(emp: Employment) {
    setPending({
      userId: emp.user,
      startTime: toLocalTime(shiftStartTime),
      endTime: toLocalTime(shiftEndTime),
    })
  }

  async function handleConfirm() {
    if (!pending || assigning) return
    setAssigning(pending.userId)
    setError('')
    const emp = employments.find((e) => e.user === pending.userId)!
    const { startISO, endISO } = buildDateTimes(shiftStartTime, pending.startTime, pending.endTime)
    try {
      await createAssignment({
        shift: shiftId,
        user: pending.userId,
        start_time: startISO,
        end_time: endISO,
      })
      setPending(null)
      onAssigned()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('unique')) setError(`${empDisplayName(emp)} is already assigned.`)
      else setError('Failed to assign. Try again.')
      setAssigning(null)
    }
  }

  if (!open) return null

  const unassigned = employments.filter((e) => e.status === 'active' && !assignedUserIds.has(e.user))
  const available = unassigned.filter((e) => !onLeaveUserIds.has(e.user))
  const onLeave = unassigned.filter((e) => onLeaveUserIds.has(e.user))
  const alreadyIn = employments.filter((e) => assignedUserIds.has(e.user))

  function EmpRow({
    emp,
    idx,
    isOnLeave = false,
  }: {
    emp: Employment
    idx: number
    isOnLeave?: boolean
  }) {
    const name = empDisplayName(emp)
    const init = empInitials(emp)
    const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
    const isPending = pending?.userId === emp.user
    const isAssigning = assigning === emp.user

    return (
      <div className={`rounded-xl transition-colors ${isPending ? 'bg-sky-50/60 border border-sky-100' : 'hover:bg-gray-50'}`}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
            <span className="text-white text-xs font-semibold">{init}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
              {isOnLeave && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                  <CalendarOff className="w-2.5 h-2.5" />
                  On Leave
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">
              {emp.position} · {emp.branch_name}
            </p>
          </div>

          {isPending ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setPending(null)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!!assigning}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {isAssigning ? 'Assigning...' : 'Confirm'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => openPicker(emp)}
              disabled={!!assigning}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                isOnLeave
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              Assign
            </button>
          )}
        </div>

        {/* Inline time picker */}
        {isPending && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-sky-100 px-3 py-2">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="text-xs text-gray-500 shrink-0">Hours:</span>
              <input
                type="time"
                value={pending!.startTime}
                onChange={(e) => setPending((p) => p ? { ...p, startTime: e.target.value } : p)}
                className="text-sm font-medium text-gray-800 border-none outline-none bg-transparent"
              />
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                type="time"
                value={pending!.endTime}
                onChange={(e) => setPending((p) => p ? { ...p, endTime: e.target.value } : p)}
                className="text-sm font-medium text-gray-800 border-none outline-none bg-transparent"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-semibold text-gray-900">Assign Staff</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-2.5 border-b border-gray-50 flex items-center gap-1.5 text-xs text-gray-400">
            <Building2 className="w-3 h-3" />
            Showing staff from this shift's branch only
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-2">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : available.length === 0 && onLeave.length === 0 && alreadyIn.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No active staff found for this branch.
              </div>
            ) : (
              <>
                {available.length > 0 && (
                  <>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1 pb-1">
                      Available ({available.length})
                    </p>
                    {available.map((emp, i) => (
                      <EmpRow key={emp.id} emp={emp} idx={i} />
                    ))}
                  </>
                )}

                {onLeave.length > 0 && (
                  <>
                    <p className="text-[11px] font-medium text-amber-500 uppercase tracking-wider px-1 pt-3 pb-1">
                      On Leave ({onLeave.length})
                    </p>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 overflow-hidden">
                      <div className="px-3 py-1.5 border-b border-amber-100">
                        <p className="text-[11px] text-amber-600">
                          These staff have approved leave covering this shift date.
                        </p>
                      </div>
                      {onLeave.map((emp, i) => (
                        <EmpRow key={emp.id} emp={emp} idx={i} isOnLeave />
                      ))}
                    </div>
                  </>
                )}

                {alreadyIn.length > 0 && (
                  <>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1 pt-3 pb-1">
                      Already Assigned ({alreadyIn.length})
                    </p>
                    {alreadyIn.map((emp, i) => {
                      const name = empDisplayName(emp)
                      const init = empInitials(emp)
                      const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                      const assignment = existingAssignments.find((a) => a.user === emp.user)
                      return (
                        <div key={emp.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <span className="text-white text-xs font-semibold">{init}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {assignment?.start_time
                                ? `${toLocalTime(assignment.start_time)} – ${toLocalTime(assignment.end_time!)}`
                                : `${emp.position} · ${emp.branch_name}`}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            Assigned
                          </span>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
