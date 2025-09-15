import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useListParams(defaults?: Partial<{ page: number; pageSize: number; sortBy: string; sortDir: 'asc'|'desc'; query: string }>) {
  const [sp, setSp] = useSearchParams()
  const params = useMemo(() => {
    const page = Number(sp.get('page') || defaults?.page || 1)
    const pageSize = Number(sp.get('pageSize') || defaults?.pageSize || 25)
    const sortBy = sp.get('sortBy') || defaults?.sortBy || ''
    const sortDir = (sp.get('sortDir') as 'asc'|'desc') || defaults?.sortDir || 'asc'
    const query = sp.get('query') || defaults?.query || ''
    const filters: Record<string,string> = {}
    for (const [k,v] of sp.entries()) {
      const m = k.match(/^filter\[(.+)\]$/)
      if (m && v) filters[m[1]] = v
    }
    return { page, pageSize, sortBy, sortDir, query, filters }
  }, [sp, defaults?.page, defaults?.pageSize, defaults?.sortBy, defaults?.sortDir, defaults?.query])

  const update = (patch: Partial<{ page: number; pageSize: number; sortBy: string; sortDir: 'asc'|'desc'; query: string; filters: Record<string,string|undefined> }>) => {
    const next = new URLSearchParams(sp)
    if (patch.page !== undefined) next.set('page', String(patch.page))
    if (patch.pageSize !== undefined) next.set('pageSize', String(patch.pageSize))
    if (patch.sortBy !== undefined) patch.sortBy ? next.set('sortBy', patch.sortBy) : next.delete('sortBy')
    if (patch.sortDir !== undefined) next.set('sortDir', patch.sortDir)
    if (patch.query !== undefined) {
      if (!patch.query) next.delete('query')
      else next.set('query', patch.query)
      // bei Suchwechsel auf Seite 1
      next.set('page','1')
    }
    if (patch.filters) {
      for (const [k,v] of Object.entries(patch.filters)) {
        const key = `filter[${k}]`
        if (v === undefined || v === '') next.delete(key)
        else next.set(key, String(v))
      }
      // reset to page 1 when filters change
      next.set('page','1')
    }
    // Historie pflegen (Back/Forward funktioniert)
    setSp(next)
  }
  return { params, update }
}
