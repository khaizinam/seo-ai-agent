import prisma from "@/lib/prisma"
import Link from "next/link"

import { ArticleStatus, Article, User } from "@prisma/client"
import { Button } from "@/components/ui/Button"
import { DeleteArticleButton } from "@/components/ui/DeleteArticleButton"
import { DataTable } from "@/components/ui/DataTable"

type ArticleWithAuthor = Article & {
  author: {
    name: string | null;
    email: string;
  };
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const params = await searchParams;
  const statusFilter = params.status;
  const query = params.q;
  
  const whereClause: any = {}
  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter as ArticleStatus
  }
  if (query) {
    whereClause.OR = [
      { titleVi: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
    ]
  }

  const articles = await prisma.article.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { name: true, email: true }
      }
    }
  }) as ArticleWithAuthor[];

  const columns = [
    {
      header: "ID",
      accessor: (article: ArticleWithAuthor) => (
        <span className="text-muted-foreground font-mono text-xs">#{article.id.slice(-4).toUpperCase()}</span>
      ),
      className: "w-20",
    },
    {
      header: "BÀI VIẾT",
      accessor: (article: ArticleWithAuthor) => (
        <div className="flex flex-col max-w-md">
          <span className="font-bold text-foreground line-clamp-1">{article.titleVi || article.slug}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{article.slug}</span>
        </div>
      ),
    },
    {
      header: "TRẠNG THÁI",
      accessor: (article: ArticleWithAuthor) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${article.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'}`}>
          {article.status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}
        </span>
      ),
      className: "w-32",
    },
    {
      header: "THỐNG KÊ",
      accessor: (article: ArticleWithAuthor) => (
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
           <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>0</span>
           </div>
           <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>0</span>
           </div>
        </div>
      ),
      className: "w-40",
    },
    {
      header: "HÀNH ĐỘNG",
      accessor: (article: ArticleWithAuthor) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/admin/articles/${article.id}`}>
            <div className="h-9 w-9 flex items-center justify-center rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
            </div>
          </Link>
          <DeleteArticleButton id={article.id} title={article.titleVi || article.slug || "Article"} showIconOnly />
        </div>
      ),
      className: "w-32 text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-8 text-foreground animate-in fade-in duration-500">
      {/* Header section with Manga18k style */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Quản lý bài viết</h1>
            <Link href="/admin/articles/create">
                <Button variant="danger" className="bg-[#ef4444] hover:bg-[#dc2626] font-bold py-2 shadow-lg shadow-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    THÊM MỚI
                </Button>
            </Link>
        </div>

        {/* Filter Toolbar */}
        <form className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-card/40 p-6 rounded-xl border border-border shadow-sm backdrop-blur-sm">
            <div className="md:col-span-4 flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Tìm kiếm</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        name="q"
                        defaultValue={query}
                        placeholder="Tìm theo tiêu đề, slug..." 
                        className="block w-full pl-10 pr-3 py-2.5 bg-[#1e293b]/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 text-foreground"
                    />
                </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Trạng thái</label>
                <select 
                    name="status"
                    defaultValue={statusFilter || "ALL"}
                    className="block w-full px-3 py-2.5 bg-[#1e293b]/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PUBLISHED">Đã đăng</option>
                    <option value="DRAFT">Bản nháp</option>
                </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Sắp xếp</label>
                <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2.5 bg-[#1e293b]/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground">
                        <option value="createdAt">Ngày tạo</option>
                        <option value="titleVi">Tiêu đề</option>
                    </select>
                    <select className="w-32 px-2 py-2.5 bg-[#1e293b]/50 border border-border rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground">
                        <option value="desc">Giảm dần</option>
                        <option value="asc">Tăng dần</option>
                    </select>
                </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="flex-1 py-2.5 bg-primary/90 hover:bg-primary border-none shadow-md shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    TÌM KIẾM
                </Button>
                <Link href="/admin/articles">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#1e293b]/80 border border-border text-muted-foreground hover:text-foreground hover:bg-[#1e293b] transition-all cursor-pointer" title="Làm mới">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                </Link>
            </div>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Hiển thị <span className="bg-[#1e293b] px-3 py-1 rounded border border-border text-foreground font-bold">100</span> mục
            </div>
            
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(p => (
                    <button key={p} className={`h-8 w-8 flex items-center justify-center rounded text-xs font-bold transition-all ${p === 1 ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/50'}`}>
                        {p}
                    </button>
                ))}
            </div>
        </div>

        <DataTable 
            columns={columns} 
            data={articles} 
            keyExtractor={(item) => item.id}
            emptyMessage="Không tìm thấy bài viết nào. Hãy thử tạo bài mới hoặc thay đổi bộ lọc."
        />
      </div>
    </div>
  )
}
