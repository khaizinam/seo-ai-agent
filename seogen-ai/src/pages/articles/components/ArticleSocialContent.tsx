import { Loader2, Sparkles, Copy } from 'lucide-react'

interface Props {
  socialContent: any[]
  setSocialContent: (v: any[]) => void
  generating: boolean
  onGenSocial: () => void
  onCopy: (text: string, label: string) => void
}

export function ArticleSocialContent({ socialContent, setSocialContent, generating, onGenSocial, onCopy }: Props) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Social Content (FB/LinkedIn)</h3>
        <button 
          className="btn-ghost" 
          style={{ fontSize: 12, color: 'var(--brand-primary)', gap: 6 }}
          onClick={onGenSocial}
          disabled={generating}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI Social Content
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {socialContent.length === 0 && (
          <div style={{ padding: '20px', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có nội dung social. Nhấn AI Social Content để tạo.
          </div>
        )}
        {socialContent.map((item, idx) => (
          <div key={idx}>
            <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--brand-primary)', fontWeight: 700 }}>{item.social_type}</span>
              <button 
                className="btn-ghost" 
                style={{ padding: '2px 8px', fontSize: 11, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => onCopy(item.content, `nội dung ${item.social_type}`)}
              >
                <Copy size={12} /> Copy
              </button>
            </label>
            <textarea 
              className="input" 
              style={{ minHeight: 120, padding: '12px', fontSize: 13, lineHeight: 1.5, background: 'var(--surface-1)' }}
              value={item.content} 
              onChange={e => {
                const newContent = [...socialContent];
                newContent[idx] = { ...newContent[idx], content: e.target.value };
                setSocialContent(newContent);
              }} 
              placeholder={`Nội dung bài đăng cho ${item.social_type}...`}
            />
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
           <span>✨ AI sẽ tự động phân loại theo nền tảng.</span>
        </div>
      </div>
    </div>
  )
}
