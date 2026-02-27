import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  const columns = [
    {
      header: "CHIẾN DỊCH",
      accessor: (c: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{c.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{c.mainKeyword}</span>
        </div>
      ),
    },
    {
      header: "TRẠNG THÁI",
      accessor: (c: any) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
          c.status === "COMPLETED" ? "bg-green-500/10 text-green-400 ring-green-500/20" : 
          c.status === "RUNNING" ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" : 
          "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20"
        }`}>
          {c.status === "COMPLETED" ? "Hoàn thành" : c.status === "RUNNING" ? "Đang chạy" : "Lập kế hoạch"}
        </span>
      ),
      className: "w-32",
    },
    {
      header: "NGÀY TẠO",
      accessor: (c: any) => (
        <span className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(c.createdAt)}
        </span>
      ),
      className: "w-32",
    },
    {
      header: "HÀNH ĐỘNG",
      accessor: (c: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/campaigns/${c.id}`}>
            <Button variant="outline" size="sm" className="text-xs h-8 px-3">
              Chi tiết
            </Button>
          </Link>
        </div>
      ),
      className: "w-32 text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-8 text-foreground animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Quản lý chiến dịch SEO</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các chiến dịch SEO theo từ khóa chính.</p>
        </div>
        <Link href="/admin/campaigns/create">
          <Button variant="danger" className="bg-[#ef4444] hover:bg-[#dc2626] font-bold py-2 shadow-lg shadow-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            TẠO CHIẾN DỊCH MỚI
          </Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={campaigns} 
        keyExtractor={(item) => item.id}
        emptyMessage="Chưa có chiến dịch nào. Hãy bắt đầu bằng cách tạo một chiến dịch SEO mới."
      />
    </div>
  );
}
