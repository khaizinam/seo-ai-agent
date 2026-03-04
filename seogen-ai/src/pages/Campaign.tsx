import { useState, useMemo } from 'react'
import { invoke } from '../lib/api'
import { DataTable, ColumnDef, PaginationState, SortState } from '../components/ui/DataTable'
import { TableFilter } from '../components/ui/TableFilter'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Edit2, Trash2, KeyRound, Upload, Plus, Loader2, Save } from 'lucide-react'
import { useEffect } from 'react'

interface Campaign { id: number; name: string; description: string; status: string; created_at: string }
interface Keyword { id: number; keyword: string; intent: string; status: string }

const STATUS_OPTS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Done', value: 'done' },
]
const STATUS_BADGE: Record<string, string> = { active: 'badge-success', paused: 'badge-warning', done: 'badge-info' }
const INTENT_BADGE: Record<string, string> = { informational: 'badge-info', commercial: 'badge-warning', transactional: 'badge-success', navigational: 'badge-purple' }

// ─── Campaign form default ───────────────────────────────────────
const EMPTY_FORM = { name: '', description: '', status: 'active' }

export default function CampaignPage() {
  // Raw data
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])

  // Filter state — only applied when user clicks Search
  const [appliedFilter, setAppliedFilter] = useState({ keyword: '', status: '', sortBy: 'created_at', sortDir: 'desc' as 'asc' | 'desc' })

  // Table state
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 50, total: 0 })
  const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' })

  // UI states
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal states
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Campaign | null>(null)
  const [deleteItem, setDeleteItem] = useState<Campaign | null>(null)
  const [kwItem, setKwItem] = useState<Campaign | null>(null)

  // Form state (shared create/edit)
  const [form, setForm] = useState(EMPTY_FORM)

  // Keyword form
  const [newKw, setNewKw] = useState('')
  const [bulkKws, setBulkKws] = useState('')
  const [kwLoading, setKwLoading] = useState(false)

  // ─── Load ────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true)
    const data = await invoke<Campaign[]>('campaign:list')
    setCampaigns(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ─── Apply filter + sort + paginate (client-side) ────────────────
  const filtered = useMemo(() => {
    let res = campaigns.filter(c => {
      const kw = appliedFilter.keyword.toLowerCase()
      const matchKw = !kw || c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw)
      const matchStatus = !appliedFilter.status || c.status === appliedFilter.status
      return matchKw && matchStatus
    })
    // Sort
    const sortKey = sort.key as keyof Campaign
    res = [...res].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return res
  }, [campaigns, appliedFilter, sort])

  // Sync total
  useEffect(() => {
    setPagination(p => ({ ...p, total: filtered.length, page: 1 }))
  }, [filtered.length])

  const pageData = useMemo(() =>
    filtered.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize),
    [filtered, pagination.page, pagination.pageSize]
  )

  // ─── Handlers ────────────────────────────────────────────────────
  const handleSearch = (params: any) => {
    setAppliedFilter({ keyword: params.keyword, status: params.filters.status || '', sortBy: params.sortBy, sortDir: params.sortDir })
    setSort({ key: params.sortBy || 'created_at', dir: params.sortDir || 'desc' })
    setPagination(p => ({ ...p, page: 1 }))
  }

  const openCreate = () => { setForm(EMPTY_FORM); setCreateOpen(true) }
  const openEdit = (c: Campaign) => { setEditItem(c); setForm({ name: c.name, description: c.description || '', status: c.status }) }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setActionLoading(true)
    await invoke('campaign:create', { name: form.name, description: form.description, status: form.status })
    setCreateOpen(false); setForm(EMPTY_FORM); await load(); setActionLoading(false)
  }

  const handleEdit = async () => {
    if (!editItem || !form.name.trim()) return
    setActionLoading(true)
    await invoke('campaign:update', { ...editItem, ...form })
    setEditItem(null); await load(); setActionLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setActionLoading(true)
    await invoke('campaign:delete', deleteItem.id)
    setDeleteItem(null); await load(); setActionLoading(false)
  }

  const openKw = async (c: Campaign) => {
    setKwItem(c); setNewKw(''); setBulkKws('')
    const kws = await invoke<Keyword[]>('keyword:list', c.id)
    setKeywords(kws || [])
  }

  const addKeyword = async () => {
    if (!kwItem || !newKw.trim()) return
    setKwLoading(true)
    await invoke('keyword:create', { campaign_id: kwItem.id, keyword: newKw, status: 'pending' })
    setNewKw('')
    const kws = await invoke<Keyword[]>('keyword:list', kwItem.id)
    setKeywords(kws || []); setKwLoading(false)
  }

  const bulkAdd = async () => {
    if (!kwItem) return
    const lines = bulkKws.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return; setKwLoading(true)
    await invoke('keyword:bulkCreate', { campaign_id: kwItem.id, keywords: lines })
    setBulkKws('')
    const kws = await invoke<Keyword[]>('keyword:list', kwItem.id)
    setKeywords(kws || []); setKwLoading(false)
  }

  // ─── Columns ─────────────────────────────────────────────────────
  const columns: ColumnDef<Campaign>[] = [
    {
      key: 'name', title: 'Tên chiến dịch', sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
          {c.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.description}</div>}
        </div>
      )
    },
    {
      key: 'status', title: 'Trạng thái', sortable: true, width: 110,
      render: c => <span className={`badge ${STATUS_BADGE[c.status] || 'badge-muted'}`}>{c.status}</span>
    },
    {
      key: 'keywords', title: 'Từ khoá', width: 90, align: 'center',
      render: c => (
        <button className="btn-ghost" style={{ fontSize: 12, gap: 4 }} onClick={() => openKw(c)}>
          <KeyRound size={12} style={{ flexShrink: 0 }} /> Xem
        </button>
      )
    },
    {
      key: 'created_at', title: 'Ngày tạo', sortable: true, width: 120,
      render: c => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
    },
  ]

  // ─── Form fields (shared create/edit) ────────────────────────────
  const FormFields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="label">Tên chiến dịch <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input className="input" placeholder="VD: Blog Manga18k Q1/2026" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div>
        <label className="label">Mô tả</label>
        <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Mục tiêu, ghi chú chiến dịch..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <div>
        <label className="label">Trạng thái</label>
        <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🎯 Chiến dịch từ khoá</h1>
        <p className="page-subtitle">Quản lý chiến dịch & nhóm từ khoá SEO</p>
      </div>

      {/* Filter Bar */}
      <TableFilter
        filters={[{ key: 'status', placeholder: 'Trạng thái', options: STATUS_OPTS }]}
        sorts={[
          { key: 'created_at', label: 'Ngày tạo' },
          { key: 'name', label: 'Tên' },
          { key: 'status', label: 'Trạng thái' },
        ]}
        initialSortBy="created_at"
        initialSortDir="desc"
        createLabel="Tạo chiến dịch"
        onCreateClick={openCreate}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Summary */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {filtered.length} chiến dịch {appliedFilter.keyword || appliedFilter.status ? `(lọc từ ${campaigns.length} tổng)` : ''}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={pageData}
        rowKey={c => c.id}
        pagination={pagination}
        sort={sort}
        loading={loading}
        emptyText="Không tìm thấy chiến dịch nào. Nhấn &quot;Tạo chiến dịch&quot; để bắt đầu."
        onPageChange={page => setPagination(p => ({ ...p, page }))}
        onPageSizeChange={pageSize => setPagination(p => ({ ...p, pageSize, page: 1 }))}
        onSortChange={setSort}
        pageSizeOptions={[50, 100, 200]}
        rowActions={c => (<>
          <button className="btn-ghost" title="Sửa" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
          <button className="btn-ghost" title="Từ khoá" onClick={() => openKw(c)}><Upload size={13} /></button>
          <button className="btn-ghost" title="Xoá" style={{ color: 'var(--danger)' }} onClick={() => setDeleteItem(c)}><Trash2 size={13} /></button>
        </>)}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title="Tạo chiến dịch mới"
        onClose={() => setCreateOpen(false)}
        footer={<>
          <button className="btn-ghost" onClick={() => setCreateOpen(false)}>Hủy</button>
          <button className="btn-primary" onClick={handleCreate} disabled={!form.name.trim() || actionLoading}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Tạo chiến dịch
          </button>
        </>}
      >
        <FormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editItem}
        title={`Chỉnh sửa — ${editItem?.name || ''}`}
        onClose={() => setEditItem(null)}
        footer={<>
          <button className="btn-ghost" onClick={() => setEditItem(null)}>Hủy</button>
          <button className="btn-primary" onClick={handleEdit} disabled={!form.name.trim() || actionLoading}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu thay đổi
          </button>
        </>}
      >
        <FormFields />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        title="Xoá chiến dịch?"
        message={`Chiến dịch "${deleteItem?.name}" và toàn bộ từ khoá bên trong sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá vĩnh viễn"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={actionLoading}
      />

      {/* Keyword Management Modal */}
      <Modal
        open={!!kwItem}
        title={`Từ khoá — ${kwItem?.name || ''}`}
        onClose={() => setKwItem(null)}
        width={680}
        maxHeight="85vh"
        footer={<button className="btn-ghost" onClick={() => setKwItem(null)}>Đóng</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Add inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Thêm từng từ khoá</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" placeholder="Nhập từ khoá..." value={newKw} onChange={e => setNewKw(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()} />
                <button className="btn-secondary" onClick={addKeyword} disabled={kwLoading || !newKw.trim()}>
                  {kwLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Bulk (mỗi dòng 1 từ khoá)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <textarea className="input" style={{ height: 38, resize: 'none' }} placeholder={'kw 1\nkw 2...'} value={bulkKws} onChange={e => setBulkKws(e.target.value)} />
                <button className="btn-secondary" onClick={bulkAdd} disabled={kwLoading || !bulkKws.trim()}>
                  <Upload size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Keyword table */}
          <div style={{ maxHeight: 320, overflow: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table className="data-table">
              <thead><tr><th>Từ khoá</th><th style={{ width: 130 }}>Intent</th><th style={{ width: 110 }}>Trạng thái</th></tr></thead>
              <tbody>
                {keywords.map(k => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{k.keyword}</td>
                    <td><span className={`badge ${INTENT_BADGE[k.intent] || 'badge-muted'}`}>{k.intent || '—'}</span></td>
                    <td><span className={`badge ${k.status === 'done' ? 'badge-success' : k.status === 'in_progress' ? 'badge-warning' : 'badge-muted'}`}>{k.status}</span></td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>Chưa có từ khoá nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{keywords.length} từ khoá</div>
        </div>
      </Modal>
    </div>
  )
}
