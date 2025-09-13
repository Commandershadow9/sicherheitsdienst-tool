import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { installAuthInterceptors } from './interceptors'

type Tokens = { accessToken: string; refreshToken?: string }
type User = { id: string; email: string; firstName?: string; lastName?: string; role: 'ADMIN'|'MANAGER'|'DISPATCHER'|'EMPLOYEE' }
type AuthCtx = {
  tokens: Tokens | null
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function isDev() {
  return import.meta.env.MODE !== 'production'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState<Tokens | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const initialized = useRef(false)

  // Persist Access-Token nur im Dev-Modus (Fallback)
  useEffect(() => {
    if (isDev()) {
      const at = localStorage.getItem('accessToken')
      if (at) setTokensState((t) => ({ accessToken: at, refreshToken: t?.refreshToken }))
    }
  }, [])

  useEffect(() => {
    if (!isDev()) return
    if (tokens?.accessToken) localStorage.setItem('accessToken', tokens.accessToken)
    else localStorage.removeItem('accessToken')
  }, [tokens?.accessToken])

  const setTokens = useCallback((t: Tokens | null) => setTokensState(t), [])

  const refresh = useCallback(async (refreshToken: string): Promise<Tokens> => {
    const res = await api.post('/auth/refresh', { refreshToken })
    const { accessToken, refreshToken: rt } = res.data
    return { accessToken, refreshToken: rt }
  }, [])

  // Install interceptors once
  useEffect(() => {
    if (initialized.current) return
    installAuthInterceptors(api, {
      getTokens: () => tokens,
      setTokens: (t) => setTokens(t),
      refresh,
      onLogout: () => {},
    })
    initialized.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user } = res.data
    setTokens({ accessToken, refreshToken })
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    setTokens(null)
    setUser(null)
  }, [])

  // Fetch user (me) when we have tokens but no user yet
  useEffect(() => {
    async function loadMe() {
      try {
        if (tokens?.accessToken && !user) {
          const res = await api.get('/auth/me')
          setUser(res.data?.user || res.data)
        }
      } catch {
        // ignore
      }
    }
    loadMe()
  }, [tokens?.accessToken, user])

  const value: AuthCtx = useMemo(
    () => ({ tokens, isAuthenticated: Boolean(tokens?.accessToken), user, login, logout }),
    [tokens, user, login, logout]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
