import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ArticleContentEditor } from './components/ArticleContentEditor'
import { ArticleSeoMeta } from './components/ArticleSeoMeta'
import { ArticleSocialContent } from './components/ArticleSocialContent'
import { ArticleThumbnailPrompt } from './components/ArticleThumbnailPrompt'
import { ArticleSidebar } from './components/ArticleSidebar'

interface Campaign { id: number; name: string }
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
  const { setToast } = useAppStore()

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
        return res.content
      } else {
        const kw = keywords.find(k => k.id === +selKeyword)
        const persona = personas.find(p => p.id === +selPersona)
        if (!kw) throw new Error('Vui lòng chọn từ khóa')

        const systemPrompt = persona
          ? `Bạn là ${persona.name}. Viết bài SEO chuyên nghiệp, tự nhiên theo phong cách của bạn.`
          : 'Bạn là chuyên gia SEO content writer. Viết bài chuẩn SEO, tự nhiên, hấp dẫn.'

        const userPrompt = `Viết bài SEO đầy đủ về từ khoá: "${kw.keyword}"
${title ? `Tiêu đề: ${title}` : ''}
Yêu cầu:
- Định dạng HTML nén (không cần <html><body>, chỉ nội dung nội tại)
- Có H2-H6 phù hợp. Tuyệt đối KHÔNG sử dụng thẻ H1. KHÔNG sử dụng các thẻ danh sách <ul>, <ol>, <li>.
- Thay thế các danh sách bằng các đoạn văn (p) trình bày mạch lạc.
- Độ dài 1000-1500 từ. Mật độ từ khoá 1-2%. Văn phong tự nhiên.
- Output là mã HTML nén (minified). Chỉ trả về mã HTML, không markdown, không giải thích.`

        const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        })
        if (!res.success) throw new Error(res.error || 'Lỗi khi gọi AI')
        setContentHtml(res.content)
        if (!title) setTitle(`Bài về: ${kw.keyword}`)
        if (!silent) setToast({ message: 'AI đã viết xong bài viết', type: 'success' })
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
      const systemPrompt = persona
        ? `Bạn là ${persona.name}. Hãy viết nội dung quảng bá bài viết.`
        : 'Bạn là chuyên gia Social Media Marketing.'
      const baseUserPrompt = `Dựa trên bài viết SEO: "${title || kw.keyword}"
Nội dung bài viết: ${html.substring(0, 2000)}
Yêu cầu:
1. Sử dụng icon năng động, kèm hashtags.
2. Phong cách viết theo nhân vật: ${persona?.name || 'Chuyên gia'}.
3. CHỈ trả về nội dung bài viết, không giải thích gì thêm.`

      const [resFb, resLi] = await Promise.all([
        invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `${baseUserPrompt}\n\nNền tảng: Facebook.` }],
        }),
        invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `${baseUserPrompt}\n\nNền tảng: LinkedIn.` }],
        }),
      ])

      const newSocial: any[] = []
      if (resFb.success) newSocial.push({ social_type: 'facebook', content: resFb.content.trim() })
      if (resLi.success) newSocial.push({ social_type: 'linkedin', content: resLi.content.trim() })
      setSocialContent(newSocial)
      if (!silent) setToast({ message: 'Đã tạo xong nội dung Social', type: 'success' })
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
      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [
          { role: 'system', content: 'Bạn là chuyên gia thiết kế hình ảnh và Prompt Engineer cho các AI tạo ảnh như Midjourney, DALL-E 3.' },
          { role: 'user', content: `Dựa trên bài viết SEO: "${title || kw.keyword}"
Nội dung bài viết: ${html.substring(0, 3000)}

Yêu cầu:
1. Hãy tạo 1 prompt tiếng Anh chuyên sâu để tạo ảnh thumbnail cho bài viết này.
2. Ảnh phải thu hút, phản ánh đúng chủ đề, phong cách nghệ thuật phù hợp.
3. Thêm các từ khoá mô tả ánh sáng, góc chụp, chi tiết (cinematic, high detail, 8k, digital art).
4. Prompt phải tập trung vào hình ảnh, KHÔNG chứa chữ (no text).
Chỉ trả về đoạn Prompt tiếng Anh, không giải thích.` },
        ],
      })
      if (res.success) {
        setThumbnailPrompt(res.content.trim())
        if (!silent) setToast({ message: 'Đã tạo xong Thumbnail Prompt', type: 'success' })
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
    try {
      // Step 1: reuse generateArticle → returns HTML string
      setToast({ message: '⏳ Bước 1/3: Đang sinh nội dung bài viết...', type: 'info' })
      const html = await generateArticle(true)
      if (!html) throw new Error('Không thể tạo nội dung bài viết')

      // Step 2: reuse generateSocialContent → pass html to bypass stale state
      setToast({ message: '⏳ Bước 2/3: Đang sinh Social Content...', type: 'info' })
      await generateSocialContent(true, html)

      // Step 3: reuse generateThumbnailPrompt → same approach
      setToast({ message: '⏳ Bước 3/3: Đang sinh Thumbnail Prompt...', type: 'info' })
      await generateThumbnailPrompt(true, html)

      setToast({ message: '🎉 Đã hoàn thành toàn bộ quy trình AI!', type: 'success' })
    } catch (e: any) {
      console.error('generateFullProcess error:', e)
      setToast({ message: `Lỗi quy trình AI: ${e.message}`, type: 'error' })
    } finally {
      setGenerating(false)
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
            onGenContent={() => generateArticle(false)}
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
            onGenSocial={() => generateSocialContent(false)}
            onCopy={handleCopyToClipboard}
          />

          <ArticleThumbnailPrompt
            thumbnailPrompt={thumbnailPrompt} setThumbnailPrompt={setThumbnailPrompt}
            generating={generating}
            onGenThumb={() => generateThumbnailPrompt(false)}
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
    </div>
  )
}
