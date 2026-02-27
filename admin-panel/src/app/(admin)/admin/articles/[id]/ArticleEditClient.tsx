"use client"

import { useState } from "react"
import { Article } from "@prisma/client"
import { CopyButton } from "@/components/ui/CopyButton"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateArticle } from "../actions"
import { Modal } from "@/components/ui/Modal"

export default function ArticleEditClient({ article }: { article: Article }) {
  const [activeTab, setActiveTab] = useState<'VI' | 'EN' | 'SOCIAL' | 'IMAGE'>('VI')
  const [isSaving, setIsSaving] = useState(false)
  
  // Custom Popup Modal State
  const [modalState, setModalState] = useState<{isOpen: boolean, type: 'success'|'error', message: string, exitAfterClose?: boolean}>({
    isOpen: false, 
    type: 'success', 
    message: ''
  })
  
  const router = useRouter()
  
  // This would ideally use a real form state library like react-hook-form
  const [formData, setFormData] = useState({
    titleVi: article.titleVi,
    metaDescVi: article.metaDescVi,
    contentVi: article.contentVi,
    titleEn: article.titleEn,
    metaDescEn: article.metaDescEn,
    contentEn: article.contentEn,
    socialContent: article.socialContent || '',
    imagePrompt: article.imagePrompt || '',
  })

  const handleSave = async (exitAfterSave = false) => {
    setIsSaving(true);
    const result = await updateArticle(article.id, formData);
    setIsSaving(false);

    if (result.success) {
      setModalState({
        isOpen: true,
        type: 'success',
        message: 'Đã lưu bài viết thành công!',
        exitAfterClose: exitAfterSave
      });
    } else {
      setModalState({
        isOpen: true,
        type: 'error',
        message: "Lỗi khi lưu: " + result.error,
        exitAfterClose: false
      });
    }
  }

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (modalState.exitAfterClose) {
      router.push("/admin/articles");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Article Header moved from page */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/articles" 
            className="h-10 w-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors"
            title="Quay về"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Chỉnh sửa bài viết
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-xs text-muted-foreground font-mono">ID: {article.slug}</p>
               <CopyButton text={article.slug} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${article.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'}`}>
            {article.status}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => router.push("/admin/articles")}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSave(false)} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <Button variant="success" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave(true)} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu & Thoát"}
            </Button>
          </div>
        </div>
      </div>

    <div className="bg-card shadow-sm ring-1 ring-border rounded-lg overflow-hidden flex flex-col border border-border text-foreground">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto bg-muted/20">
        <button
          onClick={() => setActiveTab('VI')}
          className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'VI' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
        >
          Vietnamese
        </button>
        <button
          onClick={() => setActiveTab('EN')}
          className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'EN' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
        >
          English
        </button>
        <button
          onClick={() => setActiveTab('SOCIAL')}
          className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'SOCIAL' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
        >
          Social Post
        </button>
        <button
          onClick={() => setActiveTab('IMAGE')}
          className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'IMAGE' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
        >
          Image Prompt
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'VI' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground/80">Title (vi.txt)</label>
                <CopyButton text={formData.titleVi || ""} label="Copy" />
              </div>
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={formData.titleVi}
                onChange={(e) => setFormData({...formData, titleVi: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground/80">Meta Description</label>
                <CopyButton text={formData.metaDescVi || ""} label="Copy" />
              </div>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={formData.metaDescVi}
                onChange={(e) => setFormData({...formData, metaDescVi: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground/80">Content HTML</label>
                <CopyButton text={formData.contentVi || ""} label="Copy HTML" />
              </div>
              <div className="border border-border rounded-md overflow-hidden bg-muted/10">
                 {/* In a real app we would mount CKEditor here */}
                 <div className="px-3 py-2 border-b border-border bg-muted/50 flex gap-2 items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>CKEditor Placeholder (Raw HTML view)</span>
                 </div>
                <textarea
                  className="flex min-h-[400px] w-full bg-transparent px-3 py-4 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none resize-y text-foreground"
                  value={formData.contentVi}
                  onChange={(e) => setFormData({...formData, contentVi: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {Object.keys(formData).map((key) => {
            if (activeTab === 'EN' && key.endsWith('En')) {
               return (
                <div key={key} className="grid gap-2 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none capitalize text-foreground/80">{key.replace('En', ' (English)')}</label>
                      <CopyButton text={(formData as Record<string, string>)[key] || ""} label="Copy" />
                    </div>
                    {key === 'contentEn' ? (
                        <textarea className="flex min-h-[400px] w-full rounded-md border border-border bg-muted/30 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={(formData as Record<string, string>)[key]} onChange={(e) => setFormData({...formData, [key]: e.target.value})} />
                    ) : (
                        <input className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={(formData as Record<string, string>)[key]} onChange={(e) => setFormData({...formData, [key]: e.target.value})} />
                    )}
                </div>
               )
            }
            if (activeTab === 'SOCIAL' && key === 'socialContent') {
               return (
                <div key={key} className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none text-foreground/80">Social Media Post</label>
                      <CopyButton text={formData.socialContent || ""} label="Copy Post" />
                    </div>
                    <textarea className="flex min-h-[500px] w-full rounded-md border border-border bg-muted/30 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={formData.socialContent} onChange={(e) => setFormData({...formData, socialContent: e.target.value})} />
                </div>
               )
            }
            if (activeTab === 'IMAGE' && key === 'imagePrompt') {
               return (
                <div key={key} className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none text-foreground/80">AI Image Prompts</label>
                      <CopyButton text={formData.imagePrompt || ""} label="Copy Prompt" />
                    </div>
                    <textarea className="flex min-h-[500px] w-full rounded-md border border-border bg-muted/30 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={formData.imagePrompt} onChange={(e) => setFormData({...formData, imagePrompt: e.target.value})} />
                </div>
               )
            }
            return null;
        })}

      </div>
    </div>
        {/* Modal component */}
        <Modal 
          isOpen={modalState.isOpen} 
          onClose={handleCloseModal}
          title={modalState.type === 'success' ? "Thành công" : "Lỗi"}
          footer={
            <Button onClick={handleCloseModal} variant={modalState.type === 'success' ? "primary" : "outline"} size="sm">
              Đóng
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <p>{modalState.message}</p>
          </div>
        </Modal>

    </div>
  )
}
