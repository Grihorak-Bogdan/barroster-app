import { apiFetch } from './client'

export type HoursSummaryEntry = {
  user_id: string
  user_email: string
  user_first_name: string
  user_last_name: string
  total_shifts: number
  total_hours: number
}

export const getHoursSummary = (params: {
  from_date?: string
  to_date?: string
  branch?: string
} = {}) => {
  const q = new URLSearchParams()
  if (params.from_date) q.set('from_date', params.from_date)
  if (params.to_date) q.set('to_date', params.to_date)
  if (params.branch) q.set('branch', params.branch)
  const qs = q.toString()
  return apiFetch<HoursSummaryEntry[]>(`/reports/hours/${qs ? '?' + qs : ''}`)
}
