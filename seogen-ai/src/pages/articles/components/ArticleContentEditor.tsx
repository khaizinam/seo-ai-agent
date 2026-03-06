import { Wand2, Loader2, Eye, Code, Copy } from 'lucide-react'

interface Props {
  contentHtml: string
  setContentHtml: (v: string) => void
  title: string
  setTitle: (v: string) => void
  activeTab: 'html' | 'context'
  setActiveTab: (v: 'html' | 'context') => void
  generating: boolean
  onGenContent: () => void
  onMinify: () => void
  onCopy: (text: string, label: string) => void
  hideGenButton?: boolean
  onBlur?: () => void
}

export function ArticleContentEditor({
  contentHtml, setContentHtml, title, setTitle,
  activeTab, setActiveTab, generating,
  onGenContent, onMinify, onCopy, hideGenButton, onBlur
}: Props) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Nội dung bài viết</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!hideGenButton && (
            <button 
              className="btn-ghost" 
              style={{ fontSize: 11, color: 'var(--brand-primary)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.05)' }}
              onClick={onGenContent}
              disabled={generating}
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} AI Gen Content
            </button>
          )}
          {contentHtml && (
            <button 
              className="btn-ghost" 
              style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => onCopy(contentHtml, 'mã HTML')}
              title="Sao chép toàn bộ HTML"
            >
              <Copy size={12} /> Sao chép
            </button>
          )}
          {contentHtml && (
            <button 
              className="btn-ghost" 
              style={{ fontSize: 11, color: 'var(--brand-primary)', padding: '4px 8px' }}
              onClick={onMinify}
              title="Xoá các khoảng trắng thừa trong Code HTML"
            >
              Nén HTML
            </button>
          )}
          <div style={{ display: 'flex', background: 'var(--surface-1)', padding: 4, borderRadius: 8, gap: 4 }}>
            <button 
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, gap: 6, border: 'none', display: 'flex', alignItems: 'center', ...(activeTab === 'html' ? { background: 'var(--surface-3)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'var(--brand-primary)' } : { color: 'var(--text-muted)' }) }}
              onClick={() => setActiveTab('html')}
            >
              <Code size={14} /> HTML
            </button>
            <button 
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, gap: 6, border: 'none', display: 'flex', alignItems: 'center', ...(activeTab === 'context' ? { background: 'var(--surface-3)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'var(--brand-primary)' } : { color: 'var(--text-muted)' }) }}
              onClick={() => setActiveTab('context')}
            >
              <Eye size={14} /> Nội dung (Context)
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label className="label">Tiêu đề bài viết</label>
        <input 
          className="input" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          onBlur={onBlur}
          placeholder="Nhập tiêu đề hoặc để trống cho AI tự chọn..." 
        />
      </div>

      <div>
        {activeTab === 'html' ? (
          <textarea 
            className="input" 
            style={{ height: 600, maxHeight: 600, overflowY: 'auto', fontFamily: '"Fira Code", monospace', fontSize: 13, lineHeight: 1.6, background: 'var(--surface-0)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8 }}
            value={contentHtml} 
            onChange={e => setContentHtml(e.target.value)} 
            onBlur={onBlur}
            placeholder="Mã HTML nén sẽ xuất hiện tại đây..."
          />
        ) : (
          <div 
            style={{ height: 600, maxHeight: 600, overflowY: 'auto', padding: 32, background: 'var(--prose-bg)', color: 'var(--text-primary)', borderRadius: 8, border: '1px solid var(--border)' }}
          >
            <div 
              className="prose-preview"
              style={{ lineHeight: 1.8, fontSize: 16 }}
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p style="color: var(--text-muted); font-style: italic;">Chưa có nội dung để hiển thị. Hãy sử dụng AI để bắt đầu viết.</p>' }} 
            />
          </div>
        )}
      </div>
    </div>
  )
}
