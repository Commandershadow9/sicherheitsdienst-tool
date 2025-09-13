export type SortDir = 'asc' | 'desc'
export interface ListParams {
  page: number
  pageSize: number
  sortBy?: string
  sortDir?: SortDir
  filters: Record<string, string>
}

export function toSearchParams(params: ListParams): URLSearchParams {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('pageSize', String(params.pageSize))
  if (params.sortBy) sp.set('sortBy', params.sortBy)
  if (params.sortDir) sp.set('sortDir', params.sortDir)
  for (const [k, v] of Object.entries(params.filters || {})) {
    if (v !== undefined && v !== '') sp.set(`filter[${k}]`, String(v))
  }
  return sp
}

export function fromSearchParams(sp: URLSearchParams, defaults?: Partial<ListParams>): ListParams {
  const page = Number(sp.get('page') || defaults?.page || 1)
  const pageSize = Number(sp.get('pageSize') || defaults?.pageSize || 25)
  const sortBy = sp.get('sortBy') || (defaults?.sortBy as string | undefined)
  const sortDir = (sp.get('sortDir') as SortDir | null) || (defaults?.sortDir as SortDir | undefined)
  const filters: Record<string, string> = {}
  for (const [k, v] of sp.entries()) {
    const m = k.match(/^filter\[(.+)\]$/)
    if (m && v) filters[m[1]] = v
  }
  return { page, pageSize, sortBy, sortDir, filters }
}

