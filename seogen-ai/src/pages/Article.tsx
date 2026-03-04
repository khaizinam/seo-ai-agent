import { useEffect, useState, useCallback } from 'react'
import { invoke } from '../lib/api'
import { Plus, Trash2, FileText, Wand2, Loader2, Eye, Edit2 } from 'lucide-react'

interface Campaign { id: number; name: string }
interface Persona { id: number; name: string }
interface Keyword { id: number; keyword: string }
interface Article { id: number; title: string; keyword: string; persona_name: string; status: string; seo_score: number; created_at: string }

export default function ArticlePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [showCreate, setShowCreate] = useState(false)

  const [selCampaign, setSelCampaign] = useState('')
  const [selKeyword, setSelKeyword] = useState('')
  const [selPersona, setSelPersona] = useState('')
  const [selProvider, setSelProvider] = useState('gemini')
  const [customTitle, setCustomTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [viewArticle, setViewArticle] = useState<{ html: string; title: string } | null>(null)

  const load = useCallback(async () => {
    const [arts, camps, pers] = await Promise.all([
      invoke<Article[]>('article:list'),
      invoke<Campaign[]>('campaign:list'),
      invoke<Persona[]>('persona:list'),
    ])
    setArticles(arts || []); setCampaigns(camps || []); setPersonas(pers || [])
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selCampaign) { setKeywords([]); return }
    invoke<Keyword[]>('keyword:list', +selCampaign).then(kws => setKeywords(kws || []))
  }, [selCampaign])

  async function generateArticle() {
    const kw = keywords.find(k => k.id === +selKeyword)
    const persona = personas.find(p => p.id === +selPersona)
    if (!kw) return
    setGenerating(true); setGeneratedHtml('')

    const systemPrompt = persona
      ? `Bạn là ${persona.name}. Viết bài SEO chuyên nghiệp, tự nhiên theo phong cách của bạn.`
      : 'Bạn là chuyên gia SEO content writer. Viết bài chuẩn SEO, tự nhiên, hấp dẫn.'

    const userPrompt = `Viết bài SEO đầy đủ về từ khoá: "${kw.keyword}"
${customTitle ? `Tiêu đề: ${customTitle}` : ''}
Yêu cầu:
- Định dạng HTML đầy đủ (không cần <html><body>, chỉ nội dung)
- Có H1, H2, H3 phù hợp
- Độ dài 1000-1500 từ
- Mật độ từ khoá 1-2%
- Văn phong tự nhiên, không nhồi nhét
- Thêm FAQ section ở cuối
Output chỉ là HTML, không markdown, không giải thích.`

    const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
      provider: selProvider,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    })

    if (res.success) {
      setGeneratedHtml(res.content)
      // Auto-save
      const title = customTitle || `Bài về: ${kw.keyword}`
      const textContent = res.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const saved = await invoke<{ id?: number }>('article:create', {
        keyword_id: +selKeyword, persona_id: persona?.id,
        title, content_html: res.content, content_text: textContent, status: 'draft',
      })
      // Auto-run SEO audit
      if (saved.id) {
        await invoke('audit:run', {
          articleId: saved.id, title, contentHtml: res.content,
          contentText: textContent, keyword: kw.keyword,
        })
      }
      await load()
    }
    setGenerating(false)
  }

  const STATUS_COLOR: Record<string, string> = { draft: 'badge-muted', reviewed: 'badge-warning', published: 'badge-success' }

  return (
    <div style={{ padding: 28, maxWidth: 980 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">📝 Bài viết</h1><p className="page-subtitle">Tạo & quản lý bài viết SEO</p></div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> {showCreate ? 'Đóng' : 'Tạo bài viết'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>✍️ Tạo bài viết mới với AI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label">Chiến dịch</label>
              <select className="select" value={selCampaign} onChange={e => { setSelCampaign(e.target.value); setSelKeyword('') }}>
                <option value="">-- Chọn chiến dịch --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Từ khoá *</label>
              <select className="select" value={selKeyword} onChange={e => setSelKeyword(e.target.value)} disabled={!selCampaign}>
                <option value="">-- Chọn từ khoá --</option>
                {keywords.map(k => <option key={k.id} value={k.id}>{k.keyword}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nhân vật viết bài</label>
              <select className="select" value={selPersona} onChange={e => setSelPersona(e.target.value)}>
                <option value="">-- Mặc định --</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">AI Provider</label>
              <select className="select" value={selProvider} onChange={e => setSelProvider(e.target.value)}>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
                <option value="copilot">OpenAI / Copilot</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Tiêu đề tùy chỉnh (không bắt buộc)</label>
            <input className="input" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Để trống để AI tự chọn..." />
          </div>
          <button className="btn-primary" onClick={generateArticle} disabled={!selKeyword || generating} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {generating ? <><Loader2 size={15} className="animate-spin" /> Đang tạo bài viết...</> : <><Wand2 size={15} /> Tạo bài viết với AI</>}
          </button>
          {generatedHtml && (
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', fontSize: 13 }}>
              ✅ Đã tạo và lưu bài viết! SEO Audit đã chạy tự động.
              <button className="btn-ghost" style={{ marginLeft: 12, fontSize: 12 }} onClick={() => setViewArticle({ html: generatedHtml, title: customTitle || 'Bài viết mới' })}>
                <Eye size=  {12} /> Xem bài
              </button>
            </div>
          )}
        </div>
      )}

      {/* Articles list */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Tiêu đề</th><th>Từ khoá</th><th>Nhân vật</th><th>Trạng thái</th><th>SEO</th><th></th></tr></thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</td>
                <td><span className="badge badge-info" style={{ fontSize: 10 }}>{a.keyword || '—'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.persona_name || 'Mặc định'}</td>
                <td><span className={`badge ${STATUS_COLOR[a.status] || 'badge-muted'}`}>{a.status}</span></td>
                <td><span style={{ fontWeight: 700, color: a.seo_score >= 70 ? '#10b981' : a.seo_score >= 50 ? '#f59e0b' : '#ef4444' }}>{a.seo_score}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost" style={{ padding: 4 }} onClick={async () => {
                      const full = await invoke<{ content_html?: string; title?: string }>('article:get', a.id)
                      setViewArticle({ html: full?.content_html || '', title: full?.title || a.title })
                    }}><Eye size={12} /></button>
                    <button className="btn-ghost" style={{ padding: 4, color: 'var(--danger)' }} onClick={async () => {
                      if (!confirm('Xoá?')) return
                      await invoke('article:delete', a.id); load()
                    }}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có bài viết nào</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Article viewer modal */}
      {viewArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '85vw', maxWidth: 860, height: '85vh', display: 'flex', flexDirection: 'column' }} className="glass-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{viewArticle.title}</span>
              <button className="btn-ghost" onClick={() => setViewArticle(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#fff', borderRadius: '0 0 10px 10px' }}>
              <div style={{ color: '#1a1a1a', lineHeight: 1.8, fontFamily: 'Georgia, serif' }} dangerouslySetInnerHTML={{ __html: viewArticle.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
