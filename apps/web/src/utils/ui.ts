// ── Avatar colours ─────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
  'bg-amber-500', 'bg-sky-500', 'bg-pink-500',
] as const

// ── Role labels ────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  supervisor: 'Supervisor',
  staff: 'Staff',
}

// ── Name helpers ───────────────────────────────────────────────────────────────

type NameSource = {
  user_first_name?: string | null
  user_last_name?: string | null
  user_email?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

function _firstName(obj: NameSource) { return obj.user_first_name ?? obj.first_name }
function _lastName(obj: NameSource)  { return obj.user_last_name  ?? obj.last_name  }
function _email(obj: NameSource)     { return obj.user_email      ?? obj.email      }

export function getDisplayName(obj: NameSource): string {
  const first = _firstName(obj)
  const last  = _lastName(obj)
  const email = _email(obj)
  if (first && last) return `${first} ${last}`
  if (email) {
    return email.split('@')[0]
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }
  return '—'
}

export function getInitials(obj: NameSource): string {
  const first = _firstName(obj)
  const last  = _lastName(obj)
  const email = _email(obj)
  if (first && last) return (first[0] + last[0]).toUpperCase()
  if (email) {
    const parts = email.split('@')[0].split(/[._-]/)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : email.slice(0, 2).toUpperCase()
  }
  return '?'
}
