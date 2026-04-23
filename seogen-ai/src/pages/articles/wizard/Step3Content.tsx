import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { ArticleContentEditor } from '../components/ArticleContentEditor'
import { buildIntroUserPrompt, buildBatchChunkUserPrompt, addNumberingToOutline } from '../../../lib/prompts'
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
    const rawOutlines = getOutlineArray()
    if (rawOutlines.length === 0) {
      setToast({ message: 'Không có thông tin Dàn ý. Vui lòng quay lại Bước 2 và sinh Dàn ý trước!', type: 'error' })
      return
    }

    const outlines = addNumberingToOutline(rawOutlines);

    abortRef.current = false
    setGenerating(true)
    setAiOverlayVisible(true)
    
    let generatedContent = ''

    const BATCH_SIZE = 5;
    const outlineWithIndex = outlines.map((item: any, index: number) => ({ ...item, index }));
    const batches: typeof outlineWithIndex[] = [];
    for (let i = 0; i < outlineWithIndex.length; i += BATCH_SIZE) {
      batches.push(outlineWithIndex.slice(i, i + BATCH_SIZE));
    }
    const totalSteps = batches.length + 2;

    // 1. Sinh Phần mở đầu (Hook & Intro) có chứa Keywords và EEAT
    try {
      setAiOverlayStep(`[1/${totalSteps}] Đang viết phần Mở Bài (Intro)...`)
      // Format secondary keywords for the prompt
      let keywordsStr = data.secondary_keywords || ''
      try {
        const parsed = typeof data.secondary_keywords === 'string' ? JSON.parse(data.secondary_keywords) : data.secondary_keywords
        if (Array.isArray(parsed)) keywordsStr = parsed.join(', ')
      } catch (e) {
        keywordsStr = data.secondary_keywords || ''
      }

      const introPrompt = buildIntroUserPrompt(
        data.title, data.campaign_summary, data.eeat_summary,
        keywordsStr, data.tone_of_voice, data.output_language,
        outlines.map((h, i) => ({ level: h.level, title: h.title, index: i })),
        data.internal_links
      )

      const resIntro = await invoke<{success: boolean, content: string, error?: string}>('ai:generate', {
        messages: [{ role: 'system', content: 'You are an SEO expert writer. Output clean HTML.' }, { role: 'user', content: introPrompt }]
      })
      if (!resIntro.success) throw new Error(resIntro.error || 'Unknown AI error')
      generatedContent += `\n<!-- INTRO -->\n<div class="article-intro">\n${resIntro.content.replace(/```html|```/g, '').trim()}\n</div>\n`
    } catch (e: any) {
      if (!abortRef.current) setToast({ message: `Lỗi sinh phần Intro: ${e.message}`, type: 'error' })
    }

    // 2. Gom nhóm Dàn ý (Batching)
    for (let i = 0; i < batches.length; i++) {
      if (abortRef.current) break
      const batch = batches[i]
      
      setAiOverlayStep(`[${i + 2}/${totalSteps}] Đang viết nhóm ${i + 1}/${batches.length} (mục ${batch[0].index + 1}-${batch[batch.length - 1].index + 1})...`)
      
      // Format secondary keywords for the prompt
      let keywordsStr = data.secondary_keywords || ''
      try {
        const parsed = typeof data.secondary_keywords === 'string' ? JSON.parse(data.secondary_keywords) : data.secondary_keywords
        if (Array.isArray(parsed)) keywordsStr = parsed.join(', ')
      } catch (e) {
        keywordsStr = data.secondary_keywords || ''
      }

      const batchPrompt = buildBatchChunkUserPrompt(
        data.title, batch,
        keywordsStr,
        data.tone_of_voice, data.output_language,
        data.internal_links
      )

      try {
        const resChunk = await invoke<{success: boolean, content: string, error?: string}>('ai:generate', {
          messages: [{ role: 'system', content: 'You are an SEO expert writer. Output clean HTML.' }, { role: 'user', content: batchPrompt }]
        })
        if (resChunk.success) {
           generatedContent += `\n${resChunk.content.replace(/```html|```/g, '').trim()}\n`
        }
      } catch (e) {
        if (!abortRef.current) setToast({ message: `Lỗi sinh nhóm ${i + 1}`, type: 'info' })
      }

      // Ngủ 1.5s để giảm tải rate limit
      await sleep(1500)
    }

    // 3. Sinh FAQ Schema phần QnA
    let qnaArr: any[] = []
    try { qnaArr = typeof data.qna_list === 'string' ? JSON.parse(data.qna_list) : data.qna_list } catch(e){}

    if (!abortRef.current && Array.isArray(qnaArr) && qnaArr.length > 0) {
      setAiOverlayStep(`[${totalSteps}/${totalSteps}] Đang tạo cấu trúc Q&A Schema...`)
      
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
        const finalHtml = generatedContent.trim()
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
