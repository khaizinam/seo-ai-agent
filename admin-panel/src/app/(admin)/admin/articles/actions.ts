"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateArticle(id: string, data: any) {
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        titleVi: data.titleVi,
        metaDescVi: data.metaDescVi,
        contentVi: data.contentVi,
        titleEn: data.titleEn,
        metaDescEn: data.metaDescEn,
        contentEn: data.contentEn,
        socialContent: data.socialContent,
        imagePrompt: data.imagePrompt,
      }
    });

    revalidatePath(`/admin/articles/${id}`);
    revalidatePath(`/admin/articles`);
    return { success: true, article };
  } catch (error: any) {
    console.error("Lỗi cập nhật bài viết:", error);
    return { success: false, error: error.message };
  }
}
