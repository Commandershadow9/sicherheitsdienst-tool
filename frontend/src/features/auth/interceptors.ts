import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

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

  api.interceptors.request.use((config: AxiosRequestConfig) => {
    const tokens = opts.getTokens()
    if (tokens?.accessToken) {
      config.headers = config.headers || {}
      ;(config.headers as any)['Authorization'] = `Bearer ${tokens.accessToken}`
    }
    return config
  })

  api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original: AxiosRequestConfig & { _retry?: boolean } = error.config || {}
      const status = error?.response?.status
      if (status === 401 && !original._retry) {
        original._retry = true
        try {
          if (!isRefreshing) {
            isRefreshing = true
            const rt = opts.getTokens()?.refreshToken
            if (!rt) throw error
            const newTokens = await opts.refresh(rt)
            opts.setTokens(newTokens)
            isRefreshing = false
            processQueue(null, newTokens.accessToken)
          }
          // wait until refresh resolves if already running
          const accessToken = await new Promise<string>((resolve, reject) => {
            queue.push({ resolve, reject })
          })
          original.headers = original.headers || {}
          ;(original.headers as any)['Authorization'] = `Bearer ${accessToken}`
          return api(original)
        } catch (e) {
          isRefreshing = false
          processQueue(e, null)
          opts.setTokens(null)
          opts.onLogout()
          return Promise.reject(e)
        }
      }
      return Promise.reject(error)
    }
  )
}

