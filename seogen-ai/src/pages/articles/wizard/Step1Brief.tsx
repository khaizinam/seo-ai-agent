import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { buildBriefUserPrompt } from '../../../lib/prompts'
import { Loader2 } from 'lucide-react'

export default function Step1Brief(props: any) {
  const { data, onNext, onAutoSave, setGenerating, setAiOverlayVisible, setAiOverlayStep, abortRef } = props
  const { setToast } = useAppStore()
  const [formData, setFormData] = useState({
    title: data.title || '',
    campaign_summary: data.campaign_summary || '',
    target_audience: data.target_audience || '',
    output_language: data.output_language || 'Vietnamese'
  })

  // Sync state if parent data changes
  React.useEffect(() => {
    setFormData({
      title: data.title || '',
      campaign_summary: data.campaign_summary || '',
      target_audience: data.target_audience || '',
      output_language: data.output_language || 'Vietnamese'
    })
  }, [data])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: any) => {
    const { name, value } = e.target
    // Push state to parent on blur so Sidebar save works
    onAutoSave({ [name]: value })
  }

  const handleGenBriefAI = async () => {
    if (!formData.title) {
       setToast({ message: 'Vui lòng điền Tiêu đề bài viết hoặc Keyword để AI có dữ liệu phân tích', type: 'error' })
       return
    }

    setGenerating(true)
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang phân tích Tiêu đề/Keyword và tự động sinh Tóm tắt chiến dịch...')
    
    try {
      const prompt = buildBriefUserPrompt(formData.title, formData.output_language)
      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
        messages: [{ role: 'system', content: 'You are a JSON generator.' }, { role: 'user', content: prompt }],
      })

      if (abortRef && abortRef.current) return

      if (!res.success) throw new Error(res.error)

      let rawJson = res.content.trim()
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim()
      const firstBrace = rawJson.indexOf('{')
      const lastBrace = rawJson.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawJson = rawJson.substring(firstBrace, lastBrace + 1)
      }

      const parsedJson = JSON.parse(rawJson)
      
      setFormData(prev => ({
         ...prev,
         campaign_summary: parsedJson.campaign_summary || prev.campaign_summary,
         target_audience: parsedJson.target_audience || prev.target_audience
      }))

      setToast({ message: 'Đã sinh Tóm tắt chiến dịch & Đối tượng tự động!', type: 'success' })

      // Auto-save
      await onAutoSave({
        title: formData.title,
        campaign_summary: parsedJson.campaign_summary || formData.campaign_summary,
        target_audience: parsedJson.target_audience || formData.target_audience
      })

    } catch (e: any) {
      if (abortRef && abortRef.current) return
      console.error(e)
      setToast({ message: `Lỗi gen dữ liệu: ${e.message}`, type: 'error' })
    } finally {
      if (!abortRef || !abortRef.current) {
        setGenerating(false)
        setAiOverlayVisible(false)
      }
    }
  }

  const handleContinue = () => {
    onNext(formData)
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 800 }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>1. Bối cảnh & Mục tiêu Chiến dịch</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cung cấp thông tin chi tiết để AI hiểu rõ ngữ cảnh và định hướng nội dung bài viết.</p>
        </div>
        <button 
           className="btn px-4 py-2 font-semibold text-sm rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 whitespace-nowrap"
           onClick={handleGenBriefAI}
           disabled={!formData.title}
           style={{ opacity: (!formData.title) ? 0.6 : 1 }}
        >
          ✨ Dùng AI Gen Nhập Nhanh
        </button>
      </div>

      <div className="form-group flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tiêu đề bài viết (hoặc Keyword chính) *</label>
        <input 
          type="text" name="title"
          className="input-field w-full p-2 border rounded"
          placeholder="VD: Cách tối ưu SEO lên top 1 Google"
          value={formData.title} onChange={handleChange} onBlur={handleBlur}
        />
      </div>

      <div className="form-group flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tóm tắt chiến dịch (Campaign Summary) *</label>
        <textarea 
          name="campaign_summary"
          className="input-field w-full p-2 border rounded"
          rows={3}
          placeholder="VD: Bài viết nằm trong chiến dịch tri ân khách hàng tháng 10 của Thẩm mỹ viện ABC, mục tiêu kéo traffic về landing page khuyến mãi..."
          value={formData.campaign_summary} onChange={handleChange} onBlur={handleBlur}
        />
      </div>

      <div className="form-group flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Đối tượng hướng đến (Target Audience)</label>
        <textarea 
          name="target_audience"
          className="input-field w-full p-2 border rounded"
          rows={3}
          placeholder="VD: Chủ spa, nữ 25-40 tuổi..."
          value={formData.target_audience} onChange={handleChange} onBlur={handleBlur}
        />
      </div>

      <div className="form-group flex flex-col gap-2 w-1/2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ngôn ngữ đầu ra</label>
        <select className="select w-full p-2 border rounded" name="output_language" value={formData.output_language} onChange={(e) => {handleChange(e); onAutoSave({output_language: e.target.value})}}>
          <option value="Vietnamese">Tiếng Việt</option>
          <option value="English">Tiếng Anh (English)</option>
          <option value="Japanese">Tiếng Nhật (日本語)</option>
        </select>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
           className="btn-primary px-6 py-2 rounded font-semibold flex items-center gap-2"
           style={{ background: 'var(--brand-primary)', color: 'white' }}
           onClick={handleContinue}
           disabled={!formData.title || !formData.campaign_summary}
        >
          Lưu & Tiếp tục Bước 2
        </button>
      </div>
    </div>
  )
}
