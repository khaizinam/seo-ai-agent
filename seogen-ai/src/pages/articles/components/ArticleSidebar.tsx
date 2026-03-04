import { Loader2, Save, Check, Sparkles } from 'lucide-react'

interface Campaign { id: number; name: string }
interface Persona { id: number; name: string }
interface Keyword { id: number; keyword: string }

interface Props {
  campaigns: Campaign[]
  personas: Persona[]
  keywords: Keyword[]
  selCampaign: string
  setSelCampaign: (v: string) => void
  selKeyword: string
  setSelKeyword: (v: string) => void
  selPersona: string
  setSelPersona: (v: string) => void
  plannedKeywordName: string
  isEdit: boolean
  plannedId: string | null
  saving: boolean
  generating: boolean
  onSave: () => void
  onSaveAndExit: () => void
  onExit: () => void
  onGenFull: () => void
}

export function ArticleSidebar({
  campaigns, personas, keywords,
  selCampaign, setSelCampaign, selKeyword, setSelKeyword, selPersona, setSelPersona,
  plannedKeywordName, isEdit, plannedId,
  saving, generating,
  onSave, onSaveAndExit, onExit, onGenFull
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Action Card */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', zIndex: 10 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hành động</h3>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              className="btn-primary" 
              style={{ height: 44, width: '100%', justifyContent: 'center', background: 'var(--brand-primary)' }}
              onClick={onSave} 
              disabled={saving || generating}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu bài viết
            </button>
            
            <button 
              className="btn-primary" 
              style={{ height: 44, width: '100%', justifyContent: 'center', background: '#10b981' }}
              onClick={onSaveAndExit} 
              disabled={saving || generating}
            >
              <Check size={16} />
              Lưu &amp; Thoát
            </button>

            <button 
              className="btn-secondary" 
              style={{ height: 44, width: '100%', justifyContent: 'center' }}
              onClick={onExit}
              disabled={saving || generating}
            >
              Thoát
            </button>
          </div>
        </div>

        {/* Setup Card */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>
            Thiết lập bài viết
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Chiến dịch</label>
              <select className="select" value={selCampaign} onChange={e => { setSelCampaign(e.target.value); setSelKeyword('') }} disabled={isEdit || !!plannedId}>
                <option value="">-- Chọn chiến dịch --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="label">Từ khoá {!plannedId && !isEdit && '*'}</label>
              {!plannedId && !isEdit ? (
                <select className="select" value={selKeyword} onChange={e => setSelKeyword(e.target.value)}>
                  <option value="">-- Chọn từ khoá --</option>
                  {keywords.map(k => <option key={k.id} value={k.id}>{k.keyword}</option>)}
                </select>
              ) : (
                <div style={{ padding: '8px 12px', background: 'var(--surface-1)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', border: '1px solid var(--border)', minHeight: 40, display: 'flex', alignItems: 'center' }}>
                   {keywords.find(k => k.id === +selKeyword)?.keyword || plannedKeywordName || "..."}
                </div>
              )}
              {plannedId && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Dữ liệu từ khoá từ kế hoạch.</div>}
            </div>
            
            <div>
              <label className="label">Nhân vật / Giọng văn</label>
              <select className="select" value={selPersona} onChange={e => setSelPersona(e.target.value)}>
                <option value="">-- Mặc định --</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                onClick={onGenFull} 
                disabled={generating} 
                title={generating ? 'Đang xử lý...' : ''}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Sinh nội dung AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
