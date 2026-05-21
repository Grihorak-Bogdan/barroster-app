export type LeaveType = 'day_off' | 'vacation' | 'sick_leave'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  user: string
  user_email: string
  user_first_name: string
  user_last_name: string
  employment: string | null
  employment_branch_name: string | null
  employment_position: string | null
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_by_email: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LeaveRequestPayload {
  employment?: string | null
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason?: string
}
