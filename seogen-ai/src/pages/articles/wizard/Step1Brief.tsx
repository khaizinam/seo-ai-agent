import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { buildBriefUserPrompt } from '../../../lib/prompts'
import { ButtonGenAI, FormField, InputText, InputArea, SelectField, Button } from '../../../components/ui'

export default function Step1Brief(props: any) {
  const { data, onNext, onAutoSave, setGenerating, setAiOverlayVisible, setAiOverlayStep, abortRef } = props
  const { setToast } = useAppStore()
  const [formData, setFormData] = useState({
    title: data.title || '',
    campaign_summary: data.campaign_summary || '',
    target_audience: data.target_audience || '',
    output_language: data.output_language || 'Vietnamese'
  })

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
    onAutoSave({ [name]: value })
  }

  const handleGenBriefAI = async () => {
    if (!formData.title) {
      setToast({ message: 'Vui lòng điền Tiêu đề bài viết hoặc Keyword để AI có dữ liệu phân tích', type: 'error' })
      return
    }
    if (abortRef) abortRef.current = false
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
      let rawJson = res.content.trim().replace(/```json/g, '').replace(/```/g, '').trim()
      const firstBrace = rawJson.indexOf('{')
      const lastBrace = rawJson.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) rawJson = rawJson.substring(firstBrace, lastBrace + 1)
      const parsedJson = JSON.parse(rawJson)
      setFormData(prev => ({
        ...prev,
        campaign_summary: parsedJson.campaign_summary || prev.campaign_summary,
        target_audience: parsedJson.target_audience || prev.target_audience
      }))
      setToast({ message: 'Đã sinh Tóm tắt chiến dịch & Đối tượng tự động!', type: 'success' })
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
      setGenerating(false)
      setAiOverlayVisible(false)
    }
  }

  const handleContinue = () => onNext(formData)

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 800 }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>1. Bối cảnh &amp; Mục tiêu Chiến dịch</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cung cấp thông tin chi tiết để AI hiểu rõ ngữ cảnh và định hướng nội dung bài viết.</p>
        </div>
        <ButtonGenAI onClick={handleGenBriefAI} disabled={!formData.title}>
          Dùng AI Gen Nhập Nhanh
        </ButtonGenAI>
      </div>

      <FormField label="Tiêu đề bài viết (hoặc Keyword chính)" required>
        <InputText name="title" placeholder="VD: Cách tối ưu SEO lên top 1 Google"
          value={formData.title} onChange={handleChange} onBlur={handleBlur} />
      </FormField>

      <FormField label="Tóm tắt chiến dịch (Campaign Summary)" required>
        <InputArea name="campaign_summary" rows={3}
          placeholder="VD: Bài viết nằm trong chiến dịch tri ân khách hàng tháng 10..."
          value={formData.campaign_summary} onChange={handleChange} onBlur={handleBlur} />
      </FormField>

      <FormField label="Đối tượng hướng đến (Target Audience)">
        <InputArea name="target_audience" rows={3}
          placeholder="VD: Chủ spa, nữ 25-40 tuổi..."
          value={formData.target_audience} onChange={handleChange} onBlur={handleBlur} />
      </FormField>

      <div style={{ maxWidth: 320 }}>
        <FormField label="Ngôn ngữ đầu ra">
          <SelectField
            name="output_language"
            options={[
              { label: 'Tiếng Việt', value: 'Vietnamese' },
              { label: 'Tiếng Anh (English)', value: 'English' },
              { label: 'Tiếng Nhật (日本語)', value: 'Japanese' },
            ]}
            value={formData.output_language}
            onChange={e => { handleChange(e as any); onAutoSave({ output_language: e.target.value }) }}
          />
        </FormField>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="primary"
          disabled={!formData.title || !formData.campaign_summary}
          onClick={handleContinue}
          style={{ padding: '8px 24px' }}>
          Lưu &amp; Tiếp tục Bước 2
        </Button>
      </div>
    </div>
  )
}
