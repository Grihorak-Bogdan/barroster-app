const API_BASE_URL = '/api'

export class ForbiddenError extends Error {
  constructor() {
    super('You do not have permission to perform this action.')
    this.name = 'ForbiddenError'
  }
}

export const getAccessToken = (): string | null =>
  localStorage.getItem('access_token')
export const getRefreshToken = (): string | null =>
  localStorage.getItem('refresh_token')

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Single in-flight refresh to avoid multiple simultaneous refreshes
let _refreshing: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No refresh token')

  const resp = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!resp.ok) throw new Error('Refresh failed')

  const data: { access: string } = await resp.json()
  localStorage.setItem('access_token', data.access)
  return data.access
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const run = (token: string | null) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
        ...options?.headers,
      },
    })

  let resp = await run(getAccessToken())

  // Auto-refresh on 401
  if (resp.status === 401 && getRefreshToken()) {
    try {
      if (!_refreshing) {
        _refreshing = doRefresh().finally(() => {
          _refreshing = null
        })
      }
      const newToken = await _refreshing
      resp = await run(newToken)
    } catch {
      clearTokens()
      // Redirect to login without page reload issues
      window.dispatchEvent(new CustomEvent('auth:logout'))
      throw new Error('Session expired — please log in again.')
    }
  }

  if (resp.status === 403) {
    window.dispatchEvent(new CustomEvent('api:forbidden'))
    throw new ForbiddenError()
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(text || `Request failed: ${resp.status}`)
  }

  if (resp.status === 204) return undefined as T
  return resp.json()
}
