import React from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

export type PaginationState = {
  page: number
  pageSize: number
  total: number
}

interface PaginationProps {
  state: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  state,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 200]
}: PaginationProps) {
  const { page, pageSize, total } = state
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getPaginationPages = () => {
    const delta = 2
    const range: number[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    return range
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '12px 20px',
      borderTop: '1px solid var(--border)',
      background: 'rgba(var(--surface-1-rgb), 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Hiển thị</span>
        <select className="select" style={{ width: 80, fontSize: 12, padding: '0 8px', height: 32 }}
          value={pageSize} onChange={e => { onPageSizeChange(+e.target.value); onPageChange(1) }}>
          {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>/ {total} kết quả</span>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn-ghost" style={{ padding: '4px 6px' }} onClick={() => onPageChange(1)} disabled={page === 1} title="Trang đầu">
            <ChevronsLeft size={14} />
          </button>
          <button className="btn-ghost" style={{ padding: '4px 6px' }} onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Trang trước">
            <ChevronLeft size={14} />
          </button>

          {getPaginationPages().map(p => (
            <button key={p} onClick={() => onPageChange(p)} style={{
              minWidth: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: p === page ? 700 : 400,
              background: p === page ? 'var(--brand-primary)' : 'transparent',
              color: p === page ? 'white' : 'var(--text-primary)',
              transition: 'all 0.15s'
            }}>{p}</button>
          ))}

          <button className="btn-ghost" style={{ padding: '4px 6px' }} onClick={() => onPageChange(page + 1)} disabled={page === totalPages} title="Trang sau">
            <ChevronRight size={14} />
          </button>
          <button className="btn-ghost" style={{ padding: '4px 6px' }} onClick={() => onPageChange(totalPages)} disabled={page === totalPages} title="Trang cuối">
            <ChevronsRight size={14} />
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Trang {page}/{totalPages}</span>
        </div>
      )}
    </div>
  )
}
