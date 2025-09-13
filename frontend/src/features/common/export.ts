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
  filenameHint?: string
  params?: URLSearchParams
  onProgress?: ProgressHandler
  onUnauthorized?: () => void
}): Promise<boolean> {
  const { path, accept, filenameHint, params, onProgress, onUnauthorized } = opts
  const url = `${path}${params && params.toString() ? `?${params.toString()}` : ''}`
  try {
    const res = await api.get(url, {
      responseType: 'blob',
      headers: { Accept: accept },
      onDownloadProgress: (e) => {
        const total = e.total || undefined
        const loaded = e.loaded
        const percent = total ? Math.round((loaded / total) * 100) : undefined
        onProgress?.({ loaded, total, percent })
      },
      // Axios baseURL already includes "/api"
    })
    const blob = res.data as Blob
    const cd = (res.headers as any)['content-disposition'] as string | undefined
    const contentType = (res.headers as any)['content-type'] as string | undefined
    const fallback = filenameHint || path.split('/').pop() || 'export'
    const filename = parseFilename(cd || null, fallback)

    const href = URL.createObjectURL(new Blob([blob], { type: contentType || accept }))
    const a = document.createElement('a')
    a.href = href
    a.download = filename || fallback
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
    return true
  } catch (err: any) {
    if (err?.response?.status === 401) onUnauthorized?.()
    const msg = err?.message || 'Export fehlgeschlagen'
    throw new Error(msg)
  }
}
