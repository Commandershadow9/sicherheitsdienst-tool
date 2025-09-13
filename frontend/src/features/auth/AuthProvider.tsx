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

const LS_KEY = 'auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState<Tokens | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const initialized = useRef(false)
  const refreshAttempted = useRef(false)
  const refreshTimer = useRef<number | null>(null)

  // Rehydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.tokens) setTokensState(parsed.tokens)
        if (parsed?.user) setUser(parsed.user)
      }
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    const payload = JSON.stringify({ tokens, user })
    try {
      if (tokens?.accessToken) localStorage.setItem(LS_KEY, payload)
      else localStorage.removeItem(LS_KEY)
    } catch {}
  }, [tokens, user])

  const setTokens = useCallback((t: Tokens | null) => setTokensState(t), [])

  const refresh = useCallback(async (refreshToken: string): Promise<Tokens> => {
    const res = await api.post('/auth/refresh', { refreshToken })
    const { accessToken, refreshToken: rt } = res.data
    return { accessToken, refreshToken: rt }
  }, [])

  const attemptRefresh = useCallback(async () => {
    const rt = tokens?.refreshToken
    if (!rt) return
    if (refreshAttempted.current) return
    refreshAttempted.current = true
    try {
      const t = await refresh(rt)
      setTokens(t)
    } catch {
      try { localStorage.removeItem(LS_KEY) } catch {}
      setTokensState(null)
      setUser(null)
    } finally {
      window.setTimeout(() => { refreshAttempted.current = false }, 1000)
    }
  }, [tokens?.refreshToken, refresh, setTokens])

  // Install interceptors once
  useEffect(() => {
    if (initialized.current) return
    installAuthInterceptors(api, {
      getTokens: () => tokens,
      setTokens: (t) => setTokens(t),
      refresh,
      onLogout: () => {
        try { localStorage.removeItem(LS_KEY) } catch {}
        setTokensState(null)
        setUser(null)
        // Redirect to login (avoid app being in broken state)
        try { window.location.assign('/login') } catch {}
      },
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
    try { localStorage.removeItem(LS_KEY) } catch {}
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

  // Proaktive Refresh-Logik: Wenn Access-Token abgelaufen ist und Refresh-Token vorhanden, sofort refreshen
  useEffect(() => {
    async function maybeRefresh() {
      if (!tokens?.accessToken || !tokens?.refreshToken) return
      // decode JWT (exp in seconds)
      const parts = tokens.accessToken.split('.')
      if (parts.length < 2) return
      try {
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(atob(b64).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        const payload = JSON.parse(json)
        const expMs = payload?.exp ? payload.exp * 1000 : null
        if (expMs && Date.now() >= expMs) {
          await attemptRefresh()
        }
        // schedule proactive refresh 30s before expiry
        if (expMs) {
          const leadMs = 30_000
          const delay = Math.max(0, expMs - Date.now() - leadMs)
          if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
          refreshTimer.current = window.setTimeout(() => { attemptRefresh() }, delay)
        }
      } catch {
        // ignore decode errors
      }
    }
    maybeRefresh()
    return () => { if (refreshTimer.current) { window.clearTimeout(refreshTimer.current); refreshTimer.current = null } }
  }, [tokens?.accessToken, tokens?.refreshToken, attemptRefresh])

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
