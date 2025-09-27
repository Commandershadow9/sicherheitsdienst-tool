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
  hydrated: boolean
}

const Ctx = createContext<AuthCtx | null>(null)

const LS_KEY = 'auth';

type StoredAuth = { tokens: Tokens | null; user: User | null }

function readStoredAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { tokens: null, user: null }
    const parsed = JSON.parse(raw)
    return {
      tokens: parsed?.tokens ?? null,
      user: parsed?.user ?? null,
    }
  } catch {
    return { tokens: null, user: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storedRef = useRef<StoredAuth | null>(null)
  if (typeof window !== 'undefined' && storedRef.current === null) {
    storedRef.current = readStoredAuth()
  }

  const [tokens, setTokensState] = useState<Tokens | null>(() => storedRef.current?.tokens ?? null)
  const [user, setUser] = useState<User | null>(() => storedRef.current?.user ?? null)
  const [hydrated, setHydrated] = useState(() => typeof window === 'undefined' ? false : true)
  const initialized = useRef(false)
  const refreshAttempted = useRef(false)
  const refreshTimer = useRef<number | null>(null)

  // Rehydrate from localStorage (falls initialer Read vor SSR/Build nicht möglich war)
  useEffect(() => {
    if (storedRef.current) {
      setHydrated(true)
      return
    }
    try {
      const stored = readStoredAuth()
      if (stored.tokens) setTokensState(stored.tokens)
      if (stored.user) setUser(stored.user)
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    const payload = JSON.stringify({ tokens, user })
    try {
      if (tokens?.accessToken) localStorage.setItem(LS_KEY, payload)
      else localStorage.removeItem(LS_KEY)
    } catch {}
  }, [tokens, user])

  const persist = useCallback((nextTokens: Tokens | null, nextUser: User | null) => {
    try {
      if (nextTokens?.accessToken) {
        localStorage.setItem(LS_KEY, JSON.stringify({ tokens: nextTokens, user: nextUser }))
      } else {
        localStorage.removeItem(LS_KEY)
      }
    } catch {}
  }, [])

  const setTokens = useCallback((t: Tokens | null) => {
    persist(t, user)
    setTokensState(t)
  }, [persist, user])

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
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user: loginUser } = res.data
    const nextTokens = { accessToken, refreshToken }
    persist(nextTokens, loginUser)
    setTokensState(nextTokens)
    setUser(loginUser)
  }, [persist])

  const logout = useCallback(() => {
    persist(null, null)
    setTokensState(null)
    setUser(null)
    try {
      window.location.assign('/login')
    } catch {}
  }, [persist])

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
    () => ({ tokens, isAuthenticated: Boolean(tokens?.accessToken), user, login, logout, hydrated }),
    [tokens, user, login, logout, hydrated]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
