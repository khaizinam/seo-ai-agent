import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CampaignPostList } from "./CampaignPostList";
import { CampaignFeedback } from "./CampaignFeedback";

export default async function CampaignDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { articles: true, posts: { orderBy: [{ week: 'asc' }, { createdAt: 'asc' }] } }
  });

  if (!campaign) {
    notFound();
  }

  const data = campaign.data as any;

  return (
    <div className="flex flex-col gap-4 text-foreground animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/campaigns" 
            className="h-10 w-10 flex items-center justify-center rounded-full bg-muted border border-border hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{campaign.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                campaign.status === "COMPLETED" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="font-bold text-primary mr-1">TỪ KHÓA CHÍNH:</span> {campaign.mainKeyword}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8 px-3 text-xs">Xuất báo cáo</Button>
          <Button variant="danger" className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700">Xóa chiến dịch</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Strategy & Meta (5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
              <div className="h-3 w-1.5 bg-primary rounded-full" />
              Chiến lược tổng quan
            </h2>
            <div className="prose prose-invert prose-sm">
              <p className="text-xs text-foreground leading-relaxed italic opacity-90 m-0">
                "{data?.strategy}"
              </p>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
              <div className="h-3 w-1.5 bg-indigo-500 rounded-full" />
              Chân dung đối tượng
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Ngành nghề</span>
                <span className="text-xs font-bold text-foreground">{data?.industry}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Giới tính</span>
                <span className="text-xs font-bold text-foreground">{data?.gender}</span>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Đối tượng mục tiêu</span>
                <div className="flex flex-wrap gap-1.5">
                  {data?.targets?.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold border border-border text-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
              <div className="h-3 w-1.5 bg-emerald-500 rounded-full" />
              KPI & Chỉ số dự kiến
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data?.metrics || {}).map(([k, v]: [string, any], i: number) => {
                const displayValue = typeof v === 'object' && v !== null 
                  ? (v.value || v.goal || v.kpi || JSON.stringify(v).replace(/["{}]/g, '').replace(/:/g, ': ')) 
                  : v;

                return (
                  <div key={i} className="bg-muted p-2.5 rounded-lg border border-border/60 text-center flex flex-col justify-center">
                     <p className="text-[9px] text-muted-foreground uppercase font-black truncate mb-0.5" title={k}>{k}</p>
                     <p className="text-sm font-black text-foreground line-clamp-1 leading-tight" title={String(displayValue)}>{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-4">
             <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
               <div className="h-3 w-1.5 bg-pink-500 rounded-full" />
               Kịch bản hình ảnh (AI)
             </h2>
             <div className="space-y-2">
                {data?.imagePrompts?.slice(0, 3).map((p: string, i: number) => (
                  <div key={i} className="bg-muted/50 p-2.5 rounded border border-border/40">
                    <p className="text-[10px] font-medium text-foreground leading-relaxed line-clamp-3 font-mono opacity-80">
                      {p}
                    </p>
                  </div>
                ))}
             </div>
          </section>

          <CampaignFeedback campaignId={id} />
        </div>

        {/* Right Column: List & Keywords (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <section className="bg-card rounded-xl border border-border p-4">
             <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
               <div className="h-3 w-1.5 bg-yellow-500 rounded-full" />
               Tận dụng từ khóa phụ (Sub-Keywords)
             </h2>
             <div className="flex flex-wrap gap-1.5">
                {data?.subKeywords?.map((kw: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded text-xs border border-border hover:border-border/80 transition-all cursor-default text-foreground font-medium">
                    <span className="text-primary opacity-50 font-black">#</span>
                    {kw}
                  </div>
                ))}
             </div>
          </section>

          <CampaignPostList campaignId={id} posts={campaign.posts} />
        </div>
      </div>
    </div>
  );
}
