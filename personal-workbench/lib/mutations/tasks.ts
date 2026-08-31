import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/mutations/activity";
import { ensureTags } from "@/lib/mutations/tags";
import { parseDateInput, zonedHourToUtc } from "@/lib/utils/date";
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

  const task = await prisma.task.create({
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

  await logActivity({
    userId,
    entityType: "TASK",
    entityId: task.id,
    action: "CREATED",
    summary: input.title,
    metadata: { status: input.status, priority: input.priority },
  });

  return task;
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

  await logActivity({
    userId,
    entityType: "TASK",
    entityId: id,
    action: input.status === "DONE" && existing.status !== "DONE" ? "COMPLETED" : "UPDATED",
    summary: input.title,
    metadata: { status: input.status, priority: input.priority },
  });

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

  const task = await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: completedAtFor(status, existing.status, existing.completedAt),
    },
    select: { title: true },
  });

  await logActivity({
    userId,
    entityType: "TASK",
    entityId: id,
    // 完成单独记一个 action：V2 统计「这周完成了多少」时不用再解析 metadata
    action: status === "DONE" && existing.status !== "DONE" ? "COMPLETED" : "STATUS_CHANGED",
    summary: task.title,
    metadata: { from: existing.status, to: status },
  });
  return true;
}

export async function softDeleteTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId, deletedAt: null },
    select: { title: true, status: true },
  });
  if (!task) return false;

  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    userId,
    entityType: "TASK",
    entityId: id,
    action: "DELETED",
    summary: task.title,
    metadata: { status: task.status },
  });
  return true;
}

export async function restoreTask(userId: string, id: string) {
  const result = await prisma.task.updateMany({
    where: { id, userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (result.count === 0) return false;

  await logActivity({ userId, entityType: "TASK", entityId: id, action: "RESTORED" });
  return true;
}

/** 把任务排到某天的某个整点，默认占一小时。 */
export async function scheduleTask(
  userId: string,
  id: string,
  {
    day,
    hour,
    timeZone,
    hours = 1,
  }: { day: string; hour: number; timeZone: string; hours?: number },
) {
  const start = zonedHourToUtc(day, hour, timeZone);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

  const result = await prisma.task.updateMany({
    where: { id, userId, deletedAt: null },
    data: {
      scheduledFor: new Date(`${day}T00:00:00.000Z`),
      scheduledStart: start,
      scheduledEnd: end,
    },
  });
  if (result.count === 0) return false;

  // 记下计划投入多少时间：V2 算「计划 vs 实际」时要用
  await logActivity({
    userId,
    entityType: "TASK",
    entityId: id,
    action: "SCHEDULED",
    metadata: { day, hour, hours },
  });
  return true;
}

export async function unscheduleTask(userId: string, id: string) {
  const result = await prisma.task.updateMany({
    where: { id, userId, deletedAt: null },
    data: { scheduledFor: null, scheduledStart: null, scheduledEnd: null },
  });
  if (result.count === 0) return false;

  await logActivity({ userId, entityType: "TASK", entityId: id, action: "UNSCHEDULED" });
  return true;
}
