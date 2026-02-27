import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import ArticleEditClient from "./ArticleEditClient"
import { CopyButton } from "@/components/ui/CopyButton"

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
      <ArticleEditClient article={article} />
    </div>
  )
}
