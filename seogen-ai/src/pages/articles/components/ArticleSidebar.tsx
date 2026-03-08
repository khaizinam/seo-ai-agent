import { Save, Check, Sparkles, Send } from 'lucide-react'
import { Button, ButtonGenAI, Section, FormField, SelectField } from '../../../components/ui'

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
  status: string
  setStatus: (v: string) => void
  weekNumber: number
  setWeekNumber: (v: number) => void
  articleType: 'pillar' | 'satellite'
  setArticleType: (v: 'pillar' | 'satellite') => void
  plannedKeywordName: string
  isEdit: boolean
  plannedId: string | null
  saving: boolean
  generating: boolean
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
  plannedKeywordName, isEdit, plannedId,
  saving, generating,
  onSave, onSaveAndExit, onExit, onGenFull, onPublish
}: Props) {
  const campaignOpts = campaigns.map(c => ({ label: c.name, value: c.id }))
  const personaOpts = personas.map(p => ({ label: p.name, value: p.id }))
  const keywordOpts = keywords.map(k => ({ label: k.keyword, value: k.id }))

  const isKeywordLocked = !!(plannedId || plannedKeywordName)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                disabled={!!plannedId}
              />
            </FormField>

            <FormField
              label={`Từ khoá${!isKeywordLocked ? ' *' : ''}`}
              hint={isKeywordLocked ? 'Dữ liệu từ khoá từ kế hoạch.' : undefined}
            >
              {!isKeywordLocked ? (
                <SelectField
                  options={keywordOpts}
                  placeholder="-- Chọn từ khoá --"
                  value={selKeyword}
                  onChange={e => setSelKeyword(e.target.value)}
                />
              ) : (
                <div style={{ padding: '8px 12px', background: 'var(--surface-1)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', border: '1px solid var(--border)', minHeight: 40, display: 'flex', alignItems: 'center' }}>
                  {keywords.find(k => k.id === +selKeyword)?.keyword || plannedKeywordName || '...'}
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

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <ButtonGenAI
                loading={generating}
                disabled={generating}
                onClick={onGenFull}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                Sinh nội dung AI
              </ButtonGenAI>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
