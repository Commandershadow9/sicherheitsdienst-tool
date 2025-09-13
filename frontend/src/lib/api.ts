import axios from 'axios'

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
})
