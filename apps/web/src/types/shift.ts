export type ShiftAssignment = {
  id: string
  shift: string
  user: string
  user_email: string
  user_first_name: string
  user_last_name: string
  status: string
  start_time: string | null
  end_time: string | null
  check_in_time: string | null
  check_out_time: string | null
}

export type ShiftConflict = {
  user: string
  user_email: string
  leave_type: string
  start_date: string
  end_date: string
}

export type Shift = {
  id: string
  branch: string
  branch_name: string
  created_by: string
  created_by_email: string
  start_time: string
  end_time: string
  status: string
  note: string | null
  created_at: string
  assignments: ShiftAssignment[]
  conflicts: ShiftConflict[]
}
