import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const session = await auth()
  
  // Fetch some quick stats
  const totalArticles = await prisma.article.count()
  const publishedArticles = await prisma.article.count({
    where: { status: 'PUBLISHED' }
  })
  const draftArticles = await prisma.article.count({
    where: { status: 'DRAFT' }
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back, {session?.user?.name || 'Admin'}. Here is an overview of your SEO content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Stat Card 1 */}
        <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow sm:p-6 border border-border transition-all hover:shadow-md">
          <dt className="truncate text-sm font-medium text-muted-foreground">Total Articles</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{totalArticles}</dd>
        </div>

        {/* Stat Card 2 */}
        <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow sm:p-6 border border-border transition-all hover:shadow-md">
          <dt className="truncate text-sm font-medium text-muted-foreground">Published</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-500">{publishedArticles}</dd>
        </div>

        {/* Stat Card 3 */}
        <div className="overflow-hidden rounded-lg bg-card px-4 py-5 shadow sm:p-6 border border-border transition-all hover:shadow-md">
          <dt className="truncate text-sm font-medium text-muted-foreground">Drafts</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-amber-500">{draftArticles}</dd>
        </div>
      </div>

      <div className="mt-4 pt-6 border-t border-border">
        <h2 className="text-lg font-medium text-foreground mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/articles"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2"
          >
            View All Articles
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-border bg-transparent shadow-sm hover:bg-muted hover:text-foreground h-10 px-6 py-2 text-muted-foreground"
            disabled
          >
            Import from Folder (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
