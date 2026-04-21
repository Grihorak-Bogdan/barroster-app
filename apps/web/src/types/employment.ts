export type Compensation = {
  id: string
  employment: string
  payment_type: string
  hourly_rate: string | null
  base_salary: string | null
  bonus_type: string
  bonus_value: string
  effective_from: string
  effective_to: string | null
}

export type Employment = {
  id: string
  user: string
  user_email: string
  branch: string
  branch_name: string
  position: string
  role: string
  hire_date: string
  end_date: string | null
  status: string
  termination_reason: string | null
  created_at: string
  compensations: Compensation[]
}