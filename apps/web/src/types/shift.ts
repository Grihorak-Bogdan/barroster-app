export type ShiftAssignment = {
  id: string
  shift: string
  user: string
  user_email: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
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
}