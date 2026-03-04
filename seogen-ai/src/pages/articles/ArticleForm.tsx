import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { Wand2, Loader2, ArrowLeft, Save, Eye, Code, Check, Sparkles, Copy } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'

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
  
  const [viewArticle, setViewArticle] = useState<{ html: string; title: string } | null>(null)

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
        // Load existing article (works for both real and planned since both are in 'articles' table)
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
          
          // Pre-select persona
          if (art.persona_id) {
            setSelPersona(art.persona_id.toString())
          } else if (pers && pers.length > 0) {
            setSelPersona(pers[0].id.toString())
          }
          // Store planning keyword string - prioritizing local keyword then joined keyword
          const name = art.keyword || art.keyword_from_db || ''
          if (name) {
            setPlannedKeywordName(name)
          }
        }
      } else {
        // New blank article: auto-select first persona if possible
        if (pers && pers.length > 0) setSelPersona(pers[0].id.toString())
      }
      setLoadingContent(false)
    }
    init()
  }, [id, plannedId, isEdit])

  // Fetch keywords when campaign changes
  useEffect(() => {
    if (!selCampaign) { setKeywords([]); return }
    invoke<Keyword[]>('keyword:list', +selCampaign).then(async kws => {
      setKeywords(kws || [])
      
      // If we have a plannedKeywordName/ID from article, try to sync it
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

  async function generateArticle() {
    if ((id || plannedId) && !selPersona) {
      return setToast({ message: 'Vui lòng chọn ít nhất một Nhân vật viết bài', type: 'error' })
    }
    if (!(id || plannedId) && !selKeyword) {
      return setToast({ message: 'Vui lòng chọn Từ khóa mục tiêu', type: 'error' })
    }

    setGenerating(true)
    try {
      if (id || plannedId) {
        // Find current article to get metadata
        const art = await invoke<Article>('article:get', +(id || plannedId!))
        
        // Use specialized generation if content is blank or forced
        const res = await invoke<{ success: boolean; content: string; error?: string }>('article:generateFullContent', {
          articleId: +(id || plannedId!),
          personaId: +selPersona
        })
        if (res.success) {
          setContentHtml(res.content)
          setToast({ message: 'Đã tạo xong bài viết từ kế hoạch', type: 'success' })
        } else {
          setToast({ message: res.error || 'Lỗi khi tạo bài viết', type: 'error' })
        }
      } else {
        // generic generation
        const kw = keywords.find(k => k.id === +selKeyword)
        const persona = personas.find(p => p.id === +selPersona)
        if (!kw) {
          setToast({ message: 'Vui lòng chọn từ khóa', type: 'error' })
          return
        }
        
        const systemPrompt = persona
          ? `Bạn là ${persona.name}. Viết bài SEO chuyên nghiệp, tự nhiên theo phong cách của bạn.`
          : 'Bạn là chuyên gia SEO content writer. Viết bài chuẩn SEO, tự nhiên, hấp dẫn.'

        const userPrompt = `Viết bài SEO đầy đủ về từ khoá: "${kw.keyword}"
${title ? `Tiêu đề: ${title}` : ''}
Yêu cầu:
- Định dạng HTML nén (không cần <html><body>, chỉ nội dung nội tại)
- Có H2-H6 phù hợp. Tuyệt đối KHÔNG sử dụng thẻ H1. KHÔNG sử dụng các thẻ danh sách <ul>, <ol>, <li>.
- Thay thế các danh sách bằng các đoạn văn (p) trình bày mạch lạc.
- Độ dài 1000-1500 từ
- Mật độ từ khoá 1-2%
- Văn phong tự nhiên, không nhồi nhét
- Output là mã HTML nén (minified), không xuống dòng, không khoảng trắng thừa giữa các thẻ.
- Chỉ trả về mã HTML, không markdown, không giải thích.`

        const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        })

        if (res.success) {
          setContentHtml(res.content)
          if (!title) setTitle(`Bài về: ${kw.keyword}`)
          setToast({ message: 'AI đã viết xong bài viết', type: 'success' })
        } else {
          setToast({ message: res.error || 'Lỗi khi gọi AI', type: 'error' })
        }
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  async function generateSocialContent() {
    if (!contentHtml) {
      return setToast({ message: 'Vui lòng có nội dung bài viết trước khi tạo nội dung Social', type: 'error' })
    }
    setGenerating(true)
    try {
      const persona = personas.find(p => p.id === +selPersona)
      const kw = keywords.find(k => k.id === +selKeyword) || { keyword: title }
      
      const systemPrompt = persona
        ? `Bạn là ${persona.name}. Hãy viết nội dung quảng bá bài viết.`
        : 'Bạn là chuyên gia Social Media Marketing.'

      const baseUserPrompt = `Dựa trên bài viết SEO: "${title || kw.keyword}"
Nội dung bài viết: ${contentHtml.substring(0, 2000)}
Yêu cầu:
1. Sử dụng icon năng động, kèm hashtags.
2. Phong cách viết theo nhân vật: ${persona?.name || 'Chuyên gia'}.
3. CHỈ trả về nội dung bài viết, không giải thích gì thêm.`

      // Call 1: Facebook
      const resFb = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `${baseUserPrompt}\n\nNền tảng: Facebook.` }],
      })

      // Call 2: LinkedIn
      const resLi = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `${baseUserPrompt}\n\nNền tảng: LinkedIn.` }],
      })

      const newSocial: any[] = []
      if (resFb.success) newSocial.push({ social_type: 'facebook', content: resFb.content.trim() })
      if (resLi.success) newSocial.push({ social_type: 'linkedin', content: resLi.content.trim() })

      if (newSocial.length > 0) {
        setSocialContent(newSocial)
        setToast({ message: 'Đã tạo xong nội dung Social', type: 'success' })
      } else {
        setToast({ message: 'Lỗi khi gọi AI', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  async function generateThumbnailPrompt() {
    if (!contentHtml) {
      return setToast({ message: 'Vui lòng có nội dung bài viết trước khi tạo Thumbnail Prompt', type: 'error' })
    }
    setGenerating(true)
    try {
      const kw = keywords.find(k => k.id === +selKeyword) || { keyword: title }
      
      const systemPrompt = `Bạn là chuyên gia thiết kế hình ảnh và Prompt Engineer cho các AI tạo ảnh như Midjourney, DALL-E 3.`

      const userPrompt = `Dựa trên bài viết SEO: "${title || kw.keyword}"
Nội dung bài viết: ${contentHtml.substring(0, 3000)}

Yêu cầu:
1. Hãy tạo 1 prompt tiếng Anh chuyên sâu để tạo ảnh thumbnail cho bài viết này.
2. Ảnh phải thu hút, phản ánh đúng chủ đề, phong cách nghệ thuật phù hợp (với web truyện tranh/anime là chủ yếu).
3. Thêm các từ khoá mô tả ánh sáng, góc chụp, chi tiết (cinematic, high detail, 8k, digital art).
4. Prompt phải tập trung vào hình ảnh, KHÔNG chứa chữ (no text).

Chỉ trả về đoạn Prompt tiếng Anh, không giải thích.`

      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      })

      if (res.success) {
        setThumbnailPrompt(res.content.trim())
        setToast({ message: 'Đã tạo xong Thumbnail Prompt', type: 'success' })
      } else {
        setToast({ message: res.error || 'Lỗi khi gọi AI', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const minifyHtmlContent = () => {
    if (!contentHtml) return
    const minified = contentHtml
      .replace(/>\s+</g, '><') // remove spaces between tags
      .replace(/\s+/g, ' ')    // collapse multiple spaces
      .trim()
    setContentHtml(minified)
    setToast({ message: 'Đã nén mã HTML', type: 'success' })
  }

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
        // Update
        const payload: any = { 
          id: +articleId, 
          title, 
          content_html: contentHtml, 
          content_text: textContent,
          meta_title: metaTitle,
          meta_description: metaDescription,
          content_social: JSON.stringify(socialContent),
          thumbnail_prompt: thumbnailPrompt
        }
        if (selPersona) payload.persona_id = +selPersona
        await invoke('article:update', payload)
      } else {
        // Create new
        const saved = await invoke<{ id?: number }>('article:create', {
          keyword_id: selKeyword ? +selKeyword : undefined,
          campaign_id: selCampaign ? +selCampaign : undefined,
          persona_id: selPersona ? +selPersona : undefined,
          title: title || 'Không có tiêu đề', 
          content_html: contentHtml, 
          content_text: textContent, 
          meta_title: metaTitle,
          meta_description: metaDescription,
          content_social: JSON.stringify(socialContent),
          thumbnail_prompt: thumbnailPrompt,
          status: 'draft',
        })
        articleId = saved.id?.toString() || null
      }

      // Automatically run Audit
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

  const handleSaveAndExit = async () => {
    await handleSave(true)
  }

  const handleExit = () => {
    navigate('/article')
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setToast({ message: `Đã sao chép ${label}`, type: 'success' })
  }

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
        
        {/* Left Side: Editor/Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Nội dung bài viết</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {contentHtml && (
                  <button 
                    className="btn-ghost" 
                    style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleCopyToClipboard(contentHtml, 'mã HTML')}
                    title="Sao chép toàn bộ HTML"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                )}
                {activeTab === 'html' && contentHtml && (
                  <button 
                    className="btn-ghost" 
                    style={{ fontSize: 11, color: 'var(--brand-primary)', padding: '4px 8px' }}
                    onClick={minifyHtmlContent}
                  >
                    Nén HTML
                  </button>
                )}
                <div style={{ display: 'flex', background: 'var(--surface-1)', padding: 4, borderRadius: 8, gap: 4 }}>
                  <button 
                    className={`btn-ghost`}
                    style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, gap: 6, border: 'none', display: 'flex', alignItems: 'center', ...(activeTab === 'html' ? { background: 'var(--surface-3)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'var(--brand-primary)' } : { color: 'var(--text-muted)' }) }}
                    onClick={() => setActiveTab('html')}
                  >
                    <Code size={14} /> HTML
                  </button>
                  <button 
                    className={`btn-ghost`}
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

          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>SEO Meta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Meta Title
                    {metaTitle && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => handleCopyToClipboard(metaTitle, 'Meta Title')}><Copy size={12}/></button>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 400, color: metaTitle.length > 60 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {metaTitle.length}/60
                  </span>
                </label>
                <input 
                  className="input" 
                  value={metaTitle} 
                  onChange={e => setMetaTitle(e.target.value)} 
                  placeholder="Tiêu đề hiển thị trên Google..."
                />
              </div>
              <div>
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Meta Description
                    {metaDescription && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => handleCopyToClipboard(metaDescription, 'Meta Description')}><Copy size={12}/></button>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 400, color: metaDescription.length > 160 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {metaDescription.length}/160
                  </span>
                </label>
                <textarea 
                  className="input" 
                  style={{ minHeight: 80, padding: '10px 12px' }}
                  value={metaDescription} 
                  onChange={e => setMetaDescription(e.target.value)} 
                  placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Social Content (FB/LinkedIn)</h3>
              <button 
                className="btn-ghost" 
                style={{ fontSize: 12, color: 'var(--brand-primary)', gap: 6 }}
                onClick={generateSocialContent}
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
                      onClick={() => handleCopyToClipboard(item.content, `nội dung ${item.social_type}`)}
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
                      newContent[idx].content = e.target.value;
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

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Thumbnail Prompt (AI Image)</h3>
                {thumbnailPrompt && <button className="btn-ghost" style={{ padding: 2, color: 'var(--brand-primary)' }} onClick={() => handleCopyToClipboard(thumbnailPrompt, 'Thumbnail Prompt')}><Copy size={12}/></button>}
              </div>
              <button 
                className="btn-ghost" 
                style={{ fontSize: 12, color: 'var(--brand-primary)', gap: 6 }}
                onClick={generateThumbnailPrompt}
                disabled={generating}
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
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
        </div>

        {/* Right Side: Setup & AI */}
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
                  onClick={() => handleSave(false)} 
                  disabled={saving || generating}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu bài viết
                </button>
                
                <button 
                  className="btn-primary" 
                  style={{ height: 44, width: '100%', justifyContent: 'center', background: '#10b981' }}
                  onClick={handleSaveAndExit} 
                  disabled={saving || generating}
                >
                  <Check size={16} />
                  Lưu & Thoát
                </button>

                <button 
                  className="btn-secondary" 
                  style={{ height: 44, width: '100%', justifyContent: 'center' }}
                  onClick={handleExit}
                  disabled={saving || generating}
                >
                  Thoát
                </button>
              </div>
            </div>

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
                    onClick={generateArticle} 
                    disabled={generating} 
                    title={generating ? 'Đang xử lý...' : ''}
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    Sinh nội dung AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Article viewer modal */}
      {viewArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '85vw', maxWidth: 860, height: '85vh', display: 'flex', flexDirection: 'column' }} className="glass-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{viewArticle.title}</span>
              <button className="btn-ghost" onClick={() => setViewArticle(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 32, background: '#fff', borderRadius: '0 0 10px 10px' }}>
              <div style={{ color: '#1a1a1a', lineHeight: 1.8, fontFamily: 'Georgia, serif', fontSize: 16 }} dangerouslySetInnerHTML={{ __html: viewArticle.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
