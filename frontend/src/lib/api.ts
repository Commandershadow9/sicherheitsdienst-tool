import axios from 'axios'

export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
export { AxiosHeaders } from 'axios'
export { isAxiosError } from 'axios'

const envBase = import.meta.env.VITE_API_BASE_URL

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function resolveConfiguredBaseUrl(base?: string) {
  if (!base) return null
  const trimmed = base.trim()
  if (!trimmed) return null

  if (typeof window === 'undefined') {
    return trimmed
  }

  try {
    const configured = new URL(trimmed)
    const runtimeHost = window.location.hostname
    if (runtimeHost && !LOCAL_HOSTNAMES.has(runtimeHost) && LOCAL_HOSTNAMES.has(configured.hostname)) {
      configured.hostname = runtimeHost
      // Port bleibt unverändert (Backend läuft auf 3000)
    }
    return configured.toString()
  } catch {
    return trimmed
  }
}

function deriveBaseUrl() {
  const configured = resolveConfiguredBaseUrl(envBase)
  if (configured) {
    return configured
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    if (port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:3000`
    }
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }

  return 'http://localhost:3000'
}

const normalizedBase = deriveBaseUrl().replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${normalizedBase}/api`,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'If-Modified-Since': '0',
  },
})
