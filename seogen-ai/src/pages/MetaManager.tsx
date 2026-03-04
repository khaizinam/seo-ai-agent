import { useState, useEffect, useCallback } from 'react'
import { invoke } from '../lib/api'
import {
  Search, Filter, Download, Wand2, CheckCheck,
  RefreshCw, Loader2, ChevronUp, ChevronDown, Eye
} from 'lucide-react'

interface ArticleMeta {
  id: number; title: string; slug: string; keyword: string
  meta_title: string; meta_description: string
  meta_title_status: 'auto' | 'edited' | 'approved'
  meta_desc_status: 'auto' | 'edited' | 'approved'
  seo_score: number; status: string; campaign_name: string
}

const STATUS_BADGE: Record<string, string> = {
  auto: 'badge badge-muted',
  edited: 'badge badge-warning',
  approved: 'badge badge-success',
}

function SerpPreview({ metaTitle, metaDesc, slug }: { metaTitle: string; metaDesc: string; slug: string }) {
  return (
    <div className="serp-preview">
      <div className="serp-title">{metaTitle || 'Chưa có Meta Title'}</div>
      <div className="serp-url">https://yoursite.com/{slug || 'bai-viet'}</div>
      <div className="serp-desc">{metaDesc || 'Chưa có Meta Description.'}</div>
    </div>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = (value || '').length
  const cls = len > max ? 'char-danger' : len > max * 0.9 ? 'char-warning' : 'char-ok'
  return <span className={cls} style={{ fontSize: 11 }}>{len}/{max}</span>
}

export default function MetaManagerPage() {
  const [articles, setArticles] = useState<ArticleMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [edits, setEdits] = useState<Record<number, Partial<ArticleMeta>>>({})
  const [generatingFor, setGeneratingFor] = useState<Set<number>>(new Set())
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [bulkGenRunning, setBulkGenRunning] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await invoke<ArticleMeta[]>('article:metaList')
    setArticles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.keyword?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.meta_title_status === filterStatus
    return matchSearch && matchStatus
  })

  function toggleSelect(id: number) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(a => a.id)))
  }

  function getVal<K extends keyof ArticleMeta>(a: ArticleMeta, field: K): ArticleMeta[K] {
    return ((edits[a.id] as Partial<ArticleMeta>)?.[field] ?? a[field])
  }

  function setEdit(id: number, field: keyof ArticleMeta, value: string) {
    setEdits(p => ({
      ...p,
      [id]: {
        ...p[id],
        [field]: value,
        meta_title_status: field === 'meta_title' ? 'edited' : p[id]?.meta_title_status,
        meta_desc_status: field === 'meta_description' ? 'edited' : p[id]?.meta_desc_status,
      }
    }))
  }

  async function genMetaForArticle(a: ArticleMeta) {
    setGeneratingFor(s => new Set(s).add(a.id))
    const res = await invoke<{ success: boolean; meta_title?: string; meta_description?: string }>('ai:generateMeta', {
      keyword: a.keyword, title: a.title, content: ''
    })
    if (res.success) {
      setEdits(p => ({
        ...p,
        [a.id]: { ...p[a.id], meta_title: res.meta_title, meta_description: res.meta_description, meta_title_status: 'edited', meta_desc_status: 'edited' }
      }))
    }
    setGeneratingFor(s => { const n = new Set(s); n.delete(a.id); return n })
  }

  async function bulkGenMeta() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBulkGenRunning(true)
    for (const id of ids) {
      const a = articles.find(x => x.id === id)
      if (a) await genMetaForArticle(a)
    }
    setBulkGenRunning(false)
  }

  async function saveAll() {
    setSaving(true)
    const updates = Object.entries(edits).map(([id, data]) => ({ id: +id, ...data }))
    if (updates.length) await invoke('article:bulkUpdateMeta', updates)
    setEdits({})
    await load()
    setSaving(false)
  }

  async function bulkApprove() {
    if (!selected.size) return
    await invoke('article:bulkApproveMeta', Array.from(selected))
    setSelected(new Set())
    await load()
  }

  async function exportCsv() {
    const csv = await invoke<string>('article:exportMetaCsv', selected.size ? Array.from(selected) : undefined)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `meta-export-${Date.now()}.csv`; a.click()
  }

  const pendingEdits = Object.keys(edits).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1 className="page-title">🌐 Meta SEO Manager</h1>
          <p className="page-subtitle">Tổng hợp, chỉnh sửa và phê duyệt Meta Title + Description cho toàn bộ bài viết</p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Tìm theo tiêu đề, từ khoá..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
          </div>
          <select className="select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="auto">Auto</option>
            <option value="edited">Đã sửa</option>
            <option value="approved">Approved</option>
          </select>
          <div style={{ flex: 1 }} />
          {pendingEdits > 0 && (
            <button className="btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              Lưu {pendingEdits} thay đổi
            </button>
          )}
          <button className="btn-secondary" onClick={bulkGenMeta} disabled={!selected.size || bulkGenRunning}>
            {bulkGenRunning ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            Gen Meta ({selected.size})
          </button>
          <button className="btn-secondary" onClick={bulkApprove} disabled={!selected.size}><CheckCheck size={13} /> Approve</button>
          <button className="btn-ghost" onClick={exportCsv}><Download size={13} /> Export CSV</button>
          <button className="btn-ghost" onClick={load}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} /><br />Đang tải...
            </div>
          ) : (
            <table className="data-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: 24 }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 50 }} />
              </colgroup>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th></th>
                  <th>Tiêu đề bài</th>
                  <th>Từ khoá</th>
                  <th>Meta Title <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(≤60)</span></th>
                  <th>Meta Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(≤160)</span></th>
                  <th>Trạng thái</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const mt = String(getVal(a, 'meta_title') || '')
                  const md = String(getVal(a, 'meta_description') || '')
                  const mtStatus = (edits[a.id]?.meta_title_status || a.meta_title_status)
                  return (
                    <>
                      <tr key={a.id} style={{ background: selected.has(a.id) ? 'rgba(99,102,241,0.04)' : undefined }}>
                        <td><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => setPreviewId(previewId === a.id ? null : a.id)} title="SERP Preview">
                              {previewId === a.id ? <ChevronUp size={12} /> : <Eye size={12} />}
                            </button>
                            <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => genMetaForArticle(a)} title="Gen Meta" disabled={generatingFor.has(a.id)}>
                              {generatingFor.has(a.id) ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }} title={a.title}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.campaign_name}</div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: 10 }}>{a.keyword}</span>
                        </td>
                        <td>
                          <div>
                            <input
                              className="input" style={{ fontSize: 12, padding: '4px 8px', marginBottom: 2 }}
                              value={mt} maxLength={70}
                              onChange={e => setEdit(a.id, 'meta_title', e.target.value)}
                              placeholder="Nhập meta title..."
                            />
                            <CharCount value={mt} max={60} />
                          </div>
                        </td>
                        <td>
                          <div>
                            <textarea
                              className="input" style={{ fontSize: 12, padding: '4px 8px', resize: 'none', height: 50, marginBottom: 2 }}
                              value={md} maxLength={200}
                              onChange={e => setEdit(a.id, 'meta_description', e.target.value)}
                              placeholder="Nhập meta description..."
                            />
                            <CharCount value={md} max={160} />
                          </div>
                        </td>
                        <td>
                          <span className={STATUS_BADGE[mtStatus] || 'badge badge-muted'}>{mtStatus}</span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: a.seo_score >= 80 ? '#10b981' : a.seo_score >= 50 ? '#f59e0b' : '#ef4444'
                          }}>{a.seo_score}</span>
                        </td>
                      </tr>
                      {previewId === a.id && (
                        <tr key={`preview-${a.id}`}>
                          <td colSpan={8} style={{ padding: '8px 16px 16px', background: 'rgba(15,23,42,0.5)' }}>
                            <SerpPreview metaTitle={mt} metaDesc={md} slug={a.slug} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Chưa có bài viết nào {search ? `khớp "${search}"` : ''}
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
