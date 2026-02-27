"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createCampaign } from "../actions";
import { useRouter } from "next/navigation";

export const CreateCampaignClient = ({ hasAgent }: { hasAgent: boolean }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasAgent) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCampaign(formData);

    if (result.success && result.id) {
      router.push(`/admin/campaigns/${result.id}`);
    } else {
      setError(result.error || "Có lỗi xảy ra trong quá trình phân tích.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl relative">
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="relative h-24 w-24 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-pulse" />
            <div className="absolute inset-6 rounded-full border-4 border-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground">AI đang bộ não hóa...</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Hệ thống đang phân tích thị trường, đối tượng mục tiêu và lập kế hoạch chiến lược cho từ khóa của bạn. Quá trình này có thể mất 30-60 giây.
          </p>
          <div className="mt-8 flex gap-1 w-full max-w-xs h-1 rounded-full bg-muted overflow-hidden">
             <div className="h-full bg-primary animate-progress" style={{width: '60%'}} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Tên chiến dịch</label>
            <input 
              name="name" 
              required 
              placeholder="Ví dụ: Chiến dịch SEO Vibe Coding 2026" 
              className="w-full bg-[#1e293b]/50 border border-border rounded-xl px-4 py-4 text-lg font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/30"
              disabled={isAnalyzing}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Từ khóa chính</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              <input 
                name="mainKeyword" 
                required 
                placeholder="Ví dụ: AI Vibe Coding" 
                className="w-full bg-[#1e293b]/50 border border-border rounded-xl pl-12 pr-4 py-4 text-lg font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/30"
                disabled={isAnalyzing}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="pt-4">
          <Button 
            type="submit" 
            variant="danger" 
            className="w-full bg-red-600 hover:bg-red-700 font-bold py-5 text-lg shadow-xl shadow-red-500/20"
            disabled={isAnalyzing || !hasAgent}
          >
            PHÂN TÍCH & TẠO CHIẾN DỊCH
          </Button>
        </div>
      </form>
    </div>
  );
};
