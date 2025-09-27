import axios from 'axios'

export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
export { AxiosHeaders } from 'axios'
export { isAxiosError } from 'axios'

const envBase = import.meta.env.VITE_API_BASE_URL

const fallbackBase = (() => {
  if (envBase && envBase.trim() !== '') return envBase
  if (typeof window !== 'undefined') return window.location.origin
  return ''
})()

const normalizedBase = fallbackBase.replace(/\/$/, '')

export const api = axios.create({
  baseURL: normalizedBase ? `${normalizedBase}/api` : '/api',
  withCredentials: true,
  timeout: 15000,
})
