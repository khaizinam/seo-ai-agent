import { redirect } from "next/navigation";
import { CreateCampaignClient } from "./CreateCampaignClient";
import prisma from "@/lib/prisma";

export default async function CreateCampaignPage() {
  const agent = await prisma.aiAgent.findFirst({ where: { status: 1 } });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tạo chiến dịch SEO mới</h1>
        <p className="text-muted-foreground mt-2">
          Nhập từ khóa chính để AI phân tích và lập kế hoạch chiến lược 2026.
        </p>
      </div>

      {!agent && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl mb-6 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium">Bạn chưa cấu hình AI Agent hoặc chưa kích hoạt Agent nào. <a href="/admin/ai-settings" className="underline font-bold">Cấu hình ngay</a></p>
        </div>
      )}

      <CreateCampaignClient hasAgent={!!agent} />
    </div>
  );
}
