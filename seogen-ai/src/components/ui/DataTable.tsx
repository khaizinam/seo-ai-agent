import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Pagination, PaginationState } from './Pagination'

export type ColumnDef<T> = {
  key: string
  title: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
}

export type { PaginationState }

export type SortState = {
  key: string
  dir: 'asc' | 'desc'
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  pagination: PaginationState
  sort?: SortState
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSortChange?: (sort: SortState) => void
  pageSizeOptions?: number[]
  loading?: boolean
  emptyText?: string
  rowActions?: (row: T) => React.ReactNode
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

export function DataTable<T>({
  columns, data, rowKey, pagination, sort,
  onPageChange, onPageSizeChange, onSortChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  loading = false, emptyText = 'Không có dữ liệu',
  rowActions,
}: DataTableProps<T>) {
  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleSort = (key: string) => {
    if (!onSortChange) return
    if (sort?.key === key) {
      onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ key, dir: 'asc' })
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sort?.key !== col) return <ChevronUp size={11} style={{ opacity: 0.2 }} />
    return sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
  }


  return (
    <div>
      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(var(--surface-1-rgb), 0.6)',
              zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 400, fontSize: 11 }}>#</th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                      {col.title}
                      {col.sortable && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
                {rowActions && (
                  <th style={{ width: 110, textAlign: 'right' }}>Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 2 : 1)} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    {loading ? 'Đang tải...' : emptyText}
                  </td>
                </tr>
              ) : data.map((row, idx) => (
                <tr key={rowKey(row)}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '0 12px' }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row, idx) : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                  {rowActions && (
                    <td style={{ textAlign: 'right', padding: '0 12px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: Pagination */}
      <Pagination
        state={pagination}
        onPageChange={onPageChange || (() => {})}
        onPageSizeChange={onPageSizeChange || (() => {})}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
