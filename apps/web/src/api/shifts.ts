import { apiFetch } from './client'
import type { Shift, ShiftAssignment } from '../types/shift'

export type ShiftPayload = {
  branch: string
  start_time: string
  end_time: string
  status?: string
  note?: string
}

export const getShifts = () => apiFetch<Shift[]>('/shifts/')
export const getShift = (id: string) => apiFetch<Shift>(`/shifts/${id}/`)
export const createShift = (data: ShiftPayload) =>
  apiFetch<Shift>('/shifts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
export const updateShift = (id: string, data: Partial<ShiftPayload>) =>
  apiFetch<Shift>(`/shifts/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
export const deleteShift = (id: string) =>
  apiFetch<void>(`/shifts/${id}/`, { method: 'DELETE' })

export const updateAssignment = (id: string, data: {
  start_time?: string | null
  end_time?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
}) =>
  apiFetch<ShiftAssignment>(`/shift-assignments/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const createAssignment = (data: {
  shift: string
  user: string
  start_time?: string
  end_time?: string
}) =>
  apiFetch<ShiftAssignment>('/shift-assignments/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const deleteAssignment = (id: string) =>
  apiFetch<void>(`/shift-assignments/${id}/`, { method: 'DELETE' })

export const checkInAssignment = (id: string) =>
  apiFetch<ShiftAssignment>(`/shift-assignments/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ check_in_time: new Date().toISOString() }),
  })

export const checkOutAssignment = (id: string) =>
  apiFetch<ShiftAssignment>(`/shift-assignments/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ check_out_time: new Date().toISOString() }),
  })
