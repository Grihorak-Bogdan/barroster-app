import { apiFetch } from "./client"
import type { Employment, Compensation } from "../types/employment"

export interface EmploymentPayload {
  user: string
  branch: string
  position: string
  role: string
  hire_date: string
  end_date?: string | null
  status?: string
  termination_reason?: string | null
}

export interface CompensationPayload {
  employment: string
  payment_type: string
  hourly_rate?: string | null
  base_salary?: string | null
  bonus_type?: string
  bonus_value?: string
  effective_from: string
  effective_to?: string | null
}

export function getEmployments(branchId?: string) {
  const qs = branchId ? `?branch=${branchId}` : ''
  return apiFetch<Employment[]>(`/employments/${qs}`)
}

export function createEmployment(data: EmploymentPayload) {
  return apiFetch<Employment>("/employments/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export function updateEmployment(id: string, data: Partial<EmploymentPayload>) {
  return apiFetch<Employment>(`/employments/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export function deleteEmployment(id: string) {
  return apiFetch<void>(`/employments/${id}/`, { method: "DELETE" })
}

export function createCompensation(data: CompensationPayload) {
  return apiFetch<Compensation>("/compensations/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export function updateCompensation(id: string, data: Partial<CompensationPayload>) {
  return apiFetch<Compensation>(`/compensations/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}
