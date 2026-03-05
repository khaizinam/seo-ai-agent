import { useState, useRef } from 'react'
import { Search, Plus, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

export type FilterOption = {
  label: string
  value: string
}

export type FilterConfig = {
  key: string
  placeholder: string
  options: FilterOption[]
}

export type SortConfig = {
  key: string
  label: string
}

export type ExtraInputConfig = {
  key: string
  placeholder: string
  label?: string
}

type TableFilterProps = {
  filters?: FilterConfig[]
  extraInputs?: ExtraInputConfig[]
  sorts?: SortConfig[]
  onSearch: (params: { keyword: string; filters: Record<string, string>; extraVals: Record<string, string>; sortBy: string; sortDir: 'asc' | 'desc' }) => void
  createLabel?: string
  onCreateClick?: () => void
  initialSortBy?: string
  initialSortDir?: 'asc' | 'desc'
  loading?: boolean
}

export function TableFilter({
  filters = [],
  extraInputs = [],
  sorts = [],
  onSearch,
  createLabel = 'Tạo mới',
  onCreateClick,
  initialSortBy = '',
  initialSortDir = 'desc',
  loading = false,
}: TableFilterProps) {
  const [keyword, setKeyword] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map(f => [f.key, '']))
  )
  const [extraVals, setExtraVals] = useState<Record<string, string>>(
    Object.fromEntries(extraInputs.map(e => [e.key, '']))
  )
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    onSearch({ keyword, filters: filterValues, extraVals, sortBy, sortDir })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleReset = () => {
    setKeyword('')
    setFilterValues(Object.fromEntries(filters.map(f => [f.key, ''])))
    setExtraVals(Object.fromEntries(extraInputs.map(e => [e.key, ''])))
    setSortBy(initialSortBy)
    setSortDir(initialSortDir)
    onSearch({ 
      keyword: '', 
      filters: Object.fromEntries(filters.map(f => [f.key, ''])), 
      extraVals: Object.fromEntries(extraInputs.map(e => [e.key, ''])),
      sortBy: initialSortBy, sortDir: initialSortDir 
    })
    inputRef.current?.focus()
  }

  const hasActiveFilters = keyword || Object.values(filterValues).some(v => v) || Object.values(extraVals).some(v => v)

  return (
    <div className="glass-card" style={{ padding: '16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Search Input */}
        <div style={{ flex: '1 1 240px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tìm theo tên, mô tả...</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              className="input"
              style={{ paddingLeft: 32, height: 38 }}
              placeholder={keyword || "Từ khoá tìm kiếm..."}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bộ lọc: {f.placeholder}</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="select"
                    style={{ minWidth: 140, height: 38, appearance: 'none' }}
                    value={filterValues[f.key] || ''}
                    onChange={e => setFilterValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">Tất cả</option>
                    {f.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            
            {extraInputs.map(e => (
              <div key={e.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {e.label || e.placeholder}
                </label>
                <input
                  className="input"
                  style={{ minWidth: 100, maxWidth: 140, height: 38 }}
                  placeholder={e.placeholder}
                  value={extraVals[e.key] || ''}
                  onChange={ev => setExtraVals(prev => ({ ...prev, [e.key]: ev.target.value }))}
                  onKeyDown={handleKeyDown}
                />
              </div>
            ))}
          </div>
        )}

        {/* Sort By */}
        {sorts.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sắp xếp theo</label>
              <select className="select" style={{ minWidth: 140, height: 38 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {sorts.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', opacity: 0 }}>Thứ tự</label>
              <select className="select" style={{ width: 100, height: 38 }} value={sortDir} onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}>
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button className="btn-secondary" onClick={handleSearch} disabled={loading} style={{ height: 38, marginTop: 22 }}>
          <Search size={13} /> Tìm kiếm
        </button>

        {/* Reset if active */}
        {hasActiveFilters && (
          <button className="btn-ghost" onClick={handleReset} style={{ fontSize: 12, color: 'var(--text-muted)', height: 38, marginTop: 22 }}>
            Xoá lọc
          </button>
        )}

        {/* Right Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn-secondary" onClick={handleReset} style={{ height: 38 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg> Làm mới
          </button>
          
          {onCreateClick && (
            <button className="btn-primary" onClick={onCreateClick} style={{ height: 38, background: '#ef4444', color: 'white' }}>
              <Plus size={14} /> {createLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
