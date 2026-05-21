export type PayrollStatus = 'draft' | 'approved' | 'paid'
export type PayrollFrequency = 'weekly' | 'biweekly' | 'monthly'

export type PayrollPeriod = {
  id: string
  branch: string | null
  branch_name: string | null
  frequency: PayrollFrequency
  start_date: string
  end_date: string
  status: PayrollStatus
  notes: string
  created_by: string
  created_by_email: string
  approved_by: string | null
  approved_by_email: string | null
  approved_at: string | null
  paid_at: string | null
  created_at: string
  record_count: number
  total_amount: string
}

export type PayrollRecord = {
  id: string
  period: string
  employment: string
  compensation: string | null
  user_email: string
  user_first_name: string
  user_last_name: string
  branch_name: string
  position: string
  role: string
  payment_type: string | null
  hours_worked: string
  shifts_count: number
  base_amount: string
  bonus_amount: string
  total_amount: string
  notes: string
}

export type PayrollPeriodDetail = PayrollPeriod & {
  records: PayrollRecord[]
}

export type PayrollPeriodPayload = {
  branch?: string | null
  frequency: PayrollFrequency
  start_date: string
  end_date: string
  notes?: string
}

export type PayrollFilters = {
  status?: PayrollStatus
  branch?: string
  from_date?: string
  to_date?: string
}
