import { Copy, Loader2, Sparkles } from 'lucide-react'

interface Props {
  metaTitle: string
  setMetaTitle: (v: string) => void
  metaDescription: string
  setMetaDescription: (v: string) => void
  onCopy: (text: string, label: string) => void
  generating: boolean
  onGenMeta: () => void
}

export function ArticleSeoMeta({ 
  metaTitle, setMetaTitle, 
  metaDescription, setMetaDescription, 
  onCopy, generating, onGenMeta 
}: Props) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>SEO Meta</h3>
        <button 
          className="btn-ghost" 
          style={{ fontSize: 11, color: 'var(--brand-primary)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.05)' }}
          onClick={onGenMeta}
          disabled={generating}
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          AI Gen Meta
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Meta Title
              {metaTitle && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => onCopy(metaTitle, 'Meta Title')}><Copy size={12}/></button>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 400, color: metaTitle.length > 60 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {metaTitle.length}/60
            </span>
          </label>
          <input 
            className="input" 
            value={metaTitle} 
            onChange={e => setMetaTitle(e.target.value)} 
            placeholder="Tiêu đề hiển thị trên Google..."
          />
        </div>
        <div>
          <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Meta Description
              {metaDescription && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => onCopy(metaDescription, 'Meta Description')}><Copy size={12}/></button>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 400, color: metaDescription.length > 160 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {metaDescription.length}/160
            </span>
          </label>
          <textarea 
            className="input" 
            style={{ minHeight: 80, padding: '10px 12px' }}
            value={metaDescription} 
            onChange={e => setMetaDescription(e.target.value)} 
            placeholder="Mô tả ngắn gọn về nội dung bài viết..."
          />
        </div>
      </div>
    </div>
  )
}
