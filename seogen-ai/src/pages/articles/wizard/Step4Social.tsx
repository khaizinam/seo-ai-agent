import React, { useState } from 'react'
import { invoke } from '../../../lib/api'
import { useAppStore } from '../../../stores/app.store'
import { ArticleSocialContent } from '../components/ArticleSocialContent'
import { ArticleSeoMeta } from '../components/ArticleSeoMeta'
import { ArticleThumbnailPrompt } from '../components/ArticleThumbnailPrompt'
import { buildSocialSystemPrompt, buildSocialUserPrompt, stripHtmlToText, buildThumbnailSystemPrompt, buildThumbnailUserPrompt } from '../../../lib/prompts'

export default function Step4Social(props: any) {
  const { data, onAutoSave, onFinish, setGenerating, setAiOverlayVisible, setAiOverlayStep, abortRef } = props
  const { setToast } = useAppStore()

  const [socialContent, setSocialContent] = useState<any[]>(data.content_social || [])
  const [metaTitle, setMetaTitle] = useState(data.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(data.meta_description || '')
  const [thumbnailPrompt, setThumbnailPrompt] = useState(data.thumbnail_prompt || '')

  const [localGenerating, setLocalGenerating] = useState(false)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setToast({ message: `Đã copy ${label}`, type: 'info' })
  }

  const handleGenSocial = async () => {
    if (!data.content_html) {
      setToast({ message: 'Không có HTML Bài viết, không thể sinh nội dung mạng xã hội', type: 'error' })
      return
    }

    setGenerating(true)
    setLocalGenerating(true)
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang sinh nội dung bài đăng Facebook Ads...')
    try {
      if (abortRef) abortRef.current = false // reset for new process
      const summaryText = data.content_html ? stripHtmlToText(data.content_html, 1500) : data.title || 'Bài viết mới'
      const personaLabel = 'Expert' // could fetch from persona name
      
      const resFb = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
         messages: [
           { role: 'system', content: buildSocialSystemPrompt('Facebook Ads', data.output_language) }, 
           { role: 'user', content: buildSocialUserPrompt(data.title, summaryText, personaLabel, 'Facebook Ads', data.output_language) }
         ]
       })

      if (abortRef && abortRef.current) return // User cancelled during await

      const newSocial: any[] = []
      if (resFb.success) newSocial.push({ social_type: 'facebook', content: resFb.content.trim() })
      
      setSocialContent(newSocial)
      await onAutoSave({ content_social: newSocial })
      setToast({ message: 'Sinh nội dung Facebook Ads thành công', type: 'success' })

    } catch (e: any) {
      if (abortRef && abortRef.current) return
      setToast({ message: `Lỗi gen Social: ${e.message}`, type: 'error' })
    } finally {
      if (!abortRef || !abortRef.current) {
        setGenerating(false)
        setLocalGenerating(false)
        setAiOverlayVisible(false)
      }
    }
  }

  const handleGenMeta = async () => {
    if (!data.content_html) {
      setToast({ message: 'Không có HTML Bài viết để gen Meta', type: 'error' })
      return
    }

    setGenerating(true)
    setLocalGenerating(true)
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang tối ưu Title và Description chuẩn SEO META...')
    try {
      if (abortRef) abortRef.current = false
      const summaryText = data.content_html ? stripHtmlToText(data.content_html, 1000) : data.title || 'Bài viết mới'
      const res = await invoke<{ success: boolean; meta_title: string; meta_description: string; error?: string }>('ai:generateMeta', {
        keyword: data.title,
        title: data.title,
        content: summaryText
      })

      if (abortRef && abortRef.current) return

      if (res.success) {
        setMetaTitle(res.meta_title)
        setMetaDescription(res.meta_description)
        await onAutoSave({ meta_title: res.meta_title, meta_description: res.meta_description })
        setToast({ message: 'Sinh SEO Meta thành công', type: 'success' })
      }
    } catch (e: any) {
      if (abortRef && abortRef.current) return
      setToast({ message: `Lỗi gen Meta: ${e.message}`, type: 'error' })
    } finally {
      if (!abortRef || !abortRef.current) {
        setGenerating(false)
        setLocalGenerating(false)
        setAiOverlayVisible(false)
      }
    }
  }

  const handleGenThumb = async () => {
    if (!data.content_html) {
      setToast({ message: 'Không có HTML Bài viết để gen Thumbnail', type: 'error' })
      return
    }

    setGenerating(true)
    setLocalGenerating(true)
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang phân tích và sinh Prompt tạo ảnh chuyên nghiệp...')
    try {
      if (abortRef) abortRef.current = false
      const summaryText = data.content_html ? stripHtmlToText(data.content_html, 1000) : data.title || 'Bài viết mới'
      const res = await invoke<{ success: boolean; content: string; error?: string }>('ai:generate', {
         messages: [
           { role: 'system', content: buildThumbnailSystemPrompt() }, 
           { role: 'user', content: buildThumbnailUserPrompt(data.title, summaryText) }
         ]
       })

      if (abortRef && abortRef.current) return

      if (res.success) {
        setThumbnailPrompt(res.content.trim())
        await onAutoSave({ thumbnail_prompt: res.content.trim() })
        setToast({ message: 'Sinh Thumbnail Prompt thành công', type: 'success' })
      }
    } catch (e: any) {
      if (abortRef && abortRef.current) return
      setToast({ message: `Lỗi gen Thumbnail: ${e.message}`, type: 'error' })
    } finally {
      if (!abortRef || !abortRef.current) {
        setGenerating(false)
        setLocalGenerating(false)
        setAiOverlayVisible(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>4. Phân phối & Nội dung liên quan</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sinh tự động tiêu đề Meta Search, Bài đăng Facebook Ads kéo traffic, và mô tả Prompt để tạo ảnh Thumbnail.</p>
      </div>

      <div className="flex flex-col gap-8 mt-2">
        <ArticleSeoMeta
           metaTitle={metaTitle} setMetaTitle={setMetaTitle}
           metaDescription={metaDescription} setMetaDescription={setMetaDescription}
           onCopy={handleCopy}
           generating={localGenerating}
           onGenMeta={handleGenMeta}
        />

        <ArticleSocialContent
           socialContent={socialContent} setSocialContent={setSocialContent}
           generating={localGenerating}
           onGenSocial={handleGenSocial}
           onCopy={handleCopy}
        />

        <ArticleThumbnailPrompt
           thumbnailPrompt={thumbnailPrompt} setThumbnailPrompt={setThumbnailPrompt}
           generating={localGenerating}
           onGenThumb={handleGenThumb}
           onCopy={handleCopy}
        />
      </div>
    </div>
  )
}
