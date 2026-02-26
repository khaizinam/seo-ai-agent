"use client"

import { useState } from "react"
import { Article } from "@prisma/client"

export default function ArticleEditClient({ article }: { article: Article }) {
  const [activeTab, setActiveTab] = useState<'VI' | 'EN' | 'SOCIAL' | 'IMAGE'>('VI')
  
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

  return (
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
              <label className="text-sm font-medium leading-none text-foreground/80">Title (vi.txt)</label>
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={formData.titleVi}
                onChange={(e) => setFormData({...formData, titleVi: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none text-foreground/80">Meta Description</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={formData.metaDescVi}
                onChange={(e) => setFormData({...formData, metaDescVi: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none text-foreground/80">Content HTML</label>
              <div className="border border-border rounded-md overflow-hidden bg-muted/10">
                 {/* In a real app we would mount CKEditor here */}
                 <div className="px-3 py-2 border-b border-border bg-muted/50 flex gap-2 items-center text-xs text-muted-foreground font-mono">
                    CKEditor Placeholder (Raw HTML view)
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
                    <label className="text-sm font-medium leading-none capitalize text-foreground/80">{key.replace('En', ' (English)')}</label>
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
                    <label className="text-sm font-medium leading-none text-foreground/80">Social Media Post</label>
                    <textarea className="flex min-h-[500px] w-full rounded-md border border-border bg-muted/30 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={formData.socialContent} onChange={(e) => setFormData({...formData, socialContent: e.target.value})} />
                </div>
               )
            }
            if (activeTab === 'IMAGE' && key === 'imagePrompt') {
               return (
                <div key={key} className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-sm font-medium leading-none text-foreground/80">AI Image Prompts</label>
                    <textarea className="flex min-h-[500px] w-full rounded-md border border-border bg-muted/30 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" value={formData.imagePrompt} onChange={(e) => setFormData({...formData, imagePrompt: e.target.value})} />
                </div>
               )
            }
            return null;
        })}

      </div>
    </div>

  )
}
