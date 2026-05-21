import { apiFetch } from './client'
import type { LeaveRequest, LeaveRequestPayload } from '../types/leave'

export const getLeaveRequests = (status?: string) => {
  const qs = status ? `?status=${status}` : ''
  return apiFetch<LeaveRequest[]>(`/leave-requests/${qs}`)
}

export const getApprovedLeavesOnDate = (date: string) =>
  apiFetch<LeaveRequest[]>(`/leave-requests/?status=approved&date=${date}`)

export const createLeaveRequest = (data: LeaveRequestPayload) =>
  apiFetch<LeaveRequest>('/leave-requests/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const approveLeaveRequest = (id: string) =>
  apiFetch<LeaveRequest>(`/leave-requests/${id}/approve/`, { method: 'POST' })

export const rejectLeaveRequest = (id: string) =>
  apiFetch<LeaveRequest>(`/leave-requests/${id}/reject/`, { method: 'POST' })

export const cancelLeaveRequest = (id: string) =>
  apiFetch<LeaveRequest>(`/leave-requests/${id}/cancel/`, { method: 'POST' })

export const deleteLeaveRequest = (id: string) =>
  apiFetch<void>(`/leave-requests/${id}/`, { method: 'DELETE' })
