export type BranchStatus = 'active' | 'inactive' | 'maintenance'

export type Branch = {
  id: string
  name: string
  address: string
  status: BranchStatus
  created_at: string
}