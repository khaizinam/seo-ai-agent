import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { buildOutlineUserPrompt } from '../../../lib/prompts'

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

  // Basic Text input fields since parsing complex JSON array needs custom UI components
  // For MVP, we will use Textarea to allow user to paste JSON, or better, we represent outline as raw text with H2 H3 markers and parse it later.
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
    // 1. Check requirement
    if (!data.title && !data.campaign_summary) {
       setToast({ message: 'Vui lòng điền đủ thông tin ở Bước 1 trước khi tự động sinh Dàn ý', type: 'error' })
       return
    }

    try {
      abortRef.current = false
      setGenerating(true)
      setAiOverlayVisible(true)
      setAiOverlayStep('Đang phân tích cấu trúc và sinh Dàn ý SEO & EEAT...')

      // Gọi Auto Save Bước 2 trước khi gen
      await onAutoSave({})

      // Xây dựng Prompt sinh Outline
      const prompt = buildOutlineUserPrompt(
        data.title, data.campaign_summary, data.target_audience, 
        data.tone_of_voice, data.output_language
      )

      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: 'You are an SEO outline generator. Output valid raw JSON only. No markdown formatting.' }, { role: 'user', content: prompt }],
      })

      if (!res.success) throw new Error(res.error)

      // Xoá ký tự rác và code block (nếu có do AI nhầm)
      let rawJson = res.content.trim()
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim()
      // Tìm vị trí của block JSON đầu tiên (tránh AI sinh chữ dưng trước)
      const firstBrace = rawJson.indexOf('{')
      const lastBrace = rawJson.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawJson = rawJson.substring(firstBrace, lastBrace + 1)
      }

      const parsedJson = JSON.parse(rawJson)

      // Gắn data lại
      const newOutlineText = (parsedJson.outline_data || []).map((i: any) => `${i.level === 2 ? '##' : '###'} ${i.title}`).join('\n')
      const newQnaText = (parsedJson.qna_list || []).map((i: any) => `Q: ${i.q}\nA: ${i.a}`).join('\n\n')
      
      setOutlineText(newOutlineText)
      setQnaText(newQnaText)
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

  // Chuyển đổi từ raw text input sang JSON payload
  const parseSubmitData = () => {
    const kws = keywordText.split(',').map(s => s.trim()).filter(Boolean)
    const out_arr = outlineText.split('\n').filter(Boolean).map(line => {
       const trimmed = line.trim()
       if (trimmed.startsWith('###')) return { level: 3, title: trimmed.replace(/^#+\s*/, '') }
       if (trimmed.startsWith('##')) return { level: 2, title: trimmed.replace(/^#+\s*/, '') }
       return { level: 2, title: trimmed.replace(/^#+\s*/, '') } // default fallback
    })

    const qna_arr = []
    const qnaBlocks = qnaText.split('\n\n').filter(Boolean)
    for (const block of qnaBlocks) {
      const qMatch = block.match(/Q:\s*(.*)/)
      const aMatch = block.match(/A:\s*(.*)/s) // s flag for multiline
      if (qMatch && aMatch) {
         qna_arr.push({ q: qMatch[1].trim(), a: aMatch[1].trim() })
      }
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
    const payload = parseSubmitData()
    onNext(payload)
  }

  const handleManualSave = () => {
    const payload = parseSubmitData()
    onAutoSave(payload)
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 800 }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>2. Cấu trúc Dàn ý & Thông số chuẩn SEO</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bạn có thể nhập thủ công nội dung hoặc nhấn Gen bằng AI.</p>
        </div>
        <button 
           className="btn px-4 py-2 font-semibold text-sm rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
           onClick={handleGenOutlineAI}
        >
          ✨ Dùng AI Gen Dàn ý
        </button>
      </div>

      <div className="flex flex-col gap-6 border-t border-gray-100 pt-6">
        <div className="form-group flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Từ khoá LSI (Phụ)</label>
          <textarea 
            className="input-field w-full p-2 border rounded text-sm"
            rows={2}
            placeholder="Ngăn cách bằng dấu phẩy"
            value={keywordText} onChange={e => setKeywordText(e.target.value)} onBlur={handleManualSave}
          />
        </div>

        <div className="form-group flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Cấu trúc thẻ Heading (H2, H3) *
            <span className="text-xs font-normal text-gray-500 ml-2">(Nhập `## Heading 2` và `### Heading 3`)</span>
          </label>
          <textarea 
            className="input-field w-full p-2 border rounded font-mono text-sm leading-6"
            rows={8}
            placeholder="## Giới thiệu\n### Lợi ích 1\n### Lợi ích 2\n## Kết luận"
            value={outlineText} onChange={e => setOutlineText(e.target.value)} onBlur={handleManualSave}
          />
        </div>

        <div className="form-group flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Điểm nhấn EEAT</label>
          <textarea 
            name="eeat_summary"
            className="input-field w-full p-2 border rounded text-sm leading-relaxed"
            rows={4}
            placeholder="VD: Với bài viết về spa mụn, AI sẽ thêm dòng: Dựa theo kinh nghiệm 10 năm điều trị cho 3000 ca, chuyên gia ABC nhận định... Bạn cần chèn các số liệu thực tiễn vào đây."
            value={formData.eeat_summary} 
            onChange={e => setFormData(prev => ({ ...prev, eeat_summary: e.target.value }))}
            onBlur={handleManualSave}
          />
        </div>

        <div className="form-group flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Hỏi đáp thường gặp (Q&A Schema)
            <span className="text-xs font-normal text-gray-500 ml-2">(Định dạng Q: ... A: ...)</span>
          </label>
          <textarea 
            className="input-field w-full p-2 border rounded font-mono text-sm"
            rows={5}
            placeholder={'Q: Câu hỏi số 1?\nA: Đây là câu trả lời 1.\n\nQ: Câu hỏi số 2?\nA: Trả lời số 2.'}
            value={qnaText} onChange={e => setQnaText(e.target.value)} onBlur={handleManualSave}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
         <button 
           className="btn-primary px-6 py-2 rounded font-semibold"
           style={{ background: 'var(--brand-primary)', color: 'white' }}
           onClick={handleContinue}
         >
           Xác nhận Dàn ý & Tiếp tục Bước 3
         </button>
      </div>
    </div>
  )
}
