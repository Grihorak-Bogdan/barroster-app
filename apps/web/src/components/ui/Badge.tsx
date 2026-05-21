type BadgeVariant =
  | 'green'
  | 'red'
  | 'amber'
  | 'blue'
  | 'gray'
  | 'sky'
  | 'purple'
  | 'orange'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  sky: 'bg-sky-100 text-sky-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  sky: 'bg-sky-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export default function Badge({
  variant = 'gray',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[variant]}`}
        />
      )}
      {children}
    </span>
  )
}

export function statusVariant(status: string): BadgeVariant {
  const s = status?.toUpperCase()
  if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'ACCEPTED') return 'green'
  if (s === 'TERMINATED' || s === 'CANCELLED' || s === 'REJECTED') return 'red'
  if (s === 'SUSPENDED' || s === 'MAINTENANCE' || s === 'PLANNED') return 'amber'
  if (s === 'CONFIRMED' || s === 'ASSIGNED') return 'blue'
  if (s === 'INACTIVE' || s === 'CLOSED') return 'gray'
  return 'gray'
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    CLOSED: 'Closed',
    MAINTENANCE: 'Maintenance',
    TERMINATED: 'Terminated',
    SUSPENDED: 'On Leave',
    PLANNED: 'Scheduled',
    CONFIRMED: 'Assigned',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ASSIGNED: 'Assigned',
    ACCEPTED: 'Accepted',
    REJECTED: 'Declined',
  }
  return map[status?.toUpperCase()] ?? status
}
