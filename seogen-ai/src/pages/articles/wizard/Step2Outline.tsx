import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { buildOutlineUserPrompt } from '../../../lib/prompts'
import { ButtonGenAI, FormField, InputArea, Button } from '../../../components/ui'

export default function Step2Outline(props: any) {
  const { data, onNext, onAutoSave, setGenerating, setAiOverlayVisible, setAiOverlayStep, abortRef } = props
  const { setToast } = useAppStore()

  const [formData, setFormData] = useState({
    primary_keywords: typeof data.primary_keywords === 'string' ? JSON.parse(data.primary_keywords || '[]') : [],
    secondary_keywords: typeof data.secondary_keywords === 'string' ? JSON.parse(data.secondary_keywords || '[]') : [],
    eeat_summary: data.eeat_summary || '',
    qna_list: typeof data.qna_list === 'string' ? JSON.parse(data.qna_list || '[]') : [],
    outline_data: typeof data.outline_data === 'string' ? JSON.parse(data.outline_data || '[]') : []
  })

  const [outlineText, setOutlineText] = useState(() => {
    try {
      const arr = typeof data.outline_data === 'string' ? JSON.parse(data.outline_data) : data.outline_data
      if (Array.isArray(arr) && arr.length > 0) return arr.map((item: any) => `${item.level === 2 ? '##' : '###'} ${item.title}`).join('\n')
    } catch(e) {}
    return ''
  })

  const [qnaText, setQnaText] = useState(() => {
    try {
      const arr = typeof data.qna_list === 'string' ? JSON.parse(data.qna_list) : data.qna_list
      if (Array.isArray(arr) && arr.length > 0) return arr.map((item: any) => `Q: ${item.q}\nA: ${item.a}`).join('\n\n')
    } catch(e) {}
    return ''
  })

  const [keywordText, setKeywordText] = useState(() => {
    try {
      const arr = typeof data.secondary_keywords === 'string' ? JSON.parse(data.secondary_keywords) : data.secondary_keywords
      if (Array.isArray(arr)) return arr.join(', ')
    } catch(e) {}
    return ''
  })

  const handleGenOutlineAI = async () => {
    if (!data.title && !data.campaign_summary) {
       setToast({ message: 'Vui lòng điền đủ thông tin ở Bước 1 trước khi tự động sinh Dàn ý', type: 'error' })
       return
    }

    try {
      abortRef.current = false
      setGenerating(true)
      setAiOverlayVisible(true)
      setAiOverlayStep('Đang phân tích cấu trúc và sinh Dàn ý SEO & EEAT...')
      await onAutoSave({})
      const prompt = buildOutlineUserPrompt(
        data.title, data.campaign_summary, data.target_audience,
        data.tone_of_voice, data.output_language
      )
      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: 'You are an SEO outline generator. Output valid raw JSON only. No markdown formatting.' }, { role: 'user', content: prompt }],
      })
      if (!res.success) throw new Error(res.error)
      let rawJson = res.content.trim().replace(/```json/g, '').replace(/```/g, '').trim()
      const firstBrace = rawJson.indexOf('{')
      const lastBrace = rawJson.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) rawJson = rawJson.substring(firstBrace, lastBrace + 1)
      const parsedJson = JSON.parse(rawJson)
      setOutlineText((parsedJson.outline_data || []).map((i: any) => `${i.level === 2 ? '##' : '###'} ${i.title}`).join('\n'))
      setQnaText((parsedJson.qna_list || []).map((i: any) => `Q: ${i.q}\nA: ${i.a}`).join('\n\n'))
      setKeywordText((parsedJson.secondary_keywords || []).join(', '))
      setFormData(prev => ({ ...prev, eeat_summary: parsedJson.eeat_summary || '' }))
      setToast({ message: 'Đã sinh xong Dàn ý!', type: 'success' })
    } catch (e: any) {
      console.error(e)
      setToast({ message: `Lỗi sinh JSON Outline: ${e.message}`, type: 'error' })
    } finally {
      setGenerating(false)
      setAiOverlayVisible(false)
    }
  }

  const parseSubmitData = () => {
    const kws = keywordText.split(',').map(s => s.trim()).filter(Boolean)
    const out_arr = outlineText.split('\n').filter(Boolean).map(line => {
       const trimmed = line.trim()
       if (trimmed.startsWith('###')) return { level: 3, title: trimmed.replace(/^#+\s*/, '') }
       if (trimmed.startsWith('##')) return { level: 2, title: trimmed.replace(/^#+\s*/, '') }
       return { level: 2, title: trimmed.replace(/^#+\s*/, '') }
    })
    const qna_arr = []
    const qnaBlocks = qnaText.split('\n\n').filter(Boolean)
    for (const block of qnaBlocks) {
      const qMatch = block.match(/Q:\s*(.*)/)
      const aMatch = block.match(/A:\s*(.*)/s)
      if (qMatch && aMatch) qna_arr.push({ q: qMatch[1].trim(), a: aMatch[1].trim() })
    }
    return {
      secondary_keywords: JSON.stringify(kws),
      outline_data: JSON.stringify(out_arr),
      qna_list: JSON.stringify(qna_arr),
      eeat_summary: formData.eeat_summary
    }
  }

  const handleContinue = () => {
    if (!outlineText.trim()) {
       setToast({ message: 'Dàn ý không được để trống', type: 'error' })
       return
    }
    onNext(parseSubmitData())
  }

  const handleManualSave = () => onAutoSave(parseSubmitData())

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 800 }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>2. Cấu trúc Dàn ý &amp; Thông số chuẩn SEO</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bạn có thể nhập thủ công nội dung hoặc nhấn Gen bằng AI.</p>
        </div>
        <ButtonGenAI onClick={handleGenOutlineAI}>
          Dùng AI Gen Dàn ý
        </ButtonGenAI>
      </div>

      <div className="flex flex-col gap-6 border-t border-gray-100 pt-6">
        <FormField label="Từ khoá LSI (Phụ)">
          <InputArea rows={2} placeholder="Ngăn cách bằng dấu phẩy"
            value={keywordText} onChange={e => setKeywordText(e.target.value)} onBlur={handleManualSave} />
        </FormField>

        <FormField label="Cấu trúc thẻ Heading (H2, H3)" required hint="Nhập '## Heading 2' và '### Heading 3'">
          <InputArea rows={8} className="font-mono"
            placeholder="## Giới thiệu&#10;### Lợi ích 1&#10;### Lợi ích 2&#10;## Kết luận"
            value={outlineText} onChange={e => setOutlineText(e.target.value)} onBlur={handleManualSave}
            style={{ fontSize: 13, lineHeight: 1.6 }} />
        </FormField>

        <FormField label="Điểm nhấn EEAT">
          <InputArea name="eeat_summary" rows={4}
            placeholder="VD: Với bài viết về spa mụn, AI sẽ thêm dòng: Dựa theo kinh nghiệm 10 năm điều trị cho 3000 ca..."
            value={formData.eeat_summary}
            onChange={e => setFormData(prev => ({ ...prev, eeat_summary: e.target.value }))}
            onBlur={handleManualSave} />
        </FormField>

        <FormField label="Hỏi đáp thường gặp (Q&A Schema)" hint="Định dạng Q: ... A: ...">
          <InputArea rows={5} className="font-mono"
            placeholder={'Q: Câu hỏi số 1?\nA: Đây là câu trả lời 1.\n\nQ: Câu hỏi số 2?\nA: Trả lời số 2.'}
            value={qnaText} onChange={e => setQnaText(e.target.value)} onBlur={handleManualSave}
            style={{ fontSize: 13 }} />
        </FormField>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="primary"
          style={{ background: 'var(--brand-primary)', color: 'white', padding: '8px 24px' }}
          onClick={handleContinue}>
          Xác nhận Dàn ý &amp; Tiếp tục Bước 3
        </Button>
      </div>
    </div>
  )
}
