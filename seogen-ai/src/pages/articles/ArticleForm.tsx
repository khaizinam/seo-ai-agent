import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { invoke, listen } from '../../lib/api'
import {
  buildArticleSystemPrompt, buildArticleUserPrompt,
  buildSocialSystemPrompt, buildSocialUserPrompt,
  buildThumbnailSystemPrompt, buildThumbnailUserPrompt,
  stripHtmlToText
} from '../../lib/prompts'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AIProcessingOverlay } from '../../components/ui/AIProcessingOverlay'
import { ArticleContentEditor } from './components/ArticleContentEditor'
import { ArticleSeoMeta } from './components/ArticleSeoMeta'
import { ArticleSocialContent } from './components/ArticleSocialContent'
import { ArticleThumbnailPrompt } from './components/ArticleThumbnailPrompt'
import { ArticleSidebar } from './components/ArticleSidebar'

interface Campaign { id: number; name: string; description?: string }
interface Persona { id: number; name: string }
interface Keyword { id: number; keyword: string }
interface Article { 
  id: number; 
  title: string; 
  keyword: string; 
  keyword_from_db?: string;
  persona_name: string; 
  status: string; 
  seo_score: number; 
  created_at: string;
  campaign_id?: number;
  persona_id?: number;
  keyword_id?: number;
  content_html?: string;
  meta_title?: string;
  meta_description?: string;
  content_social?: string | any[];
  thumbnail_prompt?: string;
}

