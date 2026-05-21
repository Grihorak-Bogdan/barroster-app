import type { AuditLog } from '../types/auditLog'

// ── Action metadata ────────────────────────────────────────────────────────────

export type ActionMeta = {
  label: string
  verb: string  // "created a branch", "approved a leave request", etc.
  color: string
  bg: string
  dot: string
}

export const ACTION_META: Record<string, ActionMeta> = {
  branch_created:         { label: 'Branch Created',        verb: 'created a branch',          color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  branch_updated:         { label: 'Branch Updated',        verb: 'updated a branch',          color: 'text-sky-700',     bg: 'bg-sky-50',      dot: 'bg-sky-400'     },
  branch_deleted:         { label: 'Branch Deleted',        verb: 'deleted a branch',          color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-400'     },
  employment_created:     { label: 'Staff Hired',           verb: 'hired a new employee',      color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  employment_updated:     { label: 'Employment Updated',    verb: 'updated an employment',     color: 'text-sky-700',     bg: 'bg-sky-50',      dot: 'bg-sky-400'     },
  employment_deleted:     { label: 'Staff Removed',         verb: 'removed an employee',       color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-400'     },
  shift_created:          { label: 'Shift Created',         verb: 'created a shift',           color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-violet-400'  },
  shift_updated:          { label: 'Shift Updated',         verb: 'updated a shift',           color: 'text-sky-700',     bg: 'bg-sky-50',      dot: 'bg-sky-400'     },
  shift_cancelled:        { label: 'Shift Cancelled',       verb: 'cancelled a shift',         color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400'    },
  assignment_created:     { label: 'Assigned to Shift',     verb: 'assigned staff to a shift', color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-violet-400'  },
  assignment_removed:     { label: 'Removed from Shift',    verb: 'removed staff from shift',  color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400'    },
  assignment_checked_in:  { label: 'Checked In',            verb: 'checked in for a shift',    color: 'text-teal-700',    bg: 'bg-teal-50',     dot: 'bg-teal-400'    },
  assignment_checked_out: { label: 'Checked Out',           verb: 'checked out from a shift',  color: 'text-teal-700',    bg: 'bg-teal-50',     dot: 'bg-teal-400'    },
  leave_created:          { label: 'Leave Requested',       verb: 'requested leave',           color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-400'   },
  leave_approved:         { label: 'Leave Approved',        verb: 'approved a leave request',  color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  leave_rejected:         { label: 'Leave Rejected',        verb: 'rejected a leave request',  color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-400'     },
  leave_cancelled:        { label: 'Leave Cancelled',       verb: 'cancelled a leave request', color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400'    },
  payroll_created:        { label: 'Payroll Created',       verb: 'created a payroll period',  color: 'text-sky-700',     bg: 'bg-sky-50',      dot: 'bg-sky-400'     },
  payroll_generated:      { label: 'Payroll Generated',     verb: 'generated payroll records', color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-violet-400'  },
  payroll_approved:       { label: 'Payroll Approved',      verb: 'approved a payroll period', color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  payroll_paid:           { label: 'Payroll Paid',          verb: 'marked payroll as paid',    color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
}

export const FALLBACK_META: ActionMeta = {
  label: 'Action', verb: 'performed an action',
  color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400',
}

export function getActionMeta(action: string): ActionMeta {
  return ACTION_META[action] ?? FALLBACK_META
}

// ── Actor helpers ──────────────────────────────────────────────────────────────

export function actorName(log: Pick<AuditLog, 'user_first_name' | 'user_last_name' | 'user_email'>): string {
  if (log.user_first_name && log.user_last_name)
    return `${log.user_first_name} ${log.user_last_name}`
  if (log.user_email) {
    const local = log.user_email.split('@')[0]
    return local.split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return 'System'
}

export function actorInitials(log: Pick<AuditLog, 'user_first_name' | 'user_last_name' | 'user_email'>): string {
  if (log.user_first_name && log.user_last_name)
    return (log.user_first_name[0] + log.user_last_name[0]).toUpperCase()
  if (log.user_email) return log.user_email.slice(0, 2).toUpperCase()
  return '??'
}

// ── Time helpers ───────────────────────────────────────────────────────────────

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Avatar colors (deterministic per user id) ──────────────────────────────────

export const AVATAR_COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-amber-500', 'bg-pink-500', 'bg-teal-500',
]

export function avatarColor(userId: number | null, fallbackIdx: number): string {
  const idx = userId !== null ? Math.abs(userId) : fallbackIdx
  return AVATAR_COLORS[idx % AVATAR_COLORS.length]
}
