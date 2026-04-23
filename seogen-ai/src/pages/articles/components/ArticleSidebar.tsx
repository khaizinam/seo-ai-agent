import { Save, Check, Sparkles, Send } from 'lucide-react'
import { Button, ButtonGenAI, Section, FormField, SelectField } from '../../../components/ui'

interface Campaign { id: number; name: string }
interface Persona { id: number; name: string }
interface Keyword { id: number; keyword: string }

interface Props {
  campaigns: Campaign[]
  personas: Persona[]
  keywords: Keyword[]
  selCampaign: string | number
  setSelCampaign: (v: string | number) => void
  selKeyword: string | number
  setSelKeyword: (v: string | number) => void
  selPersona: string | number
  setSelPersona: (v: string | number) => void
  status: string
  setStatus: (v: string) => void
  weekNumber: number
  setWeekNumber: (v: number) => void
  articleType: 'pillar' | 'satellite'
  setArticleType: (v: 'pillar' | 'satellite') => void
  slug: string
  setSlug: (v: string) => void
  internalLinks: string
  setInternalLinks: (v: string) => void
  plannedKeywordName: string
  articleData: any
  isEdit: boolean
  plannedId: string | null
  saving: boolean
  generating: boolean
  setGenerating?: (v: boolean) => void
  setAiOverlayVisible?: (v: boolean) => void
  setAiOverlayStep?: (v: string) => void
  onSave: () => void
  onSaveAndExit: () => void
  onExit: () => void
  onGenFull: () => void
  onPublish: () => void
}

const STATUS_OPTS = [
  { label: 'Bản nháp (Draft)', value: 'draft' },
  { label: 'Đã duyệt (Reviewed)', value: 'reviewed' },
  { label: 'Đã xuất bản (Published)', value: 'published' },
]

const ARTICLE_TYPE_OPTS = [
  { label: 'Pillar (Trụ cột)', value: 'pillar' },
  { label: 'Satellite (Vệ tinh)', value: 'satellite' },
]

export function ArticleSidebar({
  campaigns, personas, keywords,
  selCampaign, setSelCampaign, selKeyword, setSelKeyword, selPersona, setSelPersona,
  status, setStatus,
  weekNumber, setWeekNumber,
  articleType, setArticleType,
  slug, setSlug,
  internalLinks, setInternalLinks,
  plannedKeywordName, articleData, isEdit, plannedId,
  saving, generating,
  setGenerating, setAiOverlayVisible, setAiOverlayStep,
  onSave, onSaveAndExit, onExit, onGenFull, onPublish
}: Props) {
  const campaignOpts = campaigns.map(c => ({ label: c.name, value: c.id }))
  const personaOpts = personas.map(p => ({ label: p.name, value: p.id }))
  const keywordOpts = keywords.map(k => ({ label: k.keyword, value: k.id }))

  const isKeywordLocked = !!(plannedId || plannedKeywordName)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Action Card */}
        {/* Action Card */}
        <Section title="HÀNH ĐỘNG" noPadding>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button variant="primary" fullWidth loading={saving || generating} icon={<Save size={16} />}
              style={{ height: 44, background: 'var(--brand-primary)' }} onClick={onSave}>
              Lưu bài viết
            </Button>

            <Button variant="primary" fullWidth loading={saving || generating} icon={<Check size={16} />}
              style={{ height: 44, background: '#10b981' }} onClick={onSaveAndExit}>
              Lưu &amp; Thoát
            </Button>

            {isEdit && (
              <Button variant="primary" fullWidth disabled={saving || generating} icon={<Send size={16} />}
                style={{ height: 44, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} onClick={onPublish}>
                Cập nhật lên trang
              </Button>
            )}

            <Button variant="secondary" fullWidth disabled={saving || generating}
              style={{ height: 44 }} onClick={onExit}>
              Thoát
            </Button>
          </div>
        </Section>

        {/* Setup Card */}
        <Section title="THIẾT LẬP BÀI VIẾT">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Chiến dịch">
              <SelectField
                options={campaignOpts}
                placeholder="-- Chọn chiến dịch --"
                value={selCampaign}
                onChange={e => { setSelCampaign(e.target.value); setSelKeyword('') }}
              />
            </FormField>

            <FormField
              label={`Từ khoá${!isKeywordLocked ? ' *' : ''}`}
              hint={isKeywordLocked ? 'Dữ liệu từ khoá từ kế hoạch.' : undefined}
            >
              <SelectField
                options={keywordOpts}
                placeholder="-- Chọn từ khoá --"
                value={selKeyword}
                onChange={e => setSelKeyword(e.target.value)}
              />
              {isKeywordLocked && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--brand-primary)', fontWeight: 500 }}>
                  * Đây là từ khoá từ kế hoạch, nhưng bạn vẫn có thể thay đổi.
                </div>
              )}
            </FormField>

            <FormField label="Nhân vật / Giọng văn">
              <SelectField
                options={personaOpts}
                placeholder="-- Mặc định --"
                value={selPersona}
                onChange={e => setSelPersona(e.target.value)}
              />
            </FormField>

            <FormField label="Tuần thực hiện">
              <input
                type="number"
                className="input"
                min={1}
                value={weekNumber}
                onChange={e => setWeekNumber(+e.target.value)}
              />
            </FormField>

            <FormField label="Loại bài viết">
              <SelectField
                options={ARTICLE_TYPE_OPTS}
                value={articleType}
                onChange={e => setArticleType(e.target.value as any)}
              />
            </FormField>

            <FormField label="Trạng thái bài viết">
              <SelectField
                options={STATUS_OPTS}
                value={status}
                onChange={e => setStatus(e.target.value)}
              />
            </FormField>

            <FormField label="URL Slug" hint="Đường dẫn tĩnh cho bài viết (SEO Friendly)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="cach-toi-uu-seo-2024"
                />
                <button 
                  className="btn-ghost" 
                  style={{ padding: '0 8px', color: 'var(--brand-primary)' }}
                  title="Tự động tạo Slug tối ưu từ Tiêu đề"
                  onClick={async () => {
                     // Simple local slugify as fallback or AI Gen
                     if (setGenerating && setAiOverlayVisible && setAiOverlayStep) {
                        setGenerating(true)
                        setAiOverlayVisible(true)
                        setAiOverlayStep('Đang tối ưu URL Slug...')
                         try {
                           const res = await window.api.invoke('ai:generate', {
                              messages: [
                                 { role: 'system', content: 'You are an SEO expert. Generate a short, clean, descriptive URL slug in lowercase with hyphens. ONLY output the slug, nothing else.' },
                                 { role: 'user', content: `Generate a clean SEO URL slug for an article with these details:
Title: "${articleData.title || 'New Article'}"
Campaign Summary: "${articleData.campaign_summary || 'N/A'}"
Target Audience: "${articleData.target_audience || 'N/A'}"
Tone: "${articleData.tone_of_voice || 'N/A'}"` }
                              ]
                           }) as { success: boolean, content: string }
                           if (res.success) {
                              setSlug(res.content.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
                           }
                        } finally {
                           setGenerating(false)
                           setAiOverlayVisible(false)
                        }
                     }
                  }}
                >
                  <Sparkles size={14} />
                </button>
              </div>
            </FormField>
          </div>
        </Section>
    </div>
  )
}
