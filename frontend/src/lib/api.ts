import axios from 'axios'

export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
export { AxiosHeaders } from 'axios'
export { isAxiosError } from 'axios'

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
})
