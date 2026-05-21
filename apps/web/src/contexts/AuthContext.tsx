import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  loginApi,
  registerApi,
  meApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../api/auth'
import { setTokens, clearTokens, getAccessToken } from '../api/client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (data: LoginPayload) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const u = await meApi()
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (getAccessToken()) {
      fetchMe().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  // Listen for forced logout from the API client (401 + failed refresh)
  useEffect(() => {
    const handle = () => {
      setUser(null)
    }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  const login = async (data: LoginPayload) => {
    const tokens = await loginApi(data)
    setTokens(tokens.access, tokens.refresh)
    await fetchMe()
  }

  const register = async (data: RegisterPayload) => {
    const result = await registerApi(data)
    setTokens(result.access, result.refresh)
    setUser(result.user)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  const refreshUser = fetchMe

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
