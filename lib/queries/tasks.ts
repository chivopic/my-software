import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { TaskStatusValue } from "@/lib/validation/task";

/** Done 列只回溯这么多天，否则看板会被历史任务撑爆。 */
export const DONE_LOOKBACK_DAYS = 7;

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  scheduledFor: true,
  scheduledStart: true,
  scheduledEnd: true,
  completedAt: true,
  order: true,
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
} as const;

export type TaskItem = Awaited<ReturnType<typeof getTask>> extends infer T ? NonNullable<T> : never;

export async function getTask(userId: string, id: string) {
  return prisma.task.findFirst({ where: { id, userId, deletedAt: null }, select: taskSelect });
}

export function activeTaskWhere(userId: string): Prisma.TaskWhereInput {
  return { userId, deletedAt: null };
}

/** 看板：四列一次查完，Done 只取最近 N 天完成的。 */
export async function getTaskBoard(userId: string, tag?: string) {
  const tagFilter = tag ? { tags: { some: { tag: { slug: tag } } } } : {};
  const doneSince = new Date();
  doneSince.setUTCDate(doneSince.getUTCDate() - DONE_LOOKBACK_DAYS);

  const tasks = await prisma.task.findMany({
    where: {
      ...activeTaskWhere(userId),
      ...tagFilter,
      OR: [{ status: { not: "DONE" } }, { status: "DONE", completedAt: { gte: doneSince } }],
    },
    select: taskSelect,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const columns: Record<TaskStatusValue, typeof tasks> = {
    INBOX: [],
    TODO: [],
    DOING: [],
    DONE: [],
  };
  for (const task of tasks) {
    columns[task.status].push(task);
  }

  // Done 按完成时间倒序，最近完成的在上面
  columns.DONE.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  return columns;
}

export type TaskBoard = Awaited<ReturnType<typeof getTaskBoard>>;
export type BoardTask = TaskBoard[TaskStatusValue][number];
