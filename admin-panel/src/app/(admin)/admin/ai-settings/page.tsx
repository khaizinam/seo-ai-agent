import prisma from "@/lib/prisma";
import { Sidebar } from "@/components/ui/Sidebar";
import { AiSettingsClient } from "./AiSettingsClient";

export default async function AiSettingsPage() {
  const agents = await prisma.aiAgent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Cấu hình AI Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các API Key và cấu hình AI cho hệ thống SEO.</p>
        </div>
      </div>

      <AiSettingsClient initialAgents={agents} />
    </div>
  );
}
