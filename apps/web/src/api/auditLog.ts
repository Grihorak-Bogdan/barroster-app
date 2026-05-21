import { apiFetch } from './client'
import type { AuditLog, AuditAction } from '../types/auditLog'

export type AuditLogFilters = {
  action?: AuditAction
  resource_type?: string
  limit?: number
}

export const getAuditLogs = (filters: AuditLogFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.action) params.set('action', filters.action)
  if (filters.resource_type) params.set('resource_type', filters.resource_type)
  if (filters.limit) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch<AuditLog[]>(`/audit-logs/${qs ? `?${qs}` : ''}`)
}
