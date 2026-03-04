import { useEffect, useState } from 'react'
import { invoke } from '../lib/api'
import { Plus, Trash2, Edit2, X, Save, Loader2, Wand2 } from 'lucide-react'

interface Persona { id: number; name: string; description: string; writing_style: string; tone: string; example_text: string; prompt_template: string }

const TONES = ['friendly', 'formal', 'casual', 'authoritative', 'empathetic', 'storytelling', 'journalistic', 'humorous']

export default function PersonaPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [editing, setEditing] = useState<Partial<Persona> | null>(null)
  const [previewing, setPreviewing] = useState<number | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = async () => { setPersonas(await invoke<Persona[]>('persona:list') || []) }
  useEffect(() => { load() }, [])

  const isNew = !editing?.id

  async function save() {
    if (!editing?.name) return
    if (isNew) await invoke('persona:create', editing)
    else await invoke('persona:update', editing)
    setEditing(null); load()
  }

  async function del(id: number) {
    if (!confirm('Xoá nhân vật này?')) return
    await invoke('persona:delete', id); load()
  }

  async function previewPersona(p: Persona) {
    setPreviewing(p.id); setPreviewText(''); setPreviewLoading(true)
    const res = await invoke<{ success: boolean; content: string }>('ai:generate', {
      provider: 'gemini',
      messages: [
        { role: 'system', content: p.prompt_template || `Bạn là ${p.name}. Phong cách: ${p.writing_style}. Giọng điệu: ${p.tone}.` },
        { role: 'user', content: `Viết 2-3 câu mẫu về chủ đề "tối ưu SEO website" theo đúng phong cách của bạn.` },
      ],
    })
    setPreviewText(res.success ? res.content : 'Lỗi: ' + res.content)
    setPreviewLoading(false)
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">👤 Nhân vật viết bài</h1><p className="page-subtitle">Tạo & quản lý giọng văn, phong cách viết</p></div>
        <button className="btn-primary" onClick={() => setEditing({})}><Plus size={14} /> Tạo nhân vật</button>
      </div>

      {/* Editor Modal */}
      {editing !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ width: 640, maxHeight: '85vh', overflow: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{isNew ? '+ Tạo nhân vật mới' : 'Chỉnh sửa nhân vật'}</h3>
              <button className="btn-ghost" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            {[
              { label: 'Tên nhân vật *', key: 'name', placeholder: 'VD: Chuyên gia SEO Nam' },
              { label: 'Mô tả', key: 'description', placeholder: 'Giới thiệu về nhân vật này...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label className="label">{f.label}</label>
                <input className="input" placeholder={f.placeholder} value={(editing as Record<string, string>)[f.key] || ''}
                  onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label className="label">Tone giọng văn</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setEditing(p => ({ ...p, tone: t }))} style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    background: editing.tone === t ? 'var(--brand-primary)' : 'var(--surface-3)',
                    color: editing.tone === t ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${editing.tone === t ? 'var(--brand-primary)' : 'var(--border)'}`,
                  }}>{t}</button>
                ))}
              </div>
            </div>
            {[
              { label: 'Phong cách viết', key: 'writing_style', placeholder: 'Viết ngắn gọn, dùng ví dụ thực tế...' },
              { label: 'Văn mẫu (ví dụ)', key: 'example_text', placeholder: 'VD: Hãy tưởng tượng website của bạn là...' },
              { label: 'System Prompt (nâng cao)', key: 'prompt_template', placeholder: 'Bạn là [tên], một [mô tả]. Khi viết...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label className="label">{f.label}</label>
                <textarea className="textarea" placeholder={f.placeholder} style={{ minHeight: 70 }}
                  value={(editing as Record<string, string>)[f.key] || ''}
                  onChange={e => setEditing(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-primary" onClick={save} style={{ flex: 1, justifyContent: 'center' }}><Save size={14} /> Lưu nhân vật</button>
              <button className="btn-secondary" onClick={() => setEditing(null)}><X size={14} /> Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Persona grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginTop: 8 }}>
        {personas.map(p => (
          <div key={p.id} className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                <span className="badge badge-purple">{p.tone || 'friendly'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-ghost" style={{ padding: 5 }} onClick={() => setEditing(p)}><Edit2 size={12} /></button>
                <button className="btn-ghost" style={{ padding: 5, color: 'var(--danger)' }} onClick={() => del(p.id)}><Trash2 size={12} /></button>
              </div>
            </div>
            {p.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{p.description}</div>}
            {p.writing_style && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>{p.writing_style.slice(0, 100)}...</div>}
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => previewPersona(p)} disabled={previewLoading && previewing === p.id}>
              {previewLoading && previewing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Preview giọng văn
            </button>
            {previewing === p.id && previewText && (
              <div style={{ marginTop: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {previewText}
              </div>
            )}
          </div>
        ))}
        {personas.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
          Chưa có nhân vật nào. Tạo nhân vật đầu tiên!
        </div>}
      </div>
    </div>
  )
}
