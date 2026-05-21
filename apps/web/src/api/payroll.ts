import { apiFetch } from './client'
import type { PayrollFilters, PayrollPeriod, PayrollPeriodDetail, PayrollPeriodPayload } from '../types/payroll'

export const getPayrollPeriods = (filters: PayrollFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.status)    params.set('status', filters.status)
  if (filters.branch)    params.set('branch', filters.branch)
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date)   params.set('to_date', filters.to_date)
  const qs = params.toString()
  return apiFetch<PayrollPeriod[]>(`/payroll-periods/${qs ? `?${qs}` : ''}`)
}

export const getPayrollPeriod = (id: string) =>
  apiFetch<PayrollPeriodDetail>(`/payroll-periods/${id}/`)

export const createPayrollPeriod = (data: PayrollPeriodPayload) =>
  apiFetch<PayrollPeriod>('/payroll-periods/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deletePayrollPeriod = (id: string) =>
  apiFetch<void>(`/payroll-periods/${id}/`, { method: 'DELETE' })

export const generatePayroll = (id: string) =>
  apiFetch<PayrollPeriodDetail>(`/payroll-periods/${id}/generate/`, { method: 'POST' })

export const approvePayroll = (id: string) =>
  apiFetch<PayrollPeriod>(`/payroll-periods/${id}/approve/`, { method: 'POST' })

export const markPayrollPaid = (id: string) =>
  apiFetch<PayrollPeriod>(`/payroll-periods/${id}/mark_paid/`, { method: 'POST' })
