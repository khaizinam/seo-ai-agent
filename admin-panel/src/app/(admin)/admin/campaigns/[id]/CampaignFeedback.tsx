"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateCampaignFeedback } from "../actions";
import { useRouter } from "next/navigation";

export const CampaignFeedback = ({ campaignId }: { campaignId: string }) => {
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!feedback.trim()) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    const res = await updateCampaignFeedback(campaignId, feedback);
    if (!res.success) {
      setError(res.error || "Có lỗi xảy ra");
    } else {
      setSuccess(true);
      setFeedback("");
      router.refresh(); // Refresh page data
    }
    setIsUpdating(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm relative mt-4">
      <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
        <div className="h-3 w-1.5 bg-blue-500 rounded-full" />
        AI Cập Nhật Yêu Cầu (Feedback)
      </h2>
      <div className="space-y-3">
         <textarea
            className="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs min-h-[80px] text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="VD: Hãy đổi đối tượng mục tiêu thành người làm VP tại Việt Nam, tăng KPIs..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isUpdating}
         />
         {error && (
           <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 rounded text-xs font-medium">
             {error}
           </div>
         )}
         {success && (
           <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-2 rounded text-xs font-medium">
             Đã cập nhật chiến dịch thành công!
           </div>
         )}
         <div className="flex justify-end pt-1">
             <Button
                onClick={handleUpdate}
                disabled={isUpdating || !feedback.trim()}
                className="h-8 px-4 text-xs font-bold gap-2"
             >
                {isUpdating ? (
                   <>
                     <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     ĐANG CẬP NHẬT...
                   </>
                ) : "GỬI YÊU CẦU"}
             </Button>
         </div>
      </div>
    </div>
  );
};
