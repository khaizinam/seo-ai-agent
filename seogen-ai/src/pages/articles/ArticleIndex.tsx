import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { DataTable, ColumnDef, PaginationState, SortState } from '../../components/ui/DataTable'
import { TableFilter } from '../../components/ui/TableFilter'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Edit2, Trash2, Send } from 'lucide-react'
import { useTableState } from '../../hooks/useTableState'
import { PublishModal } from './components/PublishModal'
import { PageHeader, Button } from '../../components/ui'

interface Article { 
  id: number; 
  title: string; 
  keyword: string; 
  keyword_from_db?: string;
  persona_name: string; 
  status: string; 
  seo_score: number; 
  created_at: string;
  campaign_id?: number;
  persona_id?: number;
  week_number?: number;
  article_type?: string;
}

const STATUS_OPTS = [
  { label: 'Bản nháp (Draft)', value: 'draft' },
  { label: 'Đã duyệt (Reviewed)', value: 'reviewed' },
  { label: 'Đã xuất bản (Published)', value: 'published' },
]

const STATUS_BADGE: Record<string, string> = { 
  draft: 'badge-muted', 
  reviewed: 'badge-warning', 
  published: 'badge-success' 
}

export default function ArticleIndex() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  

  // Applied filter (persisted)
  const [appliedFilter, setAppliedFilter] = useTableState('article_filter', {
    keyword: '', status: '', campaign_id: '', sortKey: 'created_at', sortDir: 'desc' as 'asc' | 'desc'
  })

  // Table state (persisted)
  const [pagination, setPagination] = useTableState<PaginationState>('article_pagination', { page: 1, pageSize: 20, total: 0 })
  const [sort, setSort] = useTableState<SortState>('article_sort', { key: 'created_at', dir: 'desc' })

  const [deleteItem, setDeleteItem] = useState<Article | null>(null)
  const [showPublishModal, setShowPublishModal] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await invoke<Article[]>('article:list')
    setArticles(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let res = articles.filter(a => {
      const kw = appliedFilter.keyword.toLowerCase()
      const matchKw = !kw || a.title.toLowerCase().includes(kw) || (a.keyword || '').toLowerCase().includes(kw)
      const matchStatus = !appliedFilter.status || a.status === appliedFilter.status
      const matchCamp = !appliedFilter.campaign_id || a.campaign_id === +appliedFilter.campaign_id
      return matchKw && matchStatus && matchCamp
    })
    const k = sort.key as keyof Article
    return [...res].sort((a, b) => {
      const av = a[k] ?? '', bv = b[k] ?? ''
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }, [articles, appliedFilter, sort])

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
      campaign_id: params.extraVals?.campaign_id || '',
      sortKey: params.sortBy || 'created_at',
      sortDir: params.sortDir || 'desc',
    })
    setSort({ key: params.sortBy || 'created_at', dir: params.sortDir || 'desc' })
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setActionLoading(true)
    await invoke('article:delete', deleteItem.id)
    setDeleteItem(null)
    await load()
    setActionLoading(false)
  }

  const columns: ColumnDef<Article>[] = [
    { key: 'id', title: 'ID', sortable: true, width: 60, render: a => <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{a.id}</div> },
    {
      key: 'title', title: 'Tiêu đề bài viết', sortable: true,
      render: a => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{a.title}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {a.keyword && <span className="badge badge-info" style={{ fontSize: 10 }}>{a.keyword}</span>}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>NV: {a.persona_name || 'Mặc định'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'article_type', title: 'Loại', width: 100, sortable: true,
      render: a => (
        <span className={`badge ${a.article_type === 'pillar' ? 'badge-purple' : 'badge-muted'}`}>
          {a.article_type === 'pillar' ? 'Pillar' : 'Satellite'}
        </span>
      )
    },
    {
      key: 'week_number', title: 'Tuần', width: 60, align: 'center', sortable: true,
      render: a => <span style={{ fontWeight: 700 }}>{a.week_number || 1}</span>
    },
    {
      key: 'status', title: 'Trạng thái', width: 120, sortable: true,
      render: a => <span className={`badge ${STATUS_BADGE[a.status] || 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{a.status}</span>
    },
    {
      key: 'seo_score', title: 'SEO Score', width: 100, sortable: true,
      render: a => <span style={{ fontWeight: 700, color: a.seo_score >= 70 ? '#10b981' : a.seo_score >= 50 ? '#f59e0b' : '#ef4444' }}>{a.seo_score} / 100</span>
    },
    {
      key: 'created_at', title: 'Ngày tạo', width: 120, sortable: true,
      render: a => <span style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</span>
    },
    {
      key: 'actions', title: 'Thao tác', align: 'right', width: 140,
      render: a => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" icon={<Send size={14} />}
            style={{ color: 'var(--brand-primary)', width: 28, height: 28, padding: 6 }}
            onClick={() => setShowPublishModal(a.id)}
            title="Cập nhật lên trang"
          />
          <Button variant="ghost" size="sm" icon={<Edit2 size={14} />}
            style={{ color: 'var(--success)', width: 28, height: 28, padding: 6 }}
            onClick={() => navigate(`/article/edit/${a.id}`)}
            title="Chỉnh sửa nội dung"
          />
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
            style={{ color: 'var(--danger)', width: 28, height: 28, padding: 6 }}
            onClick={() => setDeleteItem(a)}
            title="Xóa bài viết"
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: '24px 32px' }}>
      <PageHeader
        title="📝 Quản lý bài viết"
        subtitle="Quản lý và kiểm duyệt bài viết SEO"
        actions={
          <Button variant="primary" icon={<Edit2 size={14} />} onClick={() => navigate('/article/create')}>
            Tạo bài viết mới
          </Button>
        }
      />

      <TableFilter
        initialKeyword={appliedFilter.keyword}
        initialFilters={{ status: appliedFilter.status }}
        initialExtraVals={{ campaign_id: appliedFilter.campaign_id }}
        initialSortBy={appliedFilter.sortKey}
        initialSortDir={appliedFilter.sortDir}
        filters={[{ key: 'status', placeholder: 'Trạng thái', options: STATUS_OPTS }]}
        extraInputs={[{ key: 'campaign_id', placeholder: 'Mã chiến dịch (ID)' }]}
        sorts={[
          { key: 'id', label: 'Mã (ID)' },
          { key: 'title', label: 'Tiêu đề bài viết' },
          { key: 'article_type', label: 'Loại bài viết' },
          { key: 'week_number', label: 'Tuần' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'seo_score', label: 'Điểm SEO' },
          { key: 'created_at', label: 'Ngày tạo' },
        ]}
        createLabel="Tạo bài viết mới"
        onCreateClick={() => navigate('/article/create')}
        onSearch={handleSearch}
        loading={loading}
      />

      <div style={{ marginTop: 16 }}>
        <DataTable
          data={pageData}
          columns={columns}
          rowKey={a => a.id}
          loading={loading}
          emptyText="Không tìm thấy bài viết nào."
          pagination={pagination}
          sort={sort}
          onPageChange={p => setPagination(prev => ({ ...prev, page: p }))}
          onPageSizeChange={s => setPagination(prev => ({ ...prev, pageSize: s, page: 1 }))}
          onSortChange={setSort}
        />
      </div>

      <ConfirmDialog
        open={!!deleteItem}
        title="Xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài "${deleteItem?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá bài viết"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />

      <PublishModal 
        open={!!showPublishModal}
        onClose={() => setShowPublishModal(null)}
        articleId={showPublishModal || 0}
      />

    </div>
  )
}
