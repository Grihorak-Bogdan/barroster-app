import { apiFetch } from './client'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  created_at: string
  employment_role: 'owner' | 'manager' | 'supervisor' | 'staff' | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface RegisterResponse extends TokenPair {
  user: AuthUser
}

export const loginApi = (data: LoginPayload) =>
  apiFetch<TokenPair>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const registerApi = (data: RegisterPayload) =>
  apiFetch<RegisterResponse>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const refreshTokenApi = (refresh: string) =>
  apiFetch<{ access: string }>('/auth/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  })

export const meApi = () => apiFetch<AuthUser>('/auth/me/')

export const updateMeApi = (data: Partial<Pick<AuthUser, 'first_name' | 'last_name' | 'phone'>>) =>
  apiFetch<AuthUser>('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const changePasswordApi = (current_password: string, new_password: string) =>
  apiFetch<{ detail: string }>('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  })
