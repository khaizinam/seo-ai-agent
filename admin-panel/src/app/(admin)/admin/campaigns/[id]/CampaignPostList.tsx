"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { 
  generateCampaignPosts, 
  generateArticleForPost, 
  updateCampaignPostsListFeedback,
  createCampaignPost,
  updateCampaignPost,
  deleteCampaignPost
} from "../actions";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  titleVi: string;
  titleEn: string | null;
  intent: string | null;
  week: number;
  isCreated: boolean;
  articleId?: string | null;
}

export const CampaignPostList = ({ 
  campaignId, 
  posts 
}: { 
  campaignId: string; 
  posts: Post[] 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [creatingPostId, setCreatingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback States
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // CRUD States
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [postFormData, setPostFormData] = useState({ titleVi: "", intent: "Info", week: 1 });
  const [isCrudSaving, setIsCrudSaving] = useState(false);

  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    const result = await generateCampaignPosts(campaignId);
    if (!result.success) {
      setError(result.error || "Có lỗi xảy ra");
    }
    setIsGenerating(false);
  };

  const handleCreateArticle = async (postId: string) => {
    setCreatingPostId(postId);
    setError(null);
    const result = await generateArticleForPost(postId);
    if (!result.success) {
      setError(result.error || "Lỗi khi sinh bài viết. Có thể AI Timeout hoặc API error.");
    }
    setCreatingPostId(null);
  };

  const handleUpdateFeedback = async () => {
    if (!feedback.trim()) return;
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    const res = await updateCampaignPostsListFeedback(campaignId, feedback);
    if (!res.success) {
      setUpdateError(res.error || "Có lỗi xảy ra khi cập nhật feedback danh sách");
    } else {
      setUpdateSuccess(true);
      setFeedback("");
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleSaveCrud = async () => {
    if (!postFormData.titleVi.trim()) return;
    setIsCrudSaving(true);
    let result;
    if (isEditingPost) {
      result = await updateCampaignPost(isEditingPost.id, postFormData);
    } else {
      result = await createCampaignPost(campaignId, postFormData);
    }
    
    if (result.success) {
      setIsAddingPost(false);
      setIsEditingPost(null);
      router.refresh();
    } else {
      setError(result.error || "Có lỗi xảy ra");
    }
    setIsCrudSaving(false);
  };

  const handleDeleteCrud = async () => {
    if (!postToDelete) return;
    setIsCrudSaving(true);
    const result = await deleteCampaignPost(postToDelete.id);
    if (result.success) {
      setPostToDelete(null);
      router.refresh();
    } else {
      setError(result.error || "Có lỗi khi xoá bài viết");
    }
    setIsCrudSaving(false);
  };

  if (posts.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2V8h6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M8 16h8" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-foreground mb-2">Chưa có danh sách bài viết</h3>
        <p className="text-xs text-muted-foreground mb-6 max-w-sm">Hệ thống sẽ tổng hợp chiến lược và sinh danh sách các bài viết cấu trúc phân theo từng tuần.</p>
        
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          variant="primary" 
          className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold h-9 bg-primary"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
               <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Đang sinh danh sách...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              TẠO DANH SÁCH BÀI VIẾT (AI)
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Groupping posts by weeks
  const postsByWeek = posts.reduce((acc: any, post) => {
    if (!acc[post.week]) acc[post.week] = [];
    acc[post.week].push(post);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm relative">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
        <h2 className="text-sm font-bold uppercase text-foreground tracking-widest flex items-center gap-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          DANH SÁCH BÀI VIẾT CHIẾN DỊCH ({posts.length})
        </h2>
        <Button 
          onClick={() => {
            setPostFormData({ titleVi: "", intent: "Info", week: 1 });
            setIsAddingPost(true);
          }}
          variant="primary" 
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-1.5 px-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          THÊM BÀI VIẾT
        </Button>
      </div>

      <div className="space-y-6">
        {Object.keys(postsByWeek).sort((a,b) => Number(a) - Number(b)).map((week) => (
          <div key={week} className="space-y-3">
             <h3 className="text-xs font-black text-muted-foreground bg-muted inline-block px-3 py-1 rounded">TUẦN {week}</h3>
             <div className="grid gap-2">
                {postsByWeek[week].map((post: Post) => (
                  <div key={post.id} className={`bg-background p-3 rounded-lg border flex items-center justify-between transition-all ${creatingPostId === post.id ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border hover:border-border/80 group'}`}>
                     <div className="flex flex-col flex-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           {post.intent && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase">{post.intent}</span>}
                        </div>
                        <h4 className="text-sm font-bold text-foreground line-clamp-1">{post.titleVi}</h4>
                        <p className="text-xs text-muted-foreground truncate">{post.titleEn}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        {post.isCreated ? (
                           <Button 
                              onClick={() => post.articleId ? router.push(`/admin/articles/${post.articleId}`) : null}
                              variant="outline" 
                              className="h-8 px-3 text-[10px] font-bold bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 gap-1"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              XEM BÀI VIẾT
                           </Button>
                        ) : creatingPostId === post.id ? (
                           <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-xs font-bold text-primary gap-2">
                              <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="animate-pulse">AI ĐANG VIẾT...</span>
                           </div>
                        ) : (
                           <>
                             <Button 
                                onClick={() => handleCreateArticle(post.id)}
                                variant="primary" 
                                className="h-8 px-3 text-xs font-bold gap-1 shadow bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20"
                                disabled={creatingPostId !== null}
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                VIẾT BÀI
                             </Button>
                             <div className="flex gap-1 ml-2 border-l border-border pl-3">
                                <Button 
                                  onClick={() => {
                                    setPostFormData({ titleVi: post.titleVi, intent: post.intent || "Info", week: post.week });
                                    setIsEditingPost(post);
                                  }}
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                                  title="Chỉnh sửa bài viết"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </Button>
                                <Button 
                                  onClick={() => setPostToDelete(post)}
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md"
                                  title="Xoá bài viết"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                             </div>
                           </>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>

       {/* Feedback Section for Titles */}
       <div className="mt-8 pt-6 border-t border-border/50">
          <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
            <div className="h-3 w-1.5 bg-blue-500 rounded-full" />
            AI Điều chỉnh danh sách bài viết
          </h2>
          <div className="space-y-3">
             <textarea
                className="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs min-h-[80px] text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="VD: Hãy xóa bài viết ở tuần 1, đổi các bài tuần 2 thành tập trung vào manga hành động, thêm 1 bài so sánh ở tuần 3..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isUpdating}
             />
             {updateError && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 rounded text-xs font-medium">
                 {updateError}
               </div>
             )}
             {updateSuccess && (
               <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-2 rounded text-xs font-medium">
                 Đã cập nhật danh sách bài viết thành công!
               </div>
             )}
             <div className="flex justify-end pt-1">
                 <Button
                    onClick={handleUpdateFeedback}
                    disabled={isUpdating || !feedback.trim()}
                    className="h-8 px-4 text-xs font-bold gap-2"
                 >
                    {isUpdating ? (
                       <>
                         <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         ĐANG SỬA ĐỔI...
                       </>
                    ) : "GỬI YÊU CẦU"}
                 </Button>
             </div>
           </div>
        </div>

      {/* Standard Modals for Add/Edit */}
      <Modal 
        isOpen={isAddingPost || isEditingPost !== null}
        onClose={() => { setIsAddingPost(false); setIsEditingPost(null); }}
        title={isEditingPost ? "Chỉnh sửa Bài Viết" : "Thêm Bài Viết Mới"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsAddingPost(false); setIsEditingPost(null); }} size="sm" disabled={isCrudSaving}>Hủy</Button>
            <Button variant="primary" onClick={handleSaveCrud} size="sm" disabled={isCrudSaving || !postFormData.titleVi}>
              {isCrudSaving ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Tiêu đề (Tiếng Việt)</label>
            <input 
              value={postFormData.titleVi}
              onChange={e => setPostFormData({...postFormData, titleVi: e.target.value})}
              placeholder="VD: Top 10 Manga đáng đọc nhất..."
              className="w-full border border-border bg-muted/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tuần chạy</label>
              <input 
                type="number"
                min="1"
                value={postFormData.week}
                onChange={e => setPostFormData({...postFormData, week: parseInt(e.target.value) || 1})}
                className="w-full border border-border bg-muted/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Mục tiêu (Intent)</label>
              <select
                value={postFormData.intent}
                onChange={e => setPostFormData({...postFormData, intent: e.target.value})}
                className="w-full border border-border bg-muted/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Info">Info</option>
                <option value="Nav">Nav</option>
                <option value="Trans">Trans</option>
                <option value="Comm">Comm</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeleteCrud}
        title="Xoá Bài Viết"
        message={`Bạn có chắc muốn xoá ${postToDelete?.titleVi}? Bài chưa tạo nội dung bị xoá sẽ mất vĩnh viễn.`}
        isConfirming={isCrudSaving}
      />

    </div>
  );
};
