import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { installAuthInterceptors } from './interceptors'

type Tokens = { accessToken: string; refreshToken?: string }
type AuthCtx = {
  tokens: Tokens | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function isDev() {
  return import.meta.env.MODE !== 'production'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState<Tokens | null>(null)
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
    const { accessToken, refreshToken } = res.data
    setTokens({ accessToken, refreshToken })
  }, [])

  const logout = useCallback(() => {
    setTokens(null)
  }, [])

  const value: AuthCtx = useMemo(
    () => ({ tokens, isAuthenticated: Boolean(tokens?.accessToken), login, logout }),
    [tokens, login, logout]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

