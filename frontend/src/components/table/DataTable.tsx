import React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/table'
import { ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type Column<T> = {
  key: keyof T | string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

type Pagination = { page: number; pageSize: number; totalPages: number }

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: boolean
  emptyText?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  pagination: Pagination
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  error,
  emptyText = 'Keine Einträge',
  sortBy,
  sortDir,
  onSort,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: Props<T>) {
  return (
    <div className="border rounded">
      <Table>
        <THead>
          <Tr>
            {columns.map((c) => {
              const key = String(c.key)
              const active = sortBy === key
              const aria = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              const icon = c.sortable
                ? active
                  ? sortDir === 'asc'
                    ? 'up'
                    : 'down'
                  : 'both'
                : undefined
              return (
                <Th key={key} aria-sort={aria as any}>
                  {c.sortable && onSort ? (
                    <Button
                      variant="link"
                      onClick={() => onSort(key)}
                      title={active ? (sortDir === 'asc' ? 'Absteigend sortieren' : 'Aufsteigend sortieren') : 'Sortieren'}
                    >
                      <span>{c.header}</span>
                      {icon === 'both' && <ChevronsUpDown className="h-4 w-4" aria-hidden />}
                      {icon === 'up' && <ArrowUp className="h-4 w-4" aria-hidden />}
                      {icon === 'down' && <ArrowDown className="h-4 w-4" aria-hidden />}
                    </Button>
                  ) : (
                    c.header
                  )}
                </Th>
              )
            })}
          </Tr>
        </THead>
        <TBody>
          {loading && (
            <Tr>
              <Td className="p-3 text-muted-foreground" colSpan={columns.length}>
                Lade…
              </Td>
            </Tr>
          )}
          {error && !loading && (
            <Tr>
              <Td className="p-3 text-red-600" colSpan={columns.length}>
                Fehler beim Laden
              </Td>
            </Tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <Tr>
              <Td className="p-3 text-muted-foreground" colSpan={columns.length}>
                {emptyText}
              </Td>
            </Tr>
          )}
          {!loading && !error &&
            rows.map((r, idx) => (
              <Tr key={(r.id as string) ?? idx} className="border-t">
                {columns.map((c) => (
                  <Td key={String(c.key)} className="p-2">
                    {c.render ? c.render(r) : (r as any)[c.key] ?? ''}
                  </Td>
                ))}
              </Tr>
            ))}
        </TBody>
      </Table>
      <div className="flex items-center justify-between p-2 gap-2">
        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <Select value={String(pagination.pageSize)} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              {pageSizeOptions.map((o) => (
                <option key={o} value={o}>
                  {o} / Seite
                </option>
              ))}
            </Select>
          )}
        </div>
        <div>Seite {pagination.page} / {Math.max(1, pagination.totalPages)}</div>
        <div className="flex gap-2">
          <Button variant="link" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
            Zurück
          </Button>
          <Button variant="link" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
            Weiter
          </Button>
        </div>
      </div>
    </div>
  )
}
