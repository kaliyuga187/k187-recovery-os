"use server";
import { prisma } from "@k187/db";
import { revalidatePath } from "next/cache";

export async function setActive(projectId: string, reason?: string) {
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
  await prisma.activeBuild.create({
    data: { projectId, reason: reason ?? null, isPaused: false },
  });
  revalidatePath("/focus");
  revalidatePath("/dashboard");
}

export async function pauseActive() {
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
  revalidatePath("/focus");
  revalidatePath("/dashboard");
}

export async function completeActive() {
  const a = await prisma.activeBuild.findFirst({ where: { isPaused: false } });
  if (!a) return;
  await prisma.project.update({ where: { id: a.projectId }, data: { status: "complete" } });
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
  revalidatePath("/focus");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}
