import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { DataTable, ColumnDef, PaginationState, SortState } from '../../components/ui/DataTable'
import { TableFilter } from '../../components/ui/TableFilter'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Edit2, Trash2, Plus, Loader2 } from 'lucide-react'

import { useTableState } from '../../hooks/useTableState'
import { useAppStore } from '../../stores/app.store'

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const STATUS_OPTS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Done', value: 'done' },
]
const STATUS_BADGE: Record<string, string> = { active: 'badge-success', paused: 'badge-warning', done: 'badge-info' }

export default function CampaignIndex() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const setToast = useAppStore(s => s.setToast)

  // Applied filter (persisted)
  const [appliedFilter, setAppliedFilter] = useTableState('campaign_filter', {
    keyword: '', status: '', sortKey: 'created_at', sortDir: 'desc' as 'asc' | 'desc'
  })

  // Table state (persisted)
  const [pagination, setPagination] = useTableState<PaginationState>('campaign_pagination', { page: 1, pageSize: 50, total: 0 })
  const [sort, setSort] = useTableState<SortState>('campaign_sort', { key: 'created_at', dir: 'desc' })

  const [deleteItem, setDeleteItem] = useState<Campaign | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await invoke<Campaign[]>('campaign:list')
    setCampaigns(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let res = campaigns.filter(c => {
      const kw = appliedFilter.keyword.toLowerCase()
      const matchKw = !kw || c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw)
      const matchStatus = !appliedFilter.status || c.status === appliedFilter.status
      return matchKw && matchStatus
    })
    const k = sort.key as keyof Campaign
    return [...res].sort((a, b) => {
      const av = a[k] ?? '', bv = b[k] ?? ''
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }, [campaigns, appliedFilter, sort])

  useEffect(() => {
    setPagination(p => ({ ...p, total: filtered.length, page: 1 }))
  }, [filtered.length])

  const pageData = useMemo(() =>
    filtered.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize),
    [filtered, pagination.page, pagination.pageSize]
  )

  const handleSearch = (params: any) => {
    setAppliedFilter({
      keyword: params.keyword,
      status: params.filters.status || '',
      sortKey: params.sortBy || 'created_at',
      sortDir: params.sortDir || 'desc',
    })
    setSort({ key: params.sortBy || 'created_at', dir: params.sortDir || 'desc' })
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setActionLoading(true)
    try {
      await invoke('campaign:delete', deleteItem.id)
      setToast({ message: 'Xoá chiến dịch thành công', type: 'success' })
    } catch (err: any) {
      setToast({ message: `Lỗi khi xoá: ${err.message || 'Không xác định'}`, type: 'error' })
    }
    setDeleteItem(null)
    await load()
    setActionLoading(false)
  }

  const columns: ColumnDef<Campaign>[] = [
    {
      key: 'id', title: 'ID', sortable: true, width: 70,
      render: c => <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>#{c.id}</span>,
    },
    {
      key: 'name', title: 'Tên chiến dịch', sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
          {c.description && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status', title: 'Trạng thái', sortable: true, width: 110,
      render: c => <span className={`badge ${STATUS_BADGE[c.status] || 'badge-muted'}`}>{c.status}</span>,
    },
    {
      key: 'created_at', title: 'Ngày tạo', sortable: true, width: 120,
      render: c => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('vi-VN')}</span>,
    },
  ]

  return (
    <div style={{ padding: '28px 40px', maxWidth: '100%', margin: '0' }}>
      <div className="page-header">
        <h1 className="page-title">🎯 Chiến dịch từ khoá</h1>
        <p className="page-subtitle">Quản lý chiến dịch & nhóm từ khoá SEO</p>
      </div>

      <TableFilter
        initialKeyword={appliedFilter.keyword}
        initialFilters={{ status: appliedFilter.status }}
        filters={[{ key: 'status', placeholder: 'Trạng thái', options: STATUS_OPTS }]}
        sorts={[
          { key: 'created_at', label: 'Ngày tạo' },
          { key: 'name', label: 'Tên' },
          { key: 'status', label: 'Trạng thái' },
        ]}
        initialSortBy={sort.key}
        initialSortDir={sort.dir}
        createLabel="Tạo chiến dịch"
        onCreateClick={() => navigate('/campaign/create')}
        onSearch={handleSearch}
        loading={loading}
      />

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {filtered.length} chiến dịch
        {(appliedFilter.keyword || appliedFilter.status) ? ` (lọc từ ${campaigns.length} tổng)` : ''}
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        rowKey={c => c.id}
        pagination={pagination}
        sort={sort}
        loading={loading}
        emptyText="Không có chiến dịch nào. Nhấn Tạo chiến dịch để bắt đầu."
        onPageChange={page => setPagination(p => ({ ...p, page }))}
        onPageSizeChange={pageSize => setPagination(p => ({ ...p, pageSize, page: 1 }))}
        onSortChange={setSort}
        pageSizeOptions={[50, 100, 200]}
        rowActions={c => (<>
          <button className="btn-ghost" title="Sửa" onClick={() => navigate(`/campaign/edit/${c.id}`)}>
            <Edit2 size={13} />
          </button>
          <button className="btn-ghost" title="Xoá" style={{ color: 'var(--danger)' }} onClick={() => setDeleteItem(c)}>
            <Trash2 size={13} />
          </button>
        </>)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        title="Xoá chiến dịch?"
        message={`Chiến dịch "${deleteItem?.name}" cùng TOÀN BỘ bài viết và từ khoá bên trong sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá vĩnh viễn"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={actionLoading}
      />
    </div>
  )
}
