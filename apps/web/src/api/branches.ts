import { apiFetch } from './client'
import type { Branch, BranchStatus } from '../types/branch'

export type BranchPayload = { name: string; address: string; status?: BranchStatus }

export const getBranches = () => apiFetch<Branch[]>('/branches/')
export const getBranch = (id: string) => apiFetch<Branch>(`/branches/${id}/`)
export const createBranch = (data: BranchPayload) =>
  apiFetch<Branch>('/branches/', { method: 'POST', body: JSON.stringify(data) })
export const updateBranch = (id: string, data: Partial<BranchPayload>) =>
  apiFetch<Branch>(`/branches/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteBranch = (id: string) =>
  apiFetch<void>(`/branches/${id}/`, { method: 'DELETE' })
