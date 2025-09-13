import { describe, it, expect } from 'vitest'
import { fromSearchParams, toSearchParams, type ListParams } from './listParams'

describe('listParams mapping', () => {
  it('toSearchParams maps all fields including filters', () => {
    const p: ListParams = {
      page: 2,
      pageSize: 50,
      sortBy: 'name',
      sortDir: 'asc',
      filters: { name: 'foo', city: 'Berlin' },
    }
    const sp = toSearchParams(p)
    expect(sp.get('page')).toBe('2')
    expect(sp.get('pageSize')).toBe('50')
    expect(sp.get('sortBy')).toBe('name')
    expect(sp.get('sortDir')).toBe('asc')
    expect(sp.get('filter[name]')).toBe('foo')
    expect(sp.get('filter[city]')).toBe('Berlin')
  })

  it('fromSearchParams reads values and defaults pageSize 25', () => {
    const sp = new URLSearchParams('page=3&sortBy=city&sortDir=desc&filter[name]=x')
    const p = fromSearchParams(sp)
    expect(p.page).toBe(3)
    expect(p.pageSize).toBe(25)
    expect(p.sortBy).toBe('city')
    expect(p.sortDir).toBe('desc')
    expect(p.filters.name).toBe('x')
  })

  it('respects provided defaults', () => {
    const sp = new URLSearchParams()
    const p = fromSearchParams(sp, { page: 5, pageSize: 100, sortBy: 'email', sortDir: 'asc', filters: {} as any })
    expect(p.page).toBe(5)
    expect(p.pageSize).toBe(100)
    expect(p.sortBy).toBe('email')
    expect(p.sortDir).toBe('asc')
  })
})

