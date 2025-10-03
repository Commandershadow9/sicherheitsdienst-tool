import axios from 'axios'

export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
export { AxiosHeaders } from 'axios'
export { isAxiosError } from 'axios'

const envBase = import.meta.env.VITE_API_BASE_URL

function deriveBaseUrl() {
  if (envBase && envBase.trim() !== '') {
    return envBase.trim()
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    if (port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:3001`
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
