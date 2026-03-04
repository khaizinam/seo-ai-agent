import { useState, useEffect } from 'react'
import { invoke } from '../lib/api'
import { BarChart3, Loader2, CheckCircle, AlertTriangle, Info, Wand2 } from 'lucide-react'

interface AuditIssue { type: 'critical' | 'warning' | 'info'; message: string; suggestion: string }
interface AuditResult { score: number; issues: AuditIssue[]; suggestions: string[]; breakdown: Record<string, number> }

const ISSUE_ICON = { critical: <AlertTriangle size={13} color="#ef4444" />, warning: <AlertTriangle size={13} color="#f59e0b" />, info: <Info size={13} color="#06b6d4" /> }
const ISSUE_COLOR = { critical: '#ef4444', warning: '#f59e0b', info: '#06b6d4' }

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const r = 24, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="72" height="72" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 22, color }}>{score}</span>
    </div>
  )
}

export default function AuditPage() {
  const [articles, setArticles] = useState<{ id: number; title: string; keyword: string; content_html: string; content_text: string; meta_title: string; meta_description: string }[]>([])
  const [selArticle, setSelArticle] = useState('')
  const [keyword, setKeyword] = useState('')
  const [htmlInput, setHtmlInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)

  useEffect(() => {
    invoke<typeof articles>('article:list').then(data => setArticles(data || []))
  }, [])

  async function runAudit() {
    setLoading(true); setResult(null)
    const article = articles.find(a => a.id === +selArticle)
    const contentHtml = article ? article.content_html : htmlInput
    const contentText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const res = await invoke<{ success: boolean } & AuditResult>('audit:run', {
      articleId: article?.id,
      title: metaTitle || article?.title || 'Bài viết',
      metaTitle: metaTitle || article?.meta_title,
      metaDescription: metaDesc || article?.meta_description,
      contentHtml, contentText,
      keyword: keyword || article?.keyword || '',
    })
    if (res.success) setResult(res)
    setLoading(false)
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="page-header">
        <h1 className="page-title">📊 SEO Audit</h1>
        <p className="page-subtitle">Phân tích & chấm điểm SEO bài viết theo 10 tiêu chí</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>🔍 Chọn hoặc nhập nội dung</div>

          <div style={{ marginBottom: 12 }}>
            <label className="label">Bài viết có sẵn (từ DB)</label>
            <select className="select" value={selArticle} onChange={e => {
              setSelArticle(e.target.value)
              const a = articles.find(x => x.id === +e.target.value)
              if (a) { setKeyword(a.keyword || ''); setMetaTitle(a.meta_title || ''); setMetaDesc(a.meta_description || '') }
            }}>
              <option value="">-- Hoặc nhập HTML thủ công --</option>
              {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>

          {!selArticle && (
            <div style={{ marginBottom: 12 }}>
              <label className="label">HTML Content</label>
              <textarea className="textarea" style={{ minHeight: 120 }} placeholder="Dán HTML bài viết vào đây..." value={htmlInput} onChange={e => setHtmlInput(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label className="label">Từ khoá chính *</label><input className="input" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="VD: tối ưu seo website" /></div>
            <div><label className="label">Meta Title</label><input className="input" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Meta Description</label>
            <textarea className="textarea" style={{ minHeight: 60 }} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} />
          </div>

          <button className="btn-primary" onClick={runAudit} disabled={loading || (!selArticle && !htmlInput) || !keyword} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Đang phân tích...</> : <><BarChart3 size={14} /> Chạy SEO Audit</>}
          </button>
        </div>

        {/* Results */}
        <div>
          {!result ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <BarChart3 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>Kết quả audit sẽ hiển thị ở đây</div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Score */}
              <div className="glass-card" style={{ padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20 }}>
                <ScoreRing score={result.score} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {result.score >= 80 ? '🏆 Xuất sắc' : result.score >= 60 ? '✅ Khá tốt' : result.score >= 40 ? '⚠️ Trung bình' : '❌ Cần cải thiện'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.issues.filter(i => i.type === 'critical').length} critical · {result.issues.filter(i => i.type === 'warning').length} warning · {result.issues.filter(i => i.type === 'info').length} info</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Breakdown</div>
                {Object.entries(result.breakdown).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 130, fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{k}</span>
                    <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(v / 15) * 100}%`, background: v > 0 ? 'var(--brand-primary)' : 'var(--surface-3)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Issues */}
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Vấn đề phát hiện</div>
                {result.issues.length === 0
                  ? <div style={{ color: '#10b981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Không có vấn đề nào!</div>
                  : result.issues.map((issue, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < result.issues.length - 1 ? '1px solid rgba(30,41,59,0.4)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        {ISSUE_ICON[issue.type]}
                        <span style={{ fontWeight: 500, fontSize: 12, color: ISSUE_COLOR[issue.type] }}>{issue.message}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 19 }}>→ {issue.suggestion}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
