import React from 'react'

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
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="text-left p-2">
                {c.sortable && onSort ? (
                  <button className="underline" onClick={() => onSort(String(c.key))}>
                    {c.header}{' '}
                    {sortBy === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={columns.length}>
                Lade…
              </td>
            </tr>
          )}
          {error && !loading && (
            <tr>
              <td className="p-3 text-red-600" colSpan={columns.length}>
                Fehler beim Laden
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
          {!loading && !error &&
            rows.map((r, idx) => (
              <tr key={(r.id as string) ?? idx} className="border-t">
                {columns.map((c) => (
                  <td key={String(c.key)} className="p-2">
                    {c.render ? c.render(r) : (r as any)[c.key] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between p-2 gap-2">
        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <select
              className="border rounded px-2 py-1"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((o) => (
                <option key={o} value={o}>
                  {o} / Seite
                </option>
              ))}
            </select>
          )}
        </div>
        <div>Seite {pagination.page} / {Math.max(1, pagination.totalPages)}</div>
        <div className="flex gap-2">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
            Zurück
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  )
}

