import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggle = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}

