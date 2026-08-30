import { prisma } from "@/lib/db";
import { ensureTags } from "@/lib/mutations/tags";
import { parseDateInput } from "@/lib/utils/date";
import type { CreateTaskInput, TaskStatusValue, UpdateTaskInput } from "@/lib/validation/task";

/** 新任务排在同列最前面：取当前最小 order 再减 1。 */
async function nextOrder(userId: string, status: TaskStatusValue): Promise<number> {
  const first = await prisma.task.findFirst({
    where: { userId, status, deletedAt: null },
    orderBy: { order: "asc" },
    select: { order: true },
  });
  return (first?.order ?? 0) - 1;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const tagIds = await ensureTags(userId, input.tags);

  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
      dueDate: parseDateInput(input.dueDate),
      completedAt: input.status === "DONE" ? new Date() : null,
      order: await nextOrder(userId, input.status),
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    select: { id: true },
  });
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true, status: true, completedAt: true },
  });
  if (!existing) return false;

  const tagIds = await ensureTags(userId, input.tags);

  await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description || null,
        status: input.status,
        priority: input.priority,
        dueDate: parseDateInput(input.dueDate),
        completedAt: completedAtFor(input.status, existing.status, existing.completedAt),
      },
    }),
    prisma.taskTag.deleteMany({ where: { taskId: id, tagId: { notIn: tagIds } } }),
    prisma.taskTag.createMany({
      data: tagIds.map((tagId) => ({ taskId: id, tagId })),
      skipDuplicates: true,
    }),
  ]);

  return true;
}

/**
 * 进入 DONE 记完成时间；离开 DONE 清掉；本来就是 DONE 则保留原值，
 * 免得改个标题就把完成时间刷新了。
 */
function completedAtFor(
  next: TaskStatusValue,
  previous: TaskStatusValue,
  previousCompletedAt: Date | null,
): Date | null {
  if (next !== "DONE") return null;
  if (previous === "DONE" && previousCompletedAt) return previousCompletedAt;
  return new Date();
}

export async function setTaskStatus(userId: string, id: string, status: TaskStatusValue) {
  const existing = await prisma.task.findFirst({
    where: { id, userId, deletedAt: null },
    select: { status: true, completedAt: true },
  });
  if (!existing) return false;

  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: completedAtFor(status, existing.status, existing.completedAt),
    },
  });
  return true;
}

export async function softDeleteTask(userId: string, id: string) {
  const result = await prisma.task.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function restoreTask(userId: string, id: string) {
  const result = await prisma.task.updateMany({
    where: { id, userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  return result.count > 0;
}
