import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { DataTable, ColumnDef, PaginationState, SortState } from '../../components/ui/DataTable'
import { TableFilter } from '../../components/ui/TableFilter'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Edit2, Trash2 } from 'lucide-react'
import { useTableState } from '../../hooks/useTableState'

interface Webhook {
  id: number
  name: string
  endpoint_url: string
  method: string
  status: string
  created_at: string
}

const STATUS_OPTS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]
const STATUS_BADGE: Record<string, string> = { active: 'badge-success', inactive: 'badge-muted' }

const METHOD_BADGE: Record<string, string> = {
  GET: 'badge-info',
  POST: 'badge-success',
  PUT: 'badge-warning',
  PATCH: 'badge-warning'
}

export default function WebhookIndex() {
  const navigate = useNavigate()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Applied filter
  const [appliedFilter, setAppliedFilter] = useTableState('webhook_filter', {
    keyword: '', status: '', sortKey: 'created_at', sortDir: 'desc' as 'asc' | 'desc'
  })

  // Table state
  const [pagination, setPagination] = useTableState<PaginationState>('webhook_pagination', { page: 1, pageSize: 50, total: 0 })
  const [sort, setSort] = useTableState<SortState>('webhook_sort', { key: 'created_at', dir: 'desc' })

  const [deleteItem, setDeleteItem] = useState<Webhook | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await invoke<Webhook[]>('webhook:list')
    setWebhooks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let res = webhooks.filter(w => {
      const kw = appliedFilter.keyword.toLowerCase()
      const matchKw = !kw || w.name.toLowerCase().includes(kw) || w.endpoint_url.toLowerCase().includes(kw)
      const matchStatus = !appliedFilter.status || w.status === appliedFilter.status
      return matchKw && matchStatus
    })
    const k = sort.key as keyof Webhook
    return [...res].sort((a, b) => {
      const av = a[k] ?? '', bv = b[k] ?? ''
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }, [webhooks, appliedFilter, sort])

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
    await invoke('webhook:delete', deleteItem.id)
    setDeleteItem(null)
    await load()
    setActionLoading(false)
  }

  const columns: ColumnDef<Webhook>[] = [
    {
      key: 'name', title: 'Tên Webhook', sortable: true,
      render: w => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.endpoint_url}</div>
        </div>
      ),
    },
    {
      key: 'method', title: 'Method', sortable: true, width: 100,
      render: w => <span className={`badge ${METHOD_BADGE[w.method] || 'badge-muted'}`}>{w.method}</span>,
    },
    {
      key: 'status', title: 'Trạng thái', sortable: true, width: 110,
      render: w => <span className={`badge ${STATUS_BADGE[w.status] || 'badge-muted'}`}>{w.status}</span>,
    },
    {
      key: 'created_at', title: 'Ngày tạo', sortable: true, width: 120,
      render: w => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString('vi-VN')}</span>,
    },
  ]

  return (
    <div style={{ padding: '28px 40px', maxWidth: '100%', margin: '0' }}>
      <div className="page-header">
        <h1 className="page-title">🔗 Webhooks</h1>
        <p className="page-subtitle">Quản lý các kết nối đẩy dữ liệu bài viết sang nền tảng khác</p>
      </div>

      <TableFilter
        filters={[{ key: 'status', placeholder: 'Trạng thái', options: STATUS_OPTS }]}
        sorts={[
          { key: 'created_at', label: 'Ngày tạo' },
          { key: 'name', label: 'Tên' },
          { key: 'status', label: 'Trạng thái' },
        ]}
        initialSortBy={sort.key}
        initialSortDir={sort.dir}
        createLabel="Tạo Webhook"
        onCreateClick={() => navigate('/webhook/create')}
        onSearch={handleSearch}
        loading={loading}
      />

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {filtered.length} webhooks
        {(appliedFilter.keyword || appliedFilter.status) ? ` (lọc từ ${webhooks.length} tổng)` : ''}
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        rowKey={w => w.id}
        pagination={pagination}
        sort={sort}
        loading={loading}
        emptyText="Không có webhook nào. Nhấn Tạo Webhook để bắt đầu."
        onPageChange={page => setPagination(p => ({ ...p, page }))}
        onPageSizeChange={pageSize => setPagination(p => ({ ...p, pageSize, page: 1 }))}
        onSortChange={setSort}
        pageSizeOptions={[50, 100, 200]}
        rowActions={w => (<>
          <button className="btn-ghost" title="Sửa" onClick={() => navigate(`/webhook/edit/${w.id}`)}>
            <Edit2 size={13} />
          </button>
          <button className="btn-ghost" title="Xoá" style={{ color: 'var(--danger)' }} onClick={() => setDeleteItem(w)}>
            <Trash2 size={13} />
          </button>
        </>)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        title="Xoá webhook?"
        message={`Webhook "${deleteItem?.name}" sẽ bị xoá vĩnh viễn và không thể phục hồi.`}
        confirmLabel="Xoá vĩnh viễn"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={actionLoading}
      />
    </div>
  )
}
