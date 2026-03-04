import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { Save, Loader2, Sparkles, Check } from 'lucide-react'
import KeywordManager from './KeywordManager'
import CampaignDetails from './CampaignDetails'

interface Keyword {
  id: number
  keyword: string
  intent: string
  status: string
}

export interface CampaignFormData {
  name: string
  description: string
  status: string
  duration_type: 'weeks' | 'months'
  duration_value: number
  articles_per_week: number
}

const DEFAULT_FORM: CampaignFormData = { 
  name: '', 
  description: '', 
  status: 'active',
  duration_type: 'weeks',
  duration_value: 4,
  articles_per_week: 4
}

const INTENT_BADGE: Record<string, string> = {
  informational: 'badge-info', commercial: 'badge-warning',
  transactional: 'badge-success', navigational: 'badge-purple',
}

interface Props {
  campaignId?: string
}

export default function CampaignDetailsTab({ campaignId }: Props) {
  const navigate = useNavigate()
  const isEdit = !!campaignId

  const [form, setForm] = useState<CampaignFormData>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [errors, setErrors] = useState<Partial<CampaignFormData>>({})
  const { setToast } = useAppStore()

  // Keyword states
  const [navKws, setNavKws] = useState<string[]>([])
  const [infoKws, setInfoKws] = useState<string[]>([])
  const [navInput, setNavInput] = useState('')
  const [infoInput, setInfoInput] = useState('')
  const [kwDirty, setKwDirty] = useState(false)

  // AI states
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestedKws, setSuggestedKws] = useState<{keyword: string, intent: string}[]>([])
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiSuggestingTime, setAiSuggestingTime] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    setFetchLoading(true)
    Promise.all([
      invoke<any>('campaign:get', +campaignId!),
      invoke<Keyword[]>('keyword:list', +campaignId!)
    ]).then(([camp, kws]) => {
      if (camp) setForm({ 
        name: camp.name, 
        description: camp.description || '', 
        status: camp.status,
        duration_type: camp.duration_type || 'weeks',
        duration_value: camp.duration_value || 4,
        articles_per_week: camp.articles_per_week || 4
      })
      if (kws) {
        setNavKws(kws.filter(k => k.intent === 'navigational').map(k => k.keyword))
        setInfoKws(kws.filter(k => k.intent === 'informational').map(k => k.keyword))
      }
    }).finally(() => setFetchLoading(false))
  }, [campaignId, isEdit])

  const validate = (): boolean => {
    const errs: Partial<CampaignFormData> = {}
    if (!form.name.trim()) errs.name = 'Tên chiến dịch không được để trống'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveCampaignData = async () => {
    let newId = campaignId
    if (isEdit) {
      await invoke('campaign:update', { id: +campaignId!, ...form })
      if (kwDirty) {
        const combinedKws = [
          ...navKws.map(k => ({ keyword: k, intent: 'navigational' })),
          ...infoKws.map(k => ({ keyword: k, intent: 'informational' }))
        ]
        await invoke('campaign:syncKeywords', { campaignId: +campaignId!, keywords: combinedKws })
        setKwDirty(false)
      }
    } else {
      const res = await invoke<{ id: number }>('campaign:create', form)
      newId = res.id.toString()
    }
    return newId
  }

  const handleSaveAndExit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await saveCampaignData()
      setToast({ message: 'Đã lưu chiến dịch thành công', type: 'success' })
      navigate('/campaign')
    } catch (e: any) {
      setToast({ message: e.message || 'Lỗi khi lưu chiến dịch', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const newId = await saveCampaignData()
      setToast({ message: 'Đã lưu thay đổi', type: 'success' })
      if (!isEdit && newId) {
        navigate(`/campaign/edit/${newId}`, { replace: true })
      }
    } catch (e: any) {
      setToast({ message: e.message || 'Lỗi khi lưu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/campaign')
  }

  const handleAiSuggest = async () => {
    if (!form.name.trim()) return alert('Vui lòng nhập tên chiến dịch trước')
    setAiLoading(true)
    try {
      const res = await invoke<{ success: boolean; keywords?: any[]; error?: string }>('campaign:aiSuggestKeywords', {
        id: campaignId ? +campaignId : 0,
        name: form.name,
        description: form.description
      })
      if (res.success && res.keywords) {
        setSuggestedKws(res.keywords)
        setShowAiModal(true)
      } else {
        setToast({ message: res.error || 'Lỗi khi gọi AI', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiSuggestTime = async () => {
    if (!form.name.trim()) return alert('Vui lòng nhập tên chiến dịch trước')
    setAiSuggestingTime(true)
    try {
      const combinedKws = [...navKws, ...infoKws].join(', ')
      const res = await invoke<{ success: boolean; duration_value?: number; articles_per_week?: number; error?: string }>('campaign:aiSuggestTime', {
        name: form.name,
        description: form.description,
        keywords: combinedKws
      })
      if (res.success && res.duration_value && res.articles_per_week) {
        setForm(p => ({ ...p, duration_value: res.duration_value!, articles_per_week: res.articles_per_week! }))
        setToast({ message: 'AI đã đề xuất thời gian và mật độ phù hợp', type: 'success' })
      } else {
        setToast({ message: res.error || 'Lỗi khi gọi AI', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setAiSuggestingTime(false)
    }
  }

  const handleSyncKeywords = async () => {
    if (!confirm('Hành động này sẽ XOÁ TOÀN BỘ từ khoá hiện tại và thay thế bằng danh sách mới. Bạn có chắc chắn?')) return
    setAiLoading(true)
    try {
      const suggestedNav = suggestedKws.filter(k => k.intent === 'navigational').map(k => k.keyword)
      const suggestedInfo = suggestedKws.filter(k => k.intent === 'informational').map(k => k.keyword)
      
      setNavKws(suggestedNav)
      setInfoKws(suggestedInfo)
      setKwDirty(true)
      
      setShowAiModal(false)
      setToast({ message: 'Đã đồng bộ bộ từ khoá mới từ AI', type: 'success' })
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" color="var(--brand-primary)" />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>
      {/* LEFT SIDE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <CampaignDetails form={form} setForm={setForm} errors={errors} />

        {isEdit && (
          <KeywordManager
            navKws={navKws}
            infoKws={infoKws}
            setNavKws={setNavKws}
            setInfoKws={setInfoKws}
            navInput={navInput}
            setNavInput={setNavInput}
            infoInput={infoInput}
            setInfoInput={setInfoInput}
            kwDirty={kwDirty}
            setKwDirty={setKwDirty}
            handleAiSuggest={handleAiSuggest}
            aiLoading={aiLoading}
          />
        )}
      </div>

      {/* RIGHT SIDE */}
      <div style={{ position: 'sticky', top: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>HÀNH ĐỘNG</h3>
          </div>
          
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              className="btn-primary" 
              style={{ height: 44, width: '100%', fontSize: 13, background: 'var(--brand-primary)', color: 'white' }} 
              onClick={handleSave} 
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu thay đổi
            </button>
            
            <button 
              className="btn-primary" 
              style={{ height: 44, width: '100%', fontSize: 13, background: '#10b981', color: 'white' }} 
              onClick={handleSaveAndExit} 
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Lưu & Thoát
            </button>

            <button 
              className="btn-secondary" 
              style={{ height: 44, width: '100%', fontSize: 13, background: 'var(--surface-1)' }} 
              onClick={handleCancel} 
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Hủy
            </button>
          </div>
        </div>

        {isEdit && (
          <>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>CÀI ĐẶT THỜI GIAN</h3>
                <button 
                  className="btn-secondary" 
                  style={{ height: 28, fontSize: 12, borderRadius: 6, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', color: 'white', border: 'none', padding: '0 10px' }}
                  onClick={handleAiSuggestTime}
                  disabled={aiSuggestingTime}
                  title="AI tự động tính toán tổng số tuần và số bài/tuần phù hợp"
                >
                  {aiSuggestingTime ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span style={{ marginLeft: 4 }}>AI Đề xuất</span>
                </button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="label">Đơn vị thời gian</label>
                  <select 
                    className="select" 
                    value={form.duration_type}
                    onChange={e => setForm(p => ({ ...p, duration_type: e.target.value as any }))}
                  >
                    <option value="weeks">Tuần</option>
                    <option value="months">Tháng</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="label">Tổng thời gian ({form.duration_type === 'weeks' ? 'Tuần' : 'Tháng'})</label>
                  <input 
                    className="input" 
                    type="number" 
                    min={1} 
                    value={form.duration_value}
                    onChange={e => setForm(p => ({ ...p, duration_value: +e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="label">Mật độ bài viết / tuần</label>
                  <input 
                    className="input" 
                    type="number" 
                    min={1} 
                    value={form.articles_per_week}
                    onChange={e => setForm(p => ({ ...p, articles_per_week: +e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>THÔNG TIN HỆ THỐNG</h3>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã chiến dịch:</span>
                  <span style={{ fontWeight: 600 }}>#{campaignId}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#a855f7" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Đề xuất từ khoá</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowAiModal(false)}>&times;</button>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                Đây là danh sách từ khoá AI đề xuất dựa trên tên và mô tả chiến dịch của bạn. 
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}> Lưu ý: Toàn bộ từ khoá cũ sẽ bị thay thế.</span>
              </p>
              
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ background: 'var(--surface-1)' }}>Từ khoá</th>
                      <th style={{ width: 140, background: 'var(--surface-1)' }}>Intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestedKws.map((k, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{k.keyword}</td>
                        <td><span className={`badge ${INTENT_BADGE[k.intent] || 'badge-muted'}`}>{k.intent}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setShowAiModal(false)} disabled={aiLoading}>Hủy</button>
              <button 
                className="btn-primary" 
                style={{ background: '#a855f7', color: 'white' }} 
                onClick={handleSyncKeywords} 
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Cập nhật toàn bộ ({suggestedKws.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
