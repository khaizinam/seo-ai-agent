import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { ArticleContentEditor } from '../components/ArticleContentEditor'
import { buildIntroUserPrompt, buildChunkUserPrompt } from '../../../lib/prompts'
import { ButtonGenAI, Button } from '../../../components/ui'

// Helper function sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function Step3Content(props: any) {
  const { data, onNext, onAutoSave, setGenerating, setAiOverlayVisible, setAiOverlayStep, abortRef } = props
  const { setToast } = useAppStore()

  const [contentHtml, setContentHtml] = useState(data.content_html || '')
  // Tái sử dụng component cũ của bạn làm Editor hiển thị kết quả
  const [activeTab, setActiveTab] = useState<'html' | 'context'>('context')
  const [localTitle, setLocalTitle] = useState(data.title || '')

  // Parsing JSON data từ Step 2
  const getOutlineArray = () => {
    try {
      const parsed = typeof data.outline_data === 'string' ? JSON.parse(data.outline_data) : data.outline_data
      return Array.isArray(parsed) ? parsed : []
    } catch(e) { return [] }
  }

  const handleGenContentChunking = async () => {
    const outlines = getOutlineArray()
    if (outlines.length === 0) {
      setToast({ message: 'Không có thông tin Dàn ý. Vui lòng quay lại Bước 2 và sinh Dàn ý trước!', type: 'error' })
      return
    }

    abortRef.current = false
    setGenerating(true)
    setAiOverlayVisible(true)
    
    let generatedContent = ''

    // 1. Sinh Phần mở đầu (Hook & Intro) có chứa Keywords và EEAT
    try {
      setAiOverlayStep(`[1/${outlines.length + 2}] Đang viết phần Mở Bài (Intro)...`)
      const introPrompt = buildIntroUserPrompt(
        data.title, data.campaign_summary, data.eeat_summary,
        data.secondary_keywords, data.tone_of_voice, data.output_language
      )

      const resIntro = await invoke<{success: boolean, content: string}>('ai:generate', {
        messages: [{ role: 'system', content: 'You are an SEO expert writer. Output clean HTML.' }, { role: 'user', content: introPrompt }]
      })
      if (!resIntro.success) throw new Error()
      generatedContent += `\n<!-- INTRO -->\n<div class="article-intro">\n${resIntro.content.replace(/```html|```/g, '').trim()}\n</div>\n`
    } catch (e) {
      if (!abortRef.current) setToast({ message: 'Lỗi sinh phần Intro, tiếp tục các phần khác...', type: 'info' })
    }

    // 2. Loop qua toàn bộ Dàn ý (H2, H3)
    for (let i = 0; i < outlines.length; i++) {
      if (abortRef.current) break
      const item = outlines[i]
      const tagName = `h${item.level || 2}`
      
      setAiOverlayStep(`[${i + 2}/${outlines.length + 2}] Đang viết chi tiết mục: ${item.title}...`)
      
      const chunkPrompt = buildChunkUserPrompt(
        data.title, tagName, item.title, i,
        data.tone_of_voice, data.output_language
      )

      try {
        const resChunk = await invoke<{success: boolean, content: string}>('ai:generate', {
          messages: [{ role: 'system', content: 'You are an SEO expert writer. Output clean HTML.' }, { role: 'user', content: chunkPrompt }]
        })
        if (resChunk.success) {
           generatedContent += `\n<!-- SECTION ${i} -->\n${resChunk.content.replace(/```html|```/g, '').trim()}\n`
        }
      } catch (e) {
        if (!abortRef.current) setToast({ message: `Lỗi sinh mục ${item.title}`, type: 'info' })
      }

      // Ngủ 1s để giảm tải rate limit
      await sleep(1000)
    }

    // 3. Sinh FAQ Schema phần QnA
    let qnaArr: any[] = []
    try { qnaArr = typeof data.qna_list === 'string' ? JSON.parse(data.qna_list) : data.qna_list } catch(e){}

    if (!abortRef.current && Array.isArray(qnaArr) && qnaArr.length > 0) {
      setAiOverlayStep(`[${outlines.length + 2}/${outlines.length + 2}] Đang tạo cấu trúc Q&A Schema...`)
      
      let faqHtml = `\n<!-- FAQ SECTION -->\n<div class="article-faq" itemscope itemtype="https://schema.org/FAQPage">\n<h2 id="faq-section">Câu hỏi thường gặp</h2>\n`
      
      qnaArr.forEach((qa, idx) => {
         faqHtml += `
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">${qa.q}</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text"><p>${qa.a}</p></div>
    </div>
  </div>\n`
      })
      faqHtml += `</div>\n`
      generatedContent += faqHtml
    }

    // 4. Wrap with article tag and finalize
    if (!abortRef.current && generatedContent) {
       const finalHtml = `<article class="seo-article">\n${generatedContent}\n</article>`
       setContentHtml(finalHtml)
       setToast({ message: 'Đã hoàn tất quá trình sinh bài viết.', type: 'success' })
       
       // Tự động lưu DB lại
       await onAutoSave({ content_html: finalHtml, status: 'reviewed' })
    }

    setGenerating(false)
    setAiOverlayVisible(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setToast({ message: 'Đã copy', type: 'info' })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>3. Sinh Nội dung (Chia nhỏ API - Chunking)</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hệ thống sẽ chạy lặp qua từng mục dàn ý để viết sâu hơn, tránh AI quên ngữ cảnh và nội năng bài viết.</p>
        </div>
        <button 
           className="btn px-4 py-2 font-semibold text-sm rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
           onClick={handleGenContentChunking}
        >
           ✨ Gen bài viết
        </button>
      </div>

      <div className="mt-4 flex-1 flex flex-col" style={{ minHeight: '60vh' }}>
        <ArticleContentEditor
          contentHtml={contentHtml} setContentHtml={setContentHtml}
          title={localTitle} setTitle={setLocalTitle}
          activeTab={activeTab} setActiveTab={setActiveTab}
          generating={false}
          hideGenButton={true}
          onGenContent={() => {}} // Disabling normal gen since we use Chunking
          onMinify={() => {
            setContentHtml(contentHtml.replace(/>\s+</g, '><').trim())
          }}
          onCopy={handleCopy}
          onBlur={() => onAutoSave({ content_html: contentHtml, title: localTitle })}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary"
          style={{ padding: '8px 24px' }}
          onClick={() => onNext({ content_html: contentHtml })}>
          Xác nhận Nội dung &amp; Tiếp tục Bước 4
        </Button>
      </div>
    </div>
  )
}
