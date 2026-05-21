export type AuditAction =
  | 'branch_created' | 'branch_updated' | 'branch_deleted'
  | 'employment_created' | 'employment_updated' | 'employment_deleted'
  | 'shift_created' | 'shift_updated' | 'shift_cancelled'
  | 'assignment_created' | 'assignment_removed' | 'assignment_checked_in' | 'assignment_checked_out'
  | 'leave_created' | 'leave_approved' | 'leave_rejected' | 'leave_cancelled'
  | 'payroll_created' | 'payroll_generated' | 'payroll_approved' | 'payroll_paid'

export type AuditLog = {
  id: number
  user: number | null
  user_email: string | null
  user_first_name: string | null
  user_last_name: string | null
  action: AuditAction
  resource_type: string
  resource_id: string
  resource_name: string
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}
