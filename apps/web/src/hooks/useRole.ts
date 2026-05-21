import { useAuth } from '../contexts/AuthContext'

const HIERARCHY: Record<string, number> = { owner: 4, manager: 3, supervisor: 2, staff: 1 }

export function useRole() {
  const { user } = useAuth()
  const role = user?.employment_role ?? null

  const hasRole = (min: string) =>
    role !== null && (HIERARCHY[role] ?? 0) >= (HIERARCHY[min] ?? 0)

  return {
    role,
    isOwner: role === 'owner',
    canManage: hasRole('manager'),
    canSupervise: hasRole('supervisor'),
    canCheckIn: hasRole('staff'),
  }
}
