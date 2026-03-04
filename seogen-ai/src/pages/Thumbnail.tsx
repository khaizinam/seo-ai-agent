import { useState, useEffect } from 'react'
import { invoke } from '../lib/api'
import { Image, Wand2, Upload, Loader2, FolderOpen, RefreshCw, Plus, Trash2 } from 'lucide-react'

interface ThumbPrompt { id: number; name: string; prompt_template: string; style: string }

export default function ThumbnailPage() {
  const [prompts, setPrompts] = useState<ThumbPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<ThumbPrompt | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ path?: string; error?: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ path?: string; error?: string } | null>(null)
  const [newName, setNewName] = useState(''); const [newTemplate, setNewTemplate] = useState(''); const [newStyle, setNewStyle] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => { setPrompts(await invoke<ThumbPrompt[]>('thumbPrompt:list') || []) }
  useEffect(() => { load() }, [])

  async function generate() {
    const prompt = selectedPrompt ? selectedPrompt.prompt_template : customPrompt
    if (!prompt) return
    setGenerating(true); setResult(null)
    const res = await invoke<{ success: boolean; path?: string; error?: string }>('image:generate', { prompt, style: selectedPrompt?.style })
    setResult(res.success ? { path: res.path } : { error: res.error })
    setGenerating(false)
  }

  async function pickAndProcess() {
    const path = await invoke<string | null>('image:pickFile')
    if (!path) return
    setProcessing(true); setProcessResult(null)
    const res = await invoke<{ success: boolean; path?: string; error?: string }>('image:process', path)
    setProcessResult(res.success ? { path: res.path } : { error: res.error })
    setProcessing(false)
  }

  async function addPrompt() {
    if (!newName.trim() || !newTemplate.trim()) return
    await invoke('thumbPrompt:create', { name: newName, prompt_template: newTemplate, style: newStyle })
    setNewName(''); setNewTemplate(''); setNewStyle(''); setShowAdd(false); load()
  }

  return (
    <div style={{ padding: 28, maxWidth: 940 }}>
      <div className="page-header">
        <h1 className="page-title">🖼️ Thumbnail AI</h1>
        <p className="page-subtitle">Tạo thumbnail bằng Nano Banana API · Tự động resize 800px · PNG→JPG · Compress</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Generate */}
        <div>
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>🎨 Generate từ AI</div>

            {/* Prompt picker */}
            {prompts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label className="label">Prompt template</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {prompts.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPrompt(selectedPrompt?.id === p.id ? null : p); setCustomPrompt('') }} style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                      background: selectedPrompt?.id === p.id ? 'var(--brand-primary)' : 'var(--surface-3)',
                      color: selectedPrompt?.id === p.id ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${selectedPrompt?.id === p.id ? 'var(--brand-primary)' : 'var(--border)'}`,
                    }}>{p.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="label">{selectedPrompt ? 'Prompt đang dùng' : 'Custom prompt *'}</label>
              <textarea className="textarea" value={selectedPrompt ? selectedPrompt.prompt_template : customPrompt}
                readOnly={!!selectedPrompt} style={{ minHeight: 80 }}
                onChange={e => !selectedPrompt && setCustomPrompt(e.target.value)}
                placeholder="VD: minimalist tech blog thumbnail, blue gradient, abstract shapes, high quality..." />
            </div>

            {result?.path && (
              <div style={{ marginBottom: 14, padding: 10, background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.25)', fontSize: 12 }}>
                ✅ <span style={{ color: '#10b981' }}>Đã lưu:</span> <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{result.path}</span>
              </div>
            )}
            {result?.error && (
              <div style={{ marginBottom: 14, padding: 10, background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12 }}>
                ❌ {result.error}
              </div>
            )}

            <button className="btn-primary" onClick={generate} disabled={generating || (!customPrompt && !selectedPrompt)} style={{ width: '100%', justifyContent: 'center' }}>
              {generating ? <><Loader2 size={14} className="animate-spin" /> Đang tạo ảnh...</> : <><Wand2 size={14} /> Generate Thumbnail</>}
            </button>
          </div>

          {/* Process existing image */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>⚙️ Xử lý ảnh có sẵn</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Chọn ảnh PNG/JPG → tự động chuyển JPG + resize 800px + compress
            </p>
            {processResult?.path && (
              <div style={{ marginBottom: 12, padding: 8, background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: '#10b981' }}>
                ✅ Đã xử lý: <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{processResult.path}</span>
              </div>
            )}
            <button className="btn-secondary" onClick={pickAndProcess} disabled={processing} style={{ width: '100%', justifyContent: 'center' }}>
              {processing ? <><Loader2 size={13} className="animate-spin" /> Đang xử lý...</> : <><Upload size={13} /> Chọn ảnh & xử lý</>}
            </button>
          </div>
        </div>

        {/* Right: Prompt Library */}
        <div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📚 Thư viện Prompt
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowAdd(!showAdd)}><Plus size={12} /> Thêm</button>
            </div>

            {showAdd && (
              <div className="animate-fade-in" style={{ marginBottom: 16, padding: 14, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <label className="label">Tên template</label>
                  <input className="input" placeholder="VD: Tech Blog Dark" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label className="label">Prompt</label>
                  <textarea className="textarea" style={{ minHeight: 60 }} placeholder="minimalist dark theme, ..." value={newTemplate} onChange={e => setNewTemplate(e.target.value)} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">Style (optional)</label>
                  <input className="input" placeholder="photorealistic / illustration / abstract" value={newStyle} onChange={e => setNewStyle(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={addPrompt} disabled={!newName || !newTemplate} style={{ fontSize: 12, padding: '6px 12px' }}>Lưu prompt</button>
              </div>
            )}

            {prompts.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: 13 }}>Chưa có prompt nào</div>
              : prompts.map(p => (
                <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(30,41,59,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    {p.style && <span className="badge badge-info" style={{ fontSize: 10, marginTop: 2 }}>{p.style}</span>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{p.prompt_template.slice(0, 80)}...</div>
                  </div>
                  <button className="btn-ghost" style={{ padding: 4, color: 'var(--danger)', flexShrink: 0 }}
                    onClick={async () => { await invoke('thumbPrompt:delete', p.id); load() }}><Trash2 size={12} /></button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
