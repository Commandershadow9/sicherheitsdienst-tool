import { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from '@/lib/api'

export function installAuthInterceptors(
  api: AxiosInstance,
  opts: {
    refresh: () => Promise<void>
    onLogout: () => void
  }
) {
  let isRefreshing = false
  let queue: { resolve: () => void; reject: (e: any) => void }[] = []

  const processQueue = (error: any) => {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve()))
    queue = []
  }

  // Request interceptor: No longer needed to attach tokens (Cookies handles it)
  // But we might want to ensure we don't attach old headers if any logic tries to.
  // api.interceptors.request.use((config) => config); 

  api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original = (error.config || {}) as (InternalAxiosRequestConfig & { _retry?: boolean })
      const status = error?.response?.status
      const urlPath = String(original.url || '')
      
      // Ignore 401 on login/refresh endpoints to prevent loops
      if (status === 401 && !original._retry && !/\/auth\/(login|refresh|me)/.test(urlPath)) {
        original._retry = true
        try {
          if (!isRefreshing) {
            isRefreshing = true
            await opts.refresh() // Call refresh API (uses cookies)
            isRefreshing = false
            processQueue(null)
          } else {
            // Wait for existing refresh
            await new Promise<void>((resolve, reject) => {
              queue.push({ resolve, reject })
            })
          }
          // Retry original request (cookies will be sent automatically)
          return api.request(original)
        } catch (e) {
          isRefreshing = false
          processQueue(e)
          opts.onLogout()
          return Promise.reject(e)
        }
      }
      
      // If refresh failed or 401 persists
      if (status === 401 && original._retry) {
        opts.onLogout()
      }
      
      return Promise.reject(error)
    }
  )
}
