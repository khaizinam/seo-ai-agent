"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addAiAgent(formData: FormData) {
  const name = formData.get("name") as string;
  const provider = formData.get("provider") as string;
  const model = formData.get("model") as string;
  const apiKey = formData.get("apiKey") as string;
  const type = formData.get("type") as string;

  await prisma.aiAgent.create({
    data: {
      name,
      provider,
      model,
      apiKey,
      type,
      status: 0,
    },
  });

  revalidatePath("/admin/ai-settings");
}

export async function deleteAiAgent(id: string) {
  await prisma.aiAgent.delete({
    where: { id },
  });
  revalidatePath("/admin/ai-settings");
}

export async function setActiveAiAgent(id: string) {
  // Use a transaction to ensure atomicity
  await prisma.$transaction([
    // Set all to inactive
    prisma.aiAgent.updateMany({
      data: { status: 0 },
    }),
    // Set target to active
    prisma.aiAgent.update({
      where: { id },
      data: { status: 1 },
    }),
  ]);

  revalidatePath("/admin/ai-settings");
}
