import { api } from '@/lib/api'

export type ProgressHandler = (p: { loaded: number; total?: number; percent?: number }) => void

function parseFilename(cd?: string | null, fallback?: string) {
  if (!cd) return fallback
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd)
  if (m) return decodeURIComponent(m[1] || m[2])
  return fallback
}

export async function exportFile(opts: {
  path: string
  accept: 'text/csv' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  token?: string
  filenameHint?: string
  params?: URLSearchParams
  onProgress?: ProgressHandler
  onUnauthorized?: () => void
}): Promise<boolean> {
  const { path, accept, token, filenameHint, params, onProgress, onUnauthorized } = opts
  const url = `${api.defaults.baseURL}${path}${params && params.toString() ? `?${params.toString()}` : ''}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: accept,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.()
    const text = await res.text().catch(() => '')
    throw new Error(text || `Export fehlgeschlagen (HTTP ${res.status})`)
  }

  const contentLength = Number(res.headers.get('Content-Length') || 0)
  const contentType = res.headers.get('Content-Type') || accept
  const cd = res.headers.get('Content-Disposition')
  const fallback = filenameHint || path.split('/').pop() || 'export'
  const filename = parseFilename(cd, fallback)

  const reader = res.body?.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        loaded += value.byteLength
        const percent = contentLength ? Math.round((loaded / contentLength) * 100) : undefined
        onProgress?.({ loaded, total: contentLength || undefined, percent })
      }
    }
  }

  const blob = new Blob(chunks, { type: contentType })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename || fallback
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
  return true
}

