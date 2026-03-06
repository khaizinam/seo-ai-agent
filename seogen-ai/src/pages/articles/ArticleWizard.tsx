import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { invoke, listen } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AIProcessingOverlay } from '../../components/ui/AIProcessingOverlay'
import { ArticleSidebar } from './components/ArticleSidebar'
import { PublishModal } from './components/PublishModal'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

// Steps Components - sẽ được define sau
import Step1Brief from './wizard/Step1Brief'
import Step2Outline from './wizard/Step2Outline'
import Step3Content from './wizard/Step3Content'
import Step4Social from './wizard/Step4Social'

const WIZARD_STEPS = [
  { id: 1, title: 'Bối cảnh', key: 'brief', desc: 'Mục tiêu & Đối tượng' },
  { id: 2, title: 'Dàn ý & SEO', key: 'outline', desc: 'Heading, EEAT, QnA' },
  { id: 3, title: 'Bài viết', key: 'content', desc: 'AI sinh Content' },
  { id: 4, title: 'Export', key: 'social', desc: 'Mạng xã hội & Ảnh' }
]

export default function ArticleWizard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const plannedId = searchParams.get('plannedId')
  const { setToast, outputLanguage } = useAppStore()
  const isEdit = !!id

  // ─── Global State & Dependencies ───
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [keywords, setKeywords] = useState<any[]>([])
  
  // ─── Article Data State ───
  const [articleData, setArticleData] = useState<any>({
    current_step: 1,
    highest_unlocked_step: 1,
    title: '', status: 'draft',
    campaign_id: '', keyword_id: '', persona_id: '',
    week_number: 1, article_type: 'satellite',
    content_html: '', meta_title: '', meta_description: '',
    thumbnail_prompt: '', content_social: [],
    // Linear fields
    campaign_summary: '', tone_of_voice: 'friendly',
    target_audience: '', output_language: outputLanguage || 'Vietnamese',
    primary_keywords: '[]', secondary_keywords: '[]',
    keyword_placement_rules: '', eeat_summary: '',
    qna_list: '[]', outline_data: '[]'
  })

  // UI State
  const [loadingContent, setLoadingContent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  
  // AI Overlay state
  const [aiOverlayVisible, setAiOverlayVisible] = useState(false)
  const [aiOverlayStep, setAiOverlayStep] = useState('')
  const [aiOverlaySub, setAiOverlaySub] = useState('')
  const abortRef = useRef(false)

  useEffect(() => {
    const unsub = listen('ai:model-switched', (...args: unknown[]) => {
      const data = args[0] as any
      setAiOverlaySub(`${data.fromName} (${data.fromModel}) hết limit → Chuyển sang ${data.toName} (${data.toModel})`)
    })
    return unsub
  }, [])

  const cancelAiProcess = () => {
    abortRef.current = true
    setAiOverlayVisible(false)
    setAiOverlaySub('')
    setGenerating(false)
    setToast({ message: 'Đã huỷ tiến trình AI', type: 'info' })
  }

  // ─── Loading Dependencies ───
  useEffect(() => {
    const init = async () => {
      setLoadingContent(true)
      const [camps, pers] = await Promise.all([
        invoke<any[]>('campaign:list'),
        invoke<any[]>('persona:list'),
      ])
      setCampaigns(camps || [])
      setPersonas(pers || [])

      if (id || plannedId) {
        const art = await invoke<any>('article:get', +(id || plannedId!))
        if (art) {
           setArticleData((prev: any) => ({
             ...prev,
             ...art,
             campaign_id: art.campaign_id?.toString() || '',
             keyword_id: art.keyword_id?.toString() || '',
             persona_id: art.persona_id?.toString() || (pers?.length ? pers[0].id.toString() : ''),
             content_social: typeof art.content_social === 'string' ? JSON.parse(art.content_social || '[]') : (art.content_social || []),
             // fallback default for linear fields if null
             current_step: art.current_step || 1,
             highest_unlocked_step: art.highest_unlocked_step || 1,
           }))
        }
      } else {
        if (pers && pers.length > 0) {
          setArticleData((prev: any) => ({ ...prev, persona_id: pers[0].id.toString() }))
        }
      }
      setLoadingContent(false)
    }
    init()
  }, [id, plannedId, isEdit])

  useEffect(() => {
    if (!articleData.campaign_id) { setKeywords([]); return }
    invoke<any[]>('keyword:list', +articleData.campaign_id).then(kws => {
      setKeywords(kws || [])
    })
  }, [articleData.campaign_id])

  // ─── Handlers ───
  const updateData = (updates: Partial<typeof articleData>) => {
    setArticleData((prev: any) => ({ ...prev, ...updates }))
  }

  const handleTabClick = (stepId: number) => {
    if (stepId <= articleData.highest_unlocked_step) {
      updateData({ current_step: stepId })
    } else {
      setToast({ message: "Vui lòng hoàn thành bước hiện tại trước!", type: 'info' })
    }
  }

  // Auto save the whole object
  const autoSave = async (updates: Partial<typeof articleData>) => {
    const merged = { ...articleData, ...updates }
    updateData(updates) // update UI stat immediately
    
    // Convert to DB payload
    const payload: any = { ...merged }
    payload.campaign_id = payload.campaign_id ? +payload.campaign_id : null
    payload.keyword_id = payload.keyword_id ? +payload.keyword_id : null
    payload.persona_id = payload.persona_id ? +payload.persona_id : null
    if (typeof payload.content_social !== 'string') payload.content_social = JSON.stringify(payload.content_social || [])
    
    // Xóa các trường dư thừa từ JOIN / metadata không có trong bảng articles thực tế
    delete payload.keyword
    delete payload.keyword_from_db
    delete payload.persona_name
    delete payload.campaign_name
    
    try {
      if (id || plannedId || articleData.id) {
        payload.id = +(id || plannedId || articleData.id)
        await invoke('article:update', payload)
      } else {
         // Create Draft internally
         if (!payload.title) payload.title = updates.title || articleData.title || 'Bài viết mới (Bản nháp)'
         const saved = await invoke<{ id?: number }>('article:create', payload)
         if (saved.id && !id && !plannedId && !articleData.id) {
           // We might want to replaceUrl to prevent multi creation, but for now we just keep id state somehow
           // Let's force an update to URL if needed, or better just use history.replaceState
           window.history.replaceState(null, '', `#/article/edit/${saved.id}`)
           payload.id = saved.id
           updateData({ id: saved.id }) // Sync ID to state
         }
      }
    } catch (e) {
      console.error('AutoSave Error: ', e)
    }
    return payload
  }

  const handleNextStep = async (stepId: number, stepUpdates: Partial<typeof articleData>) => {
    const nextStep = stepId + 1
    const maxUnlocked = Math.max(articleData.highest_unlocked_step, nextStep)
    await autoSave({ ...stepUpdates, current_step: nextStep, highest_unlocked_step: maxUnlocked })
    setToast({ message: 'Đã lưu dũ liệu Bước ' + stepId, type: 'success' })
  }

  const handleExit = () => navigate('/article')

  // ─── Render ───
  if (loadingContent) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--brand-primary)" />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-0)' }}>
      {/* HEADER */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)' }}>
         <button className="btn-ghost" onClick={handleExit} style={{ padding: '8px', borderRadius: 8, background: 'var(--surface-1)' }}>
          <ArrowLeft size={16} />
         </button>
         <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {articleData.title || (isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết SEO mới')}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Trình hướng dẫn - Bước {articleData.current_step} / 4
            </p>
         </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
        
        {/* LEFT PANE - Linear Wizard */}
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          
          {/* Stepper Navigation */}
          <div style={{ padding: '24px 32px 0 32px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = articleData.current_step === step.id
              const isPassed = step.id < articleData.current_step
              const isLocked = step.id > articleData.highest_unlocked_step

              return (
                <div 
                  key={step.id} 
                  onClick={() => handleTabClick(step.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.4 : 1,
                    flex: 1, position: 'relative'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 18, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'var(--brand-primary)' : isPassed ? 'var(--success-bg)' : 'var(--surface-2)',
                    color: isActive ? '#fff' : isPassed ? 'var(--success-text)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: 14, zIndex: 2
                  }}>
                    {isPassed ? <CheckCircle2 size={18} /> : step.id}
                  </div>
                  <div style={{ zIndex: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
                  </div>
                  {/* Connector Line */}
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 18, left: 45, right: -15, height: 2,
                      background: isPassed ? 'var(--success-bg)' : 'var(--surface-2)', zIndex: 1
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Stepper Content */}
          <div style={{ flex: 1, padding: '32px' }}>
             {articleData.current_step === 1 && (
               <Step1Brief 
                 data={articleData} 
                 onNext={(updates: any) => handleNextStep(1, updates)} 
                 onAutoSave={(updates: any) => autoSave(updates)}
                 setGenerating={setGenerating}
                 setAiOverlayVisible={setAiOverlayVisible}
                 setAiOverlayStep={setAiOverlayStep}
                 abortRef={abortRef}
               />
             )}
             {articleData.current_step === 2 && (
               <Step2Outline 
                 data={articleData} 
                 onNext={(updates: any) => handleNextStep(2, updates)} 
                 onAutoSave={(updates: any) => autoSave(updates)}
                 setGenerating={setGenerating}
                 setAiOverlayVisible={setAiOverlayVisible}
                 setAiOverlayStep={setAiOverlayStep}
                 abortRef={abortRef}
               />
             )}
             {articleData.current_step === 3 && (
               <Step3Content 
                 data={articleData} 
                 onNext={(updates: any) => handleNextStep(3, updates)} 
                 onAutoSave={(updates: any) => autoSave(updates)}
                 setGenerating={setGenerating}
                 setAiOverlayVisible={setAiOverlayVisible}
                 setAiOverlayStep={setAiOverlayStep}
                 abortRef={abortRef}
               />
             )}
             {articleData.current_step === 4 && (
               <Step4Social 
                 data={articleData} 
                 onAutoSave={(updates: any) => autoSave(updates)}
                 onFinish={() => handleExit()}
                 setGenerating={setGenerating}
                 setAiOverlayVisible={setAiOverlayVisible}
                 setAiOverlayStep={setAiOverlayStep}
                 abortRef={abortRef}
               />
             )}
          </div>
        </div>

        {/* RIGHT PANE - Sidebar (Settings) */}
        <div style={{ overflowY: 'auto' }}>
          <ArticleSidebar
             campaigns={campaigns} personas={personas} keywords={keywords}
             selCampaign={articleData.campaign_id} setSelCampaign={(v) => autoSave({campaign_id: v})}
             selKeyword={articleData.keyword_id} setSelKeyword={(v) => { 
                autoSave({keyword_id: v})
                const kwText = keywords.find(k => k.id === +v)?.keyword
                if (kwText && (!articleData.title || articleData.title === 'Bài viết mới (Bản nháp)')) {
                   autoSave({title: kwText})
                }
             }}
             selPersona={articleData.persona_id} setSelPersona={(v) => autoSave({persona_id: v})}
             status={articleData.status} setStatus={(v) => autoSave({status: v})}
             weekNumber={articleData.week_number} setWeekNumber={(v) => autoSave({week_number: v})}
             articleType={articleData.article_type} setArticleType={(v) => autoSave({article_type: v})}
             plannedKeywordName={articleData.keyword_from_db || ''}
             isEdit={isEdit} plannedId={plannedId}
             saving={saving} generating={generating}
             onSave={() => autoSave({})}
             onSaveAndExit={async () => { await autoSave({}); handleExit() }}
             onExit={handleExit}
             onGenFull={() => setToast({message: "Đang Gen full", type: 'info'})}
             onPublish={() => setShowPublishModal(true)}
          />
        </div>
      </div>

      <PublishModal 
        open={showPublishModal} 
        onClose={() => setShowPublishModal(false)} 
        articleId={+(id || plannedId || '0')} 
      />

      <AIProcessingOverlay
        visible={aiOverlayVisible}
        stepLabel={aiOverlayStep}
        subLabel={aiOverlaySub}
        onCancel={cancelAiProcess}
      />
    </div>
  )
}