export default function ArticleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const plannedId = searchParams.get('plannedId')
  const { setToast, outputLanguage } = useAppStore()

  const isEdit = !!id

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])

  const [selCampaign, setSelCampaign] = useState('')
  const [selKeyword, setSelKeyword] = useState('')
  const [selPersona, setSelPersona] = useState('')
  
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [socialContent, setSocialContent] = useState<any[]>([])
  const [thumbnailPrompt, setThumbnailPrompt] = useState('')
  const [plannedKeywordName, setPlannedKeywordName] = useState('')
  
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'context'>('context')
  const [showGenFullConfirm, setShowGenFullConfirm] = useState(false)

  // AI Overlay state
  const [aiOverlayVisible, setAiOverlayVisible] = useState(false)
  const [aiOverlayStep, setAiOverlayStep] = useState('')
  const [aiOverlaySub, setAiOverlaySub] = useState('')
  const abortRef = useRef(false)

  // Listen for model-switch events from backend
  useEffect(() => {
    const unsub = listen('ai:model-switched', (...args: unknown[]) => {
      const data = args[0] as { fromName: string; fromModel: string; toName: string; toModel: string }
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

  // ─── Data Loading ───
  const loadDependencies = useCallback(async () => {
    const [camps, pers] = await Promise.all([
      invoke<Campaign[]>('campaign:list'),
      invoke<Persona[]>('persona:list'),
    ])
    setCampaigns(camps || [])
    setPersonas(pers || [])
    return { camps, pers }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoadingContent(true)
      const { pers } = await loadDependencies()

      if (id || plannedId) {
        const art = await invoke<Article>('article:get', +(id || plannedId!))
        if (art) {
          setTitle(art.title || '')
          setContentHtml(art.content_html || '')
          setMetaTitle(art.meta_title || '')
          setMetaDescription(art.meta_description || '')
          try {
            const parsed = art.content_social ? (typeof art.content_social === 'string' ? JSON.parse(art.content_social) : art.content_social) : []
            setSocialContent(Array.isArray(parsed) ? parsed : [])
          } catch(e) { setSocialContent([]) }
          setThumbnailPrompt(art.thumbnail_prompt || '')
          if (art.campaign_id) setSelCampaign(art.campaign_id.toString())
          
          if (art.persona_id) {
            setSelPersona(art.persona_id.toString())
          } else if (pers && pers.length > 0) {
            setSelPersona(pers[0].id.toString())
          }
          const name = art.keyword || art.keyword_from_db || ''
          if (name) setPlannedKeywordName(name)
        }
      } else {
        if (pers && pers.length > 0) setSelPersona(pers[0].id.toString())
      }
      setLoadingContent(false)
    }
    init()
  }, [id, plannedId, isEdit])

  useEffect(() => {
    if (!selCampaign) { setKeywords([]); return }
    invoke<Keyword[]>('keyword:list', +selCampaign).then(async kws => {
      setKeywords(kws || [])
      if ((id || plannedId) && kws) {
        const art = await invoke<Article>('article:get', +(id || plannedId!))
        if (art?.keyword_id) {
          setSelKeyword(art.keyword_id.toString())
        } else if (art?.keyword) {
          const match = kws.find(k => k.keyword.toLowerCase() === art.keyword.toLowerCase())
          if (match) setSelKeyword(match.id.toString())
        }
      }
    })
  }, [selCampaign, plannedId, id])

  // ─── Reusable AI Generation Functions ───
  // Each function works standalone (individual buttons) or chained (generateFullProcess).
  // - silent: skip individual toast & generating state (orchestrator manages them)
  // - contentOverride: bypass stale React state when chaining calls

  async function generateArticle(silent = false): Promise<string | null> {
    if ((id || plannedId) && !selPersona) {
      if (!silent) setToast({ message: 'Vui lòng chọn ít nhất một Nhân vật viết bài', type: 'error' })
      return null
    }
    if (!(id || plannedId) && !selKeyword) {
      if (!silent) setToast({ message: 'Vui lòng chọn Từ khóa mục tiêu', type: 'error' })
      return null
    }

    if (!silent) setGenerating(true)
    try {
      if (id || plannedId) {
        const res = await invoke<{ success: boolean; content: string; error?: string }>('article:generateFullContent', {
          articleId: +(id || plannedId!),
          personaId: +selPersona
        })
        if (!res.success) throw new Error(res.error || 'Lỗi khi tạo bài viết')
        setContentHtml(res.content)
        if (!silent) setToast({ message: 'Đã tạo xong bài viết từ kế hoạch', type: 'success' })
        // Auto-save
        await silentSave({ contentHtml: res.content })
        return res.content
      } else {
        const kw = keywords.find(k => k.id === +selKeyword)
        const persona = personas.find(p => p.id === +selPersona)
        if (!kw) throw new Error('Vui lòng chọn từ khóa')

        const lang = outputLanguage || 'Vietnamese'
        const campaign = campaigns.find(c => c.id === +selCampaign)
        const relatedKws = keywords.map(k => k.keyword).join(', ')
        const systemPrompt = buildArticleSystemPrompt(persona?.name, lang)
        const userPrompt = buildArticleUserPrompt(kw.keyword, title, lang, {
          campaignName: campaign?.name,
          campaignDescription: campaign?.description,
          relatedKeywords: relatedKws,
        })

        const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        })
        if (!res.success) throw new Error(res.error || 'Lỗi khi gọi AI')
        setContentHtml(res.content)
        if (!title) setTitle(`Bài về: ${kw.keyword}`)
        if (!silent) setToast({ message: 'AI đã viết xong bài viết', type: 'success' })
        // Auto-save immediately to prevent data loss
        await silentSave({ contentHtml: res.content, title: title || `Bài về: ${kw.keyword}` })
        return res.content
      }
    } catch (e: any) {
      if (!silent) setToast({ message: e.message, type: 'error' })
      if (silent) throw e  // re-throw so orchestrator can catch
      return null
    } finally {
      if (!silent) setGenerating(false)
    }
  }

  async function generateSocialContent(silent = false, contentOverride?: string) {
    const html = contentOverride || contentHtml
    if (!html) {
      if (!silent) setToast({ message: 'Vui lòng có nội dung bài viết trước khi tạo nội dung Social', type: 'error' })
      return false
    }
    if (!silent) setGenerating(true)
    try {
      const persona = personas.find(p => p.id === +selPersona)
      const kw = keywords.find(k => k.id === +selKeyword) || { keyword: title }
      const lang = outputLanguage || 'Vietnamese'
      const campaign = campaigns.find(c => c.id === +selCampaign)
      const systemPrompt = buildSocialSystemPrompt(persona?.name, lang)
      const personaLabel = persona?.name || 'Expert'
      const articleTitle = title || kw.keyword
      const snippet = stripHtmlToText(html, 1500)
      const campaignCtx = campaign ? `\nCampaign: "${campaign.name}" — ${campaign.description || ''}` : ''

      const [resFb, resLi] = await Promise.all([
        invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: buildSocialUserPrompt(articleTitle, snippet, personaLabel, 'Facebook', lang) }],
        }),
        invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: buildSocialUserPrompt(articleTitle, snippet, personaLabel, 'LinkedIn', lang) }],
        }),
      ])

      const newSocial: any[] = []
      if (resFb.success) newSocial.push({ social_type: 'facebook', content: resFb.content.trim() })
      if (resLi.success) newSocial.push({ social_type: 'linkedin', content: resLi.content.trim() })
      setSocialContent(newSocial)
      if (!silent) setToast({ message: 'Đã tạo xong nội dung Social', type: 'success' })
      // Auto-save
      await silentSave({ socialContent: newSocial })
      return true
    } catch (e: any) {
      if (!silent) setToast({ message: e.message, type: 'error' })
      if (silent) throw e
      return false
    } finally {
      if (!silent) setGenerating(false)
    }
  }

  async function generateThumbnailPrompt(silent = false, contentOverride?: string) {
    const html = contentOverride || contentHtml
    if (!html) {
      if (!silent) setToast({ message: 'Vui lòng có nội dung bài viết trước khi tạo Thumbnail Prompt', type: 'error' })
      return false
    }
    if (!silent) setGenerating(true)
    try {
      const kw = keywords.find(k => k.id === +selKeyword) || { keyword: title }
      const articleTitle = title || kw.keyword
      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [
          { role: 'system', content: buildThumbnailSystemPrompt() },
          { role: 'user', content: buildThumbnailUserPrompt(articleTitle, stripHtmlToText(html, 1200)) },
        ],
      })
      if (res.success) {
        setThumbnailPrompt(res.content.trim())
        if (!silent) setToast({ message: 'Đã tạo xong Thumbnail Prompt', type: 'success' })
        // Auto-save
        await silentSave({ thumbnailPrompt: res.content.trim() })
        return true
      }
      return false
    } catch (e: any) {
      if (!silent) setToast({ message: e.message, type: 'error' })
      if (silent) throw e
      return false
    } finally {
      if (!silent) setGenerating(false)
    }
  }

  // ─── Full Process: thin orchestrator reusing the 3 functions above ───
  async function generateFullProcess() {
    setShowGenFullConfirm(false)
    setGenerating(true)
    abortRef.current = false
    setAiOverlaySub('')
    setAiOverlayVisible(true)
    try {
      // Step 1
      setAiOverlayStep('⏳ Bước 1/3 — Đang sinh nội dung bài viết...')
      const html = await generateArticle(true)
      if (abortRef.current) return
      if (!html) throw new Error('Không thể tạo nội dung bài viết')

      // Step 2
      setAiOverlayStep('⏳ Bước 2/3 — Đang sinh Social Content...')
      await generateSocialContent(true, html)
      if (abortRef.current) return

      // Step 3
      setAiOverlayStep('⏳ Bước 3/3 — Đang sinh Thumbnail Prompt...')
      await generateThumbnailPrompt(true, html)
      if (abortRef.current) return

      setAiOverlayStep('🎉 Hoàn tất!')
      // Auto-save once at the very end (individual steps already auto-saved)
      setToast({ message: '🎉 Đã hoàn thành toàn bộ quy trình AI!', type: 'success' })
    } catch (e: any) {
      if (!abortRef.current) {
        console.error('generateFullProcess error:', e)
        setToast({ message: `Lỗi quy trình AI: ${e.message}`, type: 'error' })
      }
    } finally {
      setAiOverlayVisible(false)
      setGenerating(false)
    }
  }

  // ─── Individual AI with overlay ───
  async function handleGenArticle() {
    abortRef.current = false
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang sinh nội dung bài viết...')
    try {
      await generateArticle(false)
    } finally {
      setAiOverlayVisible(false)
    }
  }

  async function handleGenSocial() {
    abortRef.current = false
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang sinh nội dung Social...')
    try {
      await generateSocialContent(false)
    } finally {
      setAiOverlayVisible(false)
    }
  }

  async function handleGenThumb() {
    abortRef.current = false
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang sinh Thumbnail Prompt...')
    try {
      await generateThumbnailPrompt(false)
    } finally {
      setAiOverlayVisible(false)
    }
  }

  // ─── Utility Functions ───
  const minifyHtmlContent = () => {
    if (!contentHtml) return
    const minified = contentHtml
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim()
    setContentHtml(minified)
    setToast({ message: 'Đã nén mã HTML', type: 'success' })
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setToast({ message: `Đã sao chép ${label}`, type: 'success' })
  }

  // ─── Save Functions ───
  async function handleSave(shouldNavigate = false) {
    if (!selKeyword && !plannedId && !isEdit) {
      setToast({ message: 'Vui lòng chọn Từ khóa trước khi lưu', type: 'error' })
      return false
    }
    setSaving(true)
    try {
      const textContent = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      let articleId: string | null = id || plannedId;

      if (articleId) {
        const payload: any = { 
          id: +articleId, title, 
          content_html: contentHtml, content_text: textContent,
          meta_title: metaTitle, meta_description: metaDescription,
          content_social: JSON.stringify(socialContent),
          thumbnail_prompt: thumbnailPrompt
        }
        if (selPersona) payload.persona_id = +selPersona
        await invoke('article:update', payload)
      } else {
        const saved = await invoke<{ id?: number }>('article:create', {
          keyword_id: selKeyword ? +selKeyword : undefined,
          campaign_id: selCampaign ? +selCampaign : undefined,
          persona_id: selPersona ? +selPersona : undefined,
          title: title || 'Không có tiêu đề', 
          content_html: contentHtml, content_text: textContent, 
          meta_title: metaTitle, meta_description: metaDescription,
          content_social: JSON.stringify(socialContent),
          thumbnail_prompt: thumbnailPrompt,
          status: 'draft',
        })
        articleId = saved.id?.toString() || null
      }

      if (articleId) {
        try {
          const kw = keywords.find(k => k.id === +selKeyword) || { keyword: title }
          await invoke('audit:run', {
            articleId: +articleId, title, contentHtml,
            contentText: textContent, keyword: kw.keyword,
          })
        } catch (err) {
          console.error("Audit failed on save", err)
        }
      }

      setToast({ message: 'Lưu bài viết thành công!', type: 'success' })
      if (shouldNavigate) navigate('/article')
      return true
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
      return false
    } finally {
      setSaving(false)
    }
  }

  // Silent auto-save after AI generation — accepts overrides for freshly-set React state
  async function silentSave(overrides?: {
    contentHtml?: string
    socialContent?: any[]
    thumbnailPrompt?: string
    title?: string
  }) {
    const articleId = id || plannedId
    if (!articleId && !selKeyword) return // can't save without at least a keyword
    try {
      const html = overrides?.contentHtml ?? contentHtml
      const social = overrides?.socialContent ?? socialContent
      const thumb = overrides?.thumbnailPrompt ?? thumbnailPrompt
      const ttl = overrides?.title ?? title
      const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

      if (articleId) {
        const payload: any = {
          id: +articleId, title: ttl,
          content_html: html, content_text: textContent,
          meta_title: metaTitle, meta_description: metaDescription,
          content_social: JSON.stringify(social),
          thumbnail_prompt: thumb,
        }
        if (selPersona) payload.persona_id = +selPersona
        await invoke('article:update', payload)
      } else {
        const saved = await invoke<{ id?: number }>('article:create', {
          keyword_id: selKeyword ? +selKeyword : undefined,
          campaign_id: selCampaign ? +selCampaign : undefined,
          persona_id: selPersona ? +selPersona : undefined,
          title: ttl || 'Không có tiêu đề',
          content_html: html, content_text: textContent,
          meta_title: metaTitle, meta_description: metaDescription,
          content_social: JSON.stringify(social),
          thumbnail_prompt: thumb,
          status: 'draft',
        })
        if (saved.id) {/* navigate to edit URL so future saves use update */}
      }
      setToast({ message: '💾 Đã tự động lưu', type: 'success' })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Breadcrumb */}
      <div style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--surface-0)' }}>
        <button className="btn-ghost" onClick={handleExit} style={{ padding: '6px 10px', fontSize: 13, background: 'var(--surface-1)' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {isEdit ? 'Cập nhật nội dung và SEO cho bài viết' : 'Tạo bài viết nội dung mới chuẩn SEO'}
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, padding: 32, overflow: 'auto' }}>
        
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ArticleContentEditor
            contentHtml={contentHtml} setContentHtml={setContentHtml}
            title={title} setTitle={setTitle}
            activeTab={activeTab} setActiveTab={setActiveTab}
            generating={generating}
            onGenContent={handleGenArticle}
            onMinify={minifyHtmlContent}
            onCopy={handleCopyToClipboard}
          />

          <ArticleSeoMeta
            metaTitle={metaTitle} setMetaTitle={setMetaTitle}
            metaDescription={metaDescription} setMetaDescription={setMetaDescription}
            onCopy={handleCopyToClipboard}
          />

          <ArticleSocialContent
            socialContent={socialContent} setSocialContent={setSocialContent}
            generating={generating}
            onGenSocial={handleGenSocial}
            onCopy={handleCopyToClipboard}
          />

          <ArticleThumbnailPrompt
            thumbnailPrompt={thumbnailPrompt} setThumbnailPrompt={setThumbnailPrompt}
            generating={generating}
            onGenThumb={handleGenThumb}
            onCopy={handleCopyToClipboard}
          />
        </div>

        {/* Right Side */}
        <ArticleSidebar
          campaigns={campaigns} personas={personas} keywords={keywords}
          selCampaign={selCampaign} setSelCampaign={setSelCampaign}
          selKeyword={selKeyword} setSelKeyword={setSelKeyword}
          selPersona={selPersona} setSelPersona={setSelPersona}
          plannedKeywordName={plannedKeywordName}
          isEdit={isEdit} plannedId={plannedId}
          saving={saving} generating={generating}
          onSave={() => handleSave(false)}
          onSaveAndExit={() => handleSave(true)}
          onExit={handleExit}
          onGenFull={() => setShowGenFullConfirm(true)}
        />
      </div>

      <ConfirmDialog 
        open={showGenFullConfirm}
        title="Xác nhận quy trình AI"
        message="Bạn có muốn thực hiện hành động? Hành động này sẽ thực hiện toàn bộ quy trình AI gen cho bài viết (Nội dung, Social, Thumbnail) và rất tốn token."
        confirmLabel="Tiếp tục"
        cancelLabel="Hủy bỏ"
        variant="warning"
        onConfirm={generateFullProcess}
        onCancel={() => setShowGenFullConfirm(false)}
        loading={generating}
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
