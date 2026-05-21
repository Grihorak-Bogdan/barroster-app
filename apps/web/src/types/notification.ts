export type NotificationScope = 'private' | 'global'

export type NotificationType =
  | 'leave_approved'
  | 'leave_rejected'
  | 'shift_cancelled'
  | 'assignment_created'
  | 'payroll_approved'
  | 'payroll_paid'
  | 'announcement'

export type Notification = {
  id: number
  scope: NotificationScope
  type: NotificationType
  title: string
  body: string
  resource_type: string
  resource_id: string
  is_read: boolean
  read_at: string | null
  created_at: string
}
