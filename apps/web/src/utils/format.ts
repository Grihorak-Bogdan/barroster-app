// ── Date / time ────────────────────────────────────────────────────────────────

/** "May 20, 2026" — accepts Date or ISO string. Date-only strings (no T) are
 *  parsed as midnight local time to avoid UTC-day-off-by-one. */
export function formatDate(dt: Date | string): string {
  const d = typeof dt === 'string'
    ? new Date(dt.includes('T') ? dt : dt + 'T00:00:00')
    : dt
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "May 20" — short version without year */
export function formatDateShort(dt: Date | string): string {
  const d = typeof dt === 'string'
    ? new Date(dt.includes('T') ? dt : dt + 'T00:00:00')
    : dt
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "9:00 AM" */
export function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** "May 20, 9:00 AM" */
export function formatDateTime(dt: string): string {
  const d = new Date(dt)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  )
}

/** Difference between two ISO strings in whole hours */
export function diffHours(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3600000)
}

// ── Hours / money ──────────────────────────────────────────────────────────────

/** "12h" or "12h 30m" */
export function formatHours(h: number | string): string {
  const n = Number(h)
  const whole = Math.floor(n)
  const mins = Math.round((n - whole) * 60)
  if (mins === 0) return `${whole}h`
  return `${whole}h ${mins}m`
}

/** "$1,234.56" */
export function formatCurrency(amount: string | number): string {
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
