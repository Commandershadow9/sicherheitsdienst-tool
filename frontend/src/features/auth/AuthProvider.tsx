import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { installAuthInterceptors } from './interceptors'

type User = { id: string; email: string; firstName?: string; lastName?: string; role: 'ADMIN'|'MANAGER'|'DISPATCHER'|'EMPLOYEE' }
type AuthCtx = {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrated: boolean
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Hydrated means we have attempted to restore session (via /me)
  const [hydrated, setHydrated] = useState(false)
  const initialized = useRef(false)

  const refresh = useCallback(async (): Promise<void> => {
    // Just call endpoint, cookies are handled by browser
    await api.post('/auth/refresh')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors during logout
    } finally {
      setUser(null)
    }
  }, [])

  // Install interceptors once
  useEffect(() => {
    if (initialized.current) return
    installAuthInterceptors(api, {
      refresh,
      onLogout: () => {
        setUser(null)
      },
    })
    initialized.current = true
  }, [refresh, logout]) // logout dependency added implicitly

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    // Backend returns { success: true, data: { user: ... } }
    const loginUser = res.data?.data?.user || res.data?.user
    setUser(loginUser)
  }, [])

  // Initial Session Check (Load /me)
  useEffect(() => {
    let mounted = true
    async function checkSession() {
      try {
        const res = await api.get('/auth/me')
        if (mounted) {
          setUser(res.data?.user || res.data?.data || res.data) // handle response wrapper
        }
      } catch (e) {
        // 401 is expected if not logged in
        if (mounted) setUser(null)
      } finally {
        if (mounted) setHydrated(true)
      }
    }
    checkSession()
    return () => { mounted = false }
  }, [])

  const value: AuthCtx = useMemo(
    () => ({ isAuthenticated: !!user, user, login, logout, hydrated }),
    [user, login, logout, hydrated]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
