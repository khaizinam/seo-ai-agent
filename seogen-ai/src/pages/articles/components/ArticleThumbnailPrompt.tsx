import { Loader2, Sparkles, Copy } from 'lucide-react'

interface Props {
  thumbnailPrompt: string
  setThumbnailPrompt: (v: string) => void
  generating: boolean
  onGenThumb: () => void
  onCopy: (text: string, label: string) => void
}

export function ArticleThumbnailPrompt({ thumbnailPrompt, setThumbnailPrompt, generating, onGenThumb, onCopy }: Props) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Thumbnail Prompt (AI Image)</h3>
          {thumbnailPrompt && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => onCopy(thumbnailPrompt, 'Thumbnail Prompt')}><Copy size={12}/></button>}
        </div>
        <button 
          className="btn-ghost" 
          style={{ fontSize: 11, color: 'var(--brand-primary)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.05)' }}
          onClick={onGenThumb}
          disabled={generating}
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          AI Gen Prompt Thumbs
        </button>
      </div>
      <div>
        <textarea 
          className="input" 
          style={{ minHeight: 100, padding: '12px', fontSize: 13, lineHeight: 1.5, background: 'var(--surface-1)' }}
          value={thumbnailPrompt} 
          onChange={e => setThumbnailPrompt(e.target.value)} 
          placeholder="Mô tả hình ảnh cho AI tạo ảnh (Midjourney, DALL-E...)"
        />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
           <span>💡 AI sẽ sinh ra prompt bằng tiếng Anh để đạt kết quả tốt nhất khi tạo ảnh.</span>
        </div>
      </div>
    </div>
  )
}
