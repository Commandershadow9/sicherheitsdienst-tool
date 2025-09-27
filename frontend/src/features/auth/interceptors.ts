import { AxiosHeaders, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from '@/lib/api'

type Tokens = { accessToken: string; refreshToken?: string }

export function installAuthInterceptors(
  api: AxiosInstance,
  opts: {
    getTokens: () => Tokens | null
    setTokens: (t: Tokens | null) => void
    refresh: (refreshToken: string) => Promise<Tokens>
    onLogout: () => void
  }
) {
  let isRefreshing = false
  let queue: { resolve: (t: string) => void; reject: (e: any) => void }[] = []

  const processQueue = (error: any, token: string | null) => {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
    queue = []
  }

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    let tokens = opts.getTokens()
    if (!tokens?.accessToken) {
      try {
        const raw = localStorage.getItem('auth')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.tokens?.accessToken) tokens = parsed.tokens
        }
      } catch {}
    }
    if (tokens?.accessToken) {
      const headers = config.headers instanceof AxiosHeaders
        ? config.headers
        : AxiosHeaders.from(config.headers ?? {})
      headers.set('Authorization', `Bearer ${tokens.accessToken}`)
      config.headers = headers
    }
    return config
  })

  api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original = (error.config || {}) as (InternalAxiosRequestConfig & { _retry?: boolean })
      const status = error?.response?.status
      const urlPath = String(original.url || '')
      if (status === 401 && !original._retry && !/\/auth\/(login|refresh)/.test(urlPath)) {
        original._retry = true
        try {
          let accessToken: string
          if (!isRefreshing) {
            isRefreshing = true
            const rt = opts.getTokens()?.refreshToken
            if (!rt) throw error
            const newTokens = await opts.refresh(rt)
            opts.setTokens(newTokens)
            accessToken = newTokens.accessToken
            isRefreshing = false
            processQueue(null, newTokens.accessToken)
          } else {
            // wait until refresh resolves wenn bereits ein Refresh-Lauf aktiv ist
            accessToken = await new Promise<string>((resolve, reject) => {
              queue.push({ resolve, reject })
            })
          }
          const headers = original.headers instanceof AxiosHeaders
            ? original.headers
            : AxiosHeaders.from(original.headers ?? {})
          headers.set('Authorization', `Bearer ${accessToken}`)
          original.headers = headers
          return api.request(original)
        } catch (e) {
          isRefreshing = false
          processQueue(e, null)
          opts.setTokens(null)
          opts.onLogout()
          return Promise.reject(e)
        }
      }
      // Bei wiederholtem 401 nach bereits erfolgtem Retry -> zum Login führen
      if (status === 401 && original._retry) {
        try { opts.setTokens(null); opts.onLogout() } catch {}
      }
      // 403: Kein Refresh-Mechanismus, UI soll die 403-Karte anzeigen. Kein Toast-Spam hier.
      return Promise.reject(error)
    }
  )
}
