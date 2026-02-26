import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import ArticleEditClient from "./ArticleEditClient"

export default async function ArticleEditPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id;
  const article = await prisma.article.findUnique({
    where: { id: id },
    include: {
      author: {
        select: { name: true, email: true }
      }
    }
  })

  if (!article) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 text-foreground">
      {/* Article Header */}
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
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {article.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${article.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'}`}>
            {article.status}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Hủy
            </Button>
            <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Lưu thay đổi
            </Button>
            <Button variant="success" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              Lưu & Thoát
            </Button>
          </div>
        </div>
      </div>
      
      <ArticleEditClient article={article} />
    </div>
  )
}
