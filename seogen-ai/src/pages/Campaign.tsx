import { useState, useEffect } from 'react'
import { invoke } from '../lib/api'
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, Loader2 } from 'lucide-react'

interface Campaign { id: number; name: string; description: string; status: string; created_at: string }
interface Keyword { id: number; campaign_id: number; keyword: string; volume: number; difficulty: number; intent: string; status: string }

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [keywords, setKeywords] = useState<Record<number, Keyword[]>>({})
  const [expanded, setExpanded] = useState<number | null>(null)
  const [newName, setNewName] = useState(''); const [newDesc, setNewDesc] = useState('')
  const [newKw, setNewKw] = useState(''); const [bulkKws, setBulkKws] = useState('')
  const [loading, setLoading] = useState(false); const [generatingIntent, setGeneratingIntent] = useState(false)

  const load = async () => {
    const data = await invoke<Campaign[]>('campaign:list')
    setCampaigns(data || [])
  }
  useEffect(() => { load() }, [])

  async function createCampaign() {
    if (!newName.trim()) return
    await invoke('campaign:create', { name: newName, description: newDesc })
    setNewName(''); setNewDesc(''); load()
  }

  async function deleteCampaign(id: number) {
    if (!confirm('Xoá chiến dịch này?')) return
    await invoke('campaign:delete', id); load()
  }

  async function loadKeywords(id: number) {
    const kws = await invoke<Keyword[]>('keyword:list', id)
    setKeywords(p => ({ ...p, [id]: kws || [] }))
  }

  async function addKeyword(campaign_id: number) {
    if (!newKw.trim()) return; setLoading(true)
    await invoke('keyword:create', { campaign_id, keyword: newKw, status: 'pending' })
    setNewKw(''); await loadKeywords(campaign_id); setLoading(false)
  }

  async function bulkAddKeywords(campaign_id: number) {
    const lines = bulkKws.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return; setLoading(true)
    await invoke('keyword:bulkCreate', { campaign_id, keywords: lines })
    setBulkKws(''); await loadKeywords(campaign_id); setLoading(false)
  }

  async function expand(id: number) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id); await loadKeywords(id)
  }

  const INTENT_COLORS: Record<string, string> = {
    informational: 'badge-info', commercial: 'badge-warning',
    transactional: 'badge-success', navigational: 'badge-purple'
  }

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title">🎯 Chiến dịch từ khoá</h1>
        <p className="page-subtitle">Quản lý chiến dịch & nhóm từ khoá SEO</p>
      </div>

      {/* Create campaign */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>+ Tạo chiến dịch mới</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label className="label">Tên chiến dịch *</label>
            <input className="input" placeholder="VD: Blog kỹ thuật Q1/2026" value={newName} onChange={e => setNewName(e.target.value)} /></div>
          <div><label className="label">Mô tả</label>
            <input className="input" placeholder="Mục tiêu chiến dịch..." value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
        </div>
        <button className="btn-primary" onClick={createCampaign} disabled={!newName.trim()}>
          <Plus size={14} /> Tạo chiến dịch
        </button>
      </div>

      {/* Campaign list */}
      {campaigns.length === 0
        ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Chưa có chiến dịch nào</div>
        : campaigns.map(c => (
          <div key={c.id} className="glass-card" style={{ marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>}
              </div>
              <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'done' ? 'badge-info' : 'badge-muted'}`}>{c.status}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{keywords[c.id]?.length || 0} từ khoá</span>
              <button className="btn-ghost" onClick={() => expand(c.id)} style={{ padding: 6 }}>
                {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button className="btn-ghost" style={{ padding: 6, color: 'var(--danger)' }} onClick={() => deleteCampaign(c.id)}><Trash2 size={13} /></button>
            </div>

            {expanded === c.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                {/* Add keywords */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="label">Thêm từng từ khoá</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="input" placeholder="Nhập từ khoá..." value={newKw} onChange={e => setNewKw(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addKeyword(c.id)} />
                      <button className="btn-secondary" onClick={() => addKeyword(c.id)} disabled={loading || !newKw.trim()}>
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Bulk import (mỗi dòng 1 từ khoá)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <textarea className="input" style={{ height: 38, resize: 'none' }} placeholder="từ khoá 1&#10;từ khoá 2..." value={bulkKws} onChange={e => setBulkKws(e.target.value)} />
                      <button className="btn-secondary" onClick={() => bulkAddKeywords(c.id)} disabled={loading || !bulkKws.trim()}>
                        <Upload size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keywords table */}
                <table className="data-table">
                  <thead><tr><th>Từ khoá</th><th>Intent</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {(keywords[c.id] || []).map(k => (
                      <tr key={k.id}>
                        <td style={{ fontWeight: 500 }}>{k.keyword}</td>
                        <td><span className={`badge ${INTENT_COLORS[k.intent] || 'badge-muted'}`}>{k.intent || '—'}</span></td>
                        <td><span className={`badge ${k.status === 'done' ? 'badge-success' : k.status === 'in_progress' ? 'badge-warning' : 'badge-muted'}`}>{k.status}</span></td>
                      </tr>
                    ))}
                    {(keywords[c.id] || []).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có từ khoá nào</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
